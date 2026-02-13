import React, { useEffect, useState } from 'react';
import { Save, Folder, RefreshCw, Cpu, Database, Shield } from 'lucide-react';

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
        <div style={{ padding: '30px', color: '#e4e4e7', height: '100%', overflowY: 'auto' }} dir="rtl">
            <header style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>الإعدادات المركزية</h2>
                <p style={{ color: '#a1a1aa', fontSize: '14px' }}>تخصيص محرك الذكاء الاصطناعي وبنية الملفات المحلية.</p>
            </header>

            <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>

                {/* AI Engine Settings */}
                <section style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Cpu size={20} color="#00ffcc" />
                        <h3 style={{ margin: 0, fontSize: '18px' }}>محرك الذكاء الاصطناعي</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', color: '#a1a1aa' }}>النموذج النشط (Ollama)</label>
                            <select
                                value={settings.aiModel}
                                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                                style={{ background: '#18181b', color: '#fff', border: '1px solid #27272a', padding: '10px', borderRadius: '6px' }}
                            >
                                <option value="llama3">Llama 3 (8B)</option>
                                <option value="mistral">Mistral (7B)</option>
                                <option value="codellama">CodeLlama</option>
                                <option value="phi3">Phi-3 (Mini)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', color: '#a1a1aa' }}>حد السياق (Context Limit)</label>
                            <input
                                type="number"
                                value={settings.contextLimit}
                                onChange={(e) => setSettings({ ...settings, contextLimit: parseInt(e.target.value) })}
                                style={{ background: '#18181b', color: '#fff', border: '1px solid #27272a', padding: '10px', borderRadius: '6px' }}
                            />
                        </div>
                    </div>
                </section>

                {/* Data & Export Settings */}
                <section style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Folder size={20} color="#00ffcc" />
                        <h3 style={{ margin: 0, fontSize: '18px' }}>تكامل البيانات (Obsidian)</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#a1a1aa' }}>مسار ملفات Obsidian (Vault)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                readOnly
                                placeholder="لم يتم اختيار مسار بعد..."
                                value={settings.obsidianVaultPath}
                                style={{ flex: 1, background: '#18181b', color: '#fff', border: '1px solid #27272a', padding: '10px', borderRadius: '6px' }}
                            />
                            <button
                                onClick={handleBrowseVault}
                                style={{ background: '#27272a', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer' }}
                            >تغيير</button>
                        </div>
                        <p style={{ fontSize: '11px', color: '#71717a' }}>سيتم حفظ كافة الجلسات والتقارير في هذا المجلد بصيغة Markdown.</p>
                    </div>
                </section>

                {/* Security & System */}
                <section style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Shield size={20} color="#00ffcc" />
                        <h3 style={{ margin: 0, fontSize: '18px' }}>نظام السيادة الرقمية</h3>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(16,185,129,0.05)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#10b981' }}>التطبيق يعمل في وضع الأوفلاين بالكامل. لا يتم إرسال أي بيانات خارج هذا الجهاز.</p>
                    </div>
                </section>

                {/* Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            background: '#00ffcc', color: '#000', border: 'none',
                            padding: '12px 30px', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {isSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                        حفظ التغييرات
                    </button>

                    {status && (
                        <span style={{ color: status.type === 'success' ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                            {status.msg}
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Settings;
