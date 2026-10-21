/**
 * Browser Mock for Electron API
 * This file provides a dummy window.electronAPI when running in a standard browser.
 */

if (!(window as any).electronAPI) {
  console.log('🌐 LocalAI Insight Studio: Running in browser mode. Mocking Electron APIs.');

  (window as any).electronAPI = {
    // System Stats
    getSystemStats: async () => ({
      cpu: 25,
      memory: 45,
      load: [1.2, 1.1, 1.0],
      temp: 42
    }),

    // Chat
    sendMessage: async (messages: any[]) => {
      console.log('[Mock] sendMessage:', messages);
      return { 
        success: true, 
        response: 'هذا رد تجريبي من متصفح الويب. لا يمكن تشغيل النماذج محلياً في المتصفح، ولكن يمكنك معاينة الواجهة وتنسيقاتها.' 
      };
    },
    loadChatHistory: async () => ({ success: true, data: [] }),
    saveChatHistory: async (messages: any) => { console.log('[Mock] saveChatHistory', messages); return { success: true }; },

    // NoSQL
    dbSaveChat: async () => ({ success: true }),
    dbGetChat: async () => ({ success: true, data: [] }),
    dbClearChat: async () => ({ success: true }),
    dbSaveNewSession: async (title: string) => { console.log('[Mock] dbSaveNewSession', title); return { success: true }; },
    dbListSessions: async () => ({ success: true, data: [] }),
    dbGetSessionById: async () => ({ success: true, data: null }),
    dbDeleteSession: async () => ({ success: true }),
    dbUpdateSessionTitle: async () => ({ success: true }),

    // GGUF
    listModels: async () => [],
    getActiveModel: async () => null,
    getSmartSuggestions: async () => ({ suggestions: [], logs: 'Mock logs' }),
    getSystemResources: async () => ({ ram: '16GB', cpu: 'Mock CPU', hasGpu: false }),

    // Window Controls
    minimizeWindow: () => console.log('[Mock] Minimize'),
    toggleMaximize: () => console.log('[Mock] Toggle Maximize'),
    closeWindow: () => console.log('[Mock] Close'),

    // Settings
    loadSettings: async () => ({ theme: 'dark' }),
    saveSettings: async () => ({ success: true }),

    // External
    openExternal: async (url: string) => window.open(url, '_blank'),
  };
}
