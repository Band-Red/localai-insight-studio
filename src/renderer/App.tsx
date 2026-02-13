import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, MessageSquare, LayoutDashboard, Eye,
  MousePointer2, Settings as SettingsIcon, ExternalLink,
  Smartphone, Tablet, Monitor
} from 'lucide-react';
import ChatBox from './components/Chat/ChatBox';
import Dashboard from './components/Dashboard/Dashboard';
import SplashScreen from './components/Splash/SplashScreen';
import Emulator from './components/Emulator/Emulator';
import Previewer from './components/Previewer/Previewer';
import Settings from './components/Settings/Settings';

/**
 * استيراد التنسيقات بنظام الاستيراد المباشر لملفات الـ Modules 
 * لضمان حقن التنسيقات في الـ DOM بشكل صحيح مع الالتزام بالشرط
 */
import './App.module.css';

// تعريف الأجهزة
const DEVICES = {
  iphone: { width: '393px', height: '852px', label: 'iPhone' },
  samsung: { width: '360px', height: '780px', label: 'Samsung' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  desktop: { width: '100%', height: '100%', label: 'Desktop' }
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'sandbox' | 'settings'>('sandbox');
  const [sandboxMode, setSandboxMode] = useState<'preview' | 'code'>('preview');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [device, setDevice] = useState(DEVICES.iphone);
  const [key, setKey] = useState(0);
  const [inspectedElement, setInspectedElement] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [currentCode, setCurrentCode] = useState('');

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // الربط مع الـ Backend (Task 6.1 & 6.2)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // @ts-ignore - استدعاء من الـ Preload script للتحقق من حالة النموذج
        if (window.electronAPI && window.electronAPI.checkModelStatus) {
          const status = await window.electronAPI.checkModelStatus();
          setBackendStatus(status);
        }
      } catch (err) {
        console.error("فشل الربط مع محرك البحث المحلي", err);
      }
    };
    fetchStatus();

    // استقبال رسائل الفحص من الـ iframe لعملية الـ Inspection البصري
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_INSPECTED') {
        setInspectedElement(event.data.info);
      }
    };
    window.addEventListener('message', handleMessage);

    // Set initial code (demo)
    setCurrentCode(`
  <html>
  <body style="margin:0; background:#f8fafc; font-family: sans-serif;">
    <div style="padding:40px; text-align:center; color:#334155;">
      <h1 style="color:#0f172a;">أهلاً بك في المعاينة</h1>
      <p>انقر على أي عنصر لفحصه بصرياً ومعرفة تفاصيله.</p>
      <div style="margin-top:20px; padding:20px; background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        عنصر تجريبي قابل للفحص
      </div>
      <button style="margin-top:20px; padding:10px 24px; background:#00ffcc; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">زر تفاعلي</button>
    </div>
  </body>
  </html>
  `);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const openInBrowser = () => {
    // @ts-ignore - فتح الرابط في المتصفح الخارجي للنظام عبر Electron
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal('http://localhost:3000');
    }
  };

  const injectInspector = (html: string) => {
    const script = `
      <script>
        document.addEventListener('click', (e) => {
          if (!${isInspectMode}) return;
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.inspected-el').forEach(el => el.classList.remove('inspected-el'));
          e.target.classList.add('inspected-el');
          const info = {
            tagName: e.target.tagName,
            className: e.target.className,
            innerText: e.target.innerText.substring(0, 30)
          };
          window.parent.postMessage({ type: 'ELEMENT_INSPECTED', info }, '*');
        }, true);

        // Add visual feedback for hover
        document.addEventListener('mouseover', (e) => {
          if (!${isInspectMode}) return;
          e.target.style.outline = '1px dashed #00ffcc';
          e.target.style.cursor = 'crosshair';
        });

        document.addEventListener('mouseout', (e) => {
          if (!${isInspectMode}) return;
          e.target.style.outline = 'none';
        });

        const style = document.createElement('style');
        style.innerHTML = '.inspected-el { outline: 3px solid #00ffcc !important; outline-offset: -3px; }';
        document.head.appendChild(style);
      </script>
    `;
    return html.replace('</body>', `${script}</body>`);
  };

  const demoCode = `
  < html >
  <body style="margin:0; background:#f8fafc; font-family: sans-serif;">
    <div style="padding:40px; text-align:center; color:#334155;">
      <h1 style="color:#0f172a;">أهلاً بك في المعاينة</h1>
      <p>انقر على أي عنصر لفحصه بصرياً ومعرفة تفاصيله.</p>
      <div style="margin-top:20px; padding:20px; background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        عنصر تجريبي قابل للفحص
      </div>
      <button style="margin-top:20px; padding:10px 24px; background:#00ffcc; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">زر تفاعلي</button>
    </div>
  </body>
    </html >
  `;

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar - Side Navigation Panel */}
      <aside className="sidebar">
        <div className="logo-section"><Zap color="#00ffcc" size={28} /></div>
        <nav className="nav-items">
          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''} `}
            onClick={() => setActiveTab('chat')}
          ><MessageSquare size={22} /></button>
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''} `}
            onClick={() => setActiveTab('dashboard')}
          ><LayoutDashboard size={22} /></button>
          <button
            className={`nav-item ${activeTab === 'sandbox' ? 'active' : ''} `}
            onClick={() => setActiveTab('sandbox')}
          ><Eye size={22} /></button>
          <div style={{ marginTop: 'auto' }}>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''} `}
              onClick={() => setActiveTab('settings')}
            ><SettingsIcon size={22} /></button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        {activeTab === 'sandbox' ? (
          <div className="sandboxContainer">
            {/* Device Selection Bar */}
            <div className="device-toolbar">
              {Object.entries(DEVICES).map(([key, d]) => (
                <button
                  key={key}
                  className={`device-btn ${device === d ? 'active' : ''}`}
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
            <div className="sandbox-mode-switcher">
              <button
                onClick={() => setSandboxMode('preview')}
                className={`mode-btn ${sandboxMode === 'preview' ? 'active' : ''}`}
              >المعاينة التفاعلية</button>
              <button
                onClick={() => setSandboxMode('code')}
                className={`mode-btn ${sandboxMode === 'code' ? 'active' : ''}`}
              >عرض الكود المصدري</button>

              <div className="toolbar-actions">
                <span className="inspect-label">وضع الفحص البصري:</span>
                <button
                  onClick={() => setIsInspectMode(!isInspectMode)}
                  className={`inspect-toggle ${isInspectMode ? 'active' : 'inactive'}`}
                >{isInspectMode ? 'نشط' : 'معطل'}</button>

                <button
                  onClick={openInBrowser}
                  title="فتح في المتصفح الخارجي"
                  className="external-btn"
                ><ExternalLink size={14} /></button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {sandboxMode === 'preview' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Emulator code={injectInspector(currentCode)} />

                  {/* Visual Inspector Overlay (kept from App.tsx logic) */}
                  {inspectedElement && (
                    <div className="inspector-panel">
                      <div className="inspector-header">
                        <div className="inspector-title"><MousePointer2 size={16} /> <span>فحص العنصر</span></div>
                        <button onClick={() => setInspectedElement(null)} className="close-btn">×</button>
                      </div>
                      <div className="inspector-details">
                        <p><strong>العنصر:</strong> <code className="tag-name">&lt;{inspectedElement.tagName.toLowerCase()}&gt;</code></p>
                        <p><strong>الفئات:</strong> <span className="class-name">{inspectedElement.className || 'N/A'}</span></p>
                        <p><strong>النص:</strong> <em className="inner-text">"{inspectedElement.innerText}"</em></p>
                      </div>
                      <button className="inspect-btn-action" onClick={() => setActiveTab('chat')}>تعديل هذا الجزء ذكياً</button>
                    </div>
                  )}
                </div>
              ) : (
                <Previewer content={currentCode} />
              )}
            </div>
          </div>
        ) : activeTab === 'chat' ? (
          <ChatBox onCodeGenerated={(code) => { setCurrentCode(code); setActiveTab('sandbox'); }} />
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