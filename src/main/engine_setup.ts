import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class EngineSetupManager {
    private getBinPath(): string {
        const isPackaged = app.isPackaged;
        const rootDir = isPackaged ? process.resourcesPath : path.join(__dirname, '..', '..');
        const binFolder = path.join(rootDir, 'bin');
        if (!fs.existsSync(binFolder)) {
            fs.mkdirSync(binFolder, { recursive: true });
        }
        return binFolder;
    }

    public async ensureEngineAvailable(onProgress: (msg: string) => void): Promise<boolean> {
        const binFolder = this.getBinPath();
        const exePath = path.join(binFolder, 'llama-server.exe');

        if (fs.existsSync(exePath)) {
            onProgress('المحرك موجود وجاهز للعمل.');
            return true;
        }

        onProgress('جاري تحميل المحرك السيادي (llama-server) لأول مرة، يرجى الانتظار...');

        // استخدام PowerShell لتحميل وفك ضغط المحرك برمجياً بدون مكاتب إضافية
        const zipUrl = "https://github.com/ggerganov/llama.cpp/releases/download/b4300/llama-b4300-bin-win-avx2-x64.zip";
        const zipFile = path.join(binFolder, 'llama-server.zip');

        const psCommand = `
            $ProgressPreference = 'SilentlyContinue';
            Invoke-WebRequest -Uri "${zipUrl}" -OutFile "${zipFile}";
            Expand-Archive -Path "${zipFile}" -DestinationPath "${binFolder}" -Force;
            Remove-Item "${zipFile}";
        `.replace(/\n/g, ' ');

        return new Promise((resolve) => {
            exec(`powershell -NoProfile -Command "${psCommand}"`, (error) => {
                if (error || !fs.existsSync(exePath)) {
                    onProgress('فشل في تحميل المحرك تلقائياً، يرجى التحقق من اتصال الإنترنت.');
                    resolve(false);
                } else {
                    onProgress('تم تثبيت المحرك بنجاح!');
                    resolve(true);
                }
            });
        });
    }
}
