import React, { useEffect, useState } from 'react';
import { Save, Folder, RefreshCw, Cpu, Database, Shield } from 'lucide-react';

import styles from './Settings.module.css';

interface AppSettings {
    theme: string;
    aiModel: string;
    contextLimit: number;
    obsidianVaultPath: string;
}

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>({
        theme: 'dark',
        aiModel: 'llama3',
        contextLimit: 4096,
        obsidianVaultPath: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const electron = (window as any).electronAPI;
            if (electron && electron.loadSettings) {
                const data = await electron.loadSettings();
                if (data) setSettings(data);
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        const electron = (window as any).electronAPI;
        if (electron && electron.saveSettings) {
            const result = await electron.saveSettings(settings);
            if (result.success) {
                setStatus({ type: 'success', msg: 'تم حفظ الإعدادات بنجاح' });
            } else {
                setStatus({ type: 'error', msg: 'فشل في حفظ الإعدادات' });
            }
        }
        setIsSaving(false);
    };

    const handleBrowseVault = async () => {
        const electron = (window as any).electronAPI;
        if (electron && electron.selectFolder) {
            const result = await electron.selectFolder();
            if (result.success && result.path) {
                setSettings({ ...settings, obsidianVaultPath: result.path });
            }
        }
    };

    return (
        <div className={styles.settingsWrapper} dir="rtl">
            <header className={styles.header}>
                <h2>الإعدادات المركزية</h2>
                <p>تخصيص محرك الذكاء الاصطناعي وبنية الملفات المحلية.</p>
            </header>

            <div className={styles.grid}>

                {/* AI Engine Settings */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Cpu size={20} color="#00ffcc" />
                        <h3>محرك الذكاء الاصطناعي</h3>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.field}>
                            <label>النموذج النشط (Ollama)</label>
                            <select
                                value={settings.aiModel}
                                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                                className={styles.select}
                            >
                                <option value="llama3">Llama 3 (8B)</option>
                                <option value="mistral">Mistral (7B)</option>
                                <option value="codellama">CodeLlama</option>
                                <option value="phi3">Phi-3 (Mini)</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>حد السياق (Context Limit)</label>
                            <input
                                type="number"
                                value={settings.contextLimit}
                                onChange={(e) => setSettings({ ...settings, contextLimit: parseInt(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                    </div>
                </section>

                {/* Data & Export Settings */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Folder size={20} color="#00ffcc" />
                        <h3>تكامل البيانات (Obsidian)</h3>
                    </div>

                    <div className={styles.field}>
                        <label>مسار ملفات Obsidian (Vault)</label>
                        <div className={styles.browseWrapper}>
                            <input
                                type="text"
                                readOnly
                                placeholder="لم يتم اختيار مسار بعد..."
                                value={settings.obsidianVaultPath}
                                className={styles.inputReadOnly}
                            />
                            <button
                                onClick={handleBrowseVault}
                                className={styles.browseBtn}
                            >تغيير</button>
                        </div>
                        <p className={styles.hint}>سيتم حفظ كافة الجلسات والتقارير في هذا المجلد بصيغة Markdown.</p>
                    </div>
                </section>

                {/* Security & System */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Shield size={20} color="#00ffcc" />
                        <h3>نظام السيادة الرقمية</h3>
                    </div>
                    <div className={styles.securityBanner}>
                        <p>التطبيق يعمل في وضع الأوفلاين بالكامل. لا يتم إرسال أي بيانات خارج هذا الجهاز.</p>
                    </div>
                </section>

                {/* Action Bar */}
                <div className={styles.actionBar}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={styles.saveBtn}
                    >
                        {isSaving ? <RefreshCw size={18} className={styles.spin} /> : <Save size={18} />}
                        حفظ التغييرات
                    </button>

                    {status && (
                        <span className={`${styles.statusMsg} ${status.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                            {status.msg}
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Settings;
