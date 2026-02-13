import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // وظائف المراقبة
    getSystemStats: () => ipcRenderer.invoke('system:stats'),

    // وظائف النماذج (Task 2.1)
    checkModelStatus: () => ipcRenderer.invoke('model:status'),
    sendMessage: (message: string, model?: string) => ipcRenderer.invoke('chat:send', message, model),

    // وظائف التصدير (Task 5.1 & 3.1)
    exportChat: (session: any, vaultPath?: string) => ipcRenderer.invoke('export:chat', session, vaultPath),
    exportAudit: (data: any, vaultPath?: string) => ipcRenderer.invoke('export:audit', data, vaultPath),

    // المعاينة
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

    // الإعدادات (Task 1.1)
    saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    loadSettings: () => ipcRenderer.invoke('settings:load'),

    // نظام السجلات (Task 1.2)
    logMetrics: (entry: any) => ipcRenderer.invoke('metrics:add', entry),
    getRecentMetrics: (limit?: number) => ipcRenderer.invoke('metrics:get-recent', limit),

    // نظام الـ RAG (Task 2.2)
    selectFolder: () => ipcRenderer.invoke('rag:select-folder'),
    selectFile: () => ipcRenderer.invoke('rag:select-file'),
    clearRagContext: () => ipcRenderer.invoke('rag:clear'),

    // المعاينة البصرية (Task 3.2)
    onInspected: (callback: any) => ipcRenderer.on('element:inspected', callback)
});