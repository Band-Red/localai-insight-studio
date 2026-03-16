import Datastore from 'nedb-promises';
import path from 'path';
import os from 'os';
import fs from 'fs';

export class SessionMemoryDB {
    private db: any;

    constructor() {
        const userDataPath = path.join(os.homedir(), '.localai-insight-studio');
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        
        const dbPath = path.join(userDataPath, 'chat_memory.db');
        this.db = Datastore.create({
            filename: dbPath,
            autoload: true
        });
        
        console.log('[SessionDB] Initialized NoSQL memory at:', dbPath);
    }

    /**
     * Saves the entire conversation array.
     * We clear any existing memory in the session first to avoid duplicates.
     */
    public async saveConversation(messages: any[]) {
        try {
            // Overwrite memory completely with the latest saved array
            await this.db.remove({}, { multi: true });
            
            // Re-insert array of messages 
            // We store them as a single document under a "conversation" type, 
            // or we could insert them individually. A single container object is simpler.
            await this.db.insert({ _id: 'current_session', type: 'conversation', messages });
            
            return { success: true };
        } catch (error: any) {
            console.error('[SessionDB] Error saving conversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Retrieves the stored conversation messages to be passed as context to the AI.
     */
    public async getConversation(): Promise<any[]> {
        try {
            const doc = await this.db.findOne({ _id: 'current_session' });
            if (doc && doc.messages) {
                return doc.messages;
            }
            return [];
        } catch (error) {
            console.error('[SessionDB] Error retrieving conversation:', error);
            return [];
        }
    }

    /**
     * Clears the current session memory (used when user clears chat or discards it).
     */
    public async clearConversation() {
        try {
            await this.db.remove({}, { multi: true });
            return { success: true };
        } catch (error: any) {
            console.error('[SessionDB] Error clearing conversation:', error);
            return { success: false, error: error.message };
        }
    }
}
