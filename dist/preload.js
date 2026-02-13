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

/***/ "./src/main/preload.ts"
/*!*****************************!*\
  !*** ./src/main/preload.ts ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);\n\nelectron__WEBPACK_IMPORTED_MODULE_0__.contextBridge.exposeInMainWorld('electronAPI', {\n    // وظائف المراقبة\n    getSystemStats: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('system:stats'),\n    // وظائف النماذج (Task 2.1)\n    checkModelStatus: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('model:status'),\n    sendMessage: (message, model) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('chat:send', message, model),\n    // وظائف التصدير (Task 5.1 & 3.1)\n    exportChat: (session, vaultPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('export:chat', session, vaultPath),\n    exportAudit: (data, vaultPath) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('export:audit', data, vaultPath),\n    // المعاينة\n    openExternal: (url) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('open-external', url),\n    // الإعدادات (Task 1.1)\n    saveSettings: (settings) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:save', settings),\n    loadSettings: () => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('settings:load'),\n    // نظام السجلات (Task 1.2)\n    logMetrics: (entry) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('metrics:add', entry),\n    getRecentMetrics: (limit) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.invoke('metrics:get-recent', limit),\n    // المعاينة البصرية (Task 3.2)\n    onInspected: (callback) => electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.on('element:inspected', callback)\n});\n\n\n//# sourceURL=webpack://local-ai-studio/./src/main/preload.ts?\n}");

/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

module.exports = require("electron");

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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main/preload.ts");
/******/ 	
/******/ })()
;