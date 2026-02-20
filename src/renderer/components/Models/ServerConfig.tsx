import React, { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Server, Key, Wifi } from 'lucide-react';
import styles from './ModelManager.module.css';
import SmartSuggestBtn from './SmartSuggestBtn';

export interface ServerConfigValues {
    port: number;
    ramGb: number;
    vramGb: number;
    nGpuLayers: number;
    contextLength: number;
    evalBatch: number;
    ropeFreqBase: number;
    ropeFreqScale: number;
    keepInMemory: boolean;
    useMmap: boolean;
    requireAuth: boolean;
    apiKeys: string[];
    maxIdleTtl: number;
    serveOnLan: boolean;
    enableCors: boolean;
    jitLoading: boolean;
    autoUnloadJit: boolean;
    onlyLastJit: boolean;
    allowPerRequestMcp: boolean;
    allowMcpJson: boolean;
}

export const defaultServerConfig: ServerConfigValues = {
    port: 8080,
    ramGb: 8,
    vramGb: 0,
    nGpuLayers: 0,
    contextLength: 4096,
    evalBatch: 512,
    ropeFreqBase: 10000,
    ropeFreqScale: 1.0,
    keepInMemory: false,
    useMmap: true,
    requireAuth: false,
    apiKeys: [],
    maxIdleTtl: 30,
    serveOnLan: false,
    enableCors: true,
    jitLoading: false,
    autoUnloadJit: false,
    onlyLastJit: false,
    allowPerRequestMcp: false,
    allowMcpJson: false,
};

interface ServerConfigProps {
    config: ServerConfigValues;
    modelId: string | null;
    gpus: { name: string; vramMb: number }[];
    onChange: (config: ServerConfigValues) => void;
}

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.toggleSlider} />
    </label>
);

const calcLayersFromVram = (vramMb: number): number => {
    const gb = vramMb / 1024;
    if (gb >= 16) return 48;
    if (gb >= 12) return 35;
    if (gb >= 8) return 20;
    if (gb >= 6) return 14;
    if (gb >= 4) return 10;
    return 5;
};

const ServerConfig: React.FC<ServerConfigProps> = ({ config, modelId, gpus, onChange }) => {
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    const set = (partial: Partial<ServerConfigValues>) => onChange({ ...config, ...partial });

    const handleSmartSuggest = async () => {
        if (!modelId) return;
        setIsSuggesting(true);
        const electron = (window as any).electronAPI;
        if (electron?.getSmartSuggestions) {
            const result = await electron.getSmartSuggestions(modelId);
            if (result) {
                set({
                    contextLength: result.contextLength,
                    nGpuLayers: result.nGpuLayers,
                    ramGb: result.ramGb,
                    vramGb: result.vramGb,
                    evalBatch: result.evalBatch,
                });
                setSuggestion(result.reasoning);
            }
        }
        setIsSuggesting(false);
    };

    const generateApiKey = async () => {
        const electron = (window as any).electronAPI;
        if (electron?.generateApiKey) {
            const { key } = await electron.generateApiKey();
            set({ apiKeys: [...config.apiKeys, key] });
        }
    };

    const copyKey = (key: string) => navigator.clipboard.writeText(key);

    return (
        <div>
            {/* Smart Suggestion Alert */}
            {suggestion && (
                <div className={styles.suggestionAlert}>
                    <strong>✦ اقتراح ذكي:</strong> {suggestion}
                </div>
            )}

            {/* Section Header with Smart Suggest */}
            <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionTitle}>
                    <Server size={18} /><span>إعدادات الخادم الأساسية</span>
                </div>
                <SmartSuggestBtn onSuggest={handleSmartSuggest} loading={isSuggesting} />
            </div>

            {/* Basic Settings */}
            <div className={styles.formGrid}>
                <div className={styles.field}>
                    <label className={styles.label}>المنفذ (Port)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={config.port}
                        min={1024}
                        max={65535}
                        onChange={(e) => {
                            const v = parseInt(e.target.value) || 8080;
                            set({ port: Math.max(1024, Math.min(65535, v)) });
                        }}
                    />
                    {config.port < 1024 && (
                        <span className={styles.warningSmall}>⚠ يتطلب صلاحيات المدير</span>
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>ذاكرة RAM المخصصة (GB)</label>
                    <div className={styles.inputGroup}>
                        <input
                            type="number"
                            className={styles.input}
                            min={4}
                            value={config.ramGb}
                            onChange={(e) => set({ ramGb: Math.max(4, parseInt(e.target.value) || 4) })}
                        />
                        <span className={styles.inputSuffix}>الحد الأدنى 4 GB</span>
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>كرت الشاشة (GPU)</label>
                    <select
                        className={styles.select}
                        value={config.nGpuLayers}
                        onChange={(e) => set({ nGpuLayers: parseInt(e.target.value) })}
                    >
                        <option value={0}>CPU فقط (بدون GPU)</option>
                        {gpus.map((g, i) => (
                            <option key={i} value={calcLayersFromVram(g.vramMb)}>
                                {g.name} {g.vramMb > 0
                                    ? `(${Math.round(g.vramMb / 1024)} GB → ${calcLayersFromVram(g.vramMb)} layers)`
                                    : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>VRAM المستخدم (GB)</label>
                    <div className={styles.inputGroup}>
                        <input
                            type="number"
                            min={0}
                            max={32}
                            className={styles.input}
                            value={config.vramGb}
                            onChange={(e) => set({ vramGb: parseInt(e.target.value) || 0 })}
                        />
                        <span className={styles.inputSuffix}>0 = تلقائي</span>
                    </div>
                </div>
            </div>

            {/* Advanced Settings */}
            <div className={styles.divider} />
            <div className={styles.sectionTitle}>
                <span>إعدادات متقدمة (Advanced)</span>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.field}>
                    <label className={styles.label}>Context Length (tokens)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={config.contextLength}
                        onChange={(e) => set({ contextLength: parseInt(e.target.value) || 4096 })}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Evaluation Batch Size</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={config.evalBatch}
                        onChange={(e) => set({ evalBatch: parseInt(e.target.value) || 512 })}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>ROPE Frequency Base</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={config.ropeFreqBase}
                        onChange={(e) => set({ ropeFreqBase: parseFloat(e.target.value) || 10000 })}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>ROPE Frequency Scale</label>
                    <input
                        type="number"
                        step="0.1"
                        className={styles.input}
                        value={config.ropeFreqScale}
                        onChange={(e) => set({ ropeFreqScale: parseFloat(e.target.value) || 1.0 })}
                    />
                </div>
            </div>

            {/* Toggles: Advanced */}
            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleLabel}>Keep Model in Memory (mlock)</div>
                    <div className={styles.toggleHint}>يُثبّت النموذج في RAM لتسريع الاستجابة</div>
                </div>
                <Toggle checked={config.keepInMemory} onChange={(v) => set({ keepInMemory: v })} />
            </div>
            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleLabel}>Try mmap</div>
                    <div className={styles.toggleHint}>استخدام تعيين الذاكرة لتحميل أسرع</div>
                </div>
                <Toggle checked={config.useMmap} onChange={(v) => set({ useMmap: v })} />
            </div>

            {/* API Section */}
            <div className={styles.divider} />
            <div className={styles.sectionTitle}>
                <Key size={18} /><span>API المحلية</span>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.field}>
                    <label className={styles.label}>Max Idle TTL (minutes)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={config.maxIdleTtl}
                        onChange={(e) => set({ maxIdleTtl: parseInt(e.target.value) || 30 })}
                    />
                </div>
            </div>

            {/* API Keys */}
            <div className={styles.field}>
                <label className={styles.label}>مفاتيح API النشطة</label>
                <div className={styles.apiKeyList}>
                    {config.apiKeys.map((key, i) => (
                        <div key={i} className={styles.apiKeyRow}>
                            <span>{key}</span>
                            <button className={styles.btnIcon} onClick={() => copyKey(key)} title="نسخ">
                                <Copy size={13} />
                            </button>
                            <button
                                className={styles.btnIcon}
                                onClick={() => set({ apiKeys: config.apiKeys.filter((_, j) => j !== i) })}
                                title="حذف"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                    <button className={styles.btnGenerate} onClick={generateApiKey}>
                        <Plus size={13} /> توليد مفتاح جديد
                    </button>
                </div>
            </div>

            {/* Network Toggles */}
            <div className={styles.divider} />
            <div className={styles.sectionTitle}>
                <Wifi size={18} /><span>الشبكة والبروتوكولات</span>
            </div>

            {[
                { key: 'requireAuth', label: 'Require Authentication', hint: 'يتطلب مفتاح API لكل طلب' },
                { key: 'serveOnLan', label: 'Serve on Local Network', hint: 'يستمع على 0.0.0.0 بدل localhost' },
                { key: 'enableCors', label: 'Enable CORS', hint: 'السماح بالطلبات عبر النطاقات' },
                { key: 'allowPerRequestMcp', label: 'Allow per-request MCPs', hint: '' },
                { key: 'allowMcpJson', label: 'Allow calling servers from mcp.json', hint: '' },
                { key: 'jitLoading', label: 'Just-in-Time Model Loading', hint: 'تحميل النموذج عند الطلب' },
                { key: 'autoUnloadJit', label: 'Auto unload unused JIT models', hint: '' },
                { key: 'onlyLastJit', label: 'Only Keep Last JIT Loaded Model', hint: '' },
            ].map(({ key, label, hint }) => (
                <div className={styles.toggleRow} key={key}>
                    <div>
                        <div className={styles.toggleLabel}>{label}</div>
                        {hint && <div className={styles.toggleHint}>{hint}</div>}
                    </div>
                    <Toggle
                        checked={config[key as keyof ServerConfigValues] as boolean}
                        onChange={(v) => set({ [key]: v } as any)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ServerConfig;
