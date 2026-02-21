import React, { useEffect, useState } from 'react';
import { Save, Folder, RefreshCw, Cpu, Database, Shield } from 'lucide-react';

import styles from './Settings.module.css';

interface AppSettings {
    theme: string;
    aiModel: string;
    contextLimit: number | string;
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
            console.log('Fetching settings...');
            const electron = (window as any).electronAPI;
            if (electron && electron.loadSettings) {
                const data = await electron.loadSettings();
                console.log('Settings loaded:', data);
                if (data) setSettings(data);
            }
        };
        loadData();
    }, []);

    const toEnglishDigits = (str: string) => {
        return str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    };


    const handleSave = async () => {
        console.log('Saving settings:', settings);
        setIsSaving(true);
        setStatus(null);
        const electron = (window as any).electronAPI;
        if (electron && electron.saveSettings) {
            // Convert contextLimit back to number before saving
            const cleanSettings = {
                ...settings,
                contextLimit: parseInt(toEnglishDigits(settings.contextLimit.toString())) || 4096
            };
            const result = await electron.saveSettings(cleanSettings);
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
        if (electron && electron.selectDirectory) {
            const result = await electron.selectDirectory();
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
                                onChange={(e) => setSettings(prev => ({ ...prev, aiModel: e.target.value }))}
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
                                type="text"
                                value={settings.contextLimit}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSettings(prev => ({ ...prev, contextLimit: val }));
                                }}
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
                                placeholder="لم يتم اختيار مسار بعد..."
                                value={settings.obsidianVaultPath}
                                onChange={(e) => {
                                    console.log('Vault path manual entry:', e.target.value);
                                    const val = e.target.value;
                                    setSettings(prev => ({ ...prev, obsidianVaultPath: val }));
                                }}
                                className={styles.input}

                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    console.log('Browse button clicked');
                                    handleBrowseVault();
                                }}
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
                        type="button"
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
