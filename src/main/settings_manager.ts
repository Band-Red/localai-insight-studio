import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const getSettingsPath = () => path.join(app.getPath('userData'), 'settings.json');

export const saveSettings = (settings: any) => {
    try {
        fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save settings:', error);
        return { success: false, error };
    }
};

export const loadSettings = () => {
    try {
        const settingsPath = getSettingsPath();
        if (!fs.existsSync(settingsPath)) {
            const defaultSettings = {
                theme: 'dark',
                aiModel: 'gguf-v1',
                contextLimit: 4096,
                obsidianVaultPath: ''
            };
            saveSettings(defaultSettings);
            return defaultSettings;
        }
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
};
