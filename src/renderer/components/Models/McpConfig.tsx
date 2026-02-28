import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, FileJson } from 'lucide-react';
import styles from './ModelManager.module.css';

const McpConfig: React.FC = () => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warn'; msg: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            const fallback = JSON.stringify({ mcpServers: {} }, null, 2);
            const electron = (window as any).electronAPI;
            if (electron?.loadMcpConfig) {
                const result = await electron.loadMcpConfig();
                setContent(result.success ? result.content : fallback);
            } else {
                setContent(fallback);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!content.trim()) {
            setStatus({ type: 'error', msg: 'المحتوى فارغ — أضف JSON صحيح' });
            return;
        }
        try {
            JSON.parse(content);
        } catch (e: any) {
            setStatus({ type: 'error', msg: `JSON غير صالح: ${e.message}` });
            return;
        }

        setIsSaving(true);
        setStatus(null);
        const electron = (window as any).electronAPI;
        if (electron?.saveMcpConfig) {
            const result = await electron.saveMcpConfig(content);
            setStatus(result.success
                ? { type: 'warn', msg: '⚠ تم الحفظ — ستُعاد تهيئة خوادم MCP عند التشغيل التالي' }
                : { type: 'error', msg: result.error || 'فشل في الحفظ' }
            );
        }
        setIsSaving(false);
    };

    return (
        <div>
            <div className={styles.sectionTitle}>
                <FileJson size={18} /><span>تهيئة MCP Servers (mcp.json)</span>
            </div>

            <textarea
                className={styles.mcpEditor}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={(e) => {
                    e.preventDefault();
                    // Get pasted text
                    const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
                    try {
                        // Parse and re-stringify with formatting
                        const obj = JSON.parse(paste);
                        const formatted = JSON.stringify(obj, null, 2);
                        // If parsing works, replace the current selection or content
                        setContent(formatted);
                        setStatus({ type: 'success', msg: '✅ تم تنسيق JSON بنجاح' });
                        setTimeout(() => setStatus(null), 3000);
                    } catch (err) {
                        // If it's not valid JSON, just paste as is
                        setContent(paste);
                    }
                }}
                spellCheck={false}
                dir="ltr"
                rows={20}
            />

            <div className={styles.mcpHint}>
                <span>💡</span>
                <span>يمكنك تعريف خوادم MCP هنا كما في إعدادات Claude أو Cursor</span>
            </div>

            <div className={styles.saveBar}>
                <button type="button" className={styles.btnSave} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <RefreshCw size={16} className={styles.spin} /> : <Save size={16} />}
                    حفظ mcp.json
                </button>

                {status && (
                    <span className={`${styles.statusMsg} ${status.type === 'success' || status.type === 'warn' ? styles.statusSuccess : styles.statusError}`}>
                        {status.msg}
                    </span>
                )}
            </div>
        </div>
    );
};

export default McpConfig;
