import React, { useState, useEffect } from 'react';
import {
  Smartphone, Monitor, Tablet, ExternalLink,
  RefreshCw, MessageSquare, LayoutDashboard,
  Eye, MousePointer2, Zap
} from 'lucide-react';
import ChatBox from './components/Chat/ChatBox';
import Dashboard from './components/Dashboard/Dashboard';
import SplashScreen from './components/Splash/SplashScreen';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'sandbox'>('sandbox');
  const [device, setDevice] = useState(DEVICES.iphone);
  const [key, setKey] = useState(0);
  const [inspectedElement, setInspectedElement] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [currentCode, setCurrentCode] = useState('');

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
        const style = document.createElement('style');
        style.innerHTML = '.inspected-el { outline: 3px solid #00ffcc !important; outline-offset: -3px; }';
        document.head.appendChild(style);
      </script>
    `;
    return html.replace('</body>', `${script}</body>`);
  };

  const demoCode = `
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
  `;

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="appContainer">
      {/* Sidebar - Side Navigation Panel */}
      <aside className="sidebar">
        <div className="logoSection"><Zap color="#00ffcc" size={28} /></div>
        <nav className="navItems">
          <button
            className={`navBtn ${activeTab === 'chat' ? 'navBtnActive' : ''}`}
            onClick={() => setActiveTab('chat')}
          ><MessageSquare size={22} /></button>
          <button
            className={`navBtn ${activeTab === 'dashboard' ? 'navBtnActive' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          ><LayoutDashboard size={22} /></button>
          <button
            className={`navBtn ${activeTab === 'sandbox' ? 'navBtnActive' : ''}`}
            onClick={() => setActiveTab('sandbox')}
          ><Eye size={22} /></button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="contentArea">
        {activeTab === 'sandbox' ? (
          <div className="sandboxContainer">
            {/* Toolbar for Device Selection and Controls */}
            <header className="toolbar">
              <div className="deviceSelectors">
                {Object.entries(DEVICES).map(([key, value]) => (
                  <button
                    key={key}
                    className={`deviceBtn ${device.label === value.label ? 'deviceBtnActive' : ''}`}
                    onClick={() => setDevice(value)}
                  >
                    {key === 'iphone' ? <Smartphone size={16} /> : key === 'tablet' ? <Tablet size={16} /> : <Monitor size={16} />}
                    <span>{value.label}</span>
                  </button>
                ))}
              </div>
              <div className="actionButtons">
                <button className="navBtn" onClick={() => setKey(k => k + 1)} title="إعادة تحميل"><RefreshCw size={18} /></button>
                <button className="navBtn" onClick={openInBrowser} title="فتح خارجي"><ExternalLink size={18} color="#00ffcc" /></button>
              </div>
            </header>

            {/* Viewport for Visual Rendering */}
            <div className="viewport">
              <div className="deviceFrame" style={{ width: device.width, height: device.height }}>
                {device.label !== 'Desktop' && <div className="notch" />}
                <iframe
                  key={key}
                  className="iframeElement"
                  srcDoc={injectInspector(currentCode)}
                  sandbox="allow-scripts"
                />
              </div>
            </div>

            {/* Visual Inspector Panel */}
            {inspectedElement && (
              <div className="inspectorPanel">
                <div className="inspectorHeader">
                  <div className="inspectorTitle"><MousePointer2 size={16} /> <span>فحص العنصر</span></div>
                  <button onClick={() => setInspectedElement(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ margin: 0 }}><strong>العنصر:</strong> <code style={{ color: '#00ffcc' }}>&lt;{inspectedElement.tagName.toLowerCase()}&gt;</code></p>
                  <p style={{ margin: 0 }}><strong>الفئات:</strong> <span style={{ color: '#9ca3af' }}>{inspectedElement.className || 'N/A'}</span></p>
                  <p style={{ margin: 0 }}><strong>النص:</strong> <em style={{ color: '#e4e4e7' }}>"{inspectedElement.innerText}"</em></p>
                </div>
                <button className="inspectBtn" onClick={() => setActiveTab('chat')}>تعديل هذا الجزء ذكياً</button>
              </div>
            )}
          </div>
        ) : activeTab === 'chat' ? (
          <ChatBox onCodeGenerated={(code) => { setCurrentCode(code); setActiveTab('sandbox'); }} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default App;