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
     * Saves the entire conversation array for the active session.
     */
    public async saveConversation(messages: any[]) {
        try {
            await this.db.update(
                { _id: 'current_session' },
                { _id: 'current_session', type: 'active_session', messages, updatedAt: new Date() },
                { upsert: true }
            );
            return { success: true };
        } catch (error: any) {
            console.error('[SessionDB] Error saving active conversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Saves a completed conversation as a historical session with a title.
     */
    public async saveNewSession(title: string, messages: any[]) {
        try {
            const sessionId = `session_${Date.now()}`;
            await this.db.insert({
                _id: sessionId,
                type: 'history_session',
                title,
                messages,
                createdAt: new Date()
            });
            return { success: true, sessionId };
        } catch (error: any) {
            console.error('[SessionDB] Error saving new history session:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Lists all historical sessions (titles and IDs).
     */
    public async listSessions() {
        try {
            const sessions = await this.db.find({ type: 'history_session' }).sort({ createdAt: -1 });
            return sessions.map((s: any) => ({
                id: s._id,
                title: s.title,
                createdAt: s.createdAt,
                messageCount: s.messages.length
            }));
        } catch (error) {
            console.error('[SessionDB] Error listing sessions:', error);
            return [];
        }
    }

    /**
     * Retrieves a specific historical session by ID.
     */
    public async getSessionById(id: string) {
        try {
            return await this.db.findOne({ _id: id });
        } catch (error) {
            console.error('[SessionDB] Error getting session by ID:', error);
            return null;
        }
    }

    /**
     * Retrieves the active session messages.
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
     * Clears the current session memory.
     */
    public async clearConversation() {
        try {
            await this.db.remove({ _id: 'current_session' });
            return { success: true };
        } catch (error: any) {
            console.error('[SessionDB] Error clearing conversation:', error);
            return { success: false, error: error.message };
        }
    }
}
