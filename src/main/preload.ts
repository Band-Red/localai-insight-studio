import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // وظائف المراقبة
    getSystemStats: () => ipcRenderer.invoke('system:stats'),

    // وظائف النماذج
    checkModelStatus: () => ipcRenderer.invoke('model:status'),

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

    // المعاينة البصرية (Task 3.2)
    onInspected: (callback: any) => ipcRenderer.on('element:inspected', callback)
});