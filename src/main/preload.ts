/**
 * ملف ما قبل التحميل (Preload Script)
 * الوظيفة: يعمل كجسر آمن (Bridge) بين عمليات المتصفح (Renderer) وعمليات النظام (Main).
 * يستخدم contextBridge لتعريض دوال محدودة وآمنة لواجهة المستخدم.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // وظائف المراقبة وجلب إحصائيات النظام
    getSystemStats: () => ipcRenderer.invoke('system:stats'),

    // وظائف التعامل مع نماذج Ollama والدردشة
    checkModelStatus: () => ipcRenderer.invoke('model:status'),
    sendMessage: (message: string, model?: string) => ipcRenderer.invoke('chat:send', message, model),
    loadChatHistory: () => ipcRenderer.invoke('chat:load-history'),
    saveChatHistory: (messages: any) => ipcRenderer.invoke('chat:save-history', messages),

    // وظائف التصدير
    exportChat: (session: any, vaultPath?: string) => ipcRenderer.invoke('export:chat', session, vaultPath),
    exportAudit: (data: any, vaultPath?: string) => ipcRenderer.invoke('export:audit', data, vaultPath),

    // الروابط الخارجية
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

    // الإعدادات
    saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    loadSettings: () => ipcRenderer.invoke('settings:load'),

    // السجلات
    logMetrics: (entry: any) => ipcRenderer.invoke('metrics:add', entry),
    getRecentMetrics: (limit?: number) => ipcRenderer.invoke('metrics:get-recent', limit),

    // إعدادات المحرك
    onEngineSetupStatus: (callback: (msg: string) => void) => {
        ipcRenderer.removeAllListeners('engine:setup-status');
        ipcRenderer.on('engine:setup-status', (_e, msg) => callback(msg));
    },

    // RAG
    selectFolder: () => ipcRenderer.invoke('rag:select-folder'),
    selectFile: () => ipcRenderer.invoke('rag:select-file'),
    selectDirectory: () => ipcRenderer.invoke('system:select-directory'),
    clearRagContext: () => ipcRenderer.invoke('rag:clear'),


    // المعاينة البصرية
    onInspected: (callback: any) => ipcRenderer.on('element:inspected', callback),

    // ── GGUF Model Management (New) ─────────────────────────────────────
    selectGgufFile: () => ipcRenderer.invoke('gguf:select-file'),
    registerGgufPath: (filePath: string) => ipcRenderer.invoke('gguf:register-path', filePath),
    listModels: () => ipcRenderer.invoke('gguf:list'),
    removeModel: (id: string) => ipcRenderer.invoke('gguf:remove', id),
    updateGgufModel: (id: string, updates: any) => ipcRenderer.invoke('gguf:update-model', id, updates),
    onServerStopped: (callback: (modelId: string) => void) => {
        ipcRenderer.removeAllListeners('gguf:server-stopped');
        ipcRenderer.on('gguf:server-stopped', (_e, modelId) => callback(modelId));
    },
    startServer: (config: any) => ipcRenderer.invoke('gguf:start-server', config),
    stopServer: () => ipcRenderer.invoke('gguf:stop-server'),
    getSmartSuggestions: (modelId: string) => ipcRenderer.invoke('gguf:smart-suggest', modelId),
    getSystemResources: () => ipcRenderer.invoke('gguf:system-resources'),
    generateApiKey: () => ipcRenderer.invoke('gguf:generate-api-key'),
    loadMcpConfig: () => ipcRenderer.invoke('gguf:load-mcp'),
    saveMcpConfig: (content: string) => ipcRenderer.invoke('gguf:save-mcp', content),
    getActiveModel: () => ipcRenderer.invoke('gguf:get-active'),

    // Window Controls
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    closeWindow: () => ipcRenderer.invoke('window:close'),
});