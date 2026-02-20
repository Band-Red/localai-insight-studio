import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

import { ModelManager } from './model_manager';
import { SessionManager } from './session_manager';
import { ObsidianExporter } from './obsidian_exporter';
import { saveSettings, loadSettings } from './settings_manager';
import { LoggerManager } from './logger_manager';
import { RagManager } from './rag_manager';
import { EngineSetupManager } from './engine_setup';

class MainApp {
    private mainWindow: BrowserWindow | null = null;
    private modelManager = new ModelManager();
    private sessionManager = new SessionManager();
    private exporter = new ObsidianExporter();
    private logger = new LoggerManager();
    private ragManager = new RagManager();
    private engineSetup = new EngineSetupManager();
    private readonly mcpConfigPath = path.join(os.homedir(), '.localai-insight-studio', 'mcp.json');

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
            frame: false
        });
        this.mainWindow.loadFile(path.join(__dirname, 'index.html'));

        // تحقق من المحرك وتثبيته في الخلفية عند الإقلاع
        this.engineSetup.ensureEngineAvailable((msg: string) => {
            console.log(`[Engine Setup]: ${msg}`);
            // يمكننا إرسال الحالة للواجهة لو أردنا
            if (this.mainWindow) {
                this.mainWindow.webContents.send('engine:setup-status', msg);
            }
        });
    }

    private setupIpc() {
        // ── Legacy Ollama (backward compat) ─────────────────────────────
        ipcMain.handle('model:status', () => this.modelManager.getStatus());

        ipcMain.handle('chat:send', async (_e, message, model) => {
            const startTime = Date.now();
            try {
                const context = this.ragManager.getContextString();
                const fullPrompt = context ? `${context}\nالمستخدم يقول: ${message}` : message;
                const response = await this.modelManager.chat(fullPrompt, model);
                const latency = Date.now() - startTime;
                this.logger.addLog({ event: 'AI_Chat_Success', cpuUsage: 15, ramUsage: 45, latency, status: 'success' });
                return { success: true, response };
            } catch {
                this.logger.addLog({ event: 'AI_Chat_Error', cpuUsage: 5, ramUsage: 10, latency: Date.now() - startTime, status: 'error' });
                return { success: false, error: 'Failed to communicate with local AI engine' };
            }
        });

        // ── GGUF Model Management ────────────────────────────────────────
        ipcMain.handle('gguf:select-file', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow!, {
                title: 'اختر ملف النموذج (.gguf)',
                properties: ['openFile'],
                filters: [{ name: 'GGUF Models', extensions: ['gguf'] }]
            });
            if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'Cancelled' };
            return this.modelManager.registerModel(result.filePaths[0]);
        });

        ipcMain.handle('gguf:register-path', (_e, filePath: string) =>
            this.modelManager.registerModel(filePath));

        ipcMain.handle('gguf:list', () => this.modelManager.listModels());

        ipcMain.handle('gguf:remove', (_e, id: string) => this.modelManager.removeModel(id));

        ipcMain.handle('gguf:start-server', async (_e, config) =>
            await this.modelManager.startServer(config));

        ipcMain.handle('gguf:stop-server', () => this.modelManager.stopServer());

        ipcMain.handle('gguf:smart-suggest', async (_e, modelId: string) =>
            await this.modelManager.getSmartSuggestions(modelId));

        ipcMain.handle('gguf:system-resources', async () =>
            await this.modelManager.getSystemResources());

        ipcMain.handle('gguf:generate-api-key', () =>
            ({ key: this.modelManager.generateApiKey() }));

        ipcMain.handle('gguf:load-mcp', () => {
            try {
                if (fs.existsSync(this.mcpConfigPath)) {
                    return { success: true, content: fs.readFileSync(this.mcpConfigPath, 'utf8') };
                }
                return { success: true, content: JSON.stringify({ mcpServers: {} }, null, 2) };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        });

        ipcMain.handle('gguf:save-mcp', (_e, content: string) => {
            try {
                const dir = path.dirname(this.mcpConfigPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(this.mcpConfigPath, content, 'utf8');
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        });

        // ── Export ───────────────────────────────────────────────────────
        ipcMain.handle('export:chat', async (_e, session, vaultPath) =>
            this.exporter.exportChat(session, vaultPath));
        ipcMain.handle('export:audit', async (_e, data, vaultPath) =>
            this.exporter.exportAudit(data, vaultPath));

        // ── System ───────────────────────────────────────────────────────
        ipcMain.handle('open-external', (_e, url) => shell.openExternal(url));
        ipcMain.handle('settings:save', (_e, settings) => saveSettings(settings));
        ipcMain.handle('settings:load', () => loadSettings());
        ipcMain.handle('metrics:add', (_e, entry) => this.logger.addLog(entry));
        ipcMain.handle('metrics:get-recent', (_e, limit) => this.logger.getRecentLogs(limit));

        // ── RAG ─────────────────────────────────────────────────────────
        ipcMain.handle('rag:select-folder', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow!, { properties: ['openDirectory'] });
            if (!result.canceled && result.filePaths.length > 0) {
                const indexResult = await this.ragManager.indexFileOrFolder(result.filePaths[0]);
                return { ...indexResult, path: result.filePaths[0] };
            }
            return { success: false, error: 'Cancelled' };
        });

        ipcMain.handle('rag:select-file', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ['openFile'],
                filters: [{ name: 'Documents', extensions: ['txt', 'md', 'pdf', 'js', 'ts', 'html', 'py'] }]
            });
            if (!result.canceled && result.filePaths.length > 0) {
                const indexResult = await this.ragManager.indexFileOrFolder(result.filePaths[0]);
                return { ...indexResult, path: result.filePaths[0] };
            }
            return { success: false, error: 'Cancelled' };
        });

        ipcMain.handle('rag:clear', () => { this.ragManager.clear(); return { success: true }; });

        ipcMain.handle('system:stats', async () => new Promise((resolve) => {
            const pythonProcess = spawn('python', [path.join(__dirname, '../src/main/python_engine.py')]);
            let dataString = '';
            pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });
            pythonProcess.stderr.on('data', (data) => { console.error(`Python Engine Error: ${data}`); });
            pythonProcess.on('close', (code) => {
                try { resolve(code === 0 ? JSON.parse(dataString) : { error: 'Python process exited with error' }); }
                catch { resolve({ error: 'Failed to parse python output' }); }
            });
        }));
    }
}

new MainApp();