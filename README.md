# ⚡ LocalAI Insight Studio

[English](#english) | [العربية](#arabic)

---

<div id="english">

# 🚀 LocalAI Insight Studio: Sovereign Local AI IDE

**LocalAI Insight Studio** is an All-in-One Local AI Development Ecosystem. It enables developers to build, test, and monitor local AI models with absolute privacy. No clouds, no databases—just you and your machine.

---

## 1. Design & Planning

### 1.1 Vision & Scope

- **Goal**: Empower developers with a sovereign AI environment that integrates coding and inference locally.
- **Problem Solving**:
  - **Privacy**: Eliminates the risk of sending sensitive code to cloud servers.
  - **Cost**: No subscription fees for AI services.
  - **Dependency**: Works completely offline.
- **Importance**: Provides a secure "Sandbox" for testing GGUF models and previewing outputs in real-time.

### 1.2 Requirements

- **Business Requirements**: 100% reduction in cloud infrastructure dependency. Full developer lifecycle support (Code, Inspect, Monitor).
- **User Stories**:
  - As a developer, I want to run GGUF models locally to use as a private Copilot.
  - As an analyst, I want to see CPU/RAM usage to ensure system stability.
- **Functional Requirements**: GGUF drag-and-drop, HTML/JS live preview, Local RAG for folder indexing.
- **Non-Functional Requirements**: Response time < 200ms, Local-first data storage, Windows compatibility.

### 1.3 System Design

- **Architecture**:
  1.  **Main Process (Electron)**: Manages file system and background tasks.
  2.  **Renderer (React)**: User interface for interaction.
  3.  **Python Bridge**: High-precision hardware metrics via `psutil`.
- **Data Schema**: No SQL. Uses `config.json` for settings, `models.json` for metadata, and `Markdown` for chat logs (Obsidian compatible).
- **UI/UX**: Dark Neon/Cyberpunk theme, Inter/Segoe UI fonts, persistent Sidebar for navigation.

---

## 2. Implementation & Code

### 2.1 Setup Guide

- **Prerequisites**: Node.js v18+, Python 3.10+ (with `psutil`), Git.
- **Dependencies**: Install via `npm install` and `pip install psutil`.
- **Environment**: Uses `.env` for default server ports.

### 2.2 Build & Deployment

- **Compile**: `npm run build` (Webpack-based bundling).
- **Testing**: `npm run dev` to verify the Python bridge and IPC.
- **Deployment**: `npm run dist` to generate a Windows executable (.exe).

### 2.3 Contributing Guide

1.  **Open Issue**: Discuss major changes before starting.
2.  **Pull Requests**: Descriptive branch names (e.g., `feature/fix-tabs`).
3.  **Code Style**: TypeScript only, CSS Modules, clear comments in AR or EN.

### 2.4 Code Documentation

- **Inline Comments**: Used for complex IPC logic and Python processing algorithms.
- **Public API (electronAPI)**:
  - `sendMessage(prompt, model)`: Send text to the model.
  - `selectDirectory()`: Open directory picker.
  - `saveSettings(config)`: Save configuration to JSON.

---

## 3. Operations & Usage

### 3.1 End-User Guide

1.  **Launch**: Open the app from the shortcut.
2.  **Load Model**: Drag a `.gguf` file into the "Models" tab.
3.  **Chat**: Ask questions in the chat tab.
4.  **Preview**: Click "Run" on code outputs to see live rendering.
5.  **Visual Editor**: Click any element in the preview (e.g., a button) and type instructions like "Make it red" to edit code instantly.

### 3.2 Admin Guide

- **Configuration**: Settings are stored at `C:\Users\{User}\.localai-insight-studio\`.
- **Monitoring**: Use the Dashboard to track hardware resources and prevent OOM (Out of Memory) errors.

### 3.3 Troubleshooting

| Issue                   | Cause                        | Solution                                      |
| :---------------------- | :--------------------------- | :-------------------------------------------- |
| Dashboard data missing  | Python or `psutil` missing   | Install Python and run `pip install psutil`.  |
| Model not responding    | Model size > Available RAM   | Use a smaller model (e.g., 3B instead of 8B). |
| UI elements unclickable | Transparent overlay blocking | Restart app (Ctrl+R).                         |

---

## 4. Quality & Testing

- **Strategy**: Manual Walkthroughs, Integration testing (IPC flow), and OS compatibility (Win 10/11).
- **Test Procedures**:
  1. Verify IPC via `npm run dev`.
  2. Verify Build via `npm run build`.
  3. Verify Dist via `npm run dist`.
- **Coverage**: Dialog selection, Chart accuracy, Visual Inspector capability, and JSON persistence.

---

## 5. Architectural Decisions (ADR)

- **ADR 1: File-based instead of SQL**: Portability, privacy, and Obsidian integration without a DB server.
- **ADR 2: Python for Monitoring**: `psutil` provides more accurate hardware metrics than Node.js native tools.

</div>

---

<div id="arabic" dir="rtl">

# 🚀 LocalAI Insight Studio: المحرك السيادي المحلي للذكاء الاصطناعي

**LocalAI Insight Studio** هو نظام بيئي متكامل ومعزول لإدارة الذكاء الاصطناعي محلياً، مصمم خصيصاً للمطورين. يمنحك القدرة على بناء واختبار ومراقبة النماذج المحلية بخصوصية مطلقة. لا سحابة، لا قواعد بيانات—فقط أنت وجهازك.

---

## 1. وثائق التصميم والخطط

### 1.1 وثيقة الرؤية والنطاق

- **الهدف**: تمكين المطورين من امتلاك بيئة ذكاء اصطناعي سيادية تعمل محلياً بالكامل مدمجة مع عملية البرمجة.
- **المشكلة التي يحلها**:
  - **الخصوصية**: حماية الأكواد والبيانات الحساسة من الإرسال للسحابة.
  - **التكلفة**: التخلص من رسوم الاشتراكات الشهرية.
  - **التبعية**: العمل دون الحاجة لاتصال بالإنترنت.
- **الأهمية**: يوفر "مختبرًا" (Sandbox) آمناً لاختبار نماذج GGUF ومعاينة مخرجاتها فورياً.

### 1.2 متطلبات المشروع

- **متطلبات العمل**: تقليل التبعية السحابية بنسبة 100%. دعم كامل لدورة حياة المطور.
- **متطلبات المستخدم**:
  - كـ "مطور"، أريد تشغيل نموذج GGUF كـ Copilot خاص ومحلي.
  - كـ "محلل"، أريد مراقبة استهلاك الجهاز (CPU/RAM) لضمان الاستقرار.
- **المتطلبات الوظيفية**: دعم GGUF بالسحب والإفلات، معاينة حية للأكواد (HTML/JS)، نظام RAG محلي للمجلدات.
- **المتطلبات غير الوظيفية**: سرعة استجابة < 200ms، تخزين محلي (Local-First)، توافق مع ويندوز.

### 1.3 التصميم المعماري

- **المعمارية**:
  1.  **العملية الرئيسية (Electron)**: إدارة النظام والملفات.
  2.  **عملية العرض (React)**: واجهة المستخدم.
  3.  **جسر بايثون (Python Bridge)**: جلب إحصائيات النظام بدقة عبر `psutil`.
- **تخزين البيانات**: لا توجد قواعد بيانات تقليدية. يتم استخدام `config.json` للإعدادات، `models.json` للبيانات الوصفية، وملفات `Markdown` للمحادثات (متوافقة مع Obsidian).
- **الواجهة (UI/UX)**: نمط نيون داكن (Cyberpunk)، خطوط Inter و Segoe UI، شريط جانبي ثابت للتنقل.

---

## 2. وثائق التنفيذ والكود

### 2.1 دليل الإعداد

- **المتطلبات**: Node.js v18+، Python 3.10+ (مع `psutil`)، و Git.
- **الاعتمادات**: يتم التثبيت عبر `npm install` و `pip install psutil`.
- **البيئة**: استخدام ملف `.env` لتوصيف المنافذ الافتراضية.

### 2.2 دليل البناء والنشر

- **البناء**: تشغيل `npm run build` (برمجة Webpack).
- **الاختبار**: تشغيل `npm run dev` للتأكد من ربط IPC وجسر البايثون.
- **النشر**: تشغيل `npm run dist` لإنتاج ملف `.exe` لنظام ويندوز.

### 2.3 دليل المساهمة

1.  **فتح Issue**: ناقش التعديلات الكبيرة قبل البدء.
2.  **Pull Requests**: تسمية واضحة للفروع (مثال: `feature/fix-tabs`).
3.  **أسلوب الكود**: TypeScript فقط، الالتزام بـ CSS Modules، وتعليقات واضحة.

### 2.4 توثيق الكود الرسمي

- **التعليقات**: مستخدمة بكثافة في `main.ts` و `python_engine.py` لشرح الخوارزميات.
- **الواجهات العامة (electronAPI)**:
  - `sendMessage`: إرسال الأوامر للنموذج.
  - `selectDirectory`: نافذة اختيار المجلدات.
  - `saveSettings`: حفظ التكوين في ملف JSON.

---

## 3. وثائق التشغيل والاستخدام

### 3.1 دليل المستخدم النهائي

1.  **التشغيل**: افتح التطبيق من الاختصار.
2.  **تحميل النموذج**: اسحب ملف `.gguf` لتبويب النماذج.
3.  **الدردشة**: ابدأ المحادثة البرمجية في تبويب الدردشة.
4.  **المعاينة**: اضغط "Run" على مخرجات الكود لرؤية المعاينة الحية.
5.  **المحرر البصري**: انقر على أي عنصر في المعاينة واكتب تعليمات (مثلاً "اجعل الزر أكبر") ليتم تعديل الكود فوراً.

### 3.2 دليل الإدارة

- **التكوين**: تُحفظ الإعدادات في المسار: `C:\Users\{User}\.localai-insight-studio\`.
- **المراقبة**: استخدم لوحة التحكم لمتابعة موارد الجهاز وتجنب امتلاء الذاكرة (OOM).

### 3.3 استكشاف الأخطاء وإصلاحها

| المشكلة                       | السبب المحتمل                 | الحل                                  |
| :---------------------------- | :---------------------------- | :------------------------------------ |
| البيانات لا تظهر في Dashboard | نقص بايثون أو `psutil`        | ثبت Python وشغل `pip install psutil`. |
| النموذج لا يستجيب             | حجم النموذج > الذاكرة المتاحة | استخدم نموذجاً أصغر (مثلاً 3B).       |
| تعذر النقر على الأزرار        | وجود عنصر شفاف يحجب الواجهة   | أعد تشغيل التطبيق (Ctrl+R).           |

---

## 4. وثائق الجودة والاختبار

- **الإستراتيجية**: جولات تجريبية يدوية، اختبار تكامل (IPC)، وفحص التوافق (Win 10/11).
- **إجراءات الفحص**:
  1. التأكد من سلامة IPC عبر `npm run dev`.
  2. التأكد من سلامة الحزم عبر `npm run build`.
  3. اختبار ملف التثبيت عبر `npm run dist`.
- **التغطية**: اختيار الملفات، دقة الرسوم البيانية، وقدرات المفتش البصري.

---

## 5. القرارات المعمارية (ADR)

- **القرار الأول: نظام الملفات بدلاً من SQL**: لضمان سيادة البيانات وسهولة النقل والتكامل مع Obsidian.
- **القرار الثاني: بايثون للمراقبة**: نظراً لتفوق مكتبة `psutil` في جلب بيانات العتاد العميقة بدقة.

</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2026 The Developer of Local AI Insight Studio


