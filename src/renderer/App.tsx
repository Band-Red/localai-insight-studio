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

// وضع المعاينة الافتراضي
const DEFAULT_VIEWPORT = { width: '100%', height: '100%' };


const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'sandbox' | 'settings' | 'models'>('chat');
  const [activeModelName, setActiveModelName] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState<'preview' | 'code'>('preview');
  const [isInspectMode, setIsInspectMode] = useState(true); // تفعيل وضع الفحص افتراضياً لتجربة أفضل
  const [device, setDevice] = useState(DEFAULT_VIEWPORT);

  const [inspectedElement, setInspectedElement] = useState<any>(null);
  const [currentCode, setCurrentCode] = useState('');

  // حالات جديدة للمعاينة في الدردشة
  const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
  const [chatPreviewCode, setChatPreviewCode] = useState('');
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);
  const [engineStatus, setEngineStatus] = useState<string | null>(null);

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

    const electron = (window as any).electronAPI;
    if (electron?.onEngineSetupStatus) {
      electron.onEngineSetupStatus((msg: string) => {
        setEngineStatus(msg);
        if (msg.includes('بنجاح') || msg.includes('موجود وجاهز')) {
          setTimeout(() => setEngineStatus(null), 4000);
        }
      });
    }

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

  const [showBrowserOptions, setShowBrowserOptions] = useState(false);
  
  const openInBrowser = (browser?: 'chrome' | 'edge') => {
    const code = sandboxMode === 'preview' ? currentCode : currentCode;
    const electron = (window as any).electronAPI;
    
    if (!electron || !electron.openExternal) return;

    if (!browser && !showBrowserOptions) {
      setShowBrowserOptions(true);
      return;
    }

    const fullHtml = code.includes('<html>') ? code : `<html><body style="background:#050507;color:#fff;padding:20px;">${code}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    electron.openExternal(url, browser);
    setShowBrowserOptions(false);
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
            html: e.target.outerHTML.substring(0, 500),
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
          e.target.style.transition = 'outline 0.15s ease';
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

  const extractCode = (text: string) => {
    const codeMatch = text.match(/```html\n?([\s\S]*?)```/) || 
                     text.match(/```xml\n?([\s\S]*?)```/) ||
                     text.match(/```[\s\S]*?\n?([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) return codeMatch[1].trim();
    if (text.includes('<html>')) return text.trim();
    return text.trim();
  };

  const handleVisualEditSubmit = async (instruction: string) => {
    if (!inspectedElement || !instruction.trim()) return;

    setIsUpdatingCode(true);
    try {
      const electron = (window as any).electronAPI;
      if (electron && electron.sendMessage) {
        const prompt = `
          Context: You are modifying a live web application.
          Code: 
          \`\`\`html
          ${chatPreviewCode || currentCode}
          \`\`\`
          
          Action: Modify the following element based on the instruction.
          Element Tag: ${inspectedElement.tagName}
          Element HTML: ${inspectedElement.html}
          Instruction: ${instruction}
          
          Requirements:
          1. Retain all other functionality.
          2. Return the COMPLETE updated HTML code.
          3. Wrap the response in \`\`\`html code block.
        `;

        const result = await electron.sendMessage(prompt, activeModelName);
        if (result.success) {
          const newCode = extractCode(result.response);

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
        {engineStatus && (
          <div className={styles.engineToast}>
            <Brain size={16} /> <span>{engineStatus}</span>
          </div>
        )}
        {activeTab === 'sandbox' ? (
          <div className={styles.sandboxContainer}>
            {/* Sandbox Controls & Actions */}
            <div className={styles.deviceToolbar}>
              <div className={styles.sandboxModeSwitcher}>
                <button
                  onClick={() => setSandboxMode('preview')}
                  className={`${styles.modeBtn} ${sandboxMode === 'preview' ? styles.active : ''}`}
                >المعاينة التفاعلية</button>
                <button
                  onClick={() => setSandboxMode('code')}
                  className={`${styles.modeBtn} ${sandboxMode === 'code' ? styles.active : ''}`}
                >عرض مصدر الكود</button>
              </div>

              <div className={styles.toolbarActions}>
                <span className={styles.inspectLabel}>وضع الفحص البصري:</span>
                <button
                  onClick={() => setIsInspectMode(!isInspectMode)}
                  className={`${styles.inspectToggle} ${isInspectMode ? styles.active : styles.inactive}`}
                >{isInspectMode ? 'نشط' : 'معطل'}</button>

                <button
                  onClick={() => openInBrowser()}
                  title="فتح في المتصفح الخارجي"
                  className={styles.externalBtn}
                ><ExternalLink size={14} /></button>

                {showBrowserOptions && (
                  <div className={styles.browserSelectPopover}>
                    <button className={styles.browserBtn} onClick={() => openInBrowser('chrome')}>
                      <span>Google Chrome</span>
                    </button>
                    <button className={styles.browserBtn} onClick={() => openInBrowser('edge')}>
                      <span>Microsoft Edge</span>
                    </button>
                    <button 
                      className={styles.browserBtn} 
                      style={{ borderTop: '1px solid #1f1f23', color: '#71717a' }}
                      onClick={() => setShowBrowserOptions(false)}
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                )}
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
                onCodeGenerated={(code) => { setCurrentCode(extractCode(code)); }}
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
        )
        }
      </main >
    </div >
  );
};

export default App;
