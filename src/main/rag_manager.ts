import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse';

export interface RagContext {
    fileName: string;
    content: string;
}

export class RagManager {
    private context: RagContext[] = [];
    private readonly maxFiles = 50;

    public async indexFileOrFolder(targetPath: string) {
        this.context = []; // Clear previous context
        if (!fs.existsSync(targetPath)) return { success: false, error: 'Path does not exist' };

        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
            await this.indexDirectory(targetPath);
        } else {
            await this.indexSingleFile(targetPath);
        }

        return { success: true, fileCount: this.context.length };
    }

    private async indexDirectory(dirPath: string) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // Skip node_modules and hidden folders for performance
                if (file !== 'node_modules' && !file.startsWith('.')) {
                    await this.indexDirectory(fullPath);
                }
            } else {
                if (this.context.length >= this.maxFiles) break;
                await this.indexSingleFile(fullPath);
            }
        }
    }

    private async indexSingleFile(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath);

        try {
            if (['.txt', '.md', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.py'].includes(ext)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                this.context.push({ fileName, content });
            } else if (ext === '.pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                this.context.push({ fileName, content: data.text });
            }
        } catch (error) {
            console.error(`Failed to index file ${filePath}:`, error);
        }
    }

    public getContextString() {
        if (this.context.length === 0) return '';

        let contextStr = '\n--- السير المحلي المرفق (Context) ---\n';
        this.context.forEach(ctx => {
            contextStr += `\n[File: ${ctx.fileName}]\n${ctx.content}\n`;
        });
        contextStr += '\n--- نهاية السياق ---\n';

        // Limit context length slightly to avoid blowing up LLM limit (can be improved with real RAG later)
        return contextStr.substring(0, 10000);
    }

    public clear() {
        this.context = [];
    }
}
