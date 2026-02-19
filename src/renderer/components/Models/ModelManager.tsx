import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Server, SlidersHorizontal, Code2, Save, RefreshCw } from 'lucide-react';
import styles from './ModelManager.module.css';
import ModelDropZone from './ModelDropZone';
import ModelList from './ModelList';
import ServerConfig, { ServerConfigValues, defaultServerConfig } from './ServerConfig';
import ModelParameters, { ModelParamValues, defaultModelParams } from './ModelParameters';
import QuantizationSelector from './QuantizationSelector';
import McpConfig from './McpConfig';

type Tab = 'library' | 'server' | 'params' | 'mcp';

interface GgufModel {
    id: string;
    name: string;
    fileSizeMB: number;
    quantization: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
    errorMsg?: string;
}

interface SystemResources {
    totalRamGb: number;
    availableRamGb: number;
    cpuCores: number;
    cpuModel: string;
    gpus: { name: string; vramMb: number }[];
}

interface ModelManagerProps {
    onActiveModelChange?: (modelName: string | null) => void;
}

const STORAGE_KEY_SERVER = 'gguf_server_config';
const STORAGE_KEY_PARAMS = 'gguf_model_params';
const STORAGE_KEY_QUANT = 'gguf_selected_quant';

const ModelManager: React.FC<ModelManagerProps> = ({ onActiveModelChange }) => {
    const [activeTab, setActiveTab] = useState<Tab>('library');
    const [models, setModels] = useState<GgufModel[]>([]);
    const [activeModelId, setActiveModelId] = useState<string | null>(null);
    const [serverConfig, setServerConfig] = useState<ServerConfigValues>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVER) || 'null');
            return saved ? { ...defaultServerConfig, ...saved } : defaultServerConfig;
        } catch { return defaultServerConfig; }
    });
    const [modelParams, setModelParams] = useState<ModelParamValues>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PARAMS) || 'null');
            return saved ? { ...defaultModelParams, ...saved } : defaultModelParams;
        } catch { return defaultModelParams; }
    });
    const [selectedQuant, setSelectedQuant] = useState<string>(() =>
        localStorage.getItem(STORAGE_KEY_QUANT) || 'Q4_K_M'
    );
    const [resources, setResources] = useState<SystemResources | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
    const [restartNeeded, setRestartNeeded] = useState(false);

    // Load models and system resources on mount
    useEffect(() => {
        refreshModels();
        loadSystemResources();
    }, []);

    // Persist settings on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SERVER, JSON.stringify(serverConfig));
    }, [serverConfig]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(modelParams));
    }, [modelParams]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_QUANT, selectedQuant);
    }, [selectedQuant]);

    const refreshModels = useCallback(async () => {
        const electron = (window as any).electronAPI;
        if (electron?.listModels) {
            const list = await electron.listModels();
            setModels(list || []);
        }
    }, []);

    const loadSystemResources = async () => {
        const electron = (window as any).electronAPI;
        if (electron?.getSystemResources) {
            const res = await electron.getSystemResources();
            setResources(res);
            if (res?.totalRamGb) {
                setServerConfig(prev => ({ ...prev, ramGb: Math.min(res.totalRamGb - 2, 32) }));
            }
        }
    };

    const handleLoad = async (id: string) => {
        const electron = (window as any).electronAPI;
        if (!electron?.startServer) return;
        // Optimistically show loading state
        setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'loading' } : m));
        // Save model name before async call (avoids stale closure bug)
        const modelName = models.find(m => m.id === id)?.name || null;
        const result = await electron.startServer({ ...serverConfig, modelId: id });
        // Always refresh from source of truth first
        await refreshModels();
        if (result.success) {
            setActiveModelId(id);
            onActiveModelChange?.(modelName);
            setRestartNeeded(false);
        }
    };

    const handleStop = async () => {
        const electron = (window as any).electronAPI;
        if (electron?.stopServer) await electron.stopServer();
        setActiveModelId(null);
        onActiveModelChange?.(null);
        setRestartNeeded(false);
        await refreshModels();
    };

    const handleDelete = async (id: string) => {
        const electron = (window as any).electronAPI;
        if (electron?.removeModel) await electron.removeModel(id);
        if (id === activeModelId) {
            setActiveModelId(null);
            onActiveModelChange?.(null);
        }
        await refreshModels();
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            localStorage.setItem(STORAGE_KEY_SERVER, JSON.stringify(serverConfig));
            localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(modelParams));
            localStorage.setItem(STORAGE_KEY_QUANT, selectedQuant);
            setSaveStatus('success');
            if (activeModelId) setRestartNeeded(true);
        } catch {
            setSaveStatus('error');
        }
        setIsSaving(false);
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const activeModel = models.find(m => m.id === activeModelId) || null;

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'library', label: 'مكتبة النماذج', icon: <Brain size={15} /> },
        { id: 'server', label: 'الخادم', icon: <Server size={15} /> },
        { id: 'params', label: 'الإعدادات', icon: <SlidersHorizontal size={15} /> },
        { id: 'mcp', label: 'MCP', icon: <Code2 size={15} /> },
    ];

    return (
        <div className={styles.managerWrapper}>
            {/* Header */}
            <div className={styles.managerHeader}>
                <h2>⚡ نماذج GGUF المحلية</h2>
                <p>إدارة وتشغيل نماذج الذكاء الاصطناعي المحلية بدون اتصال بالإنترنت</p>
                <div className={styles.tabBar}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className={styles.managerBody}>

                {/* ── Library Tab ────────────────────────────────────── */}
                {activeTab === 'library' && (
                    <div className={styles.libraryLayout}>
                        {/* Left: Model List */}
                        <div>
                            <div className={styles.card}>
                                <div className={styles.sectionTitle}><Brain size={16} /><span>النماذج ({models.length}/5)</span></div>
                                <ModelList
                                    models={models}
                                    activeModelId={activeModelId}
                                    onLoad={handleLoad}
                                    onStop={() => handleStop()}
                                    onDelete={handleDelete}
                                />
                            </div>

                            {/* Quantization Section */}
                            {activeModel && (
                                <div className={styles.card} style={{ marginTop: 16 }}>
                                    <div className={styles.sectionTitle}><span>نوع الكميّة (Quantization)</span></div>
                                    <QuantizationSelector
                                        selected={selectedQuant}
                                        modelSizeMB={activeModel.fileSizeMB}
                                        onChange={setSelectedQuant}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right: Drop Zone + System Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className={styles.card}>
                                <div className={styles.sectionTitle}><span>إضافة نموذج</span></div>
                                <ModelDropZone onModelAdded={refreshModels} disabled={models.length >= 5} />
                            </div>

                            {/* System Resources */}
                            {resources && (
                                <div className={styles.card}>
                                    <div className={styles.sectionTitle}><span>موارد الجهاز</span></div>
                                    <div className={styles.resourceRow}>
                                        <div className={styles.resourceBadge}>
                                            💾 RAM: <strong>&nbsp;{resources.totalRamGb} GB</strong>
                                        </div>
                                        <div className={styles.resourceBadge}>
                                            🖥 CPU: <strong>&nbsp;{resources.cpuCores} أنوية</strong>
                                        </div>
                                    </div>
                                    {resources.gpus.map((g, i) => (
                                        <div key={i} className={styles.resourceBadge}>
                                            🎮 {g.name} {g.vramMb > 0 ? `— ${Math.round(g.vramMb / 1024)} GB VRAM` : ''}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Server Tab ─────────────────────────────────────── */}
                {activeTab === 'server' && (
                    <div className={styles.card}>
                        <ServerConfig
                            config={serverConfig}
                            modelId={activeModelId}
                            gpus={resources?.gpus || []}
                            onChange={setServerConfig}
                        />
                    </div>
                )}

                {/* ── Parameters Tab ─────────────────────────────────── */}
                {activeTab === 'params' && (
                    <div className={styles.card}>
                        <ModelParameters
                            params={modelParams}
                            modelId={activeModelId}
                            onChange={setModelParams}
                        />
                    </div>
                )}

                {/* ── MCP Tab ────────────────────────────────────────── */}
                {activeTab === 'mcp' && (
                    <div className={styles.card}>
                        <McpConfig />
                    </div>
                )}
            </div>

            {activeTab !== 'mcp' && (
                <div className={styles.saveBar}>
                    <button className={styles.btnSave} onClick={handleSaveAll} disabled={isSaving}>
                        {isSaving ? <RefreshCw size={16} /> : <Save size={16} />}
                        حفظ التغييرات
                    </button>
                    {saveStatus === 'success' && <span className={`${styles.statusMsg} ${styles.statusSuccess}`}>✓ تم الحفظ</span>}
                    {saveStatus === 'error' && <span className={`${styles.statusMsg} ${styles.statusError}`}>✗ فشل الحفظ</span>}
                    {restartNeeded && activeModel && (
                        <span className={styles.statusMsg} style={{ color: '#f59e0b' }}>
                            ⚠ أعِد تشغيل النموذج لتطبيق الإعدادات
                        </span>
                    )}
                    {activeModel && (
                        <span className={styles.statusMsg} style={{ marginRight: 'auto' }}>
                            🟢 النموذج النشط: <strong>{activeModel.name}</strong>
                        </span>
                    )}
                </div>
            )}

        </div>
    );
};

export default ModelManager;
