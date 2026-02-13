/**
 * Global Type Definitions for LocalAI Studio (Stage 6)
 * تحديث: إضافة تعريفات الوحدات الأساسية لحل مشكلة 'any' type
 */

// حل مشكلة عدم التعرف على تعريفات React و Modules الأخرى
declare module 'react';
declare module 'react-dom';
declare module '*.module.css';

export interface IElectronAPI {
    // وظائف مراقبة النظام والمقاييس الـ 13
    getSystemStats: () => Promise<{
        cpuUsage: number;
        ramUsedGB: number;
        securityLevel: number;
        reportsGenerated: number;
        totalQueries: number;
        avgResponseTime: number;
        ramPercentage: number;
        ragAccuracy: number;
        cpuLoad: number;
        confidenceLevel: number;
        systemUptime: string;
        lastOpsCount: number;
        privacyScanStatus: string;
    }>;

    // وظائف إدارة النماذج المحلية (Ollama / Local LLMs)
    checkModelStatus: () => Promise<{
        active: boolean;
        models?: string[];
        raw?: string;
    }>;

    // وظائف التصدير لبيئة Obsidian
    exportToObsidian: (data: any) => Promise<string>;

    // وظائف المعاينة والتفاعل الخارجي (Sandbox & Browser)
    openExternal: (url: string) => Promise<void>;
    openExternalBrowser: (code: string) => void;
}

declare global {
    interface Window {
        /**
         * الواجهة البرمجية المتاحة في الـ Renderer process
         * المصدر: src/main/preload.ts
         */
        electronAPI: IElectronAPI;
    }
}

// لضمان معاملة الملف كـ Module
export {};