import { exec, spawn, ChildProcess } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface GgufModel {
    id: string;
    name: string;
    filePath: string;
    fileSizeBytes: number;
    fileSizeMB: number;
    quantization: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
    errorMsg?: string;
    addedAt: string;
}

export interface ServerConfig {
    modelId: string;
    port: number;
    contextLength: number;
    nGpuLayers: number;
    ramGb: number;
    vramGb: number;
    evalBatch: number;
    ropeFreqBase: number;
    ropeFreqScale: number;
    keepInMemory: boolean;
    useMmap: boolean;
    requireAuth: boolean;
    apiKeys: string[];
    maxIdleTtl: number;
    serveOnLan: boolean;
    enableCors: boolean;
    jitLoading: boolean;
    draftModel?: string;
}


export interface SmartSuggestions {
    contextLength: number;
    nGpuLayers: number;
    ramGb: number;
    vramGb: number;
    evalBatch: number;
    temperature: number;
    topK: number;
    topP: number;
    repeatPenalty: number;
    cpuThreads: number;
    reasoning: string;
}

// ------------------------------------------------------------------
// Quantization extraction from filename
// ------------------------------------------------------------------
const QUANT_KEYS = [
    'Q2_K', 'Q3_K_S', 'Q3_K_M', 'Q3_K_L',
    'Q4_K_S', 'Q4_0', 'Q4_K_M', 'Q5_K_S',
    'Q5_0', 'Q5_K_M', 'Q6_K', 'Q8_0', 'F16', 'F32'
];

function detectQuantization(filename: string): string {
    const upper = filename.toUpperCase();
    for (const q of QUANT_KEYS) {
        if (upper.includes(q.replace('_', '-')) || upper.includes(q)) {
            return q;
        }
    }
    return 'Unknown';
}

// ------------------------------------------------------------------
// Main ModelManager class
// ------------------------------------------------------------------
export class ModelManager {
    private models: Map<string, GgufModel> = new Map();
    private serverProcess: ChildProcess | null = null;
    private activeServerId: string | null = null;
    private activePort: number = 8080;
    private readonly maxModels = 5;
    private readonly storageFile: string;

    constructor() {
        const dataDir = path.join(os.homedir(), '.localai-insight-studio');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        this.storageFile = path.join(dataDir, 'models.json');
        this.loadFromDisk();
    }

    // ----------------------------------------------------------------
    // Persistence
    // ----------------------------------------------------------------
    private loadFromDisk() {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data: GgufModel[] = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
                data.forEach(m => {
                    m.status = 'idle'; // reset on load
                    this.models.set(m.id, m);
                });
            }
        } catch { /* ignore corrupt file */ }
    }

    private saveToDisk() {
        try {
            const data = Array.from(this.models.values());
            fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf8');
        } catch { /* ignore */ }
    }

    // ----------------------------------------------------------------
    // Model CRUD
    // ----------------------------------------------------------------
    public registerModel(filePath: string): { success: boolean; model?: GgufModel; error?: string } {
        try {
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, error: 'مسار الملف غير صالح' };
            }
            if (!filePath.toLowerCase().endsWith('.gguf')) {
                return { success: false, error: 'يُقبل فقط ملفات .gguf' };
            }
            if (!fs.existsSync(filePath)) {
                return { success: false, error: 'الملف غير موجود في المسار المحدد' };
            }
            if (this.models.size >= this.maxModels) {
                return { success: false, error: `الحد الأقصى هو ${this.maxModels} نماذج` };
            }

            const stat = fs.statSync(filePath);
            const id = crypto.randomUUID();
            const filename = path.basename(filePath);
            const model: GgufModel = {
                id,
                name: filename.replace(/\.gguf$/i, ''),
                filePath,
                fileSizeBytes: stat.size,
                fileSizeMB: Math.round(stat.size / (1024 * 1024)),
                quantization: detectQuantization(filename),
                status: 'idle',
                addedAt: new Date().toISOString()
            };

            this.models.set(id, model);
            this.saveToDisk();
            return { success: true, model };
        } catch (err: any) {
            console.error('[Register Model Error]:', err);
            return { success: false, error: err.message || 'فشل غير متوقع في إضافة النموذج' };
        }
    }


    public removeModel(id: string): { success: boolean } {
        if (id === this.activeServerId) {
            this.stopServer();
        }
        this.models.delete(id);
        this.saveToDisk();
        return { success: true };
    }

    public listModels(): GgufModel[] {
        return Array.from(this.models.values());
    }

    public getActiveServer() {
        return { id: this.activeServerId, port: this.activePort };
    }

    // ----------------------------------------------------------------
    // Server
    // ----------------------------------------------------------------
    public async startServer(config: ServerConfig): Promise<{ success: boolean; error?: string }> {
        const model = this.models.get(config.modelId);
        if (!model) return { success: false, error: 'Model not found' };

        // Stop any running server first
        if (this.serverProcess) this.stopServer();

        // Mark as loading
        model.status = 'loading';
        this.activePort = config.port || 8080;
        this.models.set(model.id, model);

        return new Promise((resolve) => {
            const args = [
                '--model', model.filePath,
                '--port', String(config.port || 8080),
                '--ctx-size', String(config.contextLength || 4096),
                '--n-gpu-layers', String(config.nGpuLayers || 0),
                '--batch-size', String(config.evalBatch || 512),
                '--rope-freq-base', String(config.ropeFreqBase || 10000),
                '--rope-freq-scale', String(config.ropeFreqScale || 1.0),
            ];

            if (config.draftModel) {
                const draft = this.models.get(config.draftModel);
                if (draft) {
                    args.push('--draft', draft.filePath);
                }
            }


            if (config.keepInMemory) args.push('--mlock');
            if (config.useMmap) args.push('--mmap');
            if (config.serveOnLan) args.push('--host', '0.0.0.0');
            if (config.enableCors) args.push('--cors');

            try {
                // Determine the correct path to llama-server
                const isPackaged = __dirname.includes('app.asar');
                const rootDir = isPackaged ? process.resourcesPath : path.join(__dirname, '..');

                const binFolder = path.join(rootDir, 'bin');
                const exePath = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
                const localServerPath = path.join(binFolder, exePath);

                const serverCmd = fs.existsSync(localServerPath) ? localServerPath : exePath;

                this.serverProcess = spawn(serverCmd, args, {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    detached: false
                });

                let started = false;
                const timeout = setTimeout(() => {
                    if (!started) {
                        model.status = 'error';
                        model.errorMsg = 'Server startup timed out (30s)';
                        this.models.set(model.id, model);
                        resolve({ success: false, error: model.errorMsg });
                    }
                }, 30000);

                this.serverProcess.stdout?.on('data', (data: Buffer) => {
                    const out = data.toString();
                    if (!started && (out.includes('HTTP server listening') || out.includes('llama server listening'))) {
                        started = true;
                        clearTimeout(timeout);
                        model.status = 'ready';
                        model.errorMsg = undefined;
                        this.activeServerId = model.id;
                        this.models.set(model.id, model);
                        resolve({ success: true });
                    }
                });

                this.serverProcess.on('error', (err: NodeJS.ErrnoException) => {
                    if (!started) {
                        clearTimeout(timeout);
                        model.status = 'error';
                        model.errorMsg = err.code === 'ENOENT'
                            ? 'llama-server غير موجود في مجلد bin أو PATH — يرجى وضع llama-server.exe في مجلد bin داخل المشروع'
                            : `فشل في تشغيل الخادم: ${err.message}`;
                        this.models.set(model.id, model);
                        resolve({ success: false, error: model.errorMsg });
                    }
                });

                this.serverProcess.on('close', () => {
                    if (this.activeServerId === model.id) {
                        model.status = 'idle';
                        this.activeServerId = null;
                        this.models.set(model.id, model);
                    }
                });

            } catch (err: any) {
                model.status = 'error';
                model.errorMsg = err.message;
                this.models.set(model.id, model);
                resolve({ success: false, error: err.message });
            }
        });
    }

    public stopServer(): { success: boolean } {
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
        }
        if (this.activeServerId) {
            const model = this.models.get(this.activeServerId);
            if (model) {
                model.status = 'idle';
                this.models.set(this.activeServerId, model);
            }
            this.activeServerId = null;
        }
        return { success: true };
    }

    // ----------------------------------------------------------------
    // Legacy Ollama (kept for backward compatibility)
    // ----------------------------------------------------------------
    public async getStatus() {
        return new Promise((resolve) => {
            exec('ollama --version', (error) => {
                if (error) {
                    resolve({ active: false, message: 'Ollama is not installed or not running' });
                } else {
                    resolve({ active: true, message: 'Ollama engine is ready' });
                }
            });
        });
    }

    public async chat(message: string, model: string = 'llama3') {
        // If GGUF server is running, use it via API
        if (this.activeServerId) {
            return this.chatGguf(message);
        }

        // Fallback to Ollama
        return new Promise((resolve, reject) => {
            exec(`ollama run ${model} "${message.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ollama Error:', stderr);
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    private async chatGguf(message: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`http://127.0.0.1:${this.activePort}/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: message }],
                        stream: false
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: any = await response.json();
                resolve(data.choices[0].message.content);
            } catch (error: any) {
                console.error('GGUF Chat Error:', error);
                reject(error);
            }
        });
    }

    public async loadModel(modelName: string) {
        return new Promise((resolve) => {
            exec(`ollama pull ${modelName}`, (error) => {
                resolve({ success: !error });
            });
        });
    }

    // ----------------------------------------------------------------
    // System Resources
    // ----------------------------------------------------------------
    public async getSystemResources(): Promise<{
        totalRamGb: number;
        availableRamGb: number;
        cpuCores: number;
        cpuModel: string;
        gpus: { name: string; vramMb: number }[];
    }> {
        const totalRamGb = Math.round(os.totalmem() / (1024 ** 3));
        const availableRamGb = Math.round(os.freemem() / (1024 ** 3));
        const cpuCores = os.cpus().length;
        const cpuModel = os.cpus()[0]?.model || 'Unknown CPU';

        const gpus: { name: string; vramMb: number }[] = await new Promise((resolve) => {
            // Use PowerShell for reliability on Windows 10/11 (wmic is deprecated)
            const cmd = 'powershell -NoProfile -Command "Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json -Compress"';
            exec(cmd, (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve([{ name: 'GPU (لم يُكتشف)', vramMb: 0 }]);
                    return;
                }
                try {
                    const raw = JSON.parse(stdout.trim());
                    const list = Array.isArray(raw) ? raw : [raw];
                    const result = list
                        .map(g => ({
                            name: (g.Name || g.name || '').trim() || 'Unknown GPU',
                            vramMb: Math.round(((g.AdapterRAM || g.adapterRAM || 0)) / (1024 * 1024))
                        }))
                        .filter(g => g.name);
                    resolve(result.length > 0 ? result : [{ name: 'GPU (لم يُكتشف)', vramMb: 0 }]);
                } catch {
                    resolve([{ name: 'GPU (خطأ في الاكتشاف)', vramMb: 0 }]);
                }
            });
        });

        return { totalRamGb, availableRamGb, cpuCores, cpuModel, gpus };
    }

    // ----------------------------------------------------------------
    // Smart Suggestions
    // ----------------------------------------------------------------
    public async getSmartSuggestions(modelId: string): Promise<SmartSuggestions | null> {
        const model = this.models.get(modelId);
        if (!model) return null;

        const resources = await this.getSystemResources();
        const modelSizeMB = model.fileSizeMB;
        const ramGb = resources.totalRamGb;
        const hasGpu = resources.gpus.some(g => g.vramMb > 1000);
        const maxVramGb = Math.max(...resources.gpus.map(g => g.vramMb / 1024), 0);

        // Heuristics based on model size and RAM
        let contextLength = 4096;
        let nGpuLayers = 0;
        let suggestedRamGb = Math.min(Math.ceil(modelSizeMB / 1024) + 2, ramGb - 2);
        let suggestedVramGb = 0;
        let evalBatch = 512;
        let temperature = 0.7;
        let topK = 40;
        let topP = 0.9;
        let repeatPenalty = 1.1;
        let cpuThreads = Math.max(Math.floor(resources.cpuCores * 0.75), 1);

        if (modelSizeMB < 4000) {        // ~3B models
            contextLength = 8192;
        } else if (modelSizeMB < 8000) { // ~7B models
            contextLength = 4096;
        } else if (modelSizeMB < 20000) {// ~13B models
            contextLength = 2048;
            evalBatch = 256;
        } else {                          // 30B+
            contextLength = 1024;
            evalBatch = 128;
        }

        if (hasGpu) {
            nGpuLayers = maxVramGb >= 12 ? 35 : maxVramGb >= 8 ? 20 : 10;
            suggestedVramGb = Math.min(Math.floor(maxVramGb * 0.8), 16);
        }

        const quant = model.quantization;
        if (quant.includes('Q8') || quant.includes('F16') || quant.includes('F32')) {
            temperature = 0.5;
        }

        const reasoning = `النموذج حجمه ${Math.round(modelSizeMB / 1024)} GB، النظام يملك ${ramGb} GB RAM ${hasGpu ? `و GPU بـ ${Math.round(maxVramGb)} GB VRAM` : 'بدون GPU مخصص'}. الإعدادات مُحسَّنة للأداء الأمثل.`;

        return {
            contextLength, nGpuLayers,
            ramGb: suggestedRamGb,
            vramGb: suggestedVramGb,
            evalBatch, temperature, topK, topP,
            repeatPenalty, cpuThreads, reasoning
        };
    }

    // ----------------------------------------------------------------
    // API Key Generation
    // ----------------------------------------------------------------
    public generateApiKey(): string {
        return `lk-${crypto.randomBytes(20).toString('hex')}`;
    }
}