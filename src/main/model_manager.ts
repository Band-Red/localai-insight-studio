import { exec } from 'child_process';

export class ModelManager {
    // التحقق من حالة النموذج المحلي (Ollama مثلاً)
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
        return new Promise((resolve, reject) => {
            // استخدام التنفيذ المباشر للأوامر للتواصل مع Ollama
            // ملاحظة: يمكن تحسين هذا لاحقاً باستخدام Streaming
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

    public async loadModel(modelName: string) {
        console.log(`Ensuring model is available: ${modelName}`);
        return new Promise((resolve) => {
            exec(`ollama pull ${modelName}`, (error) => {
                resolve({ success: !error });
            });
        });
    }
}