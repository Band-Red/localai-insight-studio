import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // وظائف المراقبة
    getSystemStats: () => ipcRenderer.invoke('system:stats'),

    // وظائف النماذج القديمة (Ollama)
    checkModelStatus: () => ipcRenderer.invoke('model:status'),
    sendMessage: (message: string, model?: string) => ipcRenderer.invoke('chat:send', message, model),

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
        ipcRenderer.on('engine:setup-status', (_e, msg) => callback(msg));
    },

    // RAG
    selectFolder: () => ipcRenderer.invoke('rag:select-folder'),
    selectFile: () => ipcRenderer.invoke('rag:select-file'),
    clearRagContext: () => ipcRenderer.invoke('rag:clear'),

    // المعاينة البصرية
    onInspected: (callback: any) => ipcRenderer.on('element:inspected', callback),

    // ── GGUF Model Management (New) ─────────────────────────────────────
    selectGgufFile: () => ipcRenderer.invoke('gguf:select-file'),
    registerGgufPath: (filePath: string) => ipcRenderer.invoke('gguf:register-path', filePath),
    listModels: () => ipcRenderer.invoke('gguf:list'),
    removeModel: (id: string) => ipcRenderer.invoke('gguf:remove', id),
    startServer: (config: any) => ipcRenderer.invoke('gguf:start-server', config),
    stopServer: () => ipcRenderer.invoke('gguf:stop-server'),
    getSmartSuggestions: (modelId: string) => ipcRenderer.invoke('gguf:smart-suggest', modelId),
    getSystemResources: () => ipcRenderer.invoke('gguf:system-resources'),
    generateApiKey: () => ipcRenderer.invoke('gguf:generate-api-key'),
    loadMcpConfig: () => ipcRenderer.invoke('gguf:load-mcp'),
    saveMcpConfig: (content: string) => ipcRenderer.invoke('gguf:save-mcp', content),
});