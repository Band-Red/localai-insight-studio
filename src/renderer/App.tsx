import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, MessageSquare, LayoutDashboard, Eye,
  Settings as SettingsIcon, ExternalLink,
  Smartphone, Tablet, Monitor, X, Brain
} from 'lucide-react';
import ChatBox from './components/Chat/ChatBox';
import Dashboard from './components/Dashboard/Dashboard';
import SplashScreen from './components/Splash/SplashScreen';
import Emulator from './components/Emulator/Emulator';
import Previewer from './components/Previewer/Previewer';
import Settings from './components/Settings/Settings';
import VisualEditorOverlay from './components/Emulator/VisualEditorOverlay';
import ModelManager from './components/Models/ModelManager';

import styles from './App.module.css';
import layoutStyles from './AppLayout.module.css';

// تعريف الأجهزة
const DEVICES = {
  iphone: { width: '393px', height: '852px', label: 'iPhone' },
  samsung: { width: '360px', height: '780px', label: 'Samsung' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  desktop: { width: '100%', height: '100%', label: 'Desktop' }
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'sandbox' | 'settings' | 'models'>('chat');
  const [activeModelName, setActiveModelName] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState<'preview' | 'code'>('preview');
  const [isInspectMode, setIsInspectMode] = useState(true); // تفعيل وضع الفحص افتراضياً لتجربة أفضل
  const [device, setDevice] = useState(DEVICES.iphone);
  const [inspectedElement, setInspectedElement] = useState<any>(null);
  const [currentCode, setCurrentCode] = useState('');

  // حالات جديدة للمعاينة في الدردشة
  const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
  const [chatPreviewCode, setChatPreviewCode] = useState('');
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_INSPECTED') {
        setInspectedElement(event.data.info);
      }
    };
    window.addEventListener('message', handleMessage);

    setCurrentCode(`
  <html>
  <body style="margin:0; background:#050507; font-family: sans-serif; color: #fff; display: flex; align-items:center; justify-content:center; height: 100vh;">
    <div style="padding:40px; text-align:center; max-width: 500px;">
      <h1 style="color:#00ffcc; margin-bottom: 20px;">أهلاً بك في المعاينة</h1>
      <p style="color:#71717a; line-height: 1.6;">انقر على أي عنصر لفحصه بصرياً ومعرفة تفاصيله وتعديله ذكياً.</p>
      <div style="margin-top:30px; padding:25px; background:#0c0c12; border-radius:16px; border:1px solid #1f1f23; box-shadow:0 10px 30px rgba(0,0,0,0.4);">
        عنصر تجريبي قابل للفحص والبناء
      </div>
      <button style="margin-top:30px; padding:12px 30px; background:#00ffcc; color:#000; border:none; border-radius:10px; font-weight:bold; cursor:pointer; transition: transform 0.2s;">زر تفاعلي</button>
    </div>
  </body>
  </html>
  `);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const openInBrowser = () => {
    if ((window as any).electronAPI && (window as any).electronAPI.openExternal) {
      (window as any).electronAPI.openExternal('http://localhost:3000');
    }
  };

  const injectInspector = (html: string) => {
    const script = `
      <script>
        document.addEventListener('click', (e) => {
          if (!${isInspectMode}) return;
          e.preventDefault();
          e.stopPropagation();
          
          const info = {
            tagName: e.target.tagName,
            className: e.target.className,
            innerText: e.target.innerText.substring(0, 50),
            html: e.target.outerHTML.substring(0, 200),
            x: e.clientX,
            y: e.clientY
          };
          window.parent.postMessage({ type: 'ELEMENT_INSPECTED', info }, '*');
        }, true);

        document.addEventListener('mouseover', (e) => {
          if (!${isInspectMode}) return;
          e.target.style.outline = '2px solid #00ffcc';
          e.target.style.outlineOffset = '-2px';
          e.target.style.cursor = 'crosshair';
        });

        document.addEventListener('mouseout', (e) => {
          if (!${isInspectMode}) return;
          e.target.style.outline = 'none';
        });
      </script>
    `;
    return html.replace('</body>', `${script}</body>`);
  };

  const handleRunInChat = (code: string) => {
    setChatPreviewCode(code);
    setIsChatPreviewOpen(true);
  };

  const handleVisualEditSubmit = async (instruction: string) => {
    if (!inspectedElement || !instruction.trim()) return;

    setIsUpdatingCode(true);
    try {
      const electron = (window as any).electronAPI;
      if (electron && electron.sendMessage) {
        // نرسل السياق الكامل للذكاء الاصطناعي ليقوم بالتعديل الموضعي
        const prompt = `
          لدي هذا الكود:
          \`\`\`html
          ${chatPreviewCode || currentCode}
          \`\`\`
          
          أريد تعديل العنصر التالي:
          الفئة: ${inspectedElement.tagName}
          الكود القديم للعنصر: ${inspectedElement.html}
          
          الطلب: ${instruction}
          
          قم بإرجاع الكود الكامل المعدل فقط داخل وسم html.
        `;

        const result = await electron.sendMessage(prompt);
        if (result.success) {
          // استخراج الكود من الاستجابة (بافتراض أنه يعود بماركداون)
          const codeMatch = result.response.match(/```html\n?([\s\S]*?)```/) || [null, result.response];
          const newCode = codeMatch[1].trim();

          if (isChatPreviewOpen) {
            setChatPreviewCode(newCode);
          } else {
            setCurrentCode(newCode);
          }
          setInspectedElement(null);
        }
      }
    } catch (error) {
      console.error("Visual Edit Error:", error);
    } finally {
      setIsUpdatingCode(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className={styles.appContainer}>
      {/* Sidebar - Side Navigation Panel */}
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}><Zap color="#00ffcc" size={28} /></div>
        <nav className={styles.navItems}>
          <button
            className={`${styles.navItem} ${activeTab === 'chat' ? styles.active : ''}`}
            onClick={() => setActiveTab('chat')}
          ><MessageSquare size={22} /></button>
          <button
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          ><LayoutDashboard size={22} /></button>
          <button
            className={`${styles.navItem} ${activeTab === 'sandbox' ? styles.active : ''}`}
            onClick={() => setActiveTab('sandbox')}
          ><Eye size={22} /></button>
          <button
            className={`${styles.navItem} ${activeTab === 'models' ? styles.active : ''}`}
            onClick={() => setActiveTab('models')}
            title="نماذج GGUF المحلية"
          ><Brain size={22} /></button>
          <div className={styles.sidebarBottom}>
            <button
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            ><SettingsIcon size={22} /></button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainViewport}>
        {activeTab === 'sandbox' ? (
          <div className={styles.sandboxContainer}>
            {/* Device Selection Bar */}
            <div className={styles.deviceToolbar}>
              {Object.entries(DEVICES).map(([key, d]) => (
                <button
                  key={key}
                  className={`${styles.deviceBtn} ${device === d ? styles.active : ''}`}
                  onClick={() => setDevice(d)}
                >
                  {key === 'iphone' ? <Smartphone size={14} /> :
                    key === 'tablet' ? <Tablet size={14} /> :
                      key === 'desktop' ? <Monitor size={14} /> : <Zap size={14} />}
                  {d.label}
                </button>
              ))}
            </div>

            {/* Sandbox Mode Switcher */}
            <div className={styles.sandboxModeSwitcher}>
              <button
                onClick={() => setSandboxMode('preview')}
                className={`${styles.modeBtn} ${sandboxMode === 'preview' ? styles.active : ''}`}
              >المعاينة التفاعلية</button>
              <button
                onClick={() => setSandboxMode('code')}
                className={`${styles.modeBtn} ${sandboxMode === 'code' ? styles.active : ''}`}
              >عرض الكود المصدري</button>

              <div className={styles.toolbarActions}>
                <span className={styles.inspectLabel}>وضع الفحص البصري:</span>
                <button
                  onClick={() => setIsInspectMode(!isInspectMode)}
                  className={`${styles.inspectToggle} ${isInspectMode ? styles.active : styles.inactive}`}
                >{isInspectMode ? 'نشط' : 'معطل'}</button>

                <button
                  onClick={openInBrowser}
                  title="فتح في المتصفح الخارجي"
                  className={styles.externalBtn}
                ><ExternalLink size={14} /></button>
              </div>
            </div>

            <div className={styles.viewportContent}>
              {sandboxMode === 'preview' ? (
                <div className={styles.previewContainer}>
                  <Emulator code={injectInspector(currentCode)} />

                  {/* Visual Editor Overlay for Sandbox tab */}
                  <VisualEditorOverlay
                    element={inspectedElement}
                    onCancel={() => setInspectedElement(null)}
                    onSubmit={handleVisualEditSubmit}
                    loading={isUpdatingCode}
                  />
                </div>
              ) : (
                <Previewer content={currentCode} />
              )}
            </div>
          </div>
        ) : activeTab === 'models' ? (
          <ModelManager onActiveModelChange={setActiveModelName} />
        ) : activeTab === 'chat' ? (
          <div className={layoutStyles.chatSplitContainer}>
            <div className={`${layoutStyles.chatSide} ${isChatPreviewOpen ? layoutStyles.withPreview : ''}`}>
              <ChatBox
                onCodeGenerated={(code) => { setCurrentCode(code); }}
                onRunCode={handleRunInChat}
                activeModel={activeModelName}
              />
            </div>
            {isChatPreviewOpen && (
              <div className={layoutStyles.previewSide}>
                <div className={layoutStyles.previewHeader}>
                  <span>معاينة حية للنظام المولد</span>
                  <button className={layoutStyles.closePreviewBtn} onClick={() => setIsChatPreviewOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
                <Emulator code={injectInspector(chatPreviewCode)} />

                {/* Visual Editor Overlay for Chat splitting view */}
                <VisualEditorOverlay
                  element={inspectedElement}
                  onCancel={() => setInspectedElement(null)}
                  onSubmit={handleVisualEditSubmit}
                  loading={isUpdatingCode}
                />
              </div>
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <Dashboard />
        ) : (
          <Settings />
        )}
      </main>
    </div>
  );
};

export default App;
