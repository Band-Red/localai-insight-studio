export class SessionManager {
    private currentSessionId: string | null = null;

    public startSession() {
        this.currentSessionId = `session_${Date.now()}`;
        console.log("New Private Session Started");
    }

    public clearSessionData() {
        // مسح الذاكرة المؤقتة لضمان الخصوصية
        this.currentSessionId = null;
    }
}