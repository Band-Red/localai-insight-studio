/**
 * المكون: ModelManager
 * الوظيفة: الإدارة المركزية لنماذج GGUF، تشمل رفع النماذج، إعداد الخادم، ضبط المعاملات، ومراقبة حالة التشغيل.
 * المكان: واجهة إدارة النماذج (Model Library).
 */
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
    // حالة جديدة لتتبع النموذج المختار حالياً لضبط الكميّة قبل التشغيل
    const [selectedModelForSetup, setSelectedModelForSetup] = useState<string | null>(null);

    /**
     * تحديث قائمة النماذج المتاحة من المجلد المحلي عبر Electron
     */
    const refreshModels = useCallback(async () => {
        const electron = (window as any).electronAPI;
        if (electron?.listModels) {
            const list = await electron.listModels();
            setModels(list || []);
        }
    }, [setModels]);

    const loadSystemResources = useCallback(async () => {
        const electron = (window as any).electronAPI;
        if (electron?.getSystemResources) {
            const res = await electron.getSystemResources();
            setResources(res);
            if (res?.totalRamGb) {
                setServerConfig(prev => ({ ...prev, ramGb: Math.min(res.totalRamGb - 2, 32) }));
            }
        }
    }, [setResources, setServerConfig]);

    /**
     * تهيئة المكون: جلب الموارد، النماذج، ومزامنة حالة الخادم النشط
     */
    useEffect(() => {
        const init = async () => {
            await refreshModels();
            await loadSystemResources();
            
            // استعادة حالة النموذج النشط من عملية Electron الرئيسية (Main Process)
            const electron = (window as any).electronAPI;
            if (electron?.getActiveModel) {
                const active = await electron.getActiveModel();
                if (active && active.id) {
                    setActiveModelId(active.id);
                    // إبلاغ المكون الأب باسم النموذج النشط للمزامنة العامة
                    const list = await electron.listModels();
                    const m = (list || []).find((model: any) => model.id === active.id);
                    if (m) onActiveModelChange?.(m.name);
                }
            }
        };
        init();
    }, [refreshModels, loadSystemResources, onActiveModelChange]);

    // مزامنة الإعدادات مع التخزين المحلي عند التغيير (Auto-save) لتجربة أسلس
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SERVER, JSON.stringify(serverConfig));
        localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(modelParams));
        localStorage.setItem(STORAGE_KEY_QUANT, selectedQuant);
        
        // إذا كان هناك نموذج نشط، نحدث الإعدادات في الخلفية بدون إعادة تحميل كاملة
        if (activeModelId) {
            const electron = (window as any).electronAPI;
            if (electron?.updateGgufModel) {
                electron.updateGgufModel(activeModelId, { quantization: selectedQuant });
            }
        }
    }, [serverConfig, modelParams, selectedQuant, activeModelId]);

    // مزامنة نوع الكميّة المختار مع النموذج عند التغيير
    useEffect(() => {
        if (selectedModelForSetup || activeModelId) {
            const targetId = selectedModelForSetup || activeModelId;
            const m = models.find(i => i.id === targetId);
            if (m) setSelectedQuant(m.quantization);
        }
    }, [activeModelId, selectedModelForSetup, models]);

    /**
     * بدء تشغيل خادم النموذج (Llama Server) مع الإعدادات المختارة
     */
    const handleLoad = async (id: string) => {
        const electron = (window as any).electronAPI;
        if (!electron?.startServer) return;
        // Optimistically show loading state
        setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'loading' } : m));
        // Save model name before async call (avoids stale closure bug)
        const modelName = models.find(m => m.id === id)?.name || null;
        const result = await electron.startServer({
            ...serverConfig,
            modelId: id,
            draftModel: modelParams.draftModel
        });

        // Always refresh from source of truth first
        await refreshModels();
        if (result.success) {
            setActiveModelId(id);
            onActiveModelChange?.(modelName);
            setRestartNeeded(false);
            window.dispatchEvent(new CustomEvent('app:toast', { 
                detail: { msg: `🚀 تم تشغيل النموذج ${modelName} بنجاح`, type: 'success' } 
            }));
        } else {
            window.dispatchEvent(new CustomEvent('app:toast', { 
                detail: { msg: `❌ فشل تشغيل النموذج: ${result.error || 'حدث خطأ غير معروف'}`, type: 'error' } 
            }));
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
        // تم إزالة console.log لتقليل الضوضاء في وحدة التحكم
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
                            type="button"
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => {
                                console.log(`Switching tab to: ${tab.id}`);
                                setActiveTab(tab.id);
                            }}
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
                                    selectedId={selectedModelForSetup}
                                    onSelect={(id) => setSelectedModelForSetup(id === selectedModelForSetup ? null : id)}
                                    onLoad={handleLoad}
                                    onStop={() => handleStop()}
                                    onDelete={handleDelete}
                                />
                            </div>
 
                            {/* شاشة إجبارية لاختيار الكميّة قبل التشغيل */}
                            {(selectedModelForSetup || activeModel) && (
                                <div className={`${styles.card} ${styles.cardWithMargin} ${!activeModelId && selectedModelForSetup ? styles.highlightCard : ''}`}>
                                    <div className={styles.sectionTitle}>
                                        <span>خطوة 1: تحديد نوع الكميّة (Quantization)</span>
                                        {!activeModelId && <span className={styles.mandatoryBadge}>إجراء مطلوب</span>}
                                    </div>
                                    <QuantizationSelector
                                        selected={selectedQuant}
                                        modelSizeMB={(models.find(m => m.id === (selectedModelForSetup || activeModelId))?.fileSizeMB || 0)}
                                        onChange={setSelectedQuant}
                                    />
                                    {!activeModelId && selectedModelForSetup && (
                                        <div className={styles.startActionContainer}>
                                            <button 
                                                className={styles.btnPrimaryFull}
                                                onClick={() => handleLoad(selectedModelForSetup)}
                                            >
                                                خطوة 2: تشغيل النموذج الآن ⚡
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Drop Zone + System Info */}
                        <div className={styles.sidebarSecondary}>
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
                            models={models}
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
                    <button type="button" className={styles.btnSave} onClick={handleSaveAll} disabled={isSaving}>
                        {isSaving ? <RefreshCw size={16} className={styles.spin} /> : <Save size={16} />}
                        حفظ التغييرات
                    </button>
                    {saveStatus === 'success' && <span className={`${styles.statusMsg} ${styles.statusSuccess}`}>✓ تم الحفظ</span>}
                    {saveStatus === 'error' && <span className={`${styles.statusMsg} ${styles.statusError}`}>✗ فشل الحفظ</span>}
                    {restartNeeded && activeModel && (
                        <span className={`${styles.statusMsg} ${styles.warningText}`}>
                            ⚠ أعِد تشغيل النموذج لتطبيق الإعدادات
                        </span>
                    )}
                    {activeModel && (
                        <span className={`${styles.statusMsg} ${styles.marginRightAuto}`}>
                            🟢 النموذج النشط: <strong>{activeModel.name}</strong>
                        </span>
                    )}
                </div>
            )}

        </div>
    );
};

export default ModelManager;
