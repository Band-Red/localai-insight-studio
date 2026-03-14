import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, FileJson, Sparkles } from 'lucide-react';
import styles from './ModelManager.module.css';

const McpConfig: React.FC = () => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isImproving, setIsImproving] = useState(false);
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

    /**
     * تحسين JSON: تنسيق، ترتيب المفاتيح أبجدياً، إزالة التكرار، إضافة طابع زمني
     */
    const handleImprove = () => {
        if (!content.trim()) {
            setStatus({ type: 'error', msg: 'المحتوى فارغ — أضف JSON أولاً' });
            return;
        }
        setIsImproving(true);
        try {
            const parsed = JSON.parse(content);

            // ترتيب المفاتيح بشكل أبجدي بشكل تكراري
            const sortKeys = (obj: any): any => {
                if (Array.isArray(obj)) return obj.map(sortKeys);
                if (obj && typeof obj === 'object') {
                    return Object.keys(obj).sort().reduce((acc: any, k) => {
                        acc[k] = sortKeys(obj[k]);
                        return acc;
                    }, {});
                }
                return obj;
            };

            // إزالة خوادم MCP مكررة (بنفس الـ command)
            if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
                const seen = new Set<string>();
                const cleaned: any = {};
                for (const [key, val] of Object.entries(parsed.mcpServers as Record<string, any>)) {
                    const sig = JSON.stringify(val?.command);
                    if (!seen.has(sig)) {
                        seen.add(sig);
                        cleaned[key] = val;
                    }
                }
                parsed.mcpServers = cleaned;
            }

            // إضافة طابع زمني للتحسين
            parsed._lastImproved = new Date().toISOString();

            const improved = JSON.stringify(sortKeys(parsed), null, 2);
            setContent(improved);
            setStatus({ type: 'success', msg: '✅ تم تحسين الـ JSON وترتيب مفاتيحه' });
            setTimeout(() => setStatus(null), 3000);
        } catch (e: any) {
            setStatus({ type: 'error', msg: `JSON غير صالح: ${e.message}` });
        }
        setIsImproving(false);
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
                    const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
                    try {
                        const obj = JSON.parse(paste);
                        const formatted = JSON.stringify(obj, null, 2);
                        setContent(formatted);
                        setStatus({ type: 'success', msg: '✅ تم تنسيق JSON بنجاح' });
                        setTimeout(() => setStatus(null), 3000);
                    } catch (err) {
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

                <button type="button" className={styles.btnImprove} onClick={handleImprove} disabled={isImproving}>
                    {isImproving ? <RefreshCw size={14} className={styles.spin} /> : <Sparkles size={14} />}
                    تحسين ✨
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
