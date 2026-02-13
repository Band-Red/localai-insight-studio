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

        // التصدير لـ Obsidian
        ipcMain.handle('export:obsidian', async (event, data) => {
            return await this.exporter.exportToMarkdown(data);
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