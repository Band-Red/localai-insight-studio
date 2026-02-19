import React, { useState } from 'react';
import { Play, Copy, Download, Check, FileCode } from 'lucide-react';
import styles from './CodeSandbox.module.css';

interface CodeSandboxProps {
    code: string;
    language?: string;
    onRun?: (code: string) => void;
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({ code, language = 'html', onRun }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_code.${language === 'html' ? 'html' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const isPreviewable = language.toLowerCase() === 'html' || code.includes('<html>');

    return (
        <div className={styles.codeSandboxContainer} dir="ltr">
            <div className={styles.codeHeader}>
                <div className={styles.codeTitle}>
                    <FileCode size={14} />
                    <span>{language.toUpperCase() || 'CODE'}</span>
                </div>
                <div className={styles.codeActions}>
                    <button className={styles.actionBtn} onClick={handleCopy} title="نسخ الكود">
                        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    <button className={styles.actionBtn} onClick={handleDownload} title="تحميل الملف">
                        <Download size={14} />
                        <span>تحميل</span>
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.runBtn}`}
                        onClick={() => onRun && onRun(code)}
                        title="تشغيل ومعاينة"
                    >
                        <Play size={14} fill="currentColor" />
                        <span>تشغيل</span>
                    </button>
                </div>
            </div>
            <div className={styles.codeContent}>
                <pre className={styles.codeText}>
                    <code>{code.trim()}</code>
                </pre>
            </div>
        </div>
    );
};

export default CodeSandbox;
