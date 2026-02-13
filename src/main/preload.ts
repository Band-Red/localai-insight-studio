import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // وظائف المراقبة
    getSystemStats: () => ipcRenderer.invoke('system:stats'),
    
    // وظائف النماذج
    checkModelStatus: () => ipcRenderer.invoke('model:status'),
    
    // وظائف التصدير
    exportToObsidian: (data: any) => ipcRenderer.invoke('export:obsidian', data),
    
    // المعاينة
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
});