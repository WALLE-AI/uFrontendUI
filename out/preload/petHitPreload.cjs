"use strict";
const electron = require("electron");
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
electron.contextBridge.exposeInMainWorld("petHitAPI", {
  dragStart: () => electron.ipcRenderer.send("pet:drag-start"),
  dragEnd: () => electron.ipcRenderer.send("pet:drag-end"),
  click: (data) => electron.ipcRenderer.send("pet:click", data),
  contextMenu: () => electron.ipcRenderer.send("pet:context-menu"),
  setIgnoreMouseEvents: (ignore, options) => electron.ipcRenderer.send("pet:set-ignore-mouse-events", ignore, options),
  onHitReset: (cb) => {
    electron.ipcRenderer.on("pet:hit-reset", () => cb());
  }
});
