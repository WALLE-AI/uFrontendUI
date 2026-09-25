"use strict";
const electron = require("electron");
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
electron.contextBridge.exposeInMainWorld("petAPI", {
  onStateChange: (cb) => {
    electron.ipcRenderer.on("pet:state-changed", (_e, state) => cb(state));
  },
  onEyeMove: (cb) => {
    electron.ipcRenderer.on("pet:eye-move", (_e, data) => cb(data));
  },
  onResize: (cb) => {
    electron.ipcRenderer.on("pet:resize", (_e, size) => cb(size));
  }
});
