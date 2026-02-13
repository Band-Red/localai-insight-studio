/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main/logger_manager.ts"
/*!************************************!*\
  !*** ./src/main/logger_manager.ts ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   LoggerManager: () => (/* binding */ LoggerManager)\n/* harmony export */ });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst LOGS_DIR = path__WEBPACK_IMPORTED_MODULE_1___default().join(electron__WEBPACK_IMPORTED_MODULE_2__.app.getPath('userData'), 'logs');\nclass LoggerManager {\n    logFilePath;\n    constructor() {\n        if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(LOGS_DIR)) {\n            fs__WEBPACK_IMPORTED_MODULE_0___default().mkdirSync(LOGS_DIR, { recursive: true });\n        }\n        const today = new Date().toISOString().split('T')[0];\n        this.logFilePath = path__WEBPACK_IMPORTED_MODULE_1___default().join(LOGS_DIR, `metrics_${today}.csv`);\n        this.initHeader();\n    }\n    initHeader() {\n        if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(this.logFilePath)) {\n            const header = 'timestamp,event,cpuUsage,ramUsage,latency,status\\n';\n            fs__WEBPACK_IMPORTED_MODULE_0___default().writeFileSync(this.logFilePath, header, 'utf-8');\n        }\n    }\n    addLog(entry) {\n        try {\n            const timestamp = new Date().toISOString();\n            const row = `${timestamp},${entry.event},${entry.cpuUsage},${entry.ramUsage},${entry.latency},${entry.status}\\n`;\n            fs__WEBPACK_IMPORTED_MODULE_0___default().appendFileSync(this.logFilePath, row, 'utf-8');\n            return { success: true };\n        }\n        catch (error) {\n            console.error('Failed to write log:', error);\n            return { success: false, error };\n        }\n    }\n    getRecentLogs(limit = 50) {\n        try {\n            if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(this.logFilePath))\n                return [];\n            const data = fs__WEBPACK_IMPORTED_MODULE_0___default().readFileSync(this.logFilePath, 'utf-8');\n            const lines = data.trim().split('\\n').slice(1); // Skip header\n            const entries = lines.map(line => {\n                const [timestamp, event, cpuUsage, ramUsage, latency, status] = line.split(',');\n                return {\n                    timestamp,\n                    event,\n                    cpuUsage: parseFloat(cpuUsage),\n                    ramUsage: parseFloat(ramUsage),\n                    latency: parseFloat(latency),\n                    status: status\n                };\n            });\n            return entries.slice(-limit);\n        }\n        catch (error) {\n            console.error('Failed to read logs:', error);\n            return [];\n        }\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/logger_manager.ts?\n}");

/***/ },

/***/ "./src/main/main.ts"
/*!**************************!*\
  !*** ./src/main/main.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! child_process */ \"child_process\");\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(child_process__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _model_manager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./model_manager */ \"./src/main/model_manager.ts\");\n/* harmony import */ var _session_manager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./session_manager */ \"./src/main/session_manager.ts\");\n/* harmony import */ var _obsidian_exporter__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./obsidian_exporter */ \"./src/main/obsidian_exporter.ts\");\n/* harmony import */ var _settings_manager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./settings_manager */ \"./src/main/settings_manager.ts\");\n/* harmony import */ var _logger_manager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./logger_manager */ \"./src/main/logger_manager.ts\");\n/* harmony import */ var _rag_manager__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./rag_manager */ \"./src/main/rag_manager.ts\");\n\n\n\n\n\n\n\n\n\nclass MainApp {\n    mainWindow = null;\n    modelManager = new _model_manager__WEBPACK_IMPORTED_MODULE_3__.ModelManager();\n    sessionManager = new _session_manager__WEBPACK_IMPORTED_MODULE_4__.SessionManager();\n    exporter = new _obsidian_exporter__WEBPACK_IMPORTED_MODULE_5__.ObsidianExporter();\n    logger = new _logger_manager__WEBPACK_IMPORTED_MODULE_7__.LoggerManager();\n    ragManager = new _rag_manager__WEBPACK_IMPORTED_MODULE_8__.RagManager();\n    constructor() {\n        electron__WEBPACK_IMPORTED_MODULE_0__.app.on('ready', () => this.createWindow());\n        this.setupIpc();\n    }\n    createWindow() {\n        this.mainWindow = new electron__WEBPACK_IMPORTED_MODULE_0__.BrowserWindow({\n            width: 1200,\n            height: 800,\n            webPreferences: {\n                preload: path__WEBPACK_IMPORTED_MODULE_2___default().join(__dirname, 'preload.js'),\n                contextIsolation: true,\n                nodeIntegration: false\n            },\n            backgroundColor: '#09090b',\n            frame: false // للحصول على واجهة عصرية\n        });\n        this.mainWindow.loadFile('index.html');\n    }\n    setupIpc() {\n        // إدارة النماذج\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('model:status', () => this.modelManager.getStatus());\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('chat:send', async (event, message, model) => {\n            const startTime = Date.now();\n            try {\n                // دمج مسياق الـ RAG المحلي (Task 2.2)\n                const context = this.ragManager.getContextString();\n                const fullPrompt = context ? `${context}\\nالمستخدم يقول: ${message}` : message;\n                const response = await this.modelManager.chat(fullPrompt, model);\n                const latency = Date.now() - startTime;\n                // تسجيل العملية في السجلات (Task 1.2)\n                this.logger.addLog({\n                    event: 'AI_Chat_Success',\n                    cpuUsage: 15, // تقريبي\n                    ramUsage: 45, // تقريبي\n                    latency: latency,\n                    status: 'success'\n                });\n                return { success: true, response };\n            }\n            catch (error) {\n                this.logger.addLog({\n                    event: 'AI_Chat_Error',\n                    cpuUsage: 5,\n                    ramUsage: 10,\n                    latency: Date.now() - startTime,\n                    status: 'error'\n                });\n                return { success: false, error: 'Failed to communicate with local AI engine' };\n            }\n        });\n        // التصدير لـ Obsidian (Task 5.1 & 3.1)\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('export:chat', async (event, session, vaultPath) => {\n            return await this.exporter.exportChat(session, vaultPath);\n        });\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('export:audit', async (event, data, vaultPath) => {\n            return await this.exporter.exportAudit(data, vaultPath);\n        });\n        // فتح الروابط الخارجية\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('open-external', (event, url) => {\n            electron__WEBPACK_IMPORTED_MODULE_0__.shell.openExternal(url);\n        });\n        // إدارة الإعدادات (Task 1.1)\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('settings:save', (event, settings) => (0,_settings_manager__WEBPACK_IMPORTED_MODULE_6__.saveSettings)(settings));\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('settings:load', () => (0,_settings_manager__WEBPACK_IMPORTED_MODULE_6__.loadSettings)());\n        // نظام السجلات (Task 1.2)\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('metrics:add', (event, entry) => this.logger.addLog(entry));\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('metrics:get-recent', (event, limit) => this.logger.getRecentLogs(limit));\n        // نظام الـ RAG (Task 2.2)\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('rag:select-folder', async () => {\n            const result = await electron__WEBPACK_IMPORTED_MODULE_0__.dialog.showOpenDialog(this.mainWindow, {\n                properties: ['openDirectory']\n            });\n            if (!result.canceled && result.filePaths.length > 0) {\n                const indexResult = await this.ragManager.indexFileOrFolder(result.filePaths[0]);\n                return { ...indexResult, path: result.filePaths[0] };\n            }\n            return { success: false, error: 'Cancelled' };\n        });\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('rag:select-file', async () => {\n            const result = await electron__WEBPACK_IMPORTED_MODULE_0__.dialog.showOpenDialog(this.mainWindow, {\n                properties: ['openFile'],\n                filters: [\n                    { name: 'Documents', extensions: ['txt', 'md', 'pdf', 'js', 'ts', 'html', 'py'] }\n                ]\n            });\n            if (!result.canceled && result.filePaths.length > 0) {\n                const indexResult = await this.ragManager.indexFileOrFolder(result.filePaths[0]);\n                return { ...indexResult, path: result.filePaths[0] };\n            }\n            return { success: false, error: 'Cancelled' };\n        });\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('rag:clear', () => {\n            this.ragManager.clear();\n            return { success: true };\n        });\n        // تشغيل محرك التحليل (Python) (Task 2.3)\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('system:stats', async () => {\n            return new Promise((resolve) => {\n                const pythonProcess = (0,child_process__WEBPACK_IMPORTED_MODULE_1__.spawn)('python', [path__WEBPACK_IMPORTED_MODULE_2___default().join(__dirname, '../src/main/python_engine.py')]);\n                let dataString = '';\n                pythonProcess.stdout.on('data', (data) => {\n                    dataString += data.toString();\n                });\n                pythonProcess.stderr.on('data', (data) => {\n                    console.error(`Python Engine Error: ${data}`);\n                });\n                pythonProcess.on('close', (code) => {\n                    try {\n                        if (code === 0) {\n                            resolve(JSON.parse(dataString));\n                        }\n                        else {\n                            resolve({ error: 'Python process exited with error' });\n                        }\n                    }\n                    catch (e) {\n                        resolve({ error: 'Failed to parse python output' });\n                    }\n                });\n            });\n        });\n    }\n}\nnew MainApp();\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/main.ts?\n}");

/***/ },

/***/ "./src/main/model_manager.ts"
/*!***********************************!*\
  !*** ./src/main/model_manager.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ModelManager: () => (/* binding */ ModelManager)\n/* harmony export */ });\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! child_process */ \"child_process\");\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(child_process__WEBPACK_IMPORTED_MODULE_0__);\n\nclass ModelManager {\n    // التحقق من حالة النموذج المحلي (Ollama مثلاً)\n    async getStatus() {\n        return new Promise((resolve) => {\n            (0,child_process__WEBPACK_IMPORTED_MODULE_0__.exec)('ollama --version', (error) => {\n                if (error) {\n                    resolve({ active: false, message: 'Ollama is not installed or not running' });\n                }\n                else {\n                    resolve({ active: true, message: 'Ollama engine is ready' });\n                }\n            });\n        });\n    }\n    async chat(message, model = 'llama3') {\n        return new Promise((resolve, reject) => {\n            // استخدام التنفيذ المباشر للأوامر للتواصل مع Ollama\n            // ملاحظة: يمكن تحسين هذا لاحقاً باستخدام Streaming\n            (0,child_process__WEBPACK_IMPORTED_MODULE_0__.exec)(`ollama run ${model} \"${message.replace(/\"/g, '\\\\\"')}\"`, { encoding: 'utf8' }, (error, stdout, stderr) => {\n                if (error) {\n                    console.error('Ollama Error:', stderr);\n                    reject(error);\n                }\n                else {\n                    resolve(stdout.trim());\n                }\n            });\n        });\n    }\n    async loadModel(modelName) {\n        console.log(`Ensuring model is available: ${modelName}`);\n        return new Promise((resolve) => {\n            (0,child_process__WEBPACK_IMPORTED_MODULE_0__.exec)(`ollama pull ${modelName}`, (error) => {\n                resolve({ success: !error });\n            });\n        });\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/model_manager.ts?\n}");

/***/ },

/***/ "./src/main/obsidian_exporter.ts"
/*!***************************************!*\
  !*** ./src/main/obsidian_exporter.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ObsidianExporter: () => (/* binding */ ObsidianExporter)\n/* harmony export */ });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nclass ObsidianExporter {\n    async exportChat(session, vaultPath) {\n        try {\n            const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.md`;\n            const targetDir = vaultPath && fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(vaultPath)\n                ? vaultPath\n                : path__WEBPACK_IMPORTED_MODULE_1___default().join(electron__WEBPACK_IMPORTED_MODULE_2__.app.getPath('userData'), 'obsidian_vault');\n            if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(targetDir)) {\n                fs__WEBPACK_IMPORTED_MODULE_0___default().mkdirSync(targetDir, { recursive: true });\n            }\n            const filePath = path__WEBPACK_IMPORTED_MODULE_1___default().join(targetDir, fileName);\n            const content = `---\r\ntype: ai-chat\r\nsession: ${session.title}\r\ndate: ${new Date().toISOString()}\r\ntags: [localai, insight-studio, documentation]\r\n---\r\n# ${session.title}\r\n\r\n${session.messages.map((m) => `### [${m.sender === 'user' ? '👤 المستخدم' : '🤖 الذكاء الاصطناعي'}] - ${new Date(m.timestamp).toLocaleTimeString()}\r\n${m.text}\r\n`).join('\\n---\\n')}\r\n\r\n---\r\n*تولدت هذه الجلسة آلياً عبر LocalAI Insight Studio بصيغة Markdown متوافقة مع Obsidian.*`;\n            fs__WEBPACK_IMPORTED_MODULE_0___default().writeFileSync(filePath, content, 'utf8');\n            return { success: true, filePath };\n        }\n        catch (error) {\n            console.error('Failed to export to Obsidian:', error);\n            return { success: false, error };\n        }\n    }\n    async exportAudit(data, vaultPath) {\n        const fileName = `AI-Audit-${Date.now()}.md`;\n        const targetDir = vaultPath && fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(vaultPath)\n            ? vaultPath\n            : path__WEBPACK_IMPORTED_MODULE_1___default().join(electron__WEBPACK_IMPORTED_MODULE_2__.app.getPath('userData'), 'obsidian_vault');\n        if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(targetDir)) {\n            fs__WEBPACK_IMPORTED_MODULE_0___default().mkdirSync(targetDir, { recursive: true });\n        }\n        const filePath = path__WEBPACK_IMPORTED_MODULE_1___default().join(targetDir, fileName);\n        const content = `---\r\ntype: audit\r\ndate: ${new Date().toISOString()}\r\n---\r\n# تقرير أداء النظام\r\n\r\n- **استهلاك المعالج:** ${data.cpuUsage}%\r\n- **استهلاك الرام:** ${data.ramPercentage}%\r\n- **حالة الأمان:** آمن (محلي بالكامل)\r\n\r\nGenerated by LocalAI Studio.`;\n        fs__WEBPACK_IMPORTED_MODULE_0___default().writeFileSync(filePath, content, 'utf8');\n        return filePath;\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/obsidian_exporter.ts?\n}");

/***/ },

/***/ "./src/main/rag_manager.ts"
/*!*********************************!*\
  !*** ./src/main/rag_manager.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   RagManager: () => (/* binding */ RagManager)\n/* harmony export */ });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var pdf_parse__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! pdf-parse */ \"pdf-parse\");\n/* harmony import */ var pdf_parse__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(pdf_parse__WEBPACK_IMPORTED_MODULE_2__);\n\n\n// @ts-ignore\n\nclass RagManager {\n    context = [];\n    async indexFileOrFolder(targetPath) {\n        this.context = []; // Clear previous context\n        if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(targetPath))\n            return { success: false, error: 'Path does not exist' };\n        const stats = fs__WEBPACK_IMPORTED_MODULE_0___default().statSync(targetPath);\n        if (stats.isDirectory()) {\n            await this.indexDirectory(targetPath);\n        }\n        else {\n            await this.indexSingleFile(targetPath);\n        }\n        return { success: true, fileCount: this.context.length };\n    }\n    async indexDirectory(dirPath) {\n        const files = fs__WEBPACK_IMPORTED_MODULE_0___default().readdirSync(dirPath);\n        for (const file of files) {\n            const fullPath = path__WEBPACK_IMPORTED_MODULE_1___default().join(dirPath, file);\n            const stats = fs__WEBPACK_IMPORTED_MODULE_0___default().statSync(fullPath);\n            if (stats.isDirectory()) {\n                // Skip node_modules and hidden folders for performance\n                if (file !== 'node_modules' && !file.startsWith('.')) {\n                    await this.indexDirectory(fullPath);\n                }\n            }\n            else {\n                await this.indexSingleFile(fullPath);\n            }\n        }\n    }\n    async indexSingleFile(filePath) {\n        const ext = path__WEBPACK_IMPORTED_MODULE_1___default().extname(filePath).toLowerCase();\n        const fileName = path__WEBPACK_IMPORTED_MODULE_1___default().basename(filePath);\n        try {\n            if (['.txt', '.md', '.js', '.ts', '.html', '.css', '.json', '.py'].includes(ext)) {\n                const content = fs__WEBPACK_IMPORTED_MODULE_0___default().readFileSync(filePath, 'utf-8');\n                this.context.push({ fileName, content });\n            }\n            else if (ext === '.pdf') {\n                const dataBuffer = fs__WEBPACK_IMPORTED_MODULE_0___default().readFileSync(filePath);\n                const data = await pdf_parse__WEBPACK_IMPORTED_MODULE_2___default()(dataBuffer);\n                this.context.push({ fileName, content: data.text });\n            }\n        }\n        catch (error) {\n            console.error(`Failed to index file ${filePath}:`, error);\n        }\n    }\n    getContextString() {\n        if (this.context.length === 0)\n            return '';\n        let contextStr = '\\n--- السير المحلي المرفق (Context) ---\\n';\n        this.context.forEach(ctx => {\n            contextStr += `\\n[File: ${ctx.fileName}]\\n${ctx.content}\\n`;\n        });\n        contextStr += '\\n--- نهاية السياق ---\\n';\n        // Limit context length slightly to avoid blowing up LLM limit (can be improved with real RAG later)\n        return contextStr.substring(0, 10000);\n    }\n    clear() {\n        this.context = [];\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/rag_manager.ts?\n}");

/***/ },

/***/ "./src/main/session_manager.ts"
/*!*************************************!*\
  !*** ./src/main/session_manager.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SessionManager: () => (/* binding */ SessionManager)\n/* harmony export */ });\nclass SessionManager {\n    currentSessionId = null;\n    startSession() {\n        this.currentSessionId = `session_${Date.now()}`;\n        console.log(\"New Private Session Started\");\n    }\n    clearSessionData() {\n        // مسح الذاكرة المؤقتة لضمان الخصوصية\n        this.currentSessionId = null;\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/session_manager.ts?\n}");

/***/ },

/***/ "./src/main/settings_manager.ts"
/*!**************************************!*\
  !*** ./src/main/settings_manager.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   loadSettings: () => (/* binding */ loadSettings),\n/* harmony export */   saveSettings: () => (/* binding */ saveSettings)\n/* harmony export */ });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst SETTINGS_PATH = path__WEBPACK_IMPORTED_MODULE_1___default().join(electron__WEBPACK_IMPORTED_MODULE_2__.app.getPath('userData'), 'settings.json');\nconst saveSettings = (settings) => {\n    try {\n        fs__WEBPACK_IMPORTED_MODULE_0___default().writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');\n        return { success: true };\n    }\n    catch (error) {\n        console.error('Failed to save settings:', error);\n        return { success: false, error };\n    }\n};\nconst loadSettings = () => {\n    try {\n        if (!fs__WEBPACK_IMPORTED_MODULE_0___default().existsSync(SETTINGS_PATH)) {\n            const defaultSettings = {\n                theme: 'dark',\n                aiModel: 'gguf-v1',\n                contextLimit: 4096,\n                obsidianVaultPath: ''\n            };\n            saveSettings(defaultSettings);\n            return defaultSettings;\n        }\n        const data = fs__WEBPACK_IMPORTED_MODULE_0___default().readFileSync(SETTINGS_PATH, 'utf-8');\n        return JSON.parse(data);\n    }\n    catch (error) {\n        console.error('Failed to load settings:', error);\n        return null;\n    }\n};\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/settings_manager.ts?\n}");

/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

module.exports = require("electron");

/***/ },

/***/ "pdf-parse"
/*!****************************!*\
  !*** external "pdf-parse" ***!
  \****************************/
(module) {

module.exports = require("pdf-parse");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

module.exports = require("child_process");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main/main.ts");
/******/ 	
/******/ })()
;