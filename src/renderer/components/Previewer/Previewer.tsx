import React from 'react';
import { FileCode, Copy, Share2, Maximize2 } from 'lucide-react';
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


  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(displayCode);
      alert('تم نسخ الكود بنجاح');
    }
  };

  return (
    <div className={styles.previewContainer}>
      {/* رأس المستعرض */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <FileCode size={18} color="#00ffcc" />
          <span className={styles.titleText}>{fileName}</span>
        </div>

        <div className={styles.controls}>
          <button className={styles.actionButton} onClick={handleCopy}>
            <Copy size={14} />
            <span>نسخ</span>
          </button>
          <button className={styles.actionButton}>
            <Maximize2 size={14} />
            <span>تكبير</span>
          </button>
          <button className={styles.actionButton}>
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