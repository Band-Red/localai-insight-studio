# تقرير الاختبار والتصحيح — نظام إدارة نماذج GGUF
**LocalAI Insight Studio**
**تاريخ التقرير:** 2026-02-19
**المنهجية:** مراجعة كود شاملة (Static Code Analysis) + تحليل تدفق البيانات (Data Flow Analysis)

---

## ملخص تنفيذي

| الفئة | العدد |
|-------|-------|
| أخطاء حرجة (Critical) | 5 |
| أخطاء متوسطة (Medium) | 8 |
| أخطاء طفيفة / تحسينات (Minor) | 7 |
| **المجموع** | **20** |

**تقييم جاهزية الإصدار:** ⚠ غير جاهز للإصدار — الأخطاء الحرجة الخمسة يجب إصلاحها أولاً.

---

## القسم الأول: الأخطاء الحرجة (Critical)

---

### 🔴 BUG-001 — `llama-server` غير موجود في PATH → تعطّل صامت

**الملف:** `src/main/model_manager.ts` — السطر 191

**وصف الخطوة:** عند الضغط على "تحميل" لأي نموذج.

**النتيجة المتوقعة:** ظهور نافذة خطأ واضحة أو رسالة "llama-server غير مثبّت".

**النتيجة الفعلية:** `spawn('llama-server', ...)` يرث خطأ `ENOENT` (الأمر غير موجود)، لكن المعالِج `on('error')` يحدّث الحالة إلى `error` داخل الخادم فقط، بينما الواجهة تبقى في حالة `loading` حتى انتهاء الـ timeout (30 ثانية)، ثم تُظهر خطأ.

**السبب:** `spawn` يُطلق حدث `error` (ENOENT)، وهذا الحدث يُعالَج صحيحاً، لكن المشكلة هي أن `handleLoad` في `ModelManager.tsx` (السطر 100) لا ينتظر تحديث حالة النموذج بعد `result.success: false` — إذا فشل التحميل لا يوجد تغذية راجعة مرئية فورية للمستخدم.

**تقييم:** لا يعمل (في بيئة بدون llama-server)

**الحل المقترح:**
```typescript
// model_manager.ts — في catch الخاص بـ spawn ENOENT
this.serverProcess.on('error', (err: NodeJS.ErrnoException) => {
  clearTimeout(timeout);
  model.status = 'error';
  model.errorMsg = err.code === 'ENOENT'
    ? 'llama-server غير مثبّت — ثبّته من https://github.com/ggerganov/llama.cpp'
    : `فشل في تشغيل الخادم: ${err.message}`;
  this.models.set(model.id, model);
  resolve({ success: false, error: model.errorMsg });
});
```

```typescript
// ModelManager.tsx — handleLoad (السطر 95-107): إضافة رسالة خطأ مرئية
const handleLoad = async (id: string) => {
  const electron = (window as any).electronAPI;
  if (!electron?.startServer) return;
  setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'loading' } : m));
  const result = await electron.startServer({ ...serverConfig, modelId: id });
  await refreshModels(); // يُحدّث الحالة الفعلية (loading → error)
  if (result.success) {
    setActiveModelId(id);
    const model = models.find(m => m.id === id);
    onActiveModelChange?.(model?.name || null);
  }
  // حذف السطرين المقلوبين: كان result.success يُتحقق منه قبل refreshModels
};
```

---

### 🔴 BUG-002 — خيار GPU في `ServerConfig` يُعطي صواباً خاطئاً (hardcoded value)

**الملف:** `src/renderer/components/Models/ServerConfig.tsx` — السطر 154

**وصف الخطوة:** فتح تبويب "الخادم" والنظر إلى قائمة كرت الشاشة.

**النتيجة المتوقعة:** عند اختيار GPU معيّن، يجب أن تُحدَّث قيمة `nGpuLayers` بشكل ديناميكي بناءً على VRAM الخاص بهذا الكرت.

**النتيجة الفعلية:** جميع GPUs تُعطي قيمة ثابتة `value={35}` بغض النظر عن الكرت المختار. المستخدم يعتقد أنه اختار GPU بـ 4 GB VRAM لكن النظام يُرسل `nGpuLayers=35` وهو مناسب لـ 12 GB+ فقط.

**الكود الحالي:**
```tsx
<option key={i} value={35}>{g.name} ...</option>  // ← خطأ! 35 ثابت
```

**تقييم:** يعمل جزئياً (العرض صحيح لكن القيمة خاطئة)

**الحل المقترح:**
```tsx
// حساب nGpuLayers بناءً على VRAM الفعلي
const calcLayers = (vramMb: number): number => {
  const gb = vramMb / 1024;
  if (gb >= 12) return 35;
  if (gb >= 8) return 20;
  if (gb >= 6) return 14;
  if (gb >= 4) return 10;
  return 5;
};

// في JSX:
{gpus.map((g, i) => (
  <option key={i} value={calcLayers(g.vramMb)}>
    {g.name} {g.vramMb > 0 ? `(${Math.round(g.vramMb / 1024)} GB VRAM → ${calcLayers(g.vramMb)} layers)` : ''}
  </option>
))}
```

---

### 🔴 BUG-003 — `handleLoad` يقرأ `models` قبل الـ refresh (Stale Closure Bug)

**الملف:** `src/renderer/components/Models/ModelManager.tsx` — السطر 103

**وصف الخطوة:** الضغط على "تحميل" لأي نموذج.

**النتيجة المتوقعة:** بعد النجاح، يُعرض اسم النموذج الصحيح في ChatBox header.

**النتيجة الفعلية:** `const model = models.find(m => m.id === id)` يقرأ نسخة قديمة من الـ `models` state قبل `refreshModels()`. لأن `refreshModels` هو async وlا توجد `await` قبل `models.find`.

**الكود الحالي (السطر 100-106):**
```typescript
const result = await electron.startServer({ ...serverConfig, modelId: id });
if (result.success) {
  setActiveModelId(id);
  const model = models.find(m => m.id === id); // ← stale state
  onActiveModelChange?.(model?.name || null);
}
await refreshModels();
```

**تقييم:** يعمل جزئياً (اسم النموذج قد يكون فارغاً)

**الحل:**
```typescript
const result = await electron.startServer({ ...serverConfig, modelId: id });
await refreshModels(); // أولاً
if (result.success) {
  setActiveModelId(id);
  // استخدام models المُحدَّثة بعد refresh
  // أو: حفظ الاسم مبكراً قبل startServer
  const modelName = models.find(m => m.id === id)?.name || null;
  onActiveModelChange?.(modelName);
}
```

---

### 🔴 BUG-004 — `wmic GPU` يفشل صامتاً على بعض نسخ Windows

**الملف:** `src/main/model_manager.ts` — السطر 315

**وصف الخطوة:** فتح تبويب المكتبة وانتظار ظهور معلومات الجهاز.

**النتيجة المتوقعة:** عرض قائمة GPU الصحيحة.

**النتيجة الفعلية:** `wmic path win32_VideoController get Name,AdapterRAM /format:csv` قد يُعطي:
1. خطأ في Windows 11 (wmic مُهمَل في بعض الإصدارات)
2. `AdapterRAM` قيمة خاطئة (4GB على AMD/Nvidia بسبب معرفة WDDM)
3. أسطر فارغة تُدرج بدلاً من GPUs حقيقية

**الكود الحالي (السطر 320-326):**
```typescript
const lines = stdout.trim().split('\n').filter(l => l && !l.startsWith('Node'));
const result = lines.map(line => {
  const parts = line.split(',');
  const vramBytes = parseInt(parts[1]) || 0;  // ← قد يكون parts[1] = undefined
  const name = parts[2]?.trim() || 'Unknown GPU';
```

**تقييم:** يعمل جزئياً (قد يُعطي VRAM=0 دائماً)

**الحل المقترح:**
```typescript
// استبدال wmic بـ PowerShell (أكثر موثوقية على Windows 10/11)
exec('powershell -NoProfile -Command "Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json"',
  (error, stdout) => {
    if (error) {
      resolve([{ name: 'GPU (لم يُكتشف)', vramMb: 0 }]);
      return;
    }
    try {
      const raw = JSON.parse(stdout);
      const list = Array.isArray(raw) ? raw : [raw];
      resolve(list.map(g => ({
        name: g.Name || 'Unknown GPU',
        vramMb: Math.round((g.AdapterRAM || 0) / (1024 * 1024))
      })).filter(g => g.name));
    } catch {
      resolve([{ name: 'GPU (خطأ في الاكتشاف)', vramMb: 0 }]);
    }
  }
);
```

---

### 🔴 BUG-005 — `localStorage` fallback خاطئ عند القيمة `{}`

**الملف:** `src/renderer/components/Models/ModelManager.tsx` — السطر 43

**وصف الخطوة:** أول تشغيل للتطبيق (لا يوجد localStorage خاص بالتطبيق).

**النتيجة المتوقعة:** استخدام `defaultServerConfig` كقيمة أولية.

**النتيجة الفعلية:** `JSON.parse('{}')` يُعطي `{}` وهو "truthy"، فيُستخدم `{}` بدلاً من `defaultServerConfig`. هذا يعني أن:
- `config.port` = `undefined` → يُرسَل `8080` (آمن بسبب `|| 8080` في `startServer`)
- `config.apiKeys` = `undefined` → `.map()` سيُسبّب `TypeError: Cannot read properties of undefined`

**الكود الحالي:**
```typescript
const [serverConfig, setServerConfig] = useState<ServerConfigValues>(() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SERVER) || '{}') || defaultServerConfig; }
  //                                                                    ^^^^^
  //  {} هو truthy! الـ || defaultServerConfig لن يُنفَّذ أبداً عند {}
```

**تقييم:** خطأ يُسبّب `TypeError` عند أول تشغيل

**الحل:**
```typescript
const [serverConfig, setServerConfig] = useState<ServerConfigValues>(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVER) || 'null');
    // دمج مع defaults لضمان وجود الحقول الجديدة حتى في البيانات القديمة
    return saved ? { ...defaultServerConfig, ...saved } : defaultServerConfig;
  } catch { return defaultServerConfig; }
});

// نفس الإصلاح لـ modelParams:
const [modelParams, setModelParams] = useState<ModelParamValues>(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PARAMS) || 'null');
    return saved ? { ...defaultModelParams, ...saved } : defaultModelParams;
  } catch { return defaultModelParams; }
});
```

---

## القسم الثاني: الأخطاء المتوسطة (Medium)

---

### 🟡 BUG-006 — `QuantizationSelector` يظهر فقط عند وجود `activeModel` (not idle)

**الملف:** `src/renderer/components/Models/ModelManager.tsx` — السطر 191

**المشكلة:** 
```tsx
{activeModel && (  // activeModel = models.find(m => m.id === activeModelId)
```
`activeModel` يكون `null` دائماً حتى يُشغَّل نموذج. المستخدم لا يستطيع اختيار quantization قبل التحميل.

**الحل:** إتاحة الـ Quantization Selector لأي نموذج مُختار من القائمة (selectedModelId منفصل عن activeModelId):
```tsx
const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
const selectedModel = models.find(m => m.id === selectedModelId) || models[0] || null;

{selectedModel && (
  <QuantizationSelector
    selected={selectedQuant}
    modelSizeMB={selectedModel.fileSizeMB}
    onChange={setSelectedQuant}
  />
)}
```

---

### 🟡 BUG-007 — `McpConfig` يقبل محتوى JSON فارغاً `""` للحفظ

**الملف:** `src/renderer/components/Models/McpConfig.tsx` — الدالة `handleSave`

**المشكلة:** `JSON.parse("")` يُطلق استثناءً، لكن `JSON.parse("   ")` أيضاً يُطلق استثناءً — كلاهما يُمنع. المشكلة هي أن المحتوى الفارغ يعطي رسالة "Invalid JSON" بدلاً من رسالة أوضح. أكثر من ذلك، إذا فشل `electron?.loadMcpConfig` (الـ IPC غير متاح)، يبقى المحتوى `""` وتُعرض رسالة "Invalid JSON" للمستخدم عند محاولة الحفظ.

**الحل:**
```tsx
const handleSave = async () => {
  if (!content.trim()) {
    setStatus({ type: 'error', msg: 'المحتوى فارغ — أضف JSON صحيح' });
    return;
  }
  try { JSON.parse(content); }
  catch (e: any) {
    setStatus({ type: 'error', msg: `JSON غير صالح: ${e.message}` });
    return;
  }
  // ...
};

// وفي useEffect: إضافة fallback عند فشل التحميل
useEffect(() => {
  const load = async () => {
    const electron = (window as any).electronAPI;
    const fallback = JSON.stringify({ mcpServers: {} }, null, 2);
    if (electron?.loadMcpConfig) {
      const result = await electron.loadMcpConfig();
      setContent(result.success ? result.content : fallback);
    } else {
      setContent(fallback);  // ← fallback عند غياب IPC
    }
  };
  load();
}, []);
```

---

### 🟡 BUG-008 — `stopServer` لا يُحدِّث `activeModelId` في الواجهة بشكل موثوق

**الملف:** `src/renderer/components/Models/ModelManager.tsx` — الدالة `handleStop` (السطر 109)

**المشكلة:** `handleStop` يستدعي `electron.stopServer()` ثم يُعيّن `setActiveModelId(null)` محلياً. لكن إذا فشل IPC أو رجع خطأ، يبقى `activeModelId` محدَّثاً في الـ UI بينما الخادم لا يزال يعمل.

**الحل:**
```typescript
const handleStop = async () => {
  const electron = (window as any).electronAPI;
  if (!electron?.stopServer) return;
  const result = await electron.stopServer();
  if (result?.success !== false) { // نثق بالنجاح إلا إذا صرَّح بالفشل
    setActiveModelId(null);
    onActiveModelChange?.(null);
  }
  await refreshModels(); // دائماً نُحدِّث من المصدر الحقيقي
};
```

---

### 🟡 BUG-009 — `ModelDropZone`: drag-and-drop يفشل في Electron بيئات معينة

**الملف:** `src/renderer/components/Models/ModelDropZone.tsx` — السطر 41

**المشكلة:**
```typescript
const filePath = (file as any).path;  // Electron-specific property
```
في بعض إصدارات Electron (خاصة مع `contextIsolation: true`)، `file.path` قد يكون `undefined`. يوجد كذلك مشكلة بصرية: عند السحب فوق child elements داخل الـ dropzone، تُطلَق `onDragLeave` مما يُسبّب وميضاً في الـ border.

**الحل الأول (File Path):**
```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  const file = e.dataTransfer.files[0];
  if (!file) return;
  
  // Electron يضع المسار في خاصية .path أو في dataTransfer
  const filePath = (file as any).path 
    || e.dataTransfer.getData('text/plain')
    || null;
  
  if (filePath) {
    handleRegister(filePath);
  } else {
    // fallback: فتح نافذة الاختيار
    handleClickZone();
  }
};
```

**الحل الثاني (DragLeave flickering):**
```typescript
// استخدام counter بدلاً من boolean
const [dragCounter, setDragCounter] = useState(0);
onDragEnter={() => setDragCounter(c => c + 1)}
onDragLeave={() => setDragCounter(c => c - 1)}
// isDragging = dragCounter > 0
```

---

### 🟡 BUG-010 — `ServerConfig` لا يتحقق من صحة المنفذ (Port)

**الملف:** `src/renderer/components/Models/ServerConfig.tsx` — السطر 127

**المشكلة:** لا يوجد تحقق من أن المنفذ:
- ضمن المدى المسموح (1024 - 65535)
- غير محجوز بالفعل (مثل 80، 443، 3000)

**الحل:**
```tsx
onChange={(e) => {
  const v = parseInt(e.target.value) || 8080;
  const port = Math.max(1024, Math.min(65535, v));
  set({ port });
}}
// إضافة رسالة تحذير:
{config.port < 1024 && (
  <span style={{ color: '#f59e0b', fontSize: 11 }}>
    ⚠ المنافذ أقل من 1024 تتطلب صلاحيات المدير
  </span>
)}
```

---

### 🟡 BUG-011 — `handleSaveAll` في `ModelManager` لا يُعيد تشغيل الخادم بالإعدادات الجديدة

**الملف:** `src/renderer/components/Models/ModelManager.tsx` — السطر 127

**المشكلة:** الضغط على "حفظ التغييرات" يُخزِّن الإعدادات في localStorage فقط. إذا كان نموذج نشطاً، الخادم يعمل بالإعدادات القديمة ولا يتأثر بالتغييرات.

**الحل:** إضافة تحذير للمستخدم:
```tsx
const handleSaveAll = async () => {
  // ...حفظ في localStorage...
  if (activeModelId) {
    setSaveStatus('success');
    // تنبيه: الإعدادات ستُطبَّق عند إعادة تشغيل النموذج
    setRestartNeeded(true);
  }
};

// في JSX:
{restartNeeded && activeModel && (
  <span className={styles.statusMsg} style={{ color: '#f59e0b' }}>
    ⚠ أعِد تشغيل النموذج لتطبيق الإعدادات الجديدة
  </span>
)}
```

---

### 🟡 BUG-012 — `DraftModel` في `ModelParameters` ليس ديناميكياً

**الملف:** `src/renderer/components/Models/ModelParameters.tsx` — السطر 185

**المشكلة:**
```tsx
<select className={styles.select} value={params.draftModel}>
  <option value="">Please load a model first</option>  // ← ثابت، لا يتحدث
</select>
```
لا يُعرض أي نموذج في القائمة حتى عند وجود نماذج مُحمَّلة.

**الحل:** تمرير قائمة النماذج كـ prop:
```tsx
// في ModelParameters.tsx — إضافة prop:
interface ModelParametersProps {
  params: ModelParamValues;
  modelId: string | null;
  availableModels: { id: string; name: string }[]; // ← جديد
  onChange: (params: ModelParamValues) => void;
}

// في JSX:
<select>
  <option value="">— لا يوجد Draft Model —</option>
  {availableModels.filter(m => m.id !== modelId).map(m => (
    <option key={m.id} value={m.id}>{m.name}</option>
  ))}
</select>

// في ModelManager.tsx:
<ModelParameters
  params={modelParams}
  modelId={activeModelId}
  availableModels={models.map(m => ({ id: m.id, name: m.name }))}
  onChange={setModelParams}
/>
```

---

### 🟡 BUG-013 — `saveBar` لـ `McpConfig` مكرر في كلا المستويين

**الملف:** `src/renderer/components/Models/McpConfig.tsx` — السطر 63 + `ModelManager.tsx` — السطر 265

**المشكلة:** `McpConfig` يحتوي على `saveBar` داخلي، و`ModelManager` يُخفي `saveBar` الخارجي عند تبويب MCP فقط. هذا صحيح، لكن تتكرر أنماط CSS `saveBar` مما قد يُسبّب تعارضاً إذا عُدِّل CSS لاحقاً.

**تحسين:** استخراج `McpConfig` لتقبل `onSave` callback خارجي بدلاً من إدارة الحفظ داخلياً، وهذا يجعل الـ save bar موحَّداً.

---

## القسم الثالث: الأخطاء الطفيفة والتحسينات (Minor)

---

### 🟢 BUG-014 — `QuantizationSelector` لا يُمكن استخدامه قبل توفر `modelSizeMB`

**الملف:** `src/renderer/components/Models/QuantizationSelector.tsx` — السطر 28

**المشكلة:** إذا كان `modelSizeMB = 0`، فإن `estimateRam` ستُعطي `~0 MB` لجميع التكميمات.

**الحل:** إضافة guard:
```tsx
const estimateRam = (ratio: number) => {
  if (!modelSizeMB || modelSizeMB === 0) return 'حجم غير معروف';
  // ...
};
```

---

### 🟢 BUG-015 — `App.tsx`: ترتيب منطق `activeTab` قد يُعطي `undefined` للـ `Models` tab

**الملف:** `src/renderer/App.tsx` — السطر 262

**المشكلة:** التسلسل الشرطي هو:
```tsx
} : activeTab === 'models' ? (
  <ModelManager ... />
) : activeTab === 'chat' ? (
  ...
) : activeTab === 'dashboard' ? (
  ...
) : (
  <Settings />  // ← يظهر لأي tab غير معروف بما في ذلك 'models' إذا تغير الترتيب
```
الترتيب صحيح حالياً لكن 'models' يجب أن يُعامَل مثل باقي التبويبات بوضوح.

**لا حاجة لتغيير عاجل** — الكود يعمل صحيحاً.

---

### 🟢 BUG-016 — `ModelList` يعرض زر "إيقاف" حتى لنماذج غير نشطة

**الملف:** `src/renderer/components/Models/ModelList.tsx` — السطر 67

**المشكلة:** زر "إيقاف" يظهر عند `model.status === 'ready'` بغض النظر عن `activeModelId`. يُمكن نظرياً أن نموذجاً يُعرض بـ `status: ready` لكنه ليس النموذج الفعلي النشط (إذا تغيّر الـ state).

**الحل:** إضافة check إضافي:
```tsx
{model.status === 'ready' && model.id === activeModelId ? (
  <button className={styles.btnStop} onClick={() => onStop(model.id)}>إيقاف</button>
) : (
  <button ... disabled={model.status === 'loading'}>
    {model.status === 'loading' ? <Loader2 size={12} /> : 'تحميل'}
  </button>
)}
```

---

### 🟢 BUG-017 — `SmartSuggestBtn` يُظهر spinner لـ Zap icon (خطأ مرئي طفيف)

**الملف:** `src/renderer/components/Models/SmartSuggestBtn.tsx`

**المشكلة:** عند تفعيل `loading`، يعرض `<Loader2 ... className={spin}>` فقط أيقونة. لكن نص "اقتراحات ذكية" يختفي مما يُقلِّص حجم الزر فجأة.

**الحل:** الإبقاء على النص أثناء التحميل:
```tsx
<button>
  {loading ? <Loader2 size={14} className={styles.spin} /> : <Zap size={14} />}
  {loading ? 'جاري التحليل...' : 'اقتراحات ذكية'}
</button>
```

---

### 🟢 BUG-018 — `McpEditor`: box-sizing غير معرَّف على `.mcpEditor`

**الملف:** `src/renderer/components/Models/ModelManager.module.css` — السطر 689

**المشكلة:** `width: 100%` بدون `box-sizing: border-box` يُسبّب تجاوز العرض عند وجود `padding: 16px`.

**الحل:**
```css
.mcpEditor {
  box-sizing: border-box; /* ← إضافة */
  width: 100%;
  /* ... */
}
```

---

### 🟢 BUG-019 — `resourceBadge` يفقد الـ GPU عند أسطر فارغة من `wmic`

**الملف:** `src/main/model_manager.ts` — السطر 326

**المشكلة:**
```typescript
.filter(g => g.name && g.name !== 'Unknown GPU')
```
تصفية `Unknown GPU` تُزيل GPUs التي لم يُكتشف اسمها بدلاً من إعطائها اسماً احتياطياً.

**الحل:**
```typescript
.filter(g => g.name)
.map(g => ({ ...g, name: g.name || 'Unknown GPU' }))
```

---

### 🟢 BUG-020 — `tab.activeTab` CSS class name: ينبغي أن يكون `.active` لا `.activeTab`

**الملف:** `src/renderer/components/Models/ModelManager.tsx` — السطر 161 + `ModelManager.module.css` — السطر 60

**المشكلة:** لا خطأ وظيفي، لكن `styles.activeTab` (بدلاً من `styles.active` المعياري المستخدم في بقية المشروع) يُسبّب عدم اتساق في التسميات.

**لا تغيير عاجل — مجرد ملاحظة للاتساق.**

---

## القسم الرابع: جدول الأولويات

| الرقم | البُعد | الخطورة | الملف | سهولة الإصلاح |
|-------|--------|---------|-------|----------------|
| BUG-001 | llama-server رسالة خطأ | 🔴 حرجة | model_manager.ts | سهل |
| BUG-002 | GPU value=35 ثابت | 🔴 حرجة | ServerConfig.tsx | سهل |
| BUG-003 | Stale closure في handleLoad | 🔴 حرجة | ModelManager.tsx | سهل |
| BUG-004 | wmic GPU detection | 🔴 حرجة | model_manager.ts | متوسط |
| BUG-005 | localStorage {} fallback | 🔴 حرجة | ModelManager.tsx | سهل |
| BUG-006 | QuantizationSelector مخفي | 🟡 متوسطة | ModelManager.tsx | سهل |
| BUG-007 | McpConfig empty content | 🟡 متوسطة | McpConfig.tsx | سهل |
| BUG-008 | stopServer غير موثوق | 🟡 متوسطة | ModelManager.tsx | سهل |
| BUG-009 | Drag-and-drop path | 🟡 متوسطة | ModelDropZone.tsx | متوسط |
| BUG-010 | Port validation | 🟡 متوسطة | ServerConfig.tsx | سهل |
| BUG-011 | Save لا يُعيد تشغيل | 🟡 متوسطة | ModelManager.tsx | سهل |
| BUG-012 | DraftModel ليس ديناميكياً | 🟡 متوسطة | ModelParameters.tsx | متوسط |
| BUG-013 | saveBar مكرر | 🟡 متوسطة | McpConfig.tsx | سهل |
| BUG-014 | modelSizeMB=0 | 🟢 طفيف | QuantizationSelector.tsx | سهل |
| BUG-015 | ترتيب activeTab | 🟢 طفيف | App.tsx | لا يحتاج |
| BUG-016 | زر إيقاف لغير النشط | 🟢 طفيف | ModelList.tsx | سهل |
| BUG-017 | SmartSuggestBtn spinner | 🟢 طفيف | SmartSuggestBtn.tsx | سهل |
| BUG-018 | box-sizing mcpEditor | 🟢 طفيف | ModelManager.module.css | سهل |
| BUG-019 | GPU filter | 🟢 طفيف | model_manager.ts | سهل |
| BUG-020 | naming activeTab | 🟢 طفيف | CSS | لا يحتاج |

---

## القسم الخامس: تقييم عام

### ✅ ما يعمل بشكل صحيح

1. **هيكل البيانات** — نموذج `GgufModel` مكتمل ومنطقي
2. **التخزين المستمر للنماذج** — `models.json` يُحمَّل عند الإقلاع ويُعيَّن status إلى `idle`
3. **حد أقصى 5 نماذج** — مُطبَّق في `registerModel`
4. **التحقق من `.gguf`** — مُطبَّق في طرفين (frontend + backend)
5. **IPC channels كاملة** — جميع الـ 11 handler مربوط بشكل صحيح
6. **CSS Module** — تصميم متسق، لا تعارض مع التبويبات الأخرى
7. **Smart Suggestions** — منطق الاقتراح معقول ومحكم
8. **API Key Generation** — آمن (20 bytes عشوائي = hex 40 حرف)
9. **MCP JSON validation** — `JSON.parse` قبل الحفظ
10. **التبديل بين التبويبات** — يعمل بدون لفّات أو تسريب state

### ⚠ ما يحتاج إصلاحاً عاجلاً

1. **BUG-001, 002, 003, 005** — يجب إصلاحها قبل أي اختبار وظيفي حقيقي
2. **BUG-004** — يؤثر على Windows 11 (الأشيع)

### 🚀 الخلاصة

التطبيق مبني بشكل ممتاز من ناحية الهيكل والتصميم. الأخطاء الحرجة الخمسة تحتاج **ساعتين تقريباً** من العمل لإصلاحها. بعد إصلاحها يكون النظام جاهزاً لاختبار الدمج مع `llama-server`.

**الإجمالي المقدَّر لوقت الإصلاح:** 3-4 ساعات للأخطاء من BUG-001 إلى BUG-013.
