import React from 'react';
import { FileCode, Copy, Share2, Maximize2, X } from 'lucide-react';
import styles from './Previewer.module.css';

interface PreviewerProps {
  content?: string;
  fileName?: string;
}

const Previewer: React.FC<PreviewerProps> = ({
  content,
  fileName = "index.html"
}) => {
  const displayCode = content && content.trim() ? content : "// لا يوجد كود متاح حالياً للعرض";


  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(displayCode);
      window.dispatchEvent(new CustomEvent('app:toast', { 
        detail: { msg: '✅ تم نسخ الكود المصدري بنجاح', type: 'success' } 
      }));
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    window.dispatchEvent(new CustomEvent('app:toast', { 
      detail: { msg: isFullScreen ? 'ℹ️ تم تصغير نافذة الكود' : '🔍 تم توسيع نافذة الكود', type: 'success' } 
    }));
  };

  const handleShare = () => {
    handleCopy();
  };

  return (
    <div className={`${styles.previewContainer} ${isFullScreen ? styles.fullScreen : ''}`}>
      {/* Explicit close button for fullScreen mode */}
      <button className={styles.fullScreenCloseBtn} onClick={toggleFullScreen}>
        <X size={16} />
        <span>إغلاق التوسيع</span>
      </button>

      {/* رأس المستعرض */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <FileCode size={18} color="#00ffcc" />
          <span className={styles.titleText}>{fileName}</span>
        </div>

        <div className={styles.controls}>
          <button className={styles.actionButton} onClick={handleCopy} title="نسخ الكود">
            <Copy size={14} />
            <span>نسخ</span>
          </button>
          <button className={styles.actionButton} onClick={toggleFullScreen} title={isFullScreen ? "تصغير" : "عرض ملء الشاشة"}>
            <Maximize2 size={14} />
            <span>{isFullScreen ? 'تصغير' : 'توسيع'}</span>
          </button>
          <button className={styles.actionButton} onClick={handleShare} title="مشاركة">
            <Share2 size={14} />
          </button>
        </div>
      </header>

      {/* منطقة عرض الكود المصدري */}
      <main className={styles.contentArea}>
        <div className={styles.codeWindow}>
          <pre><code>{displayCode}</code></pre>
        </div>
      </main>


      {/* تذييل المكون */}
      <footer className={styles.statusFooter}>
        <span className={styles.statusLabel}>Mode: Local Syntax Highlighting</span>
      </footer>
    </div>
  );
};

export default Previewer;