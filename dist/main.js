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

/***/ "./src/main/main.ts"
/*!**************************!*\
  !*** ./src/main/main.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _model_manager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./model_manager */ \"./src/main/model_manager.ts\");\n/* harmony import */ var _session_manager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./session_manager */ \"./src/main/session_manager.ts\");\n/* harmony import */ var _obsidian_exporter__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./obsidian_exporter */ \"./src/main/obsidian_exporter.ts\");\n\n\n\n\n\nclass MainApp {\n    mainWindow = null;\n    modelManager = new _model_manager__WEBPACK_IMPORTED_MODULE_2__.ModelManager();\n    sessionManager = new _session_manager__WEBPACK_IMPORTED_MODULE_3__.SessionManager();\n    exporter = new _obsidian_exporter__WEBPACK_IMPORTED_MODULE_4__.ObsidianExporter();\n    constructor() {\n        electron__WEBPACK_IMPORTED_MODULE_0__.app.on('ready', () => this.createWindow());\n        this.setupIpc();\n    }\n    createWindow() {\n        this.mainWindow = new electron__WEBPACK_IMPORTED_MODULE_0__.BrowserWindow({\n            width: 1200,\n            height: 800,\n            webPreferences: {\n                preload: path__WEBPACK_IMPORTED_MODULE_1___default().join(__dirname, 'preload.js'),\n                contextIsolation: true,\n                nodeIntegration: false\n            },\n            backgroundColor: '#09090b',\n            frame: false // للحصول على واجهة عصرية\n        });\n        this.mainWindow.loadFile('index.html');\n    }\n    setupIpc() {\n        // إدارة النماذج\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('model:status', () => this.modelManager.getStatus());\n        // التصدير لـ Obsidian\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('export:obsidian', async (event, data) => {\n            return await this.exporter.exportToMarkdown(data);\n        });\n        // فتح الروابط الخارجية\n        electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle('open-external', (event, url) => {\n            electron__WEBPACK_IMPORTED_MODULE_0__.shell.openExternal(url);\n        });\n    }\n}\nnew MainApp();\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/main.ts?\n}");

/***/ },

/***/ "./src/main/model_manager.ts"
/*!***********************************!*\
  !*** ./src/main/model_manager.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ModelManager: () => (/* binding */ ModelManager)\n/* harmony export */ });\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! child_process */ \"child_process\");\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(child_process__WEBPACK_IMPORTED_MODULE_0__);\n\nclass ModelManager {\n    // التحقق من حالة النموذج المحلي (Ollama مثلاً)\n    async getStatus() {\n        return new Promise((resolve) => {\n            (0,child_process__WEBPACK_IMPORTED_MODULE_0__.exec)('ollama list', (error, stdout) => {\n                if (error) {\n                    resolve({ active: false, models: [] });\n                }\n                else {\n                    resolve({ active: true, raw: stdout });\n                }\n            });\n        });\n    }\n    async loadModel(modelName) {\n        // منطق تحميل النموذج في الذاكرة\n        console.log(`Loading model: ${modelName}`);\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/model_manager.ts?\n}");

/***/ },

/***/ "./src/main/obsidian_exporter.ts"
/*!***************************************!*\
  !*** ./src/main/obsidian_exporter.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ObsidianExporter: () => (/* binding */ ObsidianExporter)\n/* harmony export */ });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nclass ObsidianExporter {\n    async exportToMarkdown(data) {\n        const fileName = `AI-Audit-${Date.now()}.md`;\n        const desktopPath = electron__WEBPACK_IMPORTED_MODULE_2__.app.getPath('desktop');\n        const filePath = path__WEBPACK_IMPORTED_MODULE_1___default().join(desktopPath, fileName);\n        const content = `---\r\ntype: audit\r\ndate: ${new Date().toISOString()}\r\n---\r\n# تقرير أداء النظام\r\n\r\n- CPU: ${data.cpuUsage}%\r\n- RAM: ${data.ramPercentage}%\r\n- Security: Secure (Offline)\r\n\r\nGenerated by LocalAI Studio.`;\n        fs__WEBPACK_IMPORTED_MODULE_0___default().writeFileSync(filePath, content, 'utf8');\n        return filePath;\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/obsidian_exporter.ts?\n}");

/***/ },

/***/ "./src/main/session_manager.ts"
/*!*************************************!*\
  !*** ./src/main/session_manager.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SessionManager: () => (/* binding */ SessionManager)\n/* harmony export */ });\nclass SessionManager {\n    currentSessionId = null;\n    startSession() {\n        this.currentSessionId = `session_${Date.now()}`;\n        console.log(\"New Private Session Started\");\n    }\n    clearSessionData() {\n        // مسح الذاكرة المؤقتة لضمان الخصوصية\n        this.currentSessionId = null;\n    }\n}\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/session_manager.ts?\n}");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

module.exports = require("child_process");

/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

module.exports = require("electron");

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