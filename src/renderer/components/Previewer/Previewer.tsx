import React from 'react';
import { FileCode, Copy, Share2, Maximize2 } from 'lucide-react';
import './Previewer.module.css';

interface PreviewerProps {
  content?: string;
  fileName?: string;
}

const Previewer: React.FC<PreviewerProps> = ({ 
  content = "// لا يوجد كود متاح حالياً للعرض", 
  fileName = "index.html" 
}) => {

  const handleCopy = () => {
    // محاولة نسخ المحتوى إلى الحافظة
    if (content) {
      document.execCommand('copy');
      // ملاحظة: في بيئة الإنتاج يفضل استخدام navigator.clipboard.writeText
    }
  };

  return (
    <div className="previewContainer">
      {/* رأس المستعرض */}
      <header className="header">
        <div className="titleArea">
          <FileCode size={18} color="#00ffcc" />
          <span className="titleText">{fileName}</span>
        </div>

        <div className="controls">
          <button className="actionButton" onClick={handleCopy}>
            <Copy size={14} />
            <span>نسخ</span>
          </button>
          <button className="actionButton">
            <Maximize2 size={14} />
            <span>تكبير</span>
          </button>
          <button className="actionButton">
            <Share2 size={14} />
          </button>
        </div>
      </header>

      {/* منطقة عرض الكود المصدري */}
      <main className="contentArea">
        <div className="codeWindow">
          {content}
        </div>
      </main>

      {/* تذييل المكون */}
      <footer className="statusFooter">
        <span className="statusLabel">Mode: Local Syntax Highlighting</span>
      </footer>
    </div>
  );
};

export default Previewer;