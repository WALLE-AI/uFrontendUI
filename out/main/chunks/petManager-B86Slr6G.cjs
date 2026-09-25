"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const path = require("node:path");
const require$$0 = require("electron");
const index = require("../index.cjs");
const i18n = require("i18next");
require("fs");
require("path");
require("os");
require("child_process");
require("electron-log/main");
require("node:fs");
require("node:process");
require("assert");
require("events");
require("buffer");
require("stream");
require("util");
require("node:os");
require("eventemitter3");
require("fs/promises");
require("electron-log");
require("js-yaml");
require("semver");
require("electron-updater");
require("electron-updater/out/providers/Provider");
require("builder-util-runtime");
require("electron-updater/out/providers/GenericProvider");
require("electron-updater/out/util");
require("node:fs/promises");
require("node:zlib");
require("node:child_process");
require("electron-squirrel-startup");
const STATE_PRIORITY = {
  dragging: 10,
  error: 8,
  notification: 7,
  sweeping: 6,
  done: 5,
  happy: 5,
  attention: 5,
  carrying: 4,
  juggling: 4,
  building: 4,
  working: 3,
  thinking: 2,
  waking: 2,
  "poke-left": 2,
  "poke-right": 2,
  idle: 1,
  "random-look": 1,
  "random-read": 1,
  yawning: 0,
  dozing: 0,
  sleeping: 0
};
const MIN_DISPLAY_MS = {
  done: 3500,
  happy: 3e3,
  error: 5e3,
  attention: 3e3,
  notification: 2500,
  "poke-left": 2500,
  "poke-right": 2500,
  waking: 1500,
  sweeping: 5e3,
  building: 4e3,
  juggling: 4e3,
  carrying: 3e3,
  "random-look": 4e3,
  "random-read": 6e3,
  yawning: 3e3,
  thinking: 1e3,
  working: 1e3
};
const AUTO_RETURN = {
  done: { target: "idle", delayMs: 4e3 },
  happy: { target: "idle", delayMs: 4e3 },
  error: { target: "idle", delayMs: 5e3 },
  attention: { target: "idle", delayMs: 3e3 },
  notification: { target: "idle", delayMs: 3500 },
  "poke-left": { target: "idle", delayMs: 2500 },
  "poke-right": { target: "idle", delayMs: 2500 },
  waking: { target: "idle", delayMs: 1500 },
  sweeping: { target: "idle", delayMs: 5500 },
  building: { target: "idle", delayMs: 5e3 },
  juggling: { target: "idle", delayMs: 5e3 },
  carrying: { target: "idle", delayMs: 4e3 },
  "random-look": { target: "idle", delayMs: 6e3 },
  "random-read": { target: "idle", delayMs: 8e3 },
  yawning: { target: "dozing", delayMs: 3500 }
};
class PetStateMachine {
  current = "idle";
  changedAt = Date.now();
  listeners = [];
  autoReturnTimer = null;
  pendingState = null;
  pendingTimer = null;
  dnd = false;
  getCurrentState() {
    return this.current;
  }
  setDnd(enabled) {
    this.dnd = enabled;
    if (enabled) {
      this.clearPending();
      this.clearAutoReturn();
    }
  }
  getDnd() {
    return this.dnd;
  }
  requestState(state) {
    if (this.dnd && state !== "dragging") return null;
    if (state === this.current) return null;
    const newPri = STATE_PRIORITY[state];
    const curPri = STATE_PRIORITY[this.current];
    if (newPri > curPri) {
      this.applyState(state);
      return state;
    }
    if (newPri < curPri) {
      const SLEEP_STATES2 = ["yawning", "dozing", "sleeping"];
      const IDLE_STATES = ["idle", "random-look", "random-read"];
      if (IDLE_STATES.includes(this.current) && SLEEP_STATES2.includes(state)) {
        this.applyState(state);
        return state;
      }
      return null;
    }
    const minMs = MIN_DISPLAY_MS[this.current] ?? 0;
    const elapsed = Date.now() - this.changedAt;
    const remaining = minMs - elapsed;
    if (remaining > 0) {
      this.clearPending();
      this.pendingState = state;
      this.pendingTimer = setTimeout(() => {
        if (this.pendingState) {
          this.applyState(this.pendingState);
          this.pendingState = null;
          this.pendingTimer = null;
        }
      }, remaining);
      return null;
    }
    this.applyState(state);
    return state;
  }
  forceState(state) {
    this.clearPending();
    this.clearAutoReturn();
    this.applyState(state);
  }
  onStateChange(cb) {
    this.listeners.push(cb);
  }
  offStateChange(cb) {
    const idx = this.listeners.indexOf(cb);
    if (idx >= 0) this.listeners.splice(idx, 1);
  }
  dispose() {
    this.clearPending();
    this.clearAutoReturn();
    this.listeners.length = 0;
  }
  applyState(state) {
    const prev = this.current;
    this.current = state;
    this.changedAt = Date.now();
    this.clearPending();
    this.clearAutoReturn();
    const ar = AUTO_RETURN[state];
    if (ar) {
      this.autoReturnTimer = setTimeout(() => {
        this.autoReturnTimer = null;
        this.applyState(ar.target);
      }, ar.delayMs);
    }
    for (const cb of this.listeners) {
      try {
        cb(state, prev);
      } catch {
      }
    }
  }
  clearPending() {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
      this.pendingState = null;
    }
  }
  clearAutoReturn() {
    if (this.autoReturnTimer) {
      clearTimeout(this.autoReturnTimer);
      this.autoReturnTimer = null;
    }
  }
}
const TICK_INTERVAL = 50;
const RANDOM_IDLE_TIMEOUT = 2e4;
const YAWN_TIMEOUT = 6e4;
const DEEP_SLEEP_TIMEOUT = 6e5;
const AI_DRIVEN_STATES = /* @__PURE__ */ new Set([
  "working",
  "thinking",
  "error",
  "notification",
  "happy",
  "sweeping",
  "building",
  "juggling",
  "carrying",
  "waking",
  "attention",
  "dragging"
]);
const SLEEP_STATES = /* @__PURE__ */ new Set(["sleeping", "dozing", "yawning"]);
class PetIdleTicker {
  constructor(sm) {
    this.sm = sm;
  }
  interval = null;
  lastCursorX = 0;
  lastCursorY = 0;
  mouseStillSince = Date.now();
  randomIdlePlayed = false;
  yawnTriggered = false;
  eyeMoveCallback = null;
  petBounds = { x: 0, y: 0, width: 280, height: 280 };
  lastEyeDx = 0;
  lastEyeDy = 0;
  start() {
    if (this.interval) return;
    const cursor = require$$0.screen.getCursorScreenPoint();
    this.lastCursorX = cursor.x;
    this.lastCursorY = cursor.y;
    this.mouseStillSince = Date.now();
    this.interval = setInterval(() => this.tick(), TICK_INTERVAL);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  resetIdle() {
    this.mouseStillSince = Date.now();
    this.randomIdlePlayed = false;
    this.yawnTriggered = false;
  }
  setPetBounds(x, y, width, height) {
    this.petBounds = { x, y, width, height };
  }
  onEyeMove(cb) {
    this.eyeMoveCallback = cb;
  }
  tick() {
    try {
      const cursor = require$$0.screen.getCursorScreenPoint();
      const moved = cursor.x !== this.lastCursorX || cursor.y !== this.lastCursorY;
      if (moved) {
        this.lastCursorX = cursor.x;
        this.lastCursorY = cursor.y;
        this.mouseStillSince = Date.now();
        this.randomIdlePlayed = false;
        this.yawnTriggered = false;
        if (SLEEP_STATES.has(this.sm.getCurrentState())) {
          this.sm.requestState("waking");
        }
      }
      const currentState = this.sm.getCurrentState();
      if (currentState === "idle" && this.eyeMoveCallback) {
        this.computeEyeTracking(cursor.x, cursor.y);
      }
      if (AI_DRIVEN_STATES.has(currentState)) return;
      const idleMs = Date.now() - this.mouseStillSince;
      if (idleMs >= RANDOM_IDLE_TIMEOUT && !this.randomIdlePlayed && currentState === "idle") {
        this.randomIdlePlayed = true;
        const pick = Math.random() < 0.5 ? "random-look" : "random-read";
        this.sm.requestState(pick);
      }
      if (idleMs >= YAWN_TIMEOUT && !this.yawnTriggered) {
        this.yawnTriggered = true;
        this.sm.requestState("yawning");
      }
      if (idleMs >= DEEP_SLEEP_TIMEOUT && currentState === "dozing") {
        this.sm.requestState("sleeping");
      }
    } catch {
    }
  }
  computeEyeTracking(cursorX, cursorY) {
    const centerX = this.petBounds.x + this.petBounds.width * 0.5;
    const centerY = this.petBounds.y + this.petBounds.height * 0.4;
    const relX = cursorX - centerX;
    const relY = cursorY - centerY;
    const dist = Math.sqrt(relX * relX + relY * relY);
    const MAX_X = 3;
    const MAX_UP = 1.3;
    const MAX_DOWN = 1;
    const RANGE = 300;
    let eyeDx = 0;
    let eyeDy = 0;
    if (dist > 1) {
      const s = Math.min(1, dist / RANGE);
      eyeDx = Math.round(relX / dist * MAX_X * s * 2) / 2;
      const rawDy = relY / dist * MAX_UP * s;
      eyeDy = Math.round(Math.min(MAX_DOWN, Math.max(-MAX_UP, rawDy)) * 2) / 2;
    }
    if (eyeDx !== this.lastEyeDx || eyeDy !== this.lastEyeDy) {
      this.lastEyeDx = eyeDx;
      this.lastEyeDy = eyeDy;
      this.eyeMoveCallback({
        eyeDx,
        eyeDy,
        bodyDx: eyeDx * 0.35,
        bodyRotate: eyeDx * 0.6
      });
    }
  }
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const STREAM_CHANNELS = /* @__PURE__ */ new Set(["chat.response.stream", "openclaw.response.stream"]);
class PetEventBridge {
  constructor(sm, ticker) {
    this.sm = sm;
    this.ticker = ticker;
  }
  disposed = false;
  handleBridgeMessage(channelName, data) {
    if (this.disposed) return;
    if (!STREAM_CHANNELS.has(channelName)) return;
    const msg = data;
    if (!msg?.type) return;
    let targetState = null;
    switch (msg.type) {
      case "thinking":
      case "thought":
        targetState = "thinking";
        break;
      case "text":
      case "content":
        targetState = "working";
        break;
      case "finish":
        targetState = "done";
        break;
      case "error":
        targetState = "error";
        break;
    }
    if (targetState) {
      this.ticker.resetIdle();
      this.sm.requestState(targetState);
    }
  }
  handleUserSendMessage() {
    if (this.disposed) return;
    this.ticker.resetIdle();
    this.sm.requestState("thinking");
  }
  handleTurnCompleted() {
    if (this.disposed) return;
    this.ticker.resetIdle();
    this.sm.requestState("done");
  }
  handleConfirmationAdd() {
    if (this.disposed) return;
    this.ticker.resetIdle();
    this.sm.requestState("notification");
  }
  dispose() {
    this.disposed = true;
  }
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
path.join(__dirname, "..", "..", "preload");
path.join(__dirname, "..", "..", "renderer", "pet");
let confirmWindow = null;
let currentConfirmations = /* @__PURE__ */ new Map();
function initPetConfirmManager(bounds) {
  unregisterIpcHandlers$1();
  registerIpcHandlers$1();
}
function destroyPetConfirmManager() {
  unregisterIpcHandlers$1();
  destroyConfirmWindow();
  currentConfirmations.clear();
}
function destroyConfirmWindow() {
  if (confirmWindow && !confirmWindow.isDestroyed()) {
    confirmWindow.destroy();
  }
  confirmWindow = null;
  console.log("[PetConfirm] Confirm window destroyed");
}
function registerIpcHandlers$1() {
  let confirmDragOffsetX = 0;
  let confirmDragOffsetY = 0;
  let confirmDragTimer = null;
  require$$0.ipcMain.on("pet:confirm-drag-start", () => {
    if (!confirmWindow || confirmWindow.isDestroyed()) return;
    if (confirmDragTimer) {
      clearInterval(confirmDragTimer);
      confirmDragTimer = null;
    }
    const cursor = require$$0.screen.getCursorScreenPoint();
    const [wx, wy] = confirmWindow.getPosition();
    confirmDragOffsetX = cursor.x - wx;
    confirmDragOffsetY = cursor.y - wy;
    confirmDragTimer = setInterval(() => {
      if (!confirmWindow || confirmWindow.isDestroyed()) {
        if (confirmDragTimer) clearInterval(confirmDragTimer);
        confirmDragTimer = null;
        return;
      }
      const cur = require$$0.screen.getCursorScreenPoint();
      confirmWindow.setPosition(cur.x - confirmDragOffsetX, cur.y - confirmDragOffsetY, false);
    }, 16);
  });
  require$$0.ipcMain.on("pet:confirm-drag-end", () => {
    if (confirmDragTimer) {
      clearInterval(confirmDragTimer);
      confirmDragTimer = null;
    }
    if (confirmWindow && !confirmWindow.isDestroyed()) {
      const [px, py] = confirmWindow.getPosition();
    }
  });
  require$$0.ipcMain.on(
    "pet:confirm-respond",
    (_event, data) => {
      console.log("[PetConfirm] Received response:", JSON.stringify(data));
      const confirmation = Array.from(currentConfirmations.values()).find(
        (c) => c.call_id === data.call_id && c.conversation_id === data.conversation_id
      );
      if (confirmation) {
        currentConfirmations.delete(confirmation.id);
        index.conversation.confirmation.remove.emit({
          conversation_id: data.conversation_id,
          id: confirmation.id
        });
      }
      index.conversation.confirmation.confirm.invoke({
        conversation_id: data.conversation_id,
        msg_id: data.msg_id,
        call_id: data.call_id,
        data: data.data
      }).catch((error) => {
        console.error("[PetConfirm] confirmation.confirm.invoke failed:", error);
      });
      if (currentConfirmations.size === 0) {
        destroyConfirmWindow();
      }
    }
  );
}
function unregisterIpcHandlers$1() {
  require$$0.ipcMain.removeAllListeners("pet:confirm-respond");
  require$$0.ipcMain.removeAllListeners("pet:confirm-drag-start");
  require$$0.ipcMain.removeAllListeners("pet:confirm-drag-end");
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function isPetSupported() {
  if (process.platform === "linux") {
    const ozonePlatform = require$$0.app.commandLine.getSwitchValue("ozone-platform");
    if (ozonePlatform === "headless") {
      return false;
    }
  }
  return true;
}
const PRELOAD_DIR = path.join(__dirname, "..", "..", "preload");
const RENDERER_DIR = path.join(__dirname, "..", "..", "renderer", "pet");
let petWindow = null;
let petHitWindow = null;
let stateMachine = null;
let idleTicker = null;
let eventBridge = null;
let currentSize = 280;
let dragTimer = null;
let dragWatchdog = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let preDragState = null;
const DRAG_TICK_MS = 16;
const DRAG_WATCHDOG_MS = 8e3;
const HIT_WATCHDOG_INTERVAL_MS = 250;
const HIT_WATCHDOG_RADIUS_SLACK = 1.2;
let hitIgnoreWatchdog = null;
let lastHitIgnoreState = true;
let confirmBubbleEnabled = true;
const RESTORABLE_STATES = /* @__PURE__ */ new Set(["thinking", "working", "error", "notification"]);
function createPetWindow() {
  if (!isPetSupported()) {
    console.warn("[Pet] Desktop pet is not supported in headless mode");
    return;
  }
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show();
    petWindow.focus();
    return;
  }
  const { x, y } = computeInitialPosition(currentSize);
  petWindow = new require$$0.BrowserWindow({
    width: currentSize,
    height: currentSize,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(PRELOAD_DIR, "petPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.platform === "darwin") {
    petWindow.setAlwaysOnTop(true, "screen-saver");
  } else {
    petWindow.setAlwaysOnTop(true, "pop-up-menu");
  }
  petWindow.setIgnoreMouseEvents(true);
  const hitSize = Math.round(currentSize * 0.6);
  const hitOffset = Math.round(currentSize * 0.2);
  petHitWindow = new require$$0.BrowserWindow({
    width: hitSize,
    height: hitSize,
    x: x + hitOffset,
    y: y + hitOffset,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(PRELOAD_DIR, "petHitPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.platform === "darwin") {
    petHitWindow.setAlwaysOnTop(true, "screen-saver");
  } else {
    petHitWindow.setAlwaysOnTop(true, "pop-up-menu");
  }
  petHitWindow.setIgnoreMouseEvents(true, { forward: true });
  stateMachine = new PetStateMachine();
  idleTicker = new PetIdleTicker(stateMachine);
  eventBridge = new PetEventBridge(stateMachine, idleTicker);
  stateMachine.onStateChange((state) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send("pet:state-changed", state);
    }
  });
  idleTicker.onEyeMove((data) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send("pet:eye-move", data);
    }
  });
  idleTicker.setPetBounds(x, y, currentSize, currentSize);
  index.setPetNotifyHook((name, data) => {
    if (eventBridge) {
      eventBridge.handleBridgeMessage(name, data);
    }
  });
  idleTicker.start();
  registerIpcHandlers();
  startHitIgnoreWatchdog();
  loadContent();
  if (confirmBubbleEnabled) {
    initPetConfirmManager();
  }
  petWindow.on("closed", () => {
    destroyPetWindow();
  });
  console.log("[Pet] Pet windows created");
}
function destroyPetWindow() {
  clearDragTimer();
  stopHitIgnoreWatchdog();
  destroyPetConfirmManager();
  if (eventBridge) {
    eventBridge.dispose();
    eventBridge = null;
  }
  if (idleTicker) {
    idleTicker.stop();
    idleTicker = null;
  }
  if (stateMachine) {
    stateMachine.dispose();
    stateMachine = null;
  }
  index.setPetNotifyHook(null);
  unregisterIpcHandlers();
  if (petHitWindow && !petHitWindow.isDestroyed()) {
    petHitWindow.destroy();
  }
  petHitWindow = null;
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.destroy();
  }
  petWindow = null;
  console.log("[Pet] Pet windows destroyed");
}
function showPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) petWindow.show();
  if (petHitWindow && !petHitWindow.isDestroyed()) petHitWindow.show();
}
function hidePetWindow() {
  if (petWindow && !petWindow.isDestroyed()) petWindow.hide();
  if (petHitWindow && !petHitWindow.isDestroyed()) petHitWindow.hide();
}
function getEventBridge() {
  return eventBridge;
}
function resizePetWindow(size) {
  resizePet(size);
}
function setPetDndMode(dnd) {
  stateMachine?.setDnd(dnd);
}
function setPetConfirmEnabled(enabled) {
  confirmBubbleEnabled = enabled;
  if (!petWindow || petWindow.isDestroyed()) return;
  if (enabled) {
    const [x, y] = petWindow.getPosition();
    initPetConfirmManager();
  }
}
function computeInitialPosition(size) {
  const margin = 20;
  const candidate = require$$0.BrowserWindow.getAllWindows().find(
    (w) => w !== petWindow && w !== petHitWindow && !w.isDestroyed()
  );
  let workArea;
  if (candidate) {
    const [mx, my] = candidate.getPosition();
    const [mw, mh] = candidate.getSize();
    const center = { x: mx + Math.floor(mw / 2), y: my + Math.floor(mh / 2) };
    workArea = require$$0.screen.getDisplayNearestPoint(center).workArea;
  } else {
    workArea = require$$0.screen.getPrimaryDisplay().workArea;
  }
  return {
    x: workArea.x + workArea.width - size - margin,
    y: workArea.y + workArea.height - size - margin
  };
}
function loadContent() {
  if (!petWindow || !petHitWindow) return;
  const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
  if (!require$$0.app.isPackaged && rendererUrl) {
    petWindow.loadURL(`${rendererUrl}/pet/pet.html`).catch((error) => {
      console.error("[Pet] loadURL failed for pet window:", error);
    });
    petHitWindow.loadURL(`${rendererUrl}/pet/pet-hit.html`).catch((error) => {
      console.error("[Pet] loadURL failed for pet-hit window:", error);
    });
  } else {
    petWindow.loadFile(path.join(RENDERER_DIR, "pet.html")).catch((error) => {
      console.error("[Pet] loadFile failed for pet window:", error);
    });
    petHitWindow.loadFile(path.join(RENDERER_DIR, "pet-hit.html")).catch((error) => {
      console.error("[Pet] loadFile failed for pet-hit window:", error);
    });
  }
}
function registerIpcHandlers() {
  require$$0.ipcMain.on("pet:drag-start", () => {
    if (!petWindow || petWindow.isDestroyed() || !petHitWindow || petHitWindow.isDestroyed()) return;
    if (dragTimer || dragWatchdog) {
      endDrag();
    }
    const cursor = require$$0.screen.getCursorScreenPoint();
    const windowPos = petWindow.getPosition();
    dragOffsetX = cursor.x - windowPos[0];
    dragOffsetY = cursor.y - windowPos[1];
    const cur = stateMachine?.getCurrentState();
    preDragState = cur && RESTORABLE_STATES.has(cur) ? cur : null;
    stateMachine?.forceState("dragging");
    dragTimer = setInterval(() => {
      if (!petWindow || petWindow.isDestroyed() || !petHitWindow || petHitWindow.isDestroyed()) {
        endDrag();
        return;
      }
      const cursor2 = require$$0.screen.getCursorScreenPoint();
      const newX = cursor2.x - dragOffsetX;
      const newY = cursor2.y - dragOffsetY;
      petWindow.setPosition(newX, newY, false);
      const hitOffset = Math.round(currentSize * 0.2);
      petHitWindow.setPosition(newX + hitOffset, newY + hitOffset, false);
      idleTicker?.setPetBounds(newX, newY, currentSize, currentSize);
    }, DRAG_TICK_MS);
    dragWatchdog = setTimeout(() => {
      console.warn("[Pet] drag-end not received in", DRAG_WATCHDOG_MS, "ms — force-ending drag");
      endDrag();
      if (petHitWindow && !petHitWindow.isDestroyed()) {
        petHitWindow.webContents.send("pet:hit-reset");
      }
    }, DRAG_WATCHDOG_MS);
  });
  require$$0.ipcMain.on("pet:drag-end", () => {
    endDrag();
  });
  require$$0.ipcMain.on("pet:click", (_event, data) => {
    if (!stateMachine || !idleTicker) return;
    idleTicker.resetIdle();
    if (data.count >= 4) {
      stateMachine.requestState("juggling");
    } else if (data.count >= 2) {
      stateMachine.requestState(data.side === "left" ? "poke-left" : "poke-right");
    } else if (data.count === 1) {
      stateMachine.requestState("attention");
    }
  });
  require$$0.ipcMain.on("pet:context-menu", () => {
    if (!petHitWindow || petHitWindow.isDestroyed()) return;
    const sizeKeys = { 200: "pet.sizeSmall", 280: "pet.sizeMedium", 360: "pet.sizeLarge" };
    const menu = require$$0.Menu.buildFromTemplate([
      {
        label: i18n.t("pet.pat"),
        click: () => {
          if (stateMachine && idleTicker) {
            idleTicker.resetIdle();
            stateMachine.requestState("happy");
          }
        }
      },
      { type: "separator" },
      {
        label: i18n.t("pet.size"),
        submenu: [200, 280, 360].map((size) => ({
          label: i18n.t(sizeKeys[size], { px: size }),
          type: "radio",
          checked: currentSize === size,
          click: () => resizePet(size)
        }))
      },
      { type: "separator" },
      {
        label: i18n.t("pet.dnd"),
        type: "checkbox",
        checked: stateMachine?.getDnd() ?? false,
        click: (menuItem) => {
          stateMachine?.setDnd(menuItem.checked);
        }
      },
      { type: "separator" },
      {
        label: i18n.t("pet.resetPosition"),
        click: () => resetPosition()
      },
      {
        label: i18n.t("pet.hide"),
        click: () => hidePetWindow()
      }
    ]);
    menu.popup({ window: petHitWindow });
  });
  require$$0.ipcMain.on("pet:set-ignore-mouse-events", (_event, ignore, options) => {
    if (!petHitWindow || petHitWindow.isDestroyed()) return;
    petHitWindow.setIgnoreMouseEvents(ignore, options);
    lastHitIgnoreState = ignore;
  });
}
function unregisterIpcHandlers() {
  require$$0.ipcMain.removeAllListeners("pet:drag-start");
  require$$0.ipcMain.removeAllListeners("pet:drag-end");
  require$$0.ipcMain.removeAllListeners("pet:click");
  require$$0.ipcMain.removeAllListeners("pet:context-menu");
  require$$0.ipcMain.removeAllListeners("pet:set-ignore-mouse-events");
}
function applyTransparentResize(win, bounds) {
  if (process.platform !== "win32") {
    win.setBounds(bounds, false);
    return;
  }
  const wasVisible = win.isVisible();
  if (wasVisible) win.hide();
  win.setBounds(bounds, false);
  if (wasVisible) {
    win.showInactive();
  }
}
function clearDragTimer() {
  if (dragTimer) {
    clearInterval(dragTimer);
    dragTimer = null;
  }
  if (dragWatchdog) {
    clearTimeout(dragWatchdog);
    dragWatchdog = null;
  }
}
function endDrag() {
  clearDragTimer();
  const restoreTo = preDragState ?? "idle";
  preDragState = null;
  stateMachine?.forceState(restoreTo);
  idleTicker?.resetIdle();
  if (petWindow && !petWindow.isDestroyed()) {
    const [nx, ny] = petWindow.getPosition();
  }
}
function startHitIgnoreWatchdog() {
  stopHitIgnoreWatchdog();
  hitIgnoreWatchdog = setInterval(() => {
    if (!petHitWindow || petHitWindow.isDestroyed()) return;
    if (dragTimer) return;
    if (lastHitIgnoreState) return;
    const cursor = require$$0.screen.getCursorScreenPoint();
    const [wx, wy] = petHitWindow.getPosition();
    const [ww, wh] = petHitWindow.getSize();
    const cxw = wx + ww / 2;
    const cyw = wy + wh / 2;
    const radius = Math.min(ww, wh) / 2 * HIT_WATCHDOG_RADIUS_SLACK;
    const dx = cursor.x - cxw;
    const dy = cursor.y - cyw;
    if (dx * dx + dy * dy > radius * radius) {
      petHitWindow.setIgnoreMouseEvents(true, { forward: true });
      lastHitIgnoreState = true;
    }
  }, HIT_WATCHDOG_INTERVAL_MS);
}
function stopHitIgnoreWatchdog() {
  if (hitIgnoreWatchdog) {
    clearInterval(hitIgnoreWatchdog);
    hitIgnoreWatchdog = null;
  }
  lastHitIgnoreState = true;
}
function resizePet(size) {
  if (!petWindow || petWindow.isDestroyed() || !petHitWindow || petHitWindow.isDestroyed()) return;
  if (dragTimer) {
    endDrag();
  }
  currentSize = size;
  const [x, y] = petWindow.getPosition();
  applyTransparentResize(petWindow, { x, y, width: size, height: size });
  const hitSize = Math.round(size * 0.6);
  const hitOffset = Math.round(size * 0.2);
  applyTransparentResize(petHitWindow, {
    x: x + hitOffset,
    y: y + hitOffset,
    width: hitSize,
    height: hitSize
  });
  idleTicker?.setPetBounds(x, y, size, size);
  if (!petWindow.isDestroyed()) {
    petWindow.webContents.send("pet:resize", size);
  }
  if (!petHitWindow.isDestroyed()) {
    petHitWindow.webContents.send("pet:hit-reset");
  }
}
function resetPosition() {
  if (!petWindow || petWindow.isDestroyed() || !petHitWindow || petHitWindow.isDestroyed()) return;
  const { x, y } = computeInitialPosition(currentSize);
  petWindow.setPosition(x, y, false);
  const hitOffset = Math.round(currentSize * 0.2);
  petHitWindow.setPosition(x + hitOffset, y + hitOffset, false);
  idleTicker?.setPetBounds(x, y, currentSize, currentSize);
}
exports.createPetWindow = createPetWindow;
exports.destroyPetWindow = destroyPetWindow;
exports.getEventBridge = getEventBridge;
exports.hidePetWindow = hidePetWindow;
exports.isPetSupported = isPetSupported;
exports.resizePetWindow = resizePetWindow;
exports.setPetConfirmEnabled = setPetConfirmEnabled;
exports.setPetDndMode = setPetDndMode;
exports.showPetWindow = showPetWindow;
