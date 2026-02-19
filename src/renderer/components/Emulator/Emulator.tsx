import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import styles from './Emulator.module.css';
import mockupStyles from './EmulatorMockup.module.css';

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
  const [deviceKey, setDeviceKey] = useState<'iphone' | 'samsung' | 'tablet' | 'desktop'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  // كشف تلقائي لنوع الكود
  useEffect(() => {
    const isMobile = (c: string) => {
      const indicators = ['import java', 'import swift', 'import flutter', 'MaterialApp', 'Scaffold', 'View {', 'UIViewController'];
      return indicators.some(ind => c.includes(ind));
    };

    if (isMobile(code)) {
      setDeviceKey('desktop');
    }
  }, [code]);

  const handleOpenExternal = () => {
    if ((window as any).electronAPI && code) {
      (window as any).electronAPI.openExternalBrowser(code);
    }
  };

  const isHtml = code.trim().toLowerCase().startsWith('<html') || code.includes('<!DOCTYPE') || code.includes('<html>');

  const getSizeClass = (key: string) => {
    switch (key) {
      case 'iphone': return styles.iphoneSize;
      case 'samsung': return styles.samsungSize;
      case 'tablet': return styles.tabletSize;
      case 'desktop': return styles.desktopSize;
      default: return styles.iphoneSize;
    }
  };

  return (
    <div className={styles.emulatorContainer}>
      {/* شريط التحكم العلوي */}
      <div className={styles.toolbar}>
        <div className={styles.deviceSelectors}>
          <button
            onClick={() => setDeviceKey('iphone')}
            className={`${styles.deviceButton} ${deviceKey === 'iphone' ? styles.activeButton : ''}`}
          >
            <Smartphone size={16} /> iPhone
          </button>

          <button
            onClick={() => setDeviceKey('samsung')}
            className={`${styles.deviceButton} ${deviceKey === 'samsung' ? styles.activeButton : ''}`}
          >
            <Smartphone size={16} /> Samsung
          </button>

          <button
            onClick={() => setDeviceKey('tablet')}
            className={`${styles.deviceButton} ${deviceKey === 'tablet' ? styles.activeButton : ''}`}
          >
            <Tablet size={16} /> Tablet
          </button>

          <button
            onClick={() => setDeviceKey('desktop')}
            className={`${styles.deviceButton} ${deviceKey === 'desktop' ? styles.activeButton : ''}`}
          >
            <Monitor size={16} /> Desktop
          </button>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.iconButton}
            onClick={() => setRefreshKey(prev => prev + 1)}
            title="إعادة تحميل المعاينة"
          >
            <RefreshCw size={18} />
          </button>
          <button
            className={styles.iconButton}
            onClick={handleOpenExternal}
            title="فتح في المتصفح الخارجي"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {/* منطقة العرض والمعاينة */}
      <main className={styles.viewportArea}>
        <div className={`${styles.deviceFrame} ${getSizeClass(deviceKey)}`}>
          {isHtml ? (
            <iframe
              key={refreshKey}
              title="Preview Frame"
              className={styles.previewIframe}
              srcDoc={code || "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#00ffcc;font-family:sans-serif;'>بانتظار الكود للمعاينة...</body></html>"}
              sandbox="allow-scripts"
            />
          ) : (
            <div className={mockupStyles.mobileMockupContainer}>
              <div className={mockupStyles.mockupHeader}>
                <Layers size={24} color="#00ffcc" />
                <h3>Mobile App UI</h3>
                <p>تتم حالياً معاينة الكود البرمجي للهاتف</p>
              </div>
              <div className={mockupStyles.mockupCodeView}>
                <pre><code>{code.substring(0, 1000)}...</code></pre>
              </div>
              <div className={mockupStyles.mockupBadge}>
                Mobile Source Active
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Emulator;
