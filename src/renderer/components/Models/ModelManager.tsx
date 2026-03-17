/**
 * المكون: ModelManager
 * الوظيفة: الإدارة المركزية لنماذج GGUF، تشمل رفع النماذج، إعداد الخادم، ضبط المعاملات، ومراقبة حالة التشغيل.
 * المكان: واجهة إدارة النماذج (Model Library).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Server, SlidersHorizontal, Code2, Save, RefreshCw, Zap } from 'lucide-react';
import styles from './ModelManager.module.css';
import ModelDropZone from './ModelDropZone';
import ModelList from './ModelList';
import ServerConfig, { ServerConfigValues, defaultServerConfig } from './ServerConfig';
import ModelParameters, { ModelParamValues, defaultModelParams } from './ModelParameters';
import QuantizationSelector from './QuantizationSelector';
import McpConfig from './McpConfig';
import ConfirmModal from '../UI/ConfirmModal';

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<string | null>(null);
    /** معاينة الاقتراحات الذكية قبل التطبيق */
    const [pendingSuggestions, setPendingSuggestions] = useState<any | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

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
            ...modelParams,
            modelId: id
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

    /**
     * إظهار نافذة تأكيد الحذف
     */
    const handleDelete = (id: string) => {
        setModelToDelete(id);
        setIsDeleteModalOpen(true);
    };

    /**
     * تنفيذ الحذف النهائي للملف والسجل
     */
    const handleConfirmDelete = async () => {
        if (!modelToDelete) return;
        
        setIsDeleteModalOpen(false);
        const electron = (window as any).electronAPI;
        
        try {
            const result = await electron?.permanentlyDeleteModel(modelToDelete);
            
            if (result?.success) {
                window.dispatchEvent(new CustomEvent('app:toast', { 
                    detail: { msg: '✅ تم حذف ملف النموذج نهائياً من الجهاز بنجاح', type: 'success' } 
                }));
                
                if (modelToDelete === activeModelId) {
                    setActiveModelId(null);
                    onActiveModelChange?.(null);
                }
                
                await refreshModels();
            } else {
                window.dispatchEvent(new CustomEvent('app:toast', { 
                    detail: { msg: `❌ فشل حذف الملف: ${result?.error || 'حدث خطأ غير معروف'}`, type: 'error' } 
                }));
            }
        } catch (err: any) {
            window.dispatchEvent(new CustomEvent('app:toast', { 
                detail: { msg: `❌ خطأ في النظام: ${err.message}`, type: 'error' } 
            }));
        } finally {
            setModelToDelete(null);
        }
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

    /**
     * جلب الاقتراحات الذكية وتخزينها في المعاينة فقط (لا تطبيق فوري)
     */
    const handleSmartSuggest = async () => {
        const targetId = activeModelId || (models[0]?.id || null);
        setIsSuggesting(true);
        const electron = (window as any).electronAPI;
        if (electron?.getSmartSuggestions) {
            const s = await electron.getSmartSuggestions(targetId);
            if (s) setPendingSuggestions(s);
        } else {
            // توليد اقتراحات محلية مبنية على الموارد الحالية
            const ram = resources?.totalRamGb ?? 8;
            const gpuLayers = resources?.gpus?.length ? (resources.gpus[0].vramMb >= 4096 ? 20 : 5) : 0;
            const cpuCores = resources?.cpuCores ?? 4;
            setPendingSuggestions({
                // Server
                port: serverConfig.port,
                ramGb: Math.max(4, Math.round(ram * 0.6)),
                vramGb: resources?.gpus?.[0] ? Math.round((resources.gpus[0].vramMb / 1024) * 0.8) : 0,
                nGpuLayers: gpuLayers,
                contextLength: ram >= 32 ? 8192 : ram >= 16 ? 4096 : 2048,
                evalBatch: ram >= 16 ? 1024 : 512,
                ropeFreqBase: 10000,
                ropeFreqScale: 1.0,
                keepInMemory: ram >= 16,
                useMmap: true,
                maxIdleTtl: 30,
                requireAuth: false,
                serveOnLan: false,
                enableCors: true,
                allowPerRequestMcp: false,
                allowMcpJson: false,
                jitLoading: false,
                autoUnloadJit: false,
                onlyLastJit: false,
                // Params
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
                minP: 0.05,
                repeatPenalty: 1.1,
                cpuThreads: Math.max(2, Math.min(cpuCores - 1, 8)),
                contextOverflow: 'truncate',
                stopStrings: '',
                structuredOutput: false,
                draftingCutoff: 0.75,
                minDraftSize: 1,
                maxDraftSize: 5,
                visualizeDraftTokens: false,
                reasoning: `مبني على ${ram}GB RAM و${cpuCores} أنوية CPU`,
            });
        }
        setIsSuggesting(false);
    };

    /**
     * تطبيق كافة الاقتراحات الذكية على إعدادات الخادم ومعاملات النموذج معاً
     */
    const handleApplySuggestions = () => {
        if (!pendingSuggestions) return;

        // 1. تحديث إعدادات الخادم (Server Config)
        setServerConfig(prev => ({
            ...prev,
            port:               pendingSuggestions.port               ?? prev.port,
            ramGb:              pendingSuggestions.ramGb              ?? prev.ramGb,
            vramGb:             pendingSuggestions.vramGb             ?? prev.vramGb,
            nGpuLayers:         pendingSuggestions.nGpuLayers         ?? prev.nGpuLayers,
            contextLength:      pendingSuggestions.contextLength      ?? prev.contextLength,
            evalBatch:          pendingSuggestions.evalBatch          ?? prev.evalBatch,
            ropeFreqBase:       pendingSuggestions.ropeFreqBase       ?? prev.ropeFreqBase,
            ropeFreqScale:      pendingSuggestions.ropeFreqScale      ?? prev.ropeFreqScale,
            keepInMemory:       pendingSuggestions.keepInMemory       ?? prev.keepInMemory,
            useMmap:            pendingSuggestions.useMmap            ?? prev.useMmap,
            maxIdleTtl:         pendingSuggestions.maxIdleTtl         ?? prev.maxIdleTtl,
            requireAuth:        pendingSuggestions.requireAuth        ?? prev.requireAuth,
            serveOnLan:         pendingSuggestions.serveOnLan         ?? prev.serveOnLan,
            enableCors:         pendingSuggestions.enableCors         ?? prev.enableCors,
            allowPerRequestMcp: pendingSuggestions.allowPerRequestMcp ?? prev.allowPerRequestMcp,
            allowMcpJson:       pendingSuggestions.allowMcpJson       ?? prev.allowMcpJson,
            jitLoading:         pendingSuggestions.jitLoading         ?? prev.jitLoading,
            autoUnloadJit:      pendingSuggestions.autoUnloadJit      ?? prev.autoUnloadJit,
            onlyLastJit:        pendingSuggestions.onlyLastJit        ?? prev.onlyLastJit,
        }));

        // 2. تحديث معاملات النموذج (Model Parameters)
        setModelParams(prev => ({
            ...prev,
            temperature:        pendingSuggestions.temperature        ?? prev.temperature,
            topK:               pendingSuggestions.topK               ?? prev.topK,
            topP:               pendingSuggestions.topP               ?? prev.topP,
            minP:               pendingSuggestions.minP               ?? prev.minP,
            repeatPenalty:      pendingSuggestions.repeatPenalty      ?? prev.repeatPenalty,
            cpuThreads:         pendingSuggestions.cpuThreads         ?? prev.cpuThreads,
            contextOverflow:    pendingSuggestions.contextOverflow    ?? prev.contextOverflow,
            stopStrings:        pendingSuggestions.stopStrings        ?? prev.stopStrings,
            structuredOutput:   pendingSuggestions.structuredOutput   ?? prev.structuredOutput,
            draftingCutoff:     pendingSuggestions.draftingCutoff     ?? prev.draftingCutoff,
            minDraftSize:       pendingSuggestions.minDraftSize       ?? prev.minDraftSize,
            maxDraftSize:       pendingSuggestions.maxDraftSize       ?? prev.maxDraftSize,
            visualizeDraftTokens: pendingSuggestions.visualizeDraftTokens ?? prev.visualizeDraftTokens,
        }));

        setPendingSuggestions(null);
        setRestartNeeded(!!activeModelId);

        window.dispatchEvent(new CustomEvent('app:toast', {
            detail: { msg: '✨ تم تطبيق كافة الإعدادات الذكية بنجاح (الخادم + المعاملات)', type: 'success' }
        }));
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
                            onChange={(cfg) => { setServerConfig(cfg); if (activeModelId) setRestartNeeded(true); }}
                        />
                        {/* Suggestion Bar moved to bottom of body */}
                    </div>
                )}

                {/* ── Parameters Tab ─────────────────────────────────── */}
                {activeTab === 'params' && (
                    <div className={styles.card}>
                        <ModelParameters
                            params={modelParams}
                            modelId={activeModelId}
                            models={models}
                            onChange={(p) => { setModelParams(p); if (activeModelId) setRestartNeeded(true); }}
                        />
                        {/* Suggestion Bar moved to bottom of body */}
                    </div>
                )}

                {/* ── MCP Tab ────────────────────────────────────────── */}
                {activeTab === 'mcp' && (
                    <div className={styles.card}>
                        <McpConfig />
                    </div>
                )}
                {/* ── Consolidated Intelligent Suggestion Bar (Pinned to Body Bottom) ────────────────── */}
                {(activeTab === 'server' || activeTab === 'params') && (
                    <div className={styles.consolidatedSuggestionContainer}>
                        <div className={styles.suggestionBarFullWidth}>
                            <button type="button" className={styles.smartBtnIntelligent}
                                onClick={handleSmartSuggest} disabled={isSuggesting}>
                                {isSuggesting ? <RefreshCw size={14} className={styles.spin} /> : <Zap size={14} />}
                                ⚡ اقتراحات ذكية (Intelligent Resource Analyzer)
                            </button>
                        </div>
                        
                        {pendingSuggestions && (
                            <div className={styles.intelligentPanel}>
                                <div className={styles.suggestionHeader}>✨ اقتراحات محسنة بناءً على موارد جهازك وأداء المحرك</div>
                                <div className={styles.suggestionGrid}>
                                    {[
                                        ['RAM', `${pendingSuggestions.ramGb} GB`, 'nGpuLayers', pendingSuggestions.nGpuLayers],
                                        ['VRAM', `${pendingSuggestions.vramGb} GB`, 'evalBatch', pendingSuggestions.evalBatch],
                                        ['Context', `${pendingSuggestions.contextLength}`, 'cpuThreads', pendingSuggestions.cpuThreads],
                                        ['Temp', pendingSuggestions.temperature, 'topK', pendingSuggestions.topK],
                                        ['Min P', pendingSuggestions.minP, 'repeatPenalty', pendingSuggestions.repeatPenalty]
                                    ].map(([k1, v1, k2, v2]) => (
                                        <React.Fragment key={k1 as string}>
                                            <div className={styles.suggestionItem}>
                                                <span className={styles.suggestionKey}>{k1}:</span>
                                                <span className={styles.suggestionVal}>{v1}</span>
                                            </div>
                                            <div className={styles.suggestionItem}>
                                                <span className={styles.suggestionKey}>{k2}:</span>
                                                <span className={styles.suggestionVal}>{v2}</span>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                                {pendingSuggestions.reasoning && (
                                    <div className={styles.suggestionNoteIntelligent}>💡 {pendingSuggestions.reasoning}</div>
                                )}
                                <div className={styles.suggestionActions}>
                                    <button className={styles.btnDismiss} onClick={() => setPendingSuggestions(null)}>× تجاهل</button>
                                    <button className={styles.btnApplyIntelligent} onClick={handleApplySuggestions}>✓ تطبيق كل الاقتراحات</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {activeTab !== 'mcp' && (
                <div className={styles.saveBar}>
                    {/* زر إعادة التشغيل عند تغيير الإعدادات والنموذج نشط */}
                    {restartNeeded && activeModelId ? (
                        <button type="button" className={styles.btnRestart} onClick={async () => {
                            await handleSaveAll();
                            // إعادة تشغيل النموذج بالإعدادات الجديدة
                            const electron = (window as any).electronAPI;
                            if (electron?.stopServer) await electron.stopServer();
                            const modelToRestart = activeModelId;
                            setActiveModelId(null);
                            await refreshModels();
                            setTimeout(() => handleLoad(modelToRestart), 800);
                            setRestartNeeded(false);
                        }} disabled={isSaving}>
                            {isSaving ? <RefreshCw size={16} className={styles.spin} /> : <RefreshCw size={16} />}
                            إعادة تشغيل النموذج
                        </button>
                    ) : (
                        <button type="button" className={styles.btnSave} onClick={handleSaveAll} disabled={isSaving}>
                            {isSaving ? <RefreshCw size={16} className={styles.spin} /> : <Save size={16} />}
                            حفظ التغييرات
                        </button>
                    )}
                    {saveStatus === 'success' && <span className={`${styles.statusMsg} ${styles.statusSuccess}`}>✓ تم الحفظ</span>}
                    {saveStatus === 'error' && <span className={`${styles.statusMsg} ${styles.statusError}`}>✗ فشل الحفظ</span>}
                    {activeModel && (
                        <span className={`${styles.statusMsg} ${styles.marginRightAuto}`}>
                            🟢 النموذج النشط: <strong>{activeModel.name}</strong>
                        </span>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="تأكيد الحذف النهائي"
                message="هل أنت متأكد من حذف ملف النموذج نهائياً من جهازك؟ لا يمكن التراجع عن هذه العملية."
                confirmText="حذف نهائي"
                cancelText="إلغاء"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setModelToDelete(null);
                }}
            />
        </div>
    );
};

export default ModelManager;
