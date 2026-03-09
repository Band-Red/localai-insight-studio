import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Smartphone, Monitor, Tablet, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import styles from './Emulator.module.css';
import mockupStyles from './EmulatorMockup.module.css';

// تعريف قياسات الأجهزة المدعومة
const DEVICES = {
  iphone: { width: 375, height: 812, label: 'iPhone 13 Pro' },
  samsung: { width: 360, height: 780, label: 'Galaxy S22' },
  tablet: { width: 768, height: 1024, label: 'iPad Air' },
  desktop: { width: '100%', height: '100%', label: 'Desktop View' }
};

interface EmulatorProps {
  code?: string;
}

const Emulator: React.FC<EmulatorProps> = ({ code = "" }) => {
  const [deviceKey, setDeviceKey] = useState<'iphone' | 'samsung' | 'tablet' | 'desktop'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const viewportRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  // حساب الحجم المناسب (Scaling) لتطبيق المعاينة
  const updateScale = useMemo(() => () => {
    if (deviceKey === 'desktop' || !viewportRef.current) {
      setScale(1);
      return;
    }

    const viewport = viewportRef.current;
    const device = DEVICES[deviceKey];
    
    // هيدر وتولبار و padding (تقريبًا 120px)
    const availableWidth = viewport.clientWidth - 80;
    const availableHeight = viewport.clientHeight - 80;

    const scaleX = availableWidth / (device.width as number);
    const scaleY = availableHeight / (device.height as number);
    
    // استخدام أقل مقياس لضمان احتواء الجهاز بالكامل
    const newScale = Math.min(scaleX, scaleY, 1);
    setScale(newScale);
  }, [deviceKey]);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // كشف تلقائي لنوع الكود
  useEffect(() => {
    const isMobile = (c: string) => {
      const indicators = ['import java', 'import swift', 'import flutter', 'MaterialApp', 'Scaffold', 'View {', 'UIViewController'];
      return indicators.some(ind => c.includes(ind));
    };

    if (isMobile(code)) {
      setDeviceKey('iphone');
    }
  }, [code]);

  const handleOpenExternal = () => {
    const electron = (window as any).electronAPI;
    if (electron?.openExternal && code) {
      const isHtml = code.trim().toLowerCase().startsWith('<html') || code.includes('<!DOCTYPE') || code.includes('<html>');
      if (isHtml) {
        const fullHtml = code.includes('<html>') ? code : `<html><body style="background:#050507;color:#fff;padding:20px;">${code}</body></html>`;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        electron.openExternal(url);
      } else {
        const previewCode = `<html><body style="background:#050507;color:#00ffcc;font-family:monospace;padding:20px;"><pre>${code.replace(/</g, '&lt;')}</pre></body></html>`;
        const blob = new Blob([previewCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        electron.openExternal(url);
      }
    }
  };

  const isHtml = code.trim().toLowerCase().startsWith('<html') || code.includes('<!DOCTYPE') || code.includes('<html>');

  const getDeviceStyle = () => {
    if (deviceKey === 'desktop') return {};
    const d = DEVICES[deviceKey];
    return {
      width: `${d.width}px`,
      height: `${d.height}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
      flexShrink: 0
    };
  };

  return (
    <div className={styles.emulatorContainer}>
      <div className={styles.toolbar}>
        <div className={styles.deviceSelectors}>
          <button
            onClick={() => setDeviceKey('iphone')}
            className={`${styles.deviceButton} ${deviceKey === 'iphone' ? styles.activeButton : ''}`}
            title="iPhone"
          >
            <Smartphone size={16} /> <span className={styles.btnText}>iPhone</span>
          </button>
          <button
            onClick={() => setDeviceKey('samsung')}
            className={`${styles.deviceButton} ${deviceKey === 'samsung' ? styles.activeButton : ''}`}
            title="Samsung"
          >
            <Smartphone size={16} /> <span className={styles.btnText}>Samsung</span>
          </button>
          <button
            onClick={() => setDeviceKey('tablet')}
            className={`${styles.deviceButton} ${deviceKey === 'tablet' ? styles.activeButton : ''}`}
            title="Tablet"
          >
            <Tablet size={16} /> <span className={styles.btnText}>Tablet</span>
          </button>
          <button
            onClick={() => setDeviceKey('desktop')}
            className={`${styles.deviceButton} ${deviceKey === 'desktop' ? styles.activeButton : ''}`}
            title="Desktop"
          >
            <Monitor size={16} /> <span className={styles.btnText}>Desktop</span>
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

      <main className={styles.viewportArea} ref={viewportRef}>
        <div 
          className={`${styles.deviceFrame} ${deviceKey === 'desktop' ? styles.desktopSize : ''}`}
          style={getDeviceStyle()}
        >
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
