import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const LOGS_DIR = path.join(app.getPath('userData'), 'logs');

export interface LogEntry {
    timestamp: string;
    event: string;
    cpuUsage: number;
    ramUsage: number;
    latency: number;
    status: 'success' | 'warning' | 'error';
}

export class LoggerManager {
    private logFilePath: string;

    constructor() {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
        const today = new Date().toISOString().split('T')[0];
        this.logFilePath = path.join(LOGS_DIR, `metrics_${today}.csv`);
        this.initHeader();
    }

    private initHeader() {
        if (!fs.existsSync(this.logFilePath)) {
            const header = 'timestamp,event,cpuUsage,ramUsage,latency,status\n';
            fs.writeFileSync(this.logFilePath, header, 'utf-8');
        }
    }

    public addLog(entry: Omit<LogEntry, 'timestamp'>) {
        try {
            const timestamp = new Date().toISOString();
            const row = `${timestamp},${entry.event},${entry.cpuUsage},${entry.ramUsage},${entry.latency},${entry.status}\n`;
            fs.appendFileSync(this.logFilePath, row, 'utf-8');
            return { success: true };
        } catch (error) {
            console.error('Failed to write log:', error);
            return { success: false, error };
        }
    }

    public getRecentLogs(limit: number = 50): LogEntry[] {
        try {
            if (!fs.existsSync(this.logFilePath)) return [];
            const data = fs.readFileSync(this.logFilePath, 'utf-8');
            const lines = data.trim().split('\n').slice(1); // Skip header
            const entries = lines.map(line => {
                const [timestamp, event, cpuUsage, ramUsage, latency, status] = line.split(',');
                return {
                    timestamp,
                    event,
                    cpuUsage: parseFloat(cpuUsage),
                    ramUsage: parseFloat(ramUsage),
                    latency: parseFloat(latency),
                    status: status as any
                };
            });
            return entries.slice(-limit);
        } catch (error) {
            console.error('Failed to read logs:', error);
            return [];
        }
    }
}
