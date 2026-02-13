import React, { useState } from 'react';
import { Smartphone, Monitor, Tablet, ExternalLink, RefreshCw } from 'lucide-react';
import './Emulator.module.css';

// تعريف قياسات الأجهزة المدعومة
const DEVICES = {
  iphone: { width: '375px', height: '812px', label: 'iPhone 13 Pro' },
  samsung: { width: '360px', height: '780px', label: 'Galaxy S22' },
  tablet: { width: '768px', height: '1024px', label: 'iPad Air' },
  desktop: { width: '100%', height: '100%', label: 'Desktop View' }
};

interface EmulatorProps {
  code?: string;
}

const Emulator: React.FC<EmulatorProps> = ({ code = "" }) => {
  const [currentDevice, setCurrentDevice] = useState(DEVICES.iphone);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenExternal = () => {
    if ((window as any).electronAPI && code) {
      (window as any).electronAPI.openExternalBrowser(code);
    }
  };

  return (
    <div className="emulatorContainer">
      {/* شريط التحكم العلوي */}
      <div className="toolbar">
        <div className="deviceSelectors">
          <button 
            onClick={() => setCurrentDevice(DEVICES.iphone)} 
            className={`deviceButton ${currentDevice === DEVICES.iphone ? 'activeButton' : ''}`}
          >
            <Smartphone size={16} /> iPhone
          </button>
          
          <button 
            onClick={() => setCurrentDevice(DEVICES.samsung)} 
            className={`deviceButton ${currentDevice === DEVICES.samsung ? 'activeButton' : ''}`}
          >
            <Smartphone size={16} /> Samsung
          </button>

          <button 
            onClick={() => setCurrentDevice(DEVICES.tablet)} 
            className={`deviceButton ${currentDevice === DEVICES.tablet ? 'activeButton' : ''}`}
          >
            <Tablet size={16} /> Tablet
          </button>

          <button 
            onClick={() => setCurrentDevice(DEVICES.desktop)} 
            className={`deviceButton ${currentDevice === DEVICES.desktop ? 'activeButton' : ''}`}
          >
            <Monitor size={16} /> Desktop
          </button>
        </div>
        
        <div className="actionButtons">
          <button 
            className="iconButton" 
            onClick={() => setRefreshKey(prev => prev + 1)} 
            title="إعادة تحميل المعاينة"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            className="iconButton" 
            onClick={handleOpenExternal} 
            title="فتح في المتصفح الخارجي"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {/* منطقة العرض والمعاينة */}
      <main className="viewportArea">
        <div 
          className="deviceFrame" 
          style={{ 
            width: currentDevice.width, 
            height: currentDevice.height,
            maxWidth: '100%' 
          }}
        >
          <iframe 
            key={refreshKey}
            title="Preview Frame"
            className="previewIframe"
            srcDoc={code || "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;'>بانتظار الكود للمعاينة...</body></html>"}
            sandbox="allow-scripts"
          />
        </div>
      </main>
    </div>
  );
};

export default Emulator;