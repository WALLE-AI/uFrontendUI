"use strict";
const electron = require("electron");
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const ADAPTER_BRIDGE_EVENT_KEY = "office-ai-bridge-adapter";
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
electron.contextBridge.exposeInMainWorld("electronAPI", {
  emit: (name, data) => {
    return electron.ipcRenderer.invoke(
      ADAPTER_BRIDGE_EVENT_KEY,
      JSON.stringify({
        name,
        data
      })
    ).catch((error) => {
      console.error("IPC invoke error:", error);
      throw error;
    });
  },
  on: (callback) => {
    const handler = (event, value) => {
      callback({ event, value });
    };
    electron.ipcRenderer.on(ADAPTER_BRIDGE_EVENT_KEY, handler);
    return () => {
      electron.ipcRenderer.off(ADAPTER_BRIDGE_EVENT_KEY, handler);
    };
  },
  // 获取拖拽文件/目录的绝对路径 / Get absolute path for dragged file/directory
  getPathForFile: (file) => electron.webUtils.getPathForFile(file),
  // Feedback: collect and compress recent log files
  collectFeedbackLogs: () => electron.ipcRenderer.invoke("feedback:collect-logs"),
  // Feedback: capture a screenshot of the current window
  captureFeedbackScreenshot: () => electron.ipcRenderer.invoke("feedback:capture-screenshot"),
  // Feedback: forward diagnostics logs to the main process console
  logFeedbackEvent: (payload) => electron.ipcRenderer.send("feedback:renderer-log", payload),
  recoverCorruptedDatabase: () => electron.ipcRenderer.invoke("backend:recover-corrupted-database")
});
const backendPort = electron.ipcRenderer.sendSync("get-backend-port");
const initialLanguage = electron.ipcRenderer.sendSync("get-initial-language");
const backendStartupFailed = electron.ipcRenderer.sendSync("get-backend-startup-failed");
const backendStartupFailure = electron.ipcRenderer.sendSync("get-backend-startup-failure");
electron.contextBridge.exposeInMainWorld("__backendPort", backendPort > 0 ? backendPort : 0);
electron.contextBridge.exposeInMainWorld("__initialLanguage", initialLanguage ?? null);
electron.contextBridge.exposeInMainWorld("__ubidbuddyE2ETest", process.env.UBIDBUDDY_E2E_TEST === "1");
electron.contextBridge.exposeInMainWorld("__backendStartupFailed", backendStartupFailed === true);
electron.contextBridge.exposeInMainWorld("__backendStartupFailure", backendStartupFailure ?? null);
electron.contextBridge.exposeInMainWorld("__backendStartupBridge", {
  getState: () => electron.ipcRenderer.sendSync("get-backend-startup-failure"),
  subscribe: (callback) => {
    const handler = (_event, value) => callback(value);
    electron.ipcRenderer.on("backend-startup-state", handler);
    return () => {
      electron.ipcRenderer.off("backend-startup-state", handler);
    };
  }
});
const trayEvents = [
  "tray:navigate-to-guid",
  "tray:navigate-to-conversation",
  "tray:open-about",
  "tray:pause-all-tasks",
  "tray:check-update"
];
for (const channel of trayEvents) {
  electron.ipcRenderer.on(channel, (_event, ...args) => {
    window.dispatchEvent(new CustomEvent(channel, { detail: args[0] }));
  });
}
