"use strict";
const electron = require("electron");
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
electron.contextBridge.exposeInMainWorld("petConfirmAPI", {
  onConfirmationAdd: (callback) => {
    electron.ipcRenderer.on("pet:confirm-add", (_event, data) => callback(data));
  },
  onConfirmationUpdate: (callback) => {
    electron.ipcRenderer.on("pet:confirm-update", (_event, data) => callback(data));
  },
  onConfirmationRemove: (callback) => {
    electron.ipcRenderer.on("pet:confirm-remove", (_event, data) => callback(data));
  },
  onThemeChange: (callback) => {
    electron.ipcRenderer.on("pet:confirm-theme", (_event, theme) => callback(theme));
  },
  respond: (data) => {
    electron.ipcRenderer.send("pet:confirm-respond", data);
  },
  dragStart: () => {
    electron.ipcRenderer.send("pet:confirm-drag-start");
  },
  dragEnd: () => {
    electron.ipcRenderer.send("pet:confirm-drag-end");
  }
});
