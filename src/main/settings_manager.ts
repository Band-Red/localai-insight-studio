import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

export const saveSettings = (settings: any) => {
    try {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save settings:', error);
        return { success: false, error };
    }
};

export const loadSettings = () => {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) {
            const defaultSettings = {
                theme: 'dark',
                aiModel: 'gguf-v1',
                contextLimit: 4096,
                obsidianVaultPath: ''
            };
            saveSettings(defaultSettings);
            return defaultSettings;
        }
        const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
};
