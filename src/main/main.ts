import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { ModelManager } from './model_manager';
import { SessionManager } from './session_manager';
import { ObsidianExporter } from './obsidian_exporter';
import { saveSettings, loadSettings } from './settings_manager';
import { LoggerManager } from './logger_manager';

class MainApp {
    private mainWindow: BrowserWindow | null = null;
    private modelManager = new ModelManager();
    private sessionManager = new SessionManager();
    private exporter = new ObsidianExporter();
    private logger = new LoggerManager();

    constructor() {
        app.on('ready', () => this.createWindow());
        this.setupIpc();
    }

    private createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            },
            backgroundColor: '#09090b',
            frame: false // للحصول على واجهة عصرية
        });

        this.mainWindow.loadFile('index.html');
    }

    private setupIpc() {
        // إدارة النماذج
        ipcMain.handle('model:status', () => this.modelManager.getStatus());

        ipcMain.handle('chat:send', async (event, message, model) => {
            const startTime = Date.now();
            try {
                const response = await this.modelManager.chat(message, model);
                const latency = Date.now() - startTime;

                // تسجيل العملية في السجلات (Task 1.2)
                this.logger.addLog({
                    event: 'AI_Chat_Success',
                    cpuUsage: 15, // تقريبي
                    ramUsage: 45, // تقريبي
                    latency: latency,
                    status: 'success'
                });

                return { success: true, response };
            } catch (error) {
                this.logger.addLog({
                    event: 'AI_Chat_Error',
                    cpuUsage: 5,
                    ramUsage: 10,
                    latency: Date.now() - startTime,
                    status: 'error'
                });
                return { success: false, error: 'Failed to communicate with local AI engine' };
            }
        });

        // التصدير لـ Obsidian (Task 5.1 & 3.1)
        ipcMain.handle('export:chat', async (event, session, vaultPath) => {
            return await this.exporter.exportChat(session, vaultPath);
        });

        ipcMain.handle('export:audit', async (event, data, vaultPath) => {
            return await this.exporter.exportAudit(data, vaultPath);
        });

        // فتح الروابط الخارجية
        ipcMain.handle('open-external', (event, url) => {
            shell.openExternal(url);
        });

        // إدارة الإعدادات (Task 1.1)
        ipcMain.handle('settings:save', (event, settings) => saveSettings(settings));
        ipcMain.handle('settings:load', () => loadSettings());

        // نظام السجلات (Task 1.2)
        ipcMain.handle('metrics:add', (event, entry) => this.logger.addLog(entry));
        ipcMain.handle('metrics:get-recent', (event, limit) => this.logger.getRecentLogs(limit));
    }
}

new MainApp();