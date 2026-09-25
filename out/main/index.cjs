"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require$$0$1 = require("electron");
const fs$1 = require("fs");
const path = require("path");
const os = require("os");
const require$$0 = require("child_process");
const log = require("electron-log/main");
const fs$2 = require("node:fs");
const path$1 = require("node:path");
const process$1 = require("node:process");
const require$$0$2 = require("assert");
const require$$2 = require("events");
const require$$0$4 = require("buffer");
const require$$0$3 = require("stream");
const require$$2$1 = require("util");
const node_os = require("node:os");
const EventEmitter = require("eventemitter3");
const fs$3 = require("fs/promises");
const log$1 = require("electron-log");
require("js-yaml");
const semver = require("semver");
const electronUpdater = require("electron-updater");
const Provider = require("electron-updater/out/providers/Provider");
const builderUtilRuntime = require("builder-util-runtime");
const GenericProvider = require("electron-updater/out/providers/GenericProvider");
const util = require("electron-updater/out/util");
require("node:fs/promises");
const i18n = require("i18next");
const zlib = require("node:zlib");
const node_child_process = require("node:child_process");
const electronSquirrelStartup = require("electron-squirrel-startup");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs$1);
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace$1 = /* @__PURE__ */ _interopNamespaceDefault(fs$2);
const path__namespace$1 = /* @__PURE__ */ _interopNamespaceDefault(path$1);
const zlib__namespace = /* @__PURE__ */ _interopNamespaceDefault(zlib);
class NodeWorkerProcess {
  constructor(cp) {
    this.cp = cp;
  }
  postMessage(message) {
    this.cp.send(message);
  }
  on(event, handler) {
    this.cp.on(event, handler);
    return this;
  }
  kill() {
    this.cp.kill();
  }
}
const _pkg = (() => {
  try {
    return JSON.parse(fs$1.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  } catch {
    return { name: "ubidbuddy", version: "0.0.0" };
  }
})();
class NodePlatformServices {
  paths = {
    getDataDir: () => process.env.DATA_DIR ?? path.join(os.homedir(), ".ubidbuddy-server"),
    getTempDir: () => os.tmpdir(),
    getHomeDir: () => os.homedir(),
    getLogsDir: () => process.env.LOGS_DIR ?? path.join(os.homedir(), ".ubidbuddy-server", "logs"),
    getAppPath: () => process.cwd(),
    isPackaged: () => process.env.IS_PACKAGED === "true",
    getSystemPath: (_name) => null,
    getName: () => _pkg.name ?? "ubidbuddy",
    getVersion: () => _pkg.version ?? "0.0.0",
    needsCliSafeSymlinks: () => false
  };
  worker = {
    fork: (modulePath, args2, opts) => new NodeWorkerProcess(
      require$$0.fork(modulePath, args2, {
        cwd: opts.cwd,
        env: opts.env,
        // Enables V8 structured clone (supports Buffer, Map, Set).
        // ArrayBuffer ownership transfer is not supported — acceptable
        // because current IForkData messages contain no Transferables.
        serialization: "advanced"
      })
    )
  };
  power = {
    preventSleep: () => null,
    allowSleep: (_id) => {
    },
    preventDisplaySleep: () => null
  };
  notification = {
    send: (_opts) => {
    }
  };
  network = {
    fetch: (input, init) => fetch(input, init)
  };
}
let _services = null;
function getDevAppName() {
  const isMultiInstance = process.env.UBIDBUDDY_MULTI_INSTANCE === "1";
  return isMultiInstance ? "uBidBuddy-Dev-2" : "uBidBuddy-Dev";
}
function registerPlatformServices(services) {
  _services = services;
}
function getPlatformServices() {
  if (!_services) {
    if (process.versions?.electron) {
      const processType = process.type;
      if (processType !== "browser") {
        _services = new NodePlatformServices();
      } else {
        const { app, net } = require("electron");
        if (!app.isPackaged) {
          const devAppName = getDevAppName();
          app.setName(devAppName);
          app.setPath("userData", path.join(path.dirname(app.getPath("userData")), devAppName));
        }
        const paths = {
          getDataDir: () => app.getPath("userData"),
          getTempDir: () => app.getPath("temp"),
          getHomeDir: () => app.getPath("home"),
          getLogsDir: () => {
            try {
              return app.getPath("logs");
            } catch {
              return path.join(app.getPath("userData"), "logs");
            }
          },
          getAppPath: () => app.getAppPath(),
          isPackaged: () => app.isPackaged,
          getSystemPath: (name2) => app.getPath(name2),
          getName: () => app.getName(),
          getVersion: () => app.getVersion(),
          needsCliSafeSymlinks: () => process.platform === "darwin"
        };
        _services = {
          paths,
          worker: {
            fork: () => {
              throw new Error("[Platform] Worker not available before registerPlatformServices()");
            }
          },
          power: { preventSleep: () => null, allowSleep: () => {
          }, preventDisplaySleep: () => null },
          notification: { send: () => {
          } },
          network: {
            fetch: (input, init) => net.fetch(input instanceof URL ? input.toString() : input, init)
          }
        };
      }
    } else {
      throw new Error(
        "[Platform] Services not registered. Call registerPlatformServices() before using platform APIs."
      );
    }
  }
  return _services;
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const GPU_CONFIG_FILE = "gpu.config.json";
const GPU_CRASH_THRESHOLD = 3;
const GPU_CRASH_RESET_MS = 24 * 60 * 60 * 1e3;
function getConfigPath$1() {
  return path__namespace.join(require$$0$1.app.getPath("userData"), GPU_CONFIG_FILE);
}
function readConfig() {
  try {
    const p = getConfigPath$1();
    if (!fs__namespace.existsSync(p)) return {};
    const raw = fs__namespace.readFileSync(p, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeConfig(cfg) {
  try {
    fs__namespace.writeFileSync(getConfigPath$1(), JSON.stringify(cfg, null, 2), "utf-8");
  } catch (err) {
    console.warn("[GPU] Failed to write gpu config:", err);
  }
}
function applyGpuRecoveryFlags() {
  const cfg = readConfig();
  if (cfg.userOverride === "force-off") {
    require$$0$1.app.disableHardwareAcceleration();
    console.log("[GPU] hardware acceleration disabled (user override)");
    return;
  }
  if (cfg.userOverride === "force-on") {
    return;
  }
  if (cfg.lastCrashAt && Date.now() - cfg.lastCrashAt > GPU_CRASH_RESET_MS) {
    if (cfg.disableHardwareAcceleration || (cfg.crashCount ?? 0) > 0) {
      writeConfig({ ...cfg, crashCount: 0, disableHardwareAcceleration: false });
      console.log("[GPU] crash counter reset (no recent GPU crashes)");
    }
    return;
  }
  if (cfg.disableHardwareAcceleration) {
    require$$0$1.app.disableHardwareAcceleration();
    console.log(`[GPU] hardware acceleration disabled (auto, after ${cfg.crashCount ?? 0} consecutive GPU crashes)`);
  }
}
function installGpuCrashHandler() {
  require$$0$1.app.on("child-process-gone", (_event, details) => {
    if (details.type !== "GPU") return;
    const cfg = readConfig();
    const nextCount = (cfg.crashCount ?? 0) + 1;
    const next = {
      ...cfg,
      crashCount: nextCount,
      lastCrashAt: Date.now()
    };
    if (nextCount >= GPU_CRASH_THRESHOLD && cfg.userOverride !== "force-on") {
      next.disableHardwareAcceleration = true;
      console.warn(
        `[GPU] crashed ${nextCount} times (reason=${details.reason}, exitCode=${details.exitCode}); hardware acceleration will be disabled on next launch.`
      );
    } else {
      console.warn(
        `[GPU] crashed ${nextCount}/${GPU_CRASH_THRESHOLD} (reason=${details.reason}, exitCode=${details.exitCode})`
      );
    }
    writeConfig(next);
  });
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const e2eUserDataDir = process.env.UBIDBUDDY_E2E_TEST === "1" ? process.env.UBIDBUDDY_E2E_USER_DATA_DIR : void 0;
if (e2eUserDataDir && e2eUserDataDir.trim() !== "") {
  fs__namespace.mkdirSync(e2eUserDataDir, { recursive: true });
  require$$0$1.app.setPath("userData", e2eUserDataDir);
}
if (!require$$0$1.app.isPackaged && !e2eUserDataDir) {
  const devAppName = getDevAppName();
  require$$0$1.app.setName(devAppName);
  const appSupportDir = path__namespace.dirname(require$$0$1.app.getPath("userData"));
  require$$0$1.app.setPath("userData", path__namespace.join(appSupportDir, devAppName));
}
applyGpuRecoveryFlags();
const isWebUI = process.argv.some((arg) => arg === "--webui");
const isResetPassword = process.argv.includes("--resetpass");
if (isWebUI || isResetPassword) {
  if (process.platform === "linux") {
    require$$0$1.app.commandLine.appendSwitch("ozone-platform", "headless");
    require$$0$1.app.commandLine.appendSwitch("disable-gpu");
    require$$0$1.app.commandLine.appendSwitch("disable-software-rasterizer");
  }
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    require$$0$1.app.commandLine.appendSwitch("no-sandbox");
  }
}
const CDP_CONFIG_FILE = "cdp.config.json";
function removeLegacyCdpRegistryFile() {
  try {
    const legacyRegistry = path__namespace.join(os.homedir(), ".ubidbuddy-cdp-registry.json");
    if (fs__namespace.existsSync(legacyRegistry)) {
      fs__namespace.unlinkSync(legacyRegistry);
    }
  } catch {
  }
}
function loadCdpConfig() {
  try {
    const userDataPath = require$$0$1.app.getPath("userData");
    const configPath = path__namespace.join(userDataPath, CDP_CONFIG_FILE);
    if (!fs__namespace.existsSync(configPath)) {
      return {};
    }
    const raw = fs__namespace.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
  }
  return {};
}
function shouldEnableCdp(config) {
  const envVal = process.env.UBIDBUDDY_CDP_PORT;
  if (envVal === "0" || envVal === "false") return false;
  if (envVal) return true;
  if (config.enabled !== void 0) {
    return config.enabled;
  }
  return true;
}
let cdpStartupEnabled = false;
const cdpConfig = loadCdpConfig();
cdpStartupEnabled = shouldEnableCdp(cdpConfig);
if (cdpStartupEnabled) {
  console.log("[CDP] Agent browser control enabled (single-target bridge)");
} else {
  console.log("[CDP] Agent browser control disabled");
}
removeLegacyCdpRegistryFile();
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const MAX_MESSAGE_LENGTH = 1e3;
const MAX_STACK_LENGTH = 4e3;
const TRUNCATION_SUFFIX = "... (truncated)";
function truncate(text, limit) {
  return text.length <= limit ? text : `${text.slice(0, limit)}${TRUNCATION_SUFFIX}`;
}
function readProperty(value, key) {
  if (value === null || typeof value !== "object" && typeof value !== "function") return void 0;
  try {
    return value[key];
  } catch {
    return void 0;
  }
}
function readString(value, key) {
  const raw = readProperty(value, key);
  if (typeof raw === "string") return raw.length > 0 ? raw : void 0;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return void 0;
}
function readNumber(value, key) {
  const raw = readProperty(value, key);
  return typeof raw === "number" && Number.isFinite(raw) ? raw : void 0;
}
function describeValueType(value) {
  if (value === null) return "null";
  if (value instanceof Error) return "Error";
  return typeof value;
}
function describeMessage(value) {
  if (typeof value === "string") return value;
  const message = readString(value, "message");
  if (message !== void 0) return message;
  if (value === null) return "null";
  if (value === void 0) return "undefined";
  const valueType = typeof value;
  if (valueType === "number" || valueType === "boolean" || valueType === "bigint" || valueType === "symbol") {
    try {
      return String(value);
    } catch {
      return `[unserializable ${valueType}]`;
    }
  }
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return `[unserializable ${valueType}]`;
  }
}
function describeUncaughtError(value, origin) {
  try {
    const diagnostics = {
      origin,
      valueType: describeValueType(value),
      name: readString(value, "name") ?? "UnknownError",
      message: truncate(describeMessage(value), MAX_MESSAGE_LENGTH)
    };
    const code = readString(value, "code");
    if (code !== void 0) diagnostics.code = code;
    const syscall = readString(value, "syscall");
    if (syscall !== void 0) diagnostics.syscall = syscall;
    const errno = readNumber(value, "errno");
    if (errno !== void 0) diagnostics.errno = errno;
    const stack = readString(value, "stack");
    if (stack !== void 0) diagnostics.stack = truncate(stack, MAX_STACK_LENGTH);
    return diagnostics;
  } catch {
    return {
      origin,
      valueType: "unknown",
      name: "UnknownError",
      message: "[failed to describe thrown value]"
    };
  }
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const STATE_FILE = "renderer-recovery.json";
const RENDERER_RELOAD_BACKOFF_MS = [0, 1e3, 3e3];
const RENDERER_CRASH_RESET_MS = 60 * 1e3;
const RENDERER_RELAUNCH_THROTTLE_MS = 5 * 60 * 1e3;
function getStatePath() {
  return path__namespace.join(require$$0$1.app.getPath("userData"), STATE_FILE);
}
function readState() {
  try {
    const p = getStatePath();
    if (!fs__namespace.existsSync(p)) return {};
    const parsed = JSON.parse(fs__namespace.readFileSync(p, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeState(state) {
  try {
    fs__namespace.writeFileSync(getStatePath(), JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("[RendererRecovery] Failed to write recovery state:", err);
  }
}
function createRendererRecoveryPolicy(now = Date.now) {
  let attempts = 0;
  let lastCrashAt = 0;
  const escalate = (t) => {
    const state = readState();
    if (state.lastRelaunchAt && t - state.lastRelaunchAt < RENDERER_RELAUNCH_THROTTLE_MS) {
      return { kind: "give-up" };
    }
    writeState({ ...state, lastRelaunchAt: t });
    return { kind: "relaunch" };
  };
  return {
    onCrash(reason) {
      const t = now();
      if (t - lastCrashAt > RENDERER_CRASH_RESET_MS) attempts = 0;
      lastCrashAt = t;
      if (reason === "launch-failed") return escalate(t);
      if (attempts >= RENDERER_RELOAD_BACKOFF_MS.length) return escalate(t);
      const delayMs = RENDERER_RELOAD_BACKOFF_MS[attempts];
      attempts++;
      return { kind: "reload", delayMs };
    }
  };
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;
const FILE_LOG_LEVEL = "info";
const CONSOLE_LOG_LEVEL = "silly";
function formatLocalDateParts(date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return {
    year,
    month,
    day,
    dateStr: `${year}-${month}-${day}`
  };
}
function buildDatedLogFileName(date = /* @__PURE__ */ new Date()) {
  const { year, month, day, dateStr } = formatLocalDateParts(date);
  return `${year}/${month}/${day}/${dateStr}.log`;
}
function resolveMessageDate(message) {
  const rawDate = message?.date;
  const date = rawDate instanceof Date ? rawDate : rawDate ? new Date(rawDate) : /* @__PURE__ */ new Date();
  return Number.isNaN(date.getTime()) ? /* @__PURE__ */ new Date() : date;
}
log.transports.file.fileName = buildDatedLogFileName();
log.transports.file.resolvePathFn = (variables, message) => {
  const filePath = path$1.join(variables.libraryDefaultDir, buildDatedLogFileName(resolveMessageDate(message)));
  fs$2.mkdirSync(path$1.dirname(filePath), { recursive: true });
  return filePath;
};
log.transports.file.level = FILE_LOG_LEVEL;
log.transports.file.maxSize = FILE_SIZE_LIMIT;
log.transports.console.level = require$$0$1.app.isPackaged ? false : CONSOLE_LOG_LEVEL;
const BACKEND_PREFIX = "[aioncore]";
const ANSI_RE = new RegExp(String.raw`\u001B\[[0-9;]*m`, "g");
const TRACING_LEVEL_MAP = {
  TRACE: "verbose",
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error"
};
const TRACING_RE = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s+(TRACE|DEBUG|INFO|WARN|ERROR)\s+([\s\S]*)$/;
function parseTracingLine(raw) {
  const clean = raw.replace(ANSI_RE, "");
  const m = TRACING_RE.exec(clean);
  if (m) return { level: TRACING_LEVEL_MAP[m[1]] ?? "info", body: m[2] };
  return { level: "info", body: clean };
}
log.hooks.push((message, _transport) => {
  const first = message.data[0];
  if (typeof first !== "string" || !first.startsWith(BACKEND_PREFIX)) return message;
  const raw = first.slice(BACKEND_PREFIX.length + 1);
  const { level, body } = parseTracingLine(raw);
  const resolved = level;
  return { ...message, level: resolved, data: [`${BACKEND_PREFIX} ${body}`, ...message.data.slice(1)] };
});
log.initialize();
Object.assign(console, log.functions);
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var execa$1 = { exports: {} };
var crossSpawn = { exports: {} };
var windows;
var hasRequiredWindows;
function requireWindows() {
  if (hasRequiredWindows) return windows;
  hasRequiredWindows = 1;
  windows = isexe;
  isexe.sync = sync;
  var fs2 = fs$1;
  function checkPathExt(path2, options) {
    var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
    if (!pathext) {
      return true;
    }
    pathext = pathext.split(";");
    if (pathext.indexOf("") !== -1) {
      return true;
    }
    for (var i = 0; i < pathext.length; i++) {
      var p = pathext[i].toLowerCase();
      if (p && path2.substr(-p.length).toLowerCase() === p) {
        return true;
      }
    }
    return false;
  }
  function checkStat(stat, path2, options) {
    if (!stat.isSymbolicLink() && !stat.isFile()) {
      return false;
    }
    return checkPathExt(path2, options);
  }
  function isexe(path2, options, cb) {
    fs2.stat(path2, function(er, stat) {
      cb(er, er ? false : checkStat(stat, path2, options));
    });
  }
  function sync(path2, options) {
    return checkStat(fs2.statSync(path2), path2, options);
  }
  return windows;
}
var mode;
var hasRequiredMode;
function requireMode() {
  if (hasRequiredMode) return mode;
  hasRequiredMode = 1;
  mode = isexe;
  isexe.sync = sync;
  var fs2 = fs$1;
  function isexe(path2, options, cb) {
    fs2.stat(path2, function(er, stat) {
      cb(er, er ? false : checkStat(stat, options));
    });
  }
  function sync(path2, options) {
    return checkStat(fs2.statSync(path2), options);
  }
  function checkStat(stat, options) {
    return stat.isFile() && checkMode(stat, options);
  }
  function checkMode(stat, options) {
    var mod = stat.mode;
    var uid = stat.uid;
    var gid = stat.gid;
    var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
    var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
    var u = parseInt("100", 8);
    var g = parseInt("010", 8);
    var o = parseInt("001", 8);
    var ug = u | g;
    var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
    return ret;
  }
  return mode;
}
var isexe_1;
var hasRequiredIsexe;
function requireIsexe() {
  if (hasRequiredIsexe) return isexe_1;
  hasRequiredIsexe = 1;
  var core2;
  if (process.platform === "win32" || commonjsGlobal.TESTING_WINDOWS) {
    core2 = requireWindows();
  } else {
    core2 = requireMode();
  }
  isexe_1 = isexe;
  isexe.sync = sync;
  function isexe(path2, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (!cb) {
      if (typeof Promise !== "function") {
        throw new TypeError("callback not provided");
      }
      return new Promise(function(resolve, reject) {
        isexe(path2, options || {}, function(er, is) {
          if (er) {
            reject(er);
          } else {
            resolve(is);
          }
        });
      });
    }
    core2(path2, options || {}, function(er, is) {
      if (er) {
        if (er.code === "EACCES" || options && options.ignoreErrors) {
          er = null;
          is = false;
        }
      }
      cb(er, is);
    });
  }
  function sync(path2, options) {
    try {
      return core2.sync(path2, options || {});
    } catch (er) {
      if (options && options.ignoreErrors || er.code === "EACCES") {
        return false;
      } else {
        throw er;
      }
    }
  }
  return isexe_1;
}
var which_1;
var hasRequiredWhich;
function requireWhich() {
  if (hasRequiredWhich) return which_1;
  hasRequiredWhich = 1;
  const isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
  const path$12 = path;
  const COLON = isWindows ? ";" : ":";
  const isexe = requireIsexe();
  const getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
  const getPathInfo = (cmd, opt) => {
    const colon = opt.colon || COLON;
    const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
      // windows always checks the cwd first
      ...isWindows ? [process.cwd()] : [],
      ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
      "").split(colon)
    ];
    const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
    const pathExt = isWindows ? pathExtExe.split(colon) : [""];
    if (isWindows) {
      if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
        pathExt.unshift("");
    }
    return {
      pathEnv,
      pathExt,
      pathExtExe
    };
  };
  const which = (cmd, opt, cb) => {
    if (typeof opt === "function") {
      cb = opt;
      opt = {};
    }
    if (!opt)
      opt = {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    const step = (i) => new Promise((resolve, reject) => {
      if (i === pathEnv.length)
        return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path$12.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      resolve(subStep(p, i, 0));
    });
    const subStep = (p, i, ii) => new Promise((resolve, reject) => {
      if (ii === pathExt.length)
        return resolve(step(i + 1));
      const ext = pathExt[ii];
      isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
        if (!er && is) {
          if (opt.all)
            found.push(p + ext);
          else
            return resolve(p + ext);
        }
        return resolve(subStep(p, i, ii + 1));
      });
    });
    return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
  };
  const whichSync = (cmd, opt) => {
    opt = opt || {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    for (let i = 0; i < pathEnv.length; i++) {
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path$12.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      for (let j = 0; j < pathExt.length; j++) {
        const cur = p + pathExt[j];
        try {
          const is = isexe.sync(cur, { pathExt: pathExtExe });
          if (is) {
            if (opt.all)
              found.push(cur);
            else
              return cur;
          }
        } catch (ex) {
        }
      }
    }
    if (opt.all && found.length)
      return found;
    if (opt.nothrow)
      return null;
    throw getNotFoundError(cmd);
  };
  which_1 = which;
  which.sync = whichSync;
  return which_1;
}
var pathKey = { exports: {} };
var hasRequiredPathKey;
function requirePathKey() {
  if (hasRequiredPathKey) return pathKey.exports;
  hasRequiredPathKey = 1;
  const pathKey$1 = (options = {}) => {
    const environment = options.env || process.env;
    const platform = options.platform || process.platform;
    if (platform !== "win32") {
      return "PATH";
    }
    return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
  };
  pathKey.exports = pathKey$1;
  pathKey.exports.default = pathKey$1;
  return pathKey.exports;
}
var resolveCommand_1;
var hasRequiredResolveCommand;
function requireResolveCommand() {
  if (hasRequiredResolveCommand) return resolveCommand_1;
  hasRequiredResolveCommand = 1;
  const path$12 = path;
  const which = requireWhich();
  const getPathKey = requirePathKey();
  function resolveCommandAttempt(parsed, withoutPathExt) {
    const env2 = parsed.options.env || process.env;
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;
    const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
    if (shouldSwitchCwd) {
      try {
        process.chdir(parsed.options.cwd);
      } catch (err) {
      }
    }
    let resolved;
    try {
      resolved = which.sync(parsed.command, {
        path: env2[getPathKey({ env: env2 })],
        pathExt: withoutPathExt ? path$12.delimiter : void 0
      });
    } catch (e) {
    } finally {
      if (shouldSwitchCwd) {
        process.chdir(cwd);
      }
    }
    if (resolved) {
      resolved = path$12.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
    }
    return resolved;
  }
  function resolveCommand(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
  }
  resolveCommand_1 = resolveCommand;
  return resolveCommand_1;
}
var _escape = {};
var hasRequired_escape;
function require_escape() {
  if (hasRequired_escape) return _escape;
  hasRequired_escape = 1;
  const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
  function escapeCommand(arg) {
    arg = arg.replace(metaCharsRegExp, "^$1");
    return arg;
  }
  function escapeArgument(arg, doubleEscapeMetaChars) {
    arg = `${arg}`;
    arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
    arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
    arg = `"${arg}"`;
    arg = arg.replace(metaCharsRegExp, "^$1");
    if (doubleEscapeMetaChars) {
      arg = arg.replace(metaCharsRegExp, "^$1");
    }
    return arg;
  }
  _escape.command = escapeCommand;
  _escape.argument = escapeArgument;
  return _escape;
}
var shebangRegex;
var hasRequiredShebangRegex;
function requireShebangRegex() {
  if (hasRequiredShebangRegex) return shebangRegex;
  hasRequiredShebangRegex = 1;
  shebangRegex = /^#!(.*)/;
  return shebangRegex;
}
var shebangCommand;
var hasRequiredShebangCommand;
function requireShebangCommand() {
  if (hasRequiredShebangCommand) return shebangCommand;
  hasRequiredShebangCommand = 1;
  const shebangRegex2 = requireShebangRegex();
  shebangCommand = (string = "") => {
    const match = string.match(shebangRegex2);
    if (!match) {
      return null;
    }
    const [path2, argument] = match[0].replace(/#! ?/, "").split(" ");
    const binary = path2.split("/").pop();
    if (binary === "env") {
      return argument;
    }
    return argument ? `${binary} ${argument}` : binary;
  };
  return shebangCommand;
}
var readShebang_1;
var hasRequiredReadShebang;
function requireReadShebang() {
  if (hasRequiredReadShebang) return readShebang_1;
  hasRequiredReadShebang = 1;
  const fs2 = fs$1;
  const shebangCommand2 = requireShebangCommand();
  function readShebang(command2) {
    const size2 = 150;
    const buffer = Buffer.alloc(size2);
    let fd;
    try {
      fd = fs2.openSync(command2, "r");
      fs2.readSync(fd, buffer, 0, size2, 0);
      fs2.closeSync(fd);
    } catch (e) {
    }
    return shebangCommand2(buffer.toString());
  }
  readShebang_1 = readShebang;
  return readShebang_1;
}
var parse_1;
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse_1;
  hasRequiredParse = 1;
  const path$12 = path;
  const resolveCommand = requireResolveCommand();
  const escape = require_escape();
  const readShebang = requireReadShebang();
  const isWin = process.platform === "win32";
  const isExecutableRegExp = /\.(?:com|exe)$/i;
  const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
  function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);
    const shebang = parsed.file && readShebang(parsed.file);
    if (shebang) {
      parsed.args.unshift(parsed.file);
      parsed.command = shebang;
      return resolveCommand(parsed);
    }
    return parsed.file;
  }
  function parseNonShell(parsed) {
    if (!isWin) {
      return parsed;
    }
    const commandFile = detectShebang(parsed);
    const needsShell = !isExecutableRegExp.test(commandFile);
    if (parsed.options.forceShell || needsShell) {
      const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
      parsed.command = path$12.normalize(parsed.command);
      parsed.command = escape.command(parsed.command);
      parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
      const shellCommand = [parsed.command].concat(parsed.args).join(" ");
      parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
      parsed.command = process.env.comspec || "cmd.exe";
      parsed.options.windowsVerbatimArguments = true;
    }
    return parsed;
  }
  function parse(command2, args2, options) {
    if (args2 && !Array.isArray(args2)) {
      options = args2;
      args2 = null;
    }
    args2 = args2 ? args2.slice(0) : [];
    options = Object.assign({}, options);
    const parsed = {
      command: command2,
      args: args2,
      options,
      file: void 0,
      original: {
        command: command2,
        args: args2
      }
    };
    return options.shell ? parsed : parseNonShell(parsed);
  }
  parse_1 = parse;
  return parse_1;
}
var enoent;
var hasRequiredEnoent;
function requireEnoent() {
  if (hasRequiredEnoent) return enoent;
  hasRequiredEnoent = 1;
  const isWin = process.platform === "win32";
  function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
      code: "ENOENT",
      errno: "ENOENT",
      syscall: `${syscall} ${original.command}`,
      path: original.command,
      spawnargs: original.args
    });
  }
  function hookChildProcess(cp, parsed) {
    if (!isWin) {
      return;
    }
    const originalEmit = cp.emit;
    cp.emit = function(name2, arg1) {
      if (name2 === "exit") {
        const err = verifyENOENT(arg1, parsed);
        if (err) {
          return originalEmit.call(cp, "error", err);
        }
      }
      return originalEmit.apply(cp, arguments);
    };
  }
  function verifyENOENT(status2, parsed) {
    if (isWin && status2 === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawn");
    }
    return null;
  }
  function verifyENOENTSync(status2, parsed) {
    if (isWin && status2 === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawnSync");
    }
    return null;
  }
  enoent = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError
  };
  return enoent;
}
var hasRequiredCrossSpawn;
function requireCrossSpawn() {
  if (hasRequiredCrossSpawn) return crossSpawn.exports;
  hasRequiredCrossSpawn = 1;
  const cp = require$$0;
  const parse = requireParse();
  const enoent2 = requireEnoent();
  function spawn(command2, args2, options) {
    const parsed = parse(command2, args2, options);
    const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
    enoent2.hookChildProcess(spawned, parsed);
    return spawned;
  }
  function spawnSync(command2, args2, options) {
    const parsed = parse(command2, args2, options);
    const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
    result.error = result.error || enoent2.verifyENOENTSync(result.status, parsed);
    return result;
  }
  crossSpawn.exports = spawn;
  crossSpawn.exports.spawn = spawn;
  crossSpawn.exports.sync = spawnSync;
  crossSpawn.exports._parse = parse;
  crossSpawn.exports._enoent = enoent2;
  return crossSpawn.exports;
}
var stripFinalNewline;
var hasRequiredStripFinalNewline;
function requireStripFinalNewline() {
  if (hasRequiredStripFinalNewline) return stripFinalNewline;
  hasRequiredStripFinalNewline = 1;
  stripFinalNewline = (input) => {
    const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
    const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
    if (input[input.length - 1] === LF) {
      input = input.slice(0, input.length - 1);
    }
    if (input[input.length - 1] === CR) {
      input = input.slice(0, input.length - 1);
    }
    return input;
  };
  return stripFinalNewline;
}
var npmRunPath = { exports: {} };
npmRunPath.exports;
var hasRequiredNpmRunPath;
function requireNpmRunPath() {
  if (hasRequiredNpmRunPath) return npmRunPath.exports;
  hasRequiredNpmRunPath = 1;
  (function(module2) {
    const path$12 = path;
    const pathKey2 = requirePathKey();
    const npmRunPath2 = (options) => {
      options = {
        cwd: process.cwd(),
        path: process.env[pathKey2()],
        execPath: process.execPath,
        ...options
      };
      let previous;
      let cwdPath = path$12.resolve(options.cwd);
      const result = [];
      while (previous !== cwdPath) {
        result.push(path$12.join(cwdPath, "node_modules/.bin"));
        previous = cwdPath;
        cwdPath = path$12.resolve(cwdPath, "..");
      }
      const execPathDir = path$12.resolve(options.cwd, options.execPath, "..");
      result.push(execPathDir);
      return result.concat(options.path).join(path$12.delimiter);
    };
    module2.exports = npmRunPath2;
    module2.exports.default = npmRunPath2;
    module2.exports.env = (options) => {
      options = {
        env: process.env,
        ...options
      };
      const env2 = { ...options.env };
      const path2 = pathKey2({ env: env2 });
      options.path = env2[path2];
      env2[path2] = module2.exports(options);
      return env2;
    };
  })(npmRunPath);
  return npmRunPath.exports;
}
var onetime = { exports: {} };
var mimicFn = { exports: {} };
var hasRequiredMimicFn;
function requireMimicFn() {
  if (hasRequiredMimicFn) return mimicFn.exports;
  hasRequiredMimicFn = 1;
  const mimicFn$1 = (to, from) => {
    for (const prop of Reflect.ownKeys(from)) {
      Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
    }
    return to;
  };
  mimicFn.exports = mimicFn$1;
  mimicFn.exports.default = mimicFn$1;
  return mimicFn.exports;
}
var hasRequiredOnetime;
function requireOnetime() {
  if (hasRequiredOnetime) return onetime.exports;
  hasRequiredOnetime = 1;
  const mimicFn2 = requireMimicFn();
  const calledFunctions = /* @__PURE__ */ new WeakMap();
  const onetime$1 = (function_, options = {}) => {
    if (typeof function_ !== "function") {
      throw new TypeError("Expected a function");
    }
    let returnValue;
    let callCount = 0;
    const functionName = function_.displayName || function_.name || "<anonymous>";
    const onetime2 = function(...arguments_) {
      calledFunctions.set(onetime2, ++callCount);
      if (callCount === 1) {
        returnValue = function_.apply(this, arguments_);
        function_ = null;
      } else if (options.throw === true) {
        throw new Error(`Function \`${functionName}\` can only be called once`);
      }
      return returnValue;
    };
    mimicFn2(onetime2, function_);
    calledFunctions.set(onetime2, callCount);
    return onetime2;
  };
  onetime.exports = onetime$1;
  onetime.exports.default = onetime$1;
  onetime.exports.callCount = (function_) => {
    if (!calledFunctions.has(function_)) {
      throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
    }
    return calledFunctions.get(function_);
  };
  return onetime.exports;
}
var main = {};
var signals$1 = {};
var core = {};
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1;
  Object.defineProperty(core, "__esModule", { value: true });
  core.SIGNALS = void 0;
  const SIGNALS = [
    {
      name: "SIGHUP",
      number: 1,
      action: "terminate",
      description: "Terminal closed",
      standard: "posix"
    },
    {
      name: "SIGINT",
      number: 2,
      action: "terminate",
      description: "User interruption with CTRL-C",
      standard: "ansi"
    },
    {
      name: "SIGQUIT",
      number: 3,
      action: "core",
      description: "User interruption with CTRL-\\",
      standard: "posix"
    },
    {
      name: "SIGILL",
      number: 4,
      action: "core",
      description: "Invalid machine instruction",
      standard: "ansi"
    },
    {
      name: "SIGTRAP",
      number: 5,
      action: "core",
      description: "Debugger breakpoint",
      standard: "posix"
    },
    {
      name: "SIGABRT",
      number: 6,
      action: "core",
      description: "Aborted",
      standard: "ansi"
    },
    {
      name: "SIGIOT",
      number: 6,
      action: "core",
      description: "Aborted",
      standard: "bsd"
    },
    {
      name: "SIGBUS",
      number: 7,
      action: "core",
      description: "Bus error due to misaligned, non-existing address or paging error",
      standard: "bsd"
    },
    {
      name: "SIGEMT",
      number: 7,
      action: "terminate",
      description: "Command should be emulated but is not implemented",
      standard: "other"
    },
    {
      name: "SIGFPE",
      number: 8,
      action: "core",
      description: "Floating point arithmetic error",
      standard: "ansi"
    },
    {
      name: "SIGKILL",
      number: 9,
      action: "terminate",
      description: "Forced termination",
      standard: "posix",
      forced: true
    },
    {
      name: "SIGUSR1",
      number: 10,
      action: "terminate",
      description: "Application-specific signal",
      standard: "posix"
    },
    {
      name: "SIGSEGV",
      number: 11,
      action: "core",
      description: "Segmentation fault",
      standard: "ansi"
    },
    {
      name: "SIGUSR2",
      number: 12,
      action: "terminate",
      description: "Application-specific signal",
      standard: "posix"
    },
    {
      name: "SIGPIPE",
      number: 13,
      action: "terminate",
      description: "Broken pipe or socket",
      standard: "posix"
    },
    {
      name: "SIGALRM",
      number: 14,
      action: "terminate",
      description: "Timeout or timer",
      standard: "posix"
    },
    {
      name: "SIGTERM",
      number: 15,
      action: "terminate",
      description: "Termination",
      standard: "ansi"
    },
    {
      name: "SIGSTKFLT",
      number: 16,
      action: "terminate",
      description: "Stack is empty or overflowed",
      standard: "other"
    },
    {
      name: "SIGCHLD",
      number: 17,
      action: "ignore",
      description: "Child process terminated, paused or unpaused",
      standard: "posix"
    },
    {
      name: "SIGCLD",
      number: 17,
      action: "ignore",
      description: "Child process terminated, paused or unpaused",
      standard: "other"
    },
    {
      name: "SIGCONT",
      number: 18,
      action: "unpause",
      description: "Unpaused",
      standard: "posix",
      forced: true
    },
    {
      name: "SIGSTOP",
      number: 19,
      action: "pause",
      description: "Paused",
      standard: "posix",
      forced: true
    },
    {
      name: "SIGTSTP",
      number: 20,
      action: "pause",
      description: 'Paused using CTRL-Z or "suspend"',
      standard: "posix"
    },
    {
      name: "SIGTTIN",
      number: 21,
      action: "pause",
      description: "Background process cannot read terminal input",
      standard: "posix"
    },
    {
      name: "SIGBREAK",
      number: 21,
      action: "terminate",
      description: "User interruption with CTRL-BREAK",
      standard: "other"
    },
    {
      name: "SIGTTOU",
      number: 22,
      action: "pause",
      description: "Background process cannot write to terminal output",
      standard: "posix"
    },
    {
      name: "SIGURG",
      number: 23,
      action: "ignore",
      description: "Socket received out-of-band data",
      standard: "bsd"
    },
    {
      name: "SIGXCPU",
      number: 24,
      action: "core",
      description: "Process timed out",
      standard: "bsd"
    },
    {
      name: "SIGXFSZ",
      number: 25,
      action: "core",
      description: "File too big",
      standard: "bsd"
    },
    {
      name: "SIGVTALRM",
      number: 26,
      action: "terminate",
      description: "Timeout or timer",
      standard: "bsd"
    },
    {
      name: "SIGPROF",
      number: 27,
      action: "terminate",
      description: "Timeout or timer",
      standard: "bsd"
    },
    {
      name: "SIGWINCH",
      number: 28,
      action: "ignore",
      description: "Terminal window size changed",
      standard: "bsd"
    },
    {
      name: "SIGIO",
      number: 29,
      action: "terminate",
      description: "I/O is available",
      standard: "other"
    },
    {
      name: "SIGPOLL",
      number: 29,
      action: "terminate",
      description: "Watched event",
      standard: "other"
    },
    {
      name: "SIGINFO",
      number: 29,
      action: "ignore",
      description: "Request for process information",
      standard: "other"
    },
    {
      name: "SIGPWR",
      number: 30,
      action: "terminate",
      description: "Device running out of power",
      standard: "systemv"
    },
    {
      name: "SIGSYS",
      number: 31,
      action: "core",
      description: "Invalid system call",
      standard: "other"
    },
    {
      name: "SIGUNUSED",
      number: 31,
      action: "terminate",
      description: "Invalid system call",
      standard: "other"
    }
  ];
  core.SIGNALS = SIGNALS;
  return core;
}
var realtime = {};
var hasRequiredRealtime;
function requireRealtime() {
  if (hasRequiredRealtime) return realtime;
  hasRequiredRealtime = 1;
  Object.defineProperty(realtime, "__esModule", { value: true });
  realtime.SIGRTMAX = realtime.getRealtimeSignals = void 0;
  const getRealtimeSignals = function() {
    const length = SIGRTMAX - SIGRTMIN + 1;
    return Array.from({ length }, getRealtimeSignal);
  };
  realtime.getRealtimeSignals = getRealtimeSignals;
  const getRealtimeSignal = function(value, index2) {
    return {
      name: `SIGRT${index2 + 1}`,
      number: SIGRTMIN + index2,
      action: "terminate",
      description: "Application-specific signal (realtime)",
      standard: "posix"
    };
  };
  const SIGRTMIN = 34;
  const SIGRTMAX = 64;
  realtime.SIGRTMAX = SIGRTMAX;
  return realtime;
}
var hasRequiredSignals$1;
function requireSignals$1() {
  if (hasRequiredSignals$1) return signals$1;
  hasRequiredSignals$1 = 1;
  Object.defineProperty(signals$1, "__esModule", { value: true });
  signals$1.getSignals = void 0;
  var _os = os;
  var _core = requireCore();
  var _realtime = requireRealtime();
  const getSignals = function() {
    const realtimeSignals = (0, _realtime.getRealtimeSignals)();
    const signals2 = [..._core.SIGNALS, ...realtimeSignals].map(normalizeSignal);
    return signals2;
  };
  signals$1.getSignals = getSignals;
  const normalizeSignal = function({
    name: name2,
    number: defaultNumber,
    description,
    action,
    forced = false,
    standard
  }) {
    const {
      signals: { [name2]: constantSignal }
    } = _os.constants;
    const supported = constantSignal !== void 0;
    const number = supported ? constantSignal : defaultNumber;
    return { name: name2, number, description, supported, action, forced, standard };
  };
  return signals$1;
}
var hasRequiredMain;
function requireMain() {
  if (hasRequiredMain) return main;
  hasRequiredMain = 1;
  Object.defineProperty(main, "__esModule", { value: true });
  main.signalsByNumber = main.signalsByName = void 0;
  var _os = os;
  var _signals = requireSignals$1();
  var _realtime = requireRealtime();
  const getSignalsByName = function() {
    const signals2 = (0, _signals.getSignals)();
    return signals2.reduce(getSignalByName, {});
  };
  const getSignalByName = function(signalByNameMemo, { name: name2, number, description, supported, action, forced, standard }) {
    return {
      ...signalByNameMemo,
      [name2]: { name: name2, number, description, supported, action, forced, standard }
    };
  };
  const signalsByName = getSignalsByName();
  main.signalsByName = signalsByName;
  const getSignalsByNumber = function() {
    const signals2 = (0, _signals.getSignals)();
    const length = _realtime.SIGRTMAX + 1;
    const signalsA = Array.from({ length }, (value, number) => getSignalByNumber(number, signals2));
    return Object.assign({}, ...signalsA);
  };
  const getSignalByNumber = function(number, signals2) {
    const signal = findSignalByNumber(number, signals2);
    if (signal === void 0) {
      return {};
    }
    const { name: name2, description, supported, action, forced, standard } = signal;
    return {
      [number]: {
        name: name2,
        number,
        description,
        supported,
        action,
        forced,
        standard
      }
    };
  };
  const findSignalByNumber = function(number, signals2) {
    const signal = signals2.find(({ name: name2 }) => _os.constants.signals[name2] === number);
    if (signal !== void 0) {
      return signal;
    }
    return signals2.find((signalA) => signalA.number === number);
  };
  const signalsByNumber = getSignalsByNumber();
  main.signalsByNumber = signalsByNumber;
  return main;
}
var error$d;
var hasRequiredError;
function requireError() {
  if (hasRequiredError) return error$d;
  hasRequiredError = 1;
  const { signalsByName } = requireMain();
  const getErrorPrefix = ({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled }) => {
    if (timedOut) {
      return `timed out after ${timeout} milliseconds`;
    }
    if (isCanceled) {
      return "was canceled";
    }
    if (errorCode !== void 0) {
      return `failed with ${errorCode}`;
    }
    if (signal !== void 0) {
      return `was killed with ${signal} (${signalDescription})`;
    }
    if (exitCode !== void 0) {
      return `failed with exit code ${exitCode}`;
    }
    return "failed";
  };
  const makeError = ({
    stdout,
    stderr,
    all,
    error: error2,
    signal,
    exitCode,
    command: command2,
    escapedCommand,
    timedOut,
    isCanceled,
    killed,
    parsed: { options: { timeout } }
  }) => {
    exitCode = exitCode === null ? void 0 : exitCode;
    signal = signal === null ? void 0 : signal;
    const signalDescription = signal === void 0 ? void 0 : signalsByName[signal].description;
    const errorCode = error2 && error2.code;
    const prefix = getErrorPrefix({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled });
    const execaMessage = `Command ${prefix}: ${command2}`;
    const isError = Object.prototype.toString.call(error2) === "[object Error]";
    const shortMessage = isError ? `${execaMessage}
${error2.message}` : execaMessage;
    const message = [shortMessage, stderr, stdout].filter(Boolean).join("\n");
    if (isError) {
      error2.originalMessage = error2.message;
      error2.message = message;
    } else {
      error2 = new Error(message);
    }
    error2.shortMessage = shortMessage;
    error2.command = command2;
    error2.escapedCommand = escapedCommand;
    error2.exitCode = exitCode;
    error2.signal = signal;
    error2.signalDescription = signalDescription;
    error2.stdout = stdout;
    error2.stderr = stderr;
    if (all !== void 0) {
      error2.all = all;
    }
    if ("bufferedData" in error2) {
      delete error2.bufferedData;
    }
    error2.failed = true;
    error2.timedOut = Boolean(timedOut);
    error2.isCanceled = isCanceled;
    error2.killed = killed && !timedOut;
    return error2;
  };
  error$d = makeError;
  return error$d;
}
var stdio = { exports: {} };
var hasRequiredStdio;
function requireStdio() {
  if (hasRequiredStdio) return stdio.exports;
  hasRequiredStdio = 1;
  const aliases = ["stdin", "stdout", "stderr"];
  const hasAlias = (options) => aliases.some((alias) => options[alias] !== void 0);
  const normalizeStdio = (options) => {
    if (!options) {
      return;
    }
    const { stdio: stdio2 } = options;
    if (stdio2 === void 0) {
      return aliases.map((alias) => options[alias]);
    }
    if (hasAlias(options)) {
      throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`);
    }
    if (typeof stdio2 === "string") {
      return stdio2;
    }
    if (!Array.isArray(stdio2)) {
      throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio2}\``);
    }
    const length = Math.max(stdio2.length, aliases.length);
    return Array.from({ length }, (value, index2) => stdio2[index2]);
  };
  stdio.exports = normalizeStdio;
  stdio.exports.node = (options) => {
    const stdio2 = normalizeStdio(options);
    if (stdio2 === "ipc") {
      return "ipc";
    }
    if (stdio2 === void 0 || typeof stdio2 === "string") {
      return [stdio2, stdio2, stdio2, "ipc"];
    }
    if (stdio2.includes("ipc")) {
      return stdio2;
    }
    return [...stdio2, "ipc"];
  };
  return stdio.exports;
}
var signalExit = { exports: {} };
var signals = { exports: {} };
var hasRequiredSignals;
function requireSignals() {
  if (hasRequiredSignals) return signals.exports;
  hasRequiredSignals = 1;
  (function(module2) {
    module2.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module2.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module2.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  })(signals);
  return signals.exports;
}
var hasRequiredSignalExit;
function requireSignalExit() {
  if (hasRequiredSignalExit) return signalExit.exports;
  hasRequiredSignalExit = 1;
  var process2 = commonjsGlobal.process;
  const processOk = function(process3) {
    return process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
  };
  if (!processOk(process2)) {
    signalExit.exports = function() {
      return function() {
      };
    };
  } else {
    var assert = require$$0$2;
    var signals2 = requireSignals();
    var isWin = /^win/i.test(process2.platform);
    var EE = require$$2;
    if (typeof EE !== "function") {
      EE = EE.EventEmitter;
    }
    var emitter;
    if (process2.__signal_exit_emitter__) {
      emitter = process2.__signal_exit_emitter__;
    } else {
      emitter = process2.__signal_exit_emitter__ = new EE();
      emitter.count = 0;
      emitter.emitted = {};
    }
    if (!emitter.infinite) {
      emitter.setMaxListeners(Infinity);
      emitter.infinite = true;
    }
    signalExit.exports = function(cb, opts) {
      if (!processOk(commonjsGlobal.process)) {
        return function() {
        };
      }
      assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
      if (loaded === false) {
        load();
      }
      var ev = "exit";
      if (opts && opts.alwaysLast) {
        ev = "afterexit";
      }
      var remove2 = function() {
        emitter.removeListener(ev, cb);
        if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
          unload();
        }
      };
      emitter.on(ev, cb);
      return remove2;
    };
    var unload = function unload2() {
      if (!loaded || !processOk(commonjsGlobal.process)) {
        return;
      }
      loaded = false;
      signals2.forEach(function(sig) {
        try {
          process2.removeListener(sig, sigListeners[sig]);
        } catch (er) {
        }
      });
      process2.emit = originalProcessEmit;
      process2.reallyExit = originalProcessReallyExit;
      emitter.count -= 1;
    };
    signalExit.exports.unload = unload;
    var emit2 = function emit3(event, code, signal) {
      if (emitter.emitted[event]) {
        return;
      }
      emitter.emitted[event] = true;
      emitter.emit(event, code, signal);
    };
    var sigListeners = {};
    signals2.forEach(function(sig) {
      sigListeners[sig] = function listener() {
        if (!processOk(commonjsGlobal.process)) {
          return;
        }
        var listeners = process2.listeners(sig);
        if (listeners.length === emitter.count) {
          unload();
          emit2("exit", null, sig);
          emit2("afterexit", null, sig);
          if (isWin && sig === "SIGHUP") {
            sig = "SIGINT";
          }
          process2.kill(process2.pid, sig);
        }
      };
    });
    signalExit.exports.signals = function() {
      return signals2;
    };
    var loaded = false;
    var load = function load2() {
      if (loaded || !processOk(commonjsGlobal.process)) {
        return;
      }
      loaded = true;
      emitter.count += 1;
      signals2 = signals2.filter(function(sig) {
        try {
          process2.on(sig, sigListeners[sig]);
          return true;
        } catch (er) {
          return false;
        }
      });
      process2.emit = processEmit;
      process2.reallyExit = processReallyExit;
    };
    signalExit.exports.load = load;
    var originalProcessReallyExit = process2.reallyExit;
    var processReallyExit = function processReallyExit2(code) {
      if (!processOk(commonjsGlobal.process)) {
        return;
      }
      process2.exitCode = code || /* istanbul ignore next */
      0;
      emit2("exit", process2.exitCode, null);
      emit2("afterexit", process2.exitCode, null);
      originalProcessReallyExit.call(process2, process2.exitCode);
    };
    var originalProcessEmit = process2.emit;
    var processEmit = function processEmit2(ev, arg) {
      if (ev === "exit" && processOk(commonjsGlobal.process)) {
        if (arg !== void 0) {
          process2.exitCode = arg;
        }
        var ret = originalProcessEmit.apply(this, arguments);
        emit2("exit", process2.exitCode, null);
        emit2("afterexit", process2.exitCode, null);
        return ret;
      } else {
        return originalProcessEmit.apply(this, arguments);
      }
    };
  }
  return signalExit.exports;
}
var kill;
var hasRequiredKill;
function requireKill() {
  if (hasRequiredKill) return kill;
  hasRequiredKill = 1;
  const os$1 = os;
  const onExit = requireSignalExit();
  const DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
  const spawnedKill = (kill2, signal = "SIGTERM", options = {}) => {
    const killResult = kill2(signal);
    setKillTimeout(kill2, signal, options, killResult);
    return killResult;
  };
  const setKillTimeout = (kill2, signal, options, killResult) => {
    if (!shouldForceKill(signal, options, killResult)) {
      return;
    }
    const timeout = getForceKillAfterTimeout(options);
    const t = setTimeout(() => {
      kill2("SIGKILL");
    }, timeout);
    if (t.unref) {
      t.unref();
    }
  };
  const shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
    return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
  };
  const isSigterm = (signal) => {
    return signal === os$1.constants.signals.SIGTERM || typeof signal === "string" && signal.toUpperCase() === "SIGTERM";
  };
  const getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
    if (forceKillAfterTimeout === true) {
      return DEFAULT_FORCE_KILL_TIMEOUT;
    }
    if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
      throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
    }
    return forceKillAfterTimeout;
  };
  const spawnedCancel = (spawned, context) => {
    const killResult = spawned.kill();
    if (killResult) {
      context.isCanceled = true;
    }
  };
  const timeoutKill = (spawned, signal, reject) => {
    spawned.kill(signal);
    reject(Object.assign(new Error("Timed out"), { timedOut: true, signal }));
  };
  const setupTimeout = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
    if (timeout === 0 || timeout === void 0) {
      return spawnedPromise;
    }
    let timeoutId;
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        timeoutKill(spawned, killSignal, reject);
      }, timeout);
    });
    const safeSpawnedPromise = spawnedPromise.finally(() => {
      clearTimeout(timeoutId);
    });
    return Promise.race([timeoutPromise, safeSpawnedPromise]);
  };
  const validateTimeout = ({ timeout }) => {
    if (timeout !== void 0 && (!Number.isFinite(timeout) || timeout < 0)) {
      throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
    }
  };
  const setExitHandler = async (spawned, { cleanup, detached }, timedPromise) => {
    if (!cleanup || detached) {
      return timedPromise;
    }
    const removeExitHandler = onExit(() => {
      spawned.kill();
    });
    return timedPromise.finally(() => {
      removeExitHandler();
    });
  };
  kill = {
    spawnedKill,
    spawnedCancel,
    setupTimeout,
    validateTimeout,
    setExitHandler
  };
  return kill;
}
var isStream_1;
var hasRequiredIsStream;
function requireIsStream() {
  if (hasRequiredIsStream) return isStream_1;
  hasRequiredIsStream = 1;
  const isStream = (stream2) => stream2 !== null && typeof stream2 === "object" && typeof stream2.pipe === "function";
  isStream.writable = (stream2) => isStream(stream2) && stream2.writable !== false && typeof stream2._write === "function" && typeof stream2._writableState === "object";
  isStream.readable = (stream2) => isStream(stream2) && stream2.readable !== false && typeof stream2._read === "function" && typeof stream2._readableState === "object";
  isStream.duplex = (stream2) => isStream.writable(stream2) && isStream.readable(stream2);
  isStream.transform = (stream2) => isStream.duplex(stream2) && typeof stream2._transform === "function";
  isStream_1 = isStream;
  return isStream_1;
}
var getStream = { exports: {} };
var bufferStream;
var hasRequiredBufferStream;
function requireBufferStream() {
  if (hasRequiredBufferStream) return bufferStream;
  hasRequiredBufferStream = 1;
  const { PassThrough: PassThroughStream } = require$$0$3;
  bufferStream = (options) => {
    options = { ...options };
    const { array } = options;
    let { encoding } = options;
    const isBuffer = encoding === "buffer";
    let objectMode = false;
    if (array) {
      objectMode = !(encoding || isBuffer);
    } else {
      encoding = encoding || "utf8";
    }
    if (isBuffer) {
      encoding = null;
    }
    const stream2 = new PassThroughStream({ objectMode });
    if (encoding) {
      stream2.setEncoding(encoding);
    }
    let length = 0;
    const chunks = [];
    stream2.on("data", (chunk) => {
      chunks.push(chunk);
      if (objectMode) {
        length = chunks.length;
      } else {
        length += chunk.length;
      }
    });
    stream2.getBufferedValue = () => {
      if (array) {
        return chunks;
      }
      return isBuffer ? Buffer.concat(chunks, length) : chunks.join("");
    };
    stream2.getBufferedLength = () => length;
    return stream2;
  };
  return bufferStream;
}
var hasRequiredGetStream;
function requireGetStream() {
  if (hasRequiredGetStream) return getStream.exports;
  hasRequiredGetStream = 1;
  const { constants: BufferConstants } = require$$0$4;
  const stream2 = require$$0$3;
  const { promisify } = require$$2$1;
  const bufferStream2 = requireBufferStream();
  const streamPipelinePromisified = promisify(stream2.pipeline);
  class MaxBufferError extends Error {
    constructor() {
      super("maxBuffer exceeded");
      this.name = "MaxBufferError";
    }
  }
  async function getStream$1(inputStream, options) {
    if (!inputStream) {
      throw new Error("Expected a stream");
    }
    options = {
      maxBuffer: Infinity,
      ...options
    };
    const { maxBuffer } = options;
    const stream3 = bufferStream2(options);
    await new Promise((resolve, reject) => {
      const rejectPromise = (error2) => {
        if (error2 && stream3.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
          error2.bufferedData = stream3.getBufferedValue();
        }
        reject(error2);
      };
      (async () => {
        try {
          await streamPipelinePromisified(inputStream, stream3);
          resolve();
        } catch (error2) {
          rejectPromise(error2);
        }
      })();
      stream3.on("data", () => {
        if (stream3.getBufferedLength() > maxBuffer) {
          rejectPromise(new MaxBufferError());
        }
      });
    });
    return stream3.getBufferedValue();
  }
  getStream.exports = getStream$1;
  getStream.exports.buffer = (stream3, options) => getStream$1(stream3, { ...options, encoding: "buffer" });
  getStream.exports.array = (stream3, options) => getStream$1(stream3, { ...options, array: true });
  getStream.exports.MaxBufferError = MaxBufferError;
  return getStream.exports;
}
var mergeStream;
var hasRequiredMergeStream;
function requireMergeStream() {
  if (hasRequiredMergeStream) return mergeStream;
  hasRequiredMergeStream = 1;
  const { PassThrough } = require$$0$3;
  mergeStream = function() {
    var sources = [];
    var output = new PassThrough({ objectMode: true });
    output.setMaxListeners(0);
    output.add = add2;
    output.isEmpty = isEmpty;
    output.on("unpipe", remove2);
    Array.prototype.slice.call(arguments).forEach(add2);
    return output;
    function add2(source) {
      if (Array.isArray(source)) {
        source.forEach(add2);
        return this;
      }
      sources.push(source);
      source.once("end", remove2.bind(null, source));
      source.once("error", output.emit.bind(output, "error"));
      source.pipe(output, { end: false });
      return this;
    }
    function isEmpty() {
      return sources.length == 0;
    }
    function remove2(source) {
      sources = sources.filter(function(it) {
        return it !== source;
      });
      if (!sources.length && output.readable) {
        output.end();
      }
    }
  };
  return mergeStream;
}
var stream;
var hasRequiredStream;
function requireStream() {
  if (hasRequiredStream) return stream;
  hasRequiredStream = 1;
  const isStream = requireIsStream();
  const getStream2 = requireGetStream();
  const mergeStream2 = requireMergeStream();
  const handleInput = (spawned, input) => {
    if (input === void 0 || spawned.stdin === void 0) {
      return;
    }
    if (isStream(input)) {
      input.pipe(spawned.stdin);
    } else {
      spawned.stdin.end(input);
    }
  };
  const makeAllStream = (spawned, { all }) => {
    if (!all || !spawned.stdout && !spawned.stderr) {
      return;
    }
    const mixed = mergeStream2();
    if (spawned.stdout) {
      mixed.add(spawned.stdout);
    }
    if (spawned.stderr) {
      mixed.add(spawned.stderr);
    }
    return mixed;
  };
  const getBufferedData = async (stream2, streamPromise) => {
    if (!stream2) {
      return;
    }
    stream2.destroy();
    try {
      return await streamPromise;
    } catch (error2) {
      return error2.bufferedData;
    }
  };
  const getStreamPromise = (stream2, { encoding, buffer, maxBuffer }) => {
    if (!stream2 || !buffer) {
      return;
    }
    if (encoding) {
      return getStream2(stream2, { encoding, maxBuffer });
    }
    return getStream2.buffer(stream2, { maxBuffer });
  };
  const getSpawnedResult = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
    const stdoutPromise = getStreamPromise(stdout, { encoding, buffer, maxBuffer });
    const stderrPromise = getStreamPromise(stderr, { encoding, buffer, maxBuffer });
    const allPromise = getStreamPromise(all, { encoding, buffer, maxBuffer: maxBuffer * 2 });
    try {
      return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
    } catch (error2) {
      return Promise.all([
        { error: error2, signal: error2.signal, timedOut: error2.timedOut },
        getBufferedData(stdout, stdoutPromise),
        getBufferedData(stderr, stderrPromise),
        getBufferedData(all, allPromise)
      ]);
    }
  };
  const validateInputSync = ({ input }) => {
    if (isStream(input)) {
      throw new TypeError("The `input` option cannot be a stream in sync mode");
    }
  };
  stream = {
    handleInput,
    makeAllStream,
    getSpawnedResult,
    validateInputSync
  };
  return stream;
}
var promise;
var hasRequiredPromise;
function requirePromise() {
  if (hasRequiredPromise) return promise;
  hasRequiredPromise = 1;
  const nativePromisePrototype = (async () => {
  })().constructor.prototype;
  const descriptors = ["then", "catch", "finally"].map((property) => [
    property,
    Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property)
  ]);
  const mergePromise = (spawned, promise2) => {
    for (const [property, descriptor] of descriptors) {
      const value = typeof promise2 === "function" ? (...args2) => Reflect.apply(descriptor.value, promise2(), args2) : descriptor.value.bind(promise2);
      Reflect.defineProperty(spawned, property, { ...descriptor, value });
    }
    return spawned;
  };
  const getSpawnedPromise = (spawned) => {
    return new Promise((resolve, reject) => {
      spawned.on("exit", (exitCode, signal) => {
        resolve({ exitCode, signal });
      });
      spawned.on("error", (error2) => {
        reject(error2);
      });
      if (spawned.stdin) {
        spawned.stdin.on("error", (error2) => {
          reject(error2);
        });
      }
    });
  };
  promise = {
    mergePromise,
    getSpawnedPromise
  };
  return promise;
}
var command;
var hasRequiredCommand;
function requireCommand() {
  if (hasRequiredCommand) return command;
  hasRequiredCommand = 1;
  const normalizeArgs = (file2, args2 = []) => {
    if (!Array.isArray(args2)) {
      return [file2];
    }
    return [file2, ...args2];
  };
  const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
  const DOUBLE_QUOTES_REGEXP = /"/g;
  const escapeArg = (arg) => {
    if (typeof arg !== "string" || NO_ESCAPE_REGEXP.test(arg)) {
      return arg;
    }
    return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
  };
  const joinCommand = (file2, args2) => {
    return normalizeArgs(file2, args2).join(" ");
  };
  const getEscapedCommand = (file2, args2) => {
    return normalizeArgs(file2, args2).map((arg) => escapeArg(arg)).join(" ");
  };
  const SPACES_REGEXP = / +/g;
  const parseCommand = (command2) => {
    const tokens = [];
    for (const token of command2.trim().split(SPACES_REGEXP)) {
      const previousToken = tokens[tokens.length - 1];
      if (previousToken && previousToken.endsWith("\\")) {
        tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
      } else {
        tokens.push(token);
      }
    }
    return tokens;
  };
  command = {
    joinCommand,
    getEscapedCommand,
    parseCommand
  };
  return command;
}
var hasRequiredExeca;
function requireExeca() {
  if (hasRequiredExeca) return execa$1.exports;
  hasRequiredExeca = 1;
  const path$12 = path;
  const childProcess = require$$0;
  const crossSpawn2 = requireCrossSpawn();
  const stripFinalNewline2 = requireStripFinalNewline();
  const npmRunPath2 = requireNpmRunPath();
  const onetime2 = requireOnetime();
  const makeError = requireError();
  const normalizeStdio = requireStdio();
  const { spawnedKill, spawnedCancel, setupTimeout, validateTimeout, setExitHandler } = requireKill();
  const { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = requireStream();
  const { mergePromise, getSpawnedPromise } = requirePromise();
  const { joinCommand, parseCommand, getEscapedCommand } = requireCommand();
  const DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
  const getEnv = ({ env: envOption, extendEnv, preferLocal, localDir, execPath }) => {
    const env2 = extendEnv ? { ...process.env, ...envOption } : envOption;
    if (preferLocal) {
      return npmRunPath2.env({ env: env2, cwd: localDir, execPath });
    }
    return env2;
  };
  const handleArguments = (file2, args2, options = {}) => {
    const parsed = crossSpawn2._parse(file2, args2, options);
    file2 = parsed.command;
    args2 = parsed.args;
    options = parsed.options;
    options = {
      maxBuffer: DEFAULT_MAX_BUFFER,
      buffer: true,
      stripFinalNewline: true,
      extendEnv: true,
      preferLocal: false,
      localDir: options.cwd || process.cwd(),
      execPath: process.execPath,
      encoding: "utf8",
      reject: true,
      cleanup: true,
      all: false,
      windowsHide: true,
      ...options
    };
    options.env = getEnv(options);
    options.stdio = normalizeStdio(options);
    if (process.platform === "win32" && path$12.basename(file2, ".exe") === "cmd") {
      args2.unshift("/q");
    }
    return { file: file2, args: args2, options, parsed };
  };
  const handleOutput = (options, value, error2) => {
    if (typeof value !== "string" && !Buffer.isBuffer(value)) {
      return error2 === void 0 ? void 0 : "";
    }
    if (options.stripFinalNewline) {
      return stripFinalNewline2(value);
    }
    return value;
  };
  const execa2 = (file2, args2, options) => {
    const parsed = handleArguments(file2, args2, options);
    const command2 = joinCommand(file2, args2);
    const escapedCommand = getEscapedCommand(file2, args2);
    validateTimeout(parsed.options);
    let spawned;
    try {
      spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
    } catch (error2) {
      const dummySpawned = new childProcess.ChildProcess();
      const errorPromise = Promise.reject(makeError({
        error: error2,
        stdout: "",
        stderr: "",
        all: "",
        command: command2,
        escapedCommand,
        parsed,
        timedOut: false,
        isCanceled: false,
        killed: false
      }));
      return mergePromise(dummySpawned, errorPromise);
    }
    const spawnedPromise = getSpawnedPromise(spawned);
    const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
    const processDone = setExitHandler(spawned, parsed.options, timedPromise);
    const context = { isCanceled: false };
    spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
    spawned.cancel = spawnedCancel.bind(null, spawned, context);
    const handlePromise = async () => {
      const [{ error: error2, exitCode, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(spawned, parsed.options, processDone);
      const stdout = handleOutput(parsed.options, stdoutResult);
      const stderr = handleOutput(parsed.options, stderrResult);
      const all = handleOutput(parsed.options, allResult);
      if (error2 || exitCode !== 0 || signal !== null) {
        const returnedError = makeError({
          error: error2,
          exitCode,
          signal,
          stdout,
          stderr,
          all,
          command: command2,
          escapedCommand,
          parsed,
          timedOut,
          isCanceled: context.isCanceled,
          killed: spawned.killed
        });
        if (!parsed.options.reject) {
          return returnedError;
        }
        throw returnedError;
      }
      return {
        command: command2,
        escapedCommand,
        exitCode: 0,
        stdout,
        stderr,
        all,
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false
      };
    };
    const handlePromiseOnce = onetime2(handlePromise);
    handleInput(spawned, parsed.options.input);
    spawned.all = makeAllStream(spawned, parsed.options);
    return mergePromise(spawned, handlePromiseOnce);
  };
  execa$1.exports = execa2;
  execa$1.exports.sync = (file2, args2, options) => {
    const parsed = handleArguments(file2, args2, options);
    const command2 = joinCommand(file2, args2);
    const escapedCommand = getEscapedCommand(file2, args2);
    validateInputSync(parsed.options);
    let result;
    try {
      result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
    } catch (error2) {
      throw makeError({
        error: error2,
        stdout: "",
        stderr: "",
        all: "",
        command: command2,
        escapedCommand,
        parsed,
        timedOut: false,
        isCanceled: false,
        killed: false
      });
    }
    const stdout = handleOutput(parsed.options, result.stdout, result.error);
    const stderr = handleOutput(parsed.options, result.stderr, result.error);
    if (result.error || result.status !== 0 || result.signal !== null) {
      const error2 = makeError({
        stdout,
        stderr,
        error: result.error,
        signal: result.signal,
        exitCode: result.status,
        command: command2,
        escapedCommand,
        parsed,
        timedOut: result.error && result.error.code === "ETIMEDOUT",
        isCanceled: false,
        killed: result.signal !== null
      });
      if (!parsed.options.reject) {
        return error2;
      }
      throw error2;
    }
    return {
      command: command2,
      escapedCommand,
      exitCode: 0,
      stdout,
      stderr,
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false
    };
  };
  execa$1.exports.command = (command2, options) => {
    const [file2, ...args2] = parseCommand(command2);
    return execa2(file2, args2, options);
  };
  execa$1.exports.commandSync = (command2, options) => {
    const [file2, ...args2] = parseCommand(command2);
    return execa2.sync(file2, args2, options);
  };
  execa$1.exports.node = (scriptPath, args2, options = {}) => {
    if (args2 && !Array.isArray(args2) && typeof args2 === "object") {
      options = args2;
      args2 = [];
    }
    const stdio2 = normalizeStdio.node(options);
    const defaultExecArgv = process.execArgv.filter((arg) => !arg.startsWith("--inspect"));
    const {
      nodePath: nodePath2 = process.execPath,
      nodeOptions = defaultExecArgv
    } = options;
    return execa2(
      nodePath2,
      [
        ...nodeOptions,
        scriptPath,
        ...Array.isArray(args2) ? args2 : []
      ],
      {
        ...options,
        stdin: void 0,
        stdout: void 0,
        stderr: void 0,
        stdio: stdio2,
        shell: false
      }
    );
  };
  return execa$1.exports;
}
var execaExports = requireExeca();
const execa = /* @__PURE__ */ getDefaultExportFromCjs(execaExports);
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const osc = `(?:\\u001B\\][^\\u0007\\u001B\\u009C]*${ST})`;
  const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
  const pattern = `${osc}|${csi}`;
  return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
const regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  if (!string.includes("\x1B") && !string.includes("")) {
    return string;
  }
  return string.replace(regex, "");
}
const detectDefaultShell = () => {
  const { env: env2 } = process$1;
  if (process$1.platform === "win32") {
    return env2.COMSPEC || "cmd.exe";
  }
  try {
    const { shell } = node_os.userInfo();
    if (shell) {
      return shell;
    }
  } catch {
  }
  if (process$1.platform === "darwin") {
    return env2.SHELL || "/bin/zsh";
  }
  return env2.SHELL || "/bin/sh";
};
const defaultShell = detectDefaultShell();
const args = [
  "-ilc",
  // Use the command builtin to avoid shell aliases or functions named `env`.
  'echo -n "_SHELL_ENV_DELIMITER_"; command env; echo -n "_SHELL_ENV_DELIMITER_"; exit'
];
const env = {
  // Disables Oh My Zsh auto-update thing that can block the process.
  DISABLE_AUTO_UPDATE: "true",
  // Prevents the oh-my-zsh tmux plugin from auto-starting.
  ZSH_TMUX_AUTOSTARTED: "true",
  ZSH_TMUX_AUTOSTART: "false"
};
const parseEnv = (env2) => {
  env2 = env2.split("_SHELL_ENV_DELIMITER_")[1];
  const returnValue = {};
  for (const line of stripAnsi(env2).split("\n").filter(Boolean)) {
    const [key, ...values] = line.split("=");
    returnValue[key] = values.join("=");
  }
  return returnValue;
};
const fallbackShells = ["/bin/zsh", "/bin/bash"].filter((shell) => shell !== defaultShell);
function tryFallbackShellsSync() {
  for (const shell of fallbackShells) {
    try {
      const { stdout } = execa.sync(shell, args, { env });
      return parseEnv(stdout);
    } catch {
    }
  }
  return process$1.env;
}
function shellEnvSync(shell) {
  if (process$1.platform === "win32") {
    return process$1.env;
  }
  try {
    const { stdout } = execa.sync(shell || defaultShell, args, { env });
    return parseEnv(stdout);
  } catch (error2) {
    return tryFallbackShellsSync();
  }
}
function shellPathSync(options) {
  const { PATH } = shellEnvSync(options?.shell);
  return PATH;
}
function fixPath() {
  if (process$1.platform === "win32") {
    return;
  }
  process$1.env.PATH = shellPathSync() || [
    "./node_modules/.bin",
    "/.nodebrew/current/bin",
    "/usr/local/bin",
    process$1.env.PATH
  ].join(":");
}
/**
 * @license
 * Copyright 2026 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const eventEmitter = new EventEmitter();
const interceptors = [];
const listenerWrappers = /* @__PURE__ */ new Map();
const noop = () => {
};
let emitToAdapter = () => void 0;
let disconnectAdapter;
const createRequestId = (key) => `${key}${Math.random().toString(16).slice(2, 10)}`;
const adapter = (config) => {
  disconnectAdapter?.();
  emitToAdapter = config.emit;
  const disconnect = config.on({
    emit(name2, data, ...args2) {
      return eventEmitter.emit(name2, data, ...args2);
    }
  });
  disconnectAdapter = typeof disconnect === "function" ? disconnect : void 0;
};
const emit = (name2, data, ...args2) => {
  emitToAdapter(name2, data, ...args2);
};
const off = (name2, callback) => {
  const wrappers = listenerWrappers.get(name2)?.get(callback);
  if (!wrappers) {
    eventEmitter.off(name2, callback);
    return;
  }
  for (const wrapper of wrappers) {
    eventEmitter.off(name2, wrapper);
  }
  listenerWrappers.get(name2)?.delete(callback);
  if (listenerWrappers.get(name2)?.size === 0) {
    listenerWrappers.delete(name2);
  }
};
const on = (name2, callback) => {
  const wrapped = (...args2) => {
    if (/^subscribe(\.callback)?-/.test(name2) || interceptors.length === 0) {
      return callback(...args2);
    }
    void Promise.all(interceptors.map((interceptor) => interceptor({ name: name2, data: args2[0] }))).then(
      () => callback(...args2)
    );
    return void 0;
  };
  let callbacks = listenerWrappers.get(name2);
  if (!callbacks) {
    callbacks = /* @__PURE__ */ new Map();
    listenerWrappers.set(name2, callbacks);
  }
  let wrappers = callbacks.get(callback);
  if (!wrappers) {
    wrappers = /* @__PURE__ */ new Set();
    callbacks.set(callback, wrappers);
  }
  wrappers.add(wrapped);
  eventEmitter.on(name2, wrapped);
  return () => {
    eventEmitter.off(name2, wrapped);
    wrappers.delete(wrapped);
    if (wrappers.size === 0) {
      callbacks.delete(callback);
    }
    if (callbacks.size === 0) {
      listenerWrappers.delete(name2);
    }
  };
};
const intercept = (callback) => {
  interceptors.push(callback);
  return () => {
    const index2 = interceptors.indexOf(callback);
    if (index2 >= 0) {
      interceptors.splice(index2, 1);
    }
  };
};
const subscribe = (name2, handler) => on(`subscribe-${name2}`, (request) => {
  if (typeof request !== "object" || request === null || !("id" in request) || typeof request.id !== "string") {
    return;
  }
  Promise.resolve(handler(request.data)).then((result) => emit(`subscribe.callback-${name2}${request.id}`, result)).catch((error2) => {
    console.error(`[bridge] Provider "${name2}" failed:`, error2);
  });
});
const invoke = (name2, data) => {
  const id = createRequestId(name2);
  const callbackName = `subscribe.callback-${name2}${id}`;
  return new Promise((resolve) => {
    const dispose = on(callbackName, (result) => {
      dispose();
      resolve(result);
    });
    emit(`subscribe-${name2}`, { id, data });
  });
};
const buildProvider = (key) => {
  let disposeProvider = noop;
  return {
    provider(handler) {
      disposeProvider();
      disposeProvider = subscribe(key, handler);
      return disposeProvider;
    },
    invoke: ((params) => invoke(key, params))
  };
};
const buildEmitter = (key) => ({
  on: ((callback) => on(key, callback)),
  emit: ((params) => emit(key, params))
});
const bridge = {
  adapter,
  buildEmitter,
  buildProvider,
  emit,
  intercept,
  invoke,
  off,
  on,
  subscribe
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const ADAPTER_BRIDGE_EVENT_KEY = "office-ai-bridge-adapter";
const webSocketBroadcasters = [];
function broadcastToAll(name2, data) {
  for (const broadcast of webSocketBroadcasters) {
    try {
      broadcast(name2, data);
    } catch (error2) {
      console.error("[registry] WebSocket broadcast error:", error2);
    }
  }
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const adapterWindowList = [];
let petNotifyHook = null;
const setPetNotifyHook = (hook) => {
  petNotifyHook = hook;
};
const MAX_IPC_PAYLOAD_SIZE = 50 * 1024 * 1024;
bridge.adapter({
  emit(name2, data) {
    if (petNotifyHook) {
      try {
        petNotifyHook(name2, data);
      } catch {
      }
    }
    let serialized;
    try {
      serialized = JSON.stringify({ name: name2, data });
    } catch (error2) {
      console.error("[adapter] Failed to serialize bridge event:", name2, error2);
      return;
    }
    if (serialized.length > MAX_IPC_PAYLOAD_SIZE) {
      console.error(
        `[adapter] Bridge event "${name2}" too large (${(serialized.length / 1024 / 1024).toFixed(1)}MB), skipped`
      );
      const errorPayload = JSON.stringify({
        name: "bridge:error",
        data: { originalEvent: name2, reason: "payload_too_large", size: serialized.length }
      });
      for (let i = adapterWindowList.length - 1; i >= 0; i--) {
        const win = adapterWindowList[i];
        if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
          win.webContents.send(ADAPTER_BRIDGE_EVENT_KEY, errorPayload);
        }
      }
      return;
    }
    for (let i = adapterWindowList.length - 1; i >= 0; i--) {
      const win = adapterWindowList[i];
      if (win.isDestroyed() || win.webContents.isDestroyed()) {
        adapterWindowList.splice(i, 1);
        continue;
      }
      win.webContents.send(ADAPTER_BRIDGE_EVENT_KEY, serialized);
    }
    broadcastToAll(name2, data);
  },
  on(emitter) {
    require$$0$1.ipcMain.handle(ADAPTER_BRIDGE_EVENT_KEY, (_event, info) => {
      const { name: name2, data } = JSON.parse(info);
      return Promise.resolve(emitter.emit(name2, data));
    });
  }
});
const initMainAdapterWithWindow = (win) => {
  adapterWindowList.push(win);
  const off2 = () => {
    const index2 = adapterWindowList.indexOf(win);
    if (index2 > -1) adapterWindowList.splice(index2, 1);
  };
  win.on("closed", off2);
  return off2;
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function hasCompleteModelIdentity(model2) {
  return Boolean(
    model2 && typeof model2.id === "string" && model2.id.trim().length > 0 && typeof model2.use_model === "string" && model2.use_model.trim().length > 0
  );
}
function toApiModel(m) {
  return {
    provider_id: m.id,
    model: m.use_model
  };
}
function toApiModelOptional(m) {
  return hasCompleteModelIdentity(m) ? toApiModel(m) : void 0;
}
function buildCreateConversationBody(p) {
  const hasAssistant = p.assistant !== void 0 && p.assistant !== null;
  const body = {
    type: hasAssistant ? void 0 : p.type,
    id: p.id,
    name: p.name,
    assistant: p.assistant,
    extra: p.extra
  };
  const model2 = p.type === "acp" ? void 0 : toApiModelOptional(p.model);
  if (model2) body.model = model2;
  return body;
}
function fromApiModel(raw) {
  return {
    id: raw.provider_id,
    platform: "",
    name: "",
    base_url: "",
    api_key: "",
    use_model: raw.use_model ?? raw.model
  };
}
function fromApiModelOptional(raw) {
  return raw ? fromApiModel(raw) : void 0;
}
function fromApiConversation(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw;
  const next = { ...r };
  if ("model" in r) {
    next.model = fromApiModelOptional(r.model);
  }
  const extra = r.extra;
  if (extra && typeof extra === "object" && !("custom_workspace" in extra)) {
    const workspace2 = typeof extra.workspace === "string" ? extra.workspace : "";
    const isTemporary = extra.is_temporary_workspace === true;
    next.extra = {
      ...extra,
      custom_workspace: workspace2.length > 0 && !isTemporary
    };
  }
  return next;
}
function fromApiPaginatedConversations(result) {
  return {
    ...result,
    items: result.items.map(fromApiConversation)
  };
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const WS_CLOSE_POLICY_VIOLATION = 1008;
const REFRESH_ENDPOINT$1 = "/api/auth/refresh";
function isWebUiBrowserMode$1() {
  return typeof window !== "undefined" && typeof document !== "undefined" && !window.__backendPort;
}
let inFlight = null;
function refreshSession() {
  if (!isWebUiBrowserMode$1()) {
    return Promise.resolve(false);
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = performRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
async function performRefresh() {
  try {
    const headers = {};
    const csrfToken = resolveCoreCsrfToken();
    if (csrfToken) ;
    const response = await fetch(REFRESH_ENDPOINT$1, {
      method: "POST",
      // Same-origin request: the browser attaches the HttpOnly refresh cookie
      // (scoped to Path=/api/auth/refresh). No body is needed — the backend reads
      // the cookie and only falls back to a body token for legacy native clients.
      credentials: "include",
      headers
    });
    return response.ok;
  } catch {
    return false;
  }
}
function getBackendPort() {
  if (typeof window !== "undefined" && window.__backendPort) {
    return window.__backendPort;
  }
  const g = globalThis;
  return g.__backendPort ?? 13400;
}
function isWebUiBrowserMode() {
  return typeof window !== "undefined" && typeof document !== "undefined" && !window.__backendPort;
}
function getBaseUrl() {
  if (isWebUiBrowserMode()) {
    return "";
  }
  return `http://127.0.0.1:${getBackendPort()}`;
}
function getWsUrl() {
  if (isWebUiBrowserMode()) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }
  return `ws://127.0.0.1:${getBackendPort()}/ws`;
}
class BackendHttpError extends Error {
  status;
  /** Machine-readable error code from the backend `ErrorResponse.code`, or `''` when parse failed. */
  code;
  /** Backend-provided human message from `ErrorResponse.error`, or the raw body when parse failed. */
  backendMessage;
  /** Structured backend metadata from `ErrorResponse.details`, when present. */
  details;
  /** Raw parsed body (object on JSON response, string on text/non-JSON). */
  body;
  constructor(params) {
    const { method, path: path2, status: status2, body } = params;
    let code = "";
    let backendMessage = "";
    let details;
    if (body && typeof body === "object") {
      const b = body;
      if (typeof b.code === "string") code = b.code;
      if (typeof b.error === "string") backendMessage = b.error;
      details = b.details;
    } else if (typeof body === "string") {
      backendMessage = body;
    }
    super(`Backend ${method} ${path2} failed (${status2}): ${JSON.stringify(body)}`);
    this.name = "BackendHttpError";
    this.status = status2;
    this.code = code;
    this.backendMessage = backendMessage;
    this.details = details;
    this.body = body;
  }
}
const SENSITIVE_LOG_KEY_PATTERN = /api[_-]?key|authorization|auth[_-]?token|access[_-]?token|refresh[_-]?token|secret/i;
function redactForLog(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item, depth + 1));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_LOG_KEY_PATTERN.test(key) ? "[REDACTED]" : redactForLog(entry, depth + 1)
    ])
  );
}
const REFRESH_ENDPOINT = "/api/auth/refresh";
function isAuthEndpoint(path2) {
  return path2.startsWith(REFRESH_ENDPOINT) || path2 === "/login" || path2 === "/logout";
}
function resolveCoreCsrfToken() {
  return "";
}
function sendHttpRequest(method, path2, headers, body) {
  const url = `${getBaseUrl()}${path2}`;
  return fetch(url, {
    method,
    headers,
    body: body !== void 0 ? JSON.stringify(body) : void 0
  });
}
async function httpRequest(method, path2, body, options) {
  const headers = {};
  if (body !== void 0) {
    headers["Content-Type"] = "application/json";
  }
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  console.debug(
    `[httpBridge] ${method} ${path2}`,
    body !== void 0 ? JSON.stringify(redactForLog(body)).slice(0, 500) : "(no body)"
  );
  let response = await sendHttpRequest(method, path2, headers, body);
  if (response.status === 401 && !isAuthEndpoint(path2)) {
    console.debug(`[httpBridge] ${method} ${path2} → 401, attempting session refresh`);
    const refreshed = await refreshSession();
    if (refreshed) {
      console.debug(`[httpBridge] session refreshed, replaying ${method} ${path2}`);
      response = await sendHttpRequest(method, path2, headers, body);
    }
  }
  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    let errorBody;
    try {
      errorBody = JSON.parse(rawText);
    } catch {
      errorBody = rawText;
    }
    if (options?.silentStatuses?.includes(response.status)) {
      console.debug(`[httpBridge] ${method} ${path2} → ${response.status} (silenced)`, errorBody);
    } else {
      console.error(`[httpBridge] ${method} ${path2} → ${response.status}`, errorBody);
    }
    throw new BackendHttpError({ method, path: path2, status: response.status, body: errorBody });
  }
  console.debug(`[httpBridge] ${method} ${path2} → ${response.status} OK`);
  const contentType = response.headers.get("Content-Type");
  if (!contentType?.includes("application/json")) {
    return void 0;
  }
  const json = await response.json();
  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }
  return json;
}
function withResponseMap(inner, map) {
  return {
    provider: () => {
    },
    invoke: (async (params) => {
      const raw = await inner.invoke(params);
      return map(raw);
    })
  };
}
function httpGet(path2, options) {
  return {
    provider: () => {
    },
    invoke: (async (params) => {
      const resolvedPath = typeof path2 === "function" ? path2(params) : path2;
      return httpRequest("GET", resolvedPath, void 0, options);
    })
  };
}
function httpPost(path2, mapBody) {
  return {
    provider: () => {
    },
    invoke: (async (params) => {
      const resolvedPath = typeof path2 === "function" ? path2(params) : path2;
      const body = mapBody ? mapBody(params) : params;
      return httpRequest("POST", resolvedPath, body);
    })
  };
}
function httpPatch(path2, mapBody) {
  return {
    provider: () => {
    },
    invoke: (async (params) => {
      const resolvedPath = typeof path2 === "function" ? path2(params) : path2;
      const body = mapBody ? mapBody(params) : params;
      return httpRequest("PATCH", resolvedPath, body);
    })
  };
}
function httpDelete(path2) {
  return {
    provider: () => {
    },
    invoke: (async (params) => {
      const resolvedPath = typeof path2 === "function" ? path2(params) : path2;
      return httpRequest("DELETE", resolvedPath);
    })
  };
}
const REALTIME_RECONNECTED_EVENT = "realtime.reconnected";
const wsListeners = /* @__PURE__ */ new Map();
let ws = null;
let wsReconnectTimer = null;
let wsReconnectAttempt = 0;
let wsHasOpened = false;
function dispatchWsEvent(eventName, payload) {
  const handlers = wsListeners.get(eventName);
  if (!handlers) return;
  for (const handler of handlers) {
    try {
      handler(payload);
    } catch {
    }
  }
}
function ensureWs() {
  if (typeof window === "undefined") {
    console.debug("[ensureWs] skipped: no window");
    return;
  }
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.debug("[ensureWs] skipped: already open/connecting, readyState=", ws.readyState);
    return;
  }
  const url = getWsUrl();
  console.debug("[ensureWs] connecting to", url);
  try {
    ws = new WebSocket(url);
  } catch (e) {
    console.error("[ensureWs] WebSocket constructor threw:", e);
    scheduleWsReconnect();
    return;
  }
  const current = ws;
  current.addEventListener("open", () => {
    console.debug("[ensureWs] CONNECTED");
    const isReconnect = wsHasOpened;
    wsHasOpened = true;
    wsReconnectAttempt = 0;
    if (isReconnect) {
      dispatchWsEvent(REALTIME_RECONNECTED_EVENT, { timestamp: Date.now() });
    }
  });
  current.addEventListener("close", (e) => {
    console.debug("[ensureWs] CLOSED code=" + e.code + " reason=" + e.reason);
    if (ws === current) ws = null;
    if (e.code === WS_CLOSE_POLICY_VIOLATION) {
      void handleWsAuthClose();
      return;
    }
    scheduleWsReconnect();
  });
  current.addEventListener("error", (e) => {
    console.error("[ensureWs] ERROR", e);
    current.close();
  });
  current.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data);
      const eventName = msg.name ?? msg.event;
      const payload = msg.data ?? msg.payload;
      console.debug("[WS:msg]", eventName, JSON.stringify(payload).slice(0, 200));
      if (eventName) {
        dispatchWsEvent(eventName, payload);
      }
    } catch {
    }
  });
}
function scheduleWsReconnect() {
  if (wsReconnectTimer) return;
  const delay = Math.min(1e3 * Math.pow(2, wsReconnectAttempt), 3e4);
  wsReconnectAttempt++;
  wsReconnectTimer = setTimeout(() => {
    wsReconnectTimer = null;
    ensureWs();
  }, delay);
}
async function handleWsAuthClose() {
  const refreshed = await refreshSession();
  if (refreshed) {
    wsReconnectAttempt = 0;
    ensureWs();
  }
}
function wsEmitter(eventName) {
  return {
    on: (callback) => {
      ensureWs();
      if (!wsListeners.has(eventName)) {
        wsListeners.set(eventName, /* @__PURE__ */ new Set());
      }
      const cb = callback;
      wsListeners.get(eventName).add(cb);
      return () => {
        wsListeners.get(eventName)?.delete(cb);
      };
    },
    emit: (() => {
    })
  };
}
function wsMappedEmitter(eventName, transform) {
  const inner = wsEmitter(eventName);
  return {
    on: (callback) => {
      return inner.on((raw) => {
        callback(transform(raw));
      });
    },
    emit: (() => {
    })
  };
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function fromApiSearchResult(result) {
  return {
    ...result,
    items: result.items.map(fromApiSearchItem)
  };
}
function fromApiSearchItem(item) {
  return {
    conversation: fromApiConversation({
      ...item.conversation,
      model: item.conversation.model ?? void 0
    }),
    message_id: item.message_id,
    message_type: item.message_type,
    message_created_at: item.message_created_at,
    preview_text: item.preview_text
  };
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function normalizeSlashes(p) {
  return p.replace(/\\/g, "/");
}
function stripTrailingSlash(p) {
  return p.replace(/\/+$/, "");
}
function resolveWebSkillRoot(skillLocation) {
  const normalized = stripTrailingSlash(normalizeSlashes(skillLocation));
  if (normalized.split("/").at(-1)?.toLowerCase() !== "skill.md") return normalized;
  return normalized.slice(0, normalized.lastIndexOf("/")) || "/";
}
function resolveWebSkillFile(skillLocation, relativePath) {
  const workspace2 = resolveWebSkillRoot(skillLocation);
  const normalizedRelativePath = normalizeSlashes(relativePath).replace(/^\/+/, "");
  return {
    path: `${stripTrailingSlash(workspace2)}/${normalizedRelativePath}`,
    workspace: workspace2
  };
}
function absoluteToRelativePath(absolutePath, workspace2) {
  if (!absolutePath || !workspace2) return absolutePath || ".";
  const abs = stripTrailingSlash(normalizeSlashes(absolutePath));
  const ws2 = stripTrailingSlash(normalizeSlashes(workspace2));
  if (abs === ws2) return ".";
  if (abs.startsWith(ws2 + "/")) {
    return abs.slice(ws2.length + 1) || ".";
  }
  return absolutePath;
}
function fromBackendFsEntry(item, workspace2, parentRelPath) {
  const ws2 = stripTrailingSlash(workspace2);
  const name2 = item.name || "";
  const isDir = item.type === "directory";
  const relativePath = parentRelPath ? `${parentRelPath}/${name2}` : name2;
  return {
    name: name2,
    fullPath: `${ws2}/${relativePath}`,
    relativePath,
    isDir,
    isFile: !isDir
  };
}
function fromBackendWorkspaceList(raw, workspace2, relPath) {
  const ws2 = stripTrailingSlash(workspace2);
  const base = relPath === "." ? "" : relPath;
  const children = raw.map((item) => fromBackendFsEntry(item, ws2, base));
  if (relPath === "." || !relPath) {
    const rootName = ws2.split("/").pop() || "";
    return [
      {
        name: rootName,
        fullPath: ws2,
        relativePath: "",
        isDir: true,
        isFile: false,
        children
      }
    ];
  }
  const dirName = relPath.split("/").pop() || "";
  return [
    {
      name: dirName,
      fullPath: `${ws2}/${relPath}`,
      relativePath: relPath,
      isDir: true,
      isFile: false,
      children
    }
  ];
}
function compareSkillFileNodes(a, b) {
  const aPinned = a.relativePath.toLowerCase() === "skill.md";
  const bPinned = b.relativePath.toLowerCase() === "skill.md";
  if (aPinned !== bPinned) return aPinned ? -1 : 1;
  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
  return a.name.localeCompare(b.name, void 0, { sensitivity: "base" });
}
function fromBackendSkillFileNodes(raw, parentPath = "") {
  return raw.map((entry) => {
    const rawRelativePath = entry.relative_path ?? entry.relativePath;
    const relativePath = normalizeSlashes(rawRelativePath ?? [parentPath, entry.name].filter(Boolean).join("/")).replace(/^\.\//, "").replace(/^\/+/, "");
    const isDirectory2 = entry.is_dir ?? entry.isDir ?? !(entry.is_file ?? entry.isFile ?? true);
    return {
      name: entry.name,
      relativePath,
      type: isDirectory2 ? "directory" : "file",
      ...isDirectory2 ? { children: fromBackendSkillFileNodes(Array.isArray(entry.children) ? entry.children : [], relativePath) } : {}
    };
  }).toSorted(compareSkillFileNodes);
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const conversation = {
  create: withResponseMap(
    httpPost("/api/conversations", (p) => buildCreateConversationBody(p)),
    fromApiConversation
  ),
  createWithConversation: withResponseMap(
    httpPost("/api/conversations/clone", (p) => {
      const isAionrs = p.conversation.type === "aionrs";
      const { model: _rawModel, ...rest } = p.conversation;
      const clonedConversation = { ...rest };
      if (isAionrs) {
        const model2 = toApiModelOptional(_rawModel);
        if (model2) clonedConversation.model = model2;
      }
      return {
        conversation: clonedConversation
      };
    }),
    fromApiConversation
  ),
  get: withResponseMap(
    httpGet((p) => `/api/conversations/${p.id}`, { silentStatuses: [404] }),
    fromApiConversation
  ),
  getAssociateConversation: withResponseMap(
    httpGet(
      (p) => `/api/conversations/${p.conversation_id}/associated`
    ),
    (list) => list.map(fromApiConversation)
  ),
  listByCronJob: withResponseMap(
    httpGet((p) => `/api/cron/jobs/${p.cron_job_id}/conversations`),
    (list) => list.map(fromApiConversation)
  ),
  remove: httpDelete((p) => `/api/conversations/${p.id}`),
  // `name_source` qualifies a `name` change: 'user' = explicit rename (backend
  // locks the name against agent-generated titles; also the default when absent),
  // 'auto' = frontend-derived default title (stays agent-overwritable).
  update: httpPatch(
    (p) => `/api/conversations/${p.id}`,
    (p) => {
      const updates = p.updates;
      const { model: rawModel, ...rest } = updates;
      const model2 = toApiModelOptional(rawModel);
      return {
        ...rest,
        ...model2 ? { model: model2 } : {},
        merge_extra: p.merge_extra
      };
    }
  ),
  reset: httpPost((p) => `/api/conversations/${p.id}/reset`),
  /**
   * Fork the conversation at a message (inclusive) into a new conversation.
   * The backend session materializes on the fork's first open — callers should
   * follow up with `ensureRuntime` on the returned id to surface failures
   * eagerly. Error reasons carry stable `FORK_*` prefixes for i18n mapping.
   */
  fork: withResponseMap(
    httpPost(
      (p) => `/api/conversations/${p.conversation_id}/fork`,
      (p) => ({ message_id: p.message_id })
    ),
    fromApiConversation
  ),
  ensureRuntime: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/runtime/ensure`,
    () => void 0
  ),
  /**
   * Restart the conversation's agent runtime: tears down the cached CLI agent
   * process (cancelling any active turn) and respawns it, resuming the session
   * when possible. Chat history is preserved. Used after external CLI config
   * changes (e.g. a ccswitch channel switch) that a running process cannot
   * pick up on its own.
   */
  restartRuntime: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/runtime/restart`,
    () => void 0
  ),
  activeLease: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/active-lease`,
    () => void 0
  ),
  stop: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/cancel`,
    (p) => ({ turn_id: p.turn_id })
  ),
  killTerminal: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/terminals/${encodeURIComponent(p.terminal_id)}/kill`,
    () => void 0
  ),
  activeCount: httpGet("/api/conversations/active-count"),
  sendMessage: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/messages`,
    (p) => ({
      content: p.input,
      files: p.files,
      // `@@` session references. Omitting this silently breaks the feature end
      // to end: the backend's send-boundary resolver would always see an empty
      // list and neither side would report an error.
      sessions: p.sessions,
      loading_id: p.loading_id,
      inject_skills: p.inject_skills
    })
  ),
  getSlashCommands: httpGet(
    (p) => `/api/conversations/${p.conversation_id}/slash-commands`
  ),
  // Latest context-usage snapshot (ACP UsageUpdate shape: tokens in context /
  // window size / cumulative cost, with per-turn counters under _meta).
  // Null until the agent reports usage.
  getUsage: httpGet((p) => `/api/conversations/${p.conversation_id}/usage`),
  askSideQuestion: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/side-question`,
    (p) => ({ question: p.question })
  ),
  confirmMessage: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/confirmations/${encodeURIComponent(p.call_id)}/confirm`,
    (p) => ({ msg_id: p.msg_id, data: p.confirm_key })
  ),
  // Dedicated answer channel for the structured question card (AskUserQuestion)
  // — question answers must not ride the permission confirm endpoint
  // (2026-08-05 ruling). Send either answers[] or decline:true, never both.
  answerAsk: httpPost(
    (p) => `/api/conversations/${p.conversation_id}/asks/${encodeURIComponent(p.request_id)}/answer`,
    (p) => p.decline ? { decline: true } : { answers: p.answers ?? [] }
  ),
  listArtifacts: httpGet(
    (p) => `/api/conversations/${p.conversation_id}/artifacts`
  ),
  updateArtifact: httpPatch(
    (p) => `/api/conversations/${p.conversation_id}/artifacts/${p.artifact_id}`,
    (p) => ({ status: p.status })
  ),
  responseStream: wsEmitter("message.stream"),
  userCreated: wsEmitter("message.userCreated"),
  /** Fired when the agent actually consumes a mid-turn-delivered message
   * (claude command_lifecycle Started; codex synthetic receipt). Flips the
   * message row from 'pending' to 'finish'; correlate by `msg_id`, never by
   * text/time. */
  statusChanged: wsEmitter("message.statusChanged"),
  artifactStream: wsEmitter("conversation.artifact"),
  turnCompleted: wsMappedEmitter("turn.completed", (raw) => {
    const r = raw;
    const rawLast = r.last_message ?? r.lastMessage;
    const last_message = rawLast ? {
      id: rawLast.id,
      type: rawLast.type,
      content: rawLast.content ?? null,
      status: rawLast.status,
      created_at: rawLast.created_at ?? rawLast.createdAt ?? Date.now()
    } : {
      content: null,
      created_at: Date.now()
    };
    const rawRuntime = r.runtime ?? {};
    const runtime2 = {
      state: rawRuntime.state ?? "idle",
      can_send_message: rawRuntime.can_send_message ?? rawRuntime.canSendMessage ?? true,
      has_task: rawRuntime.has_task ?? rawRuntime.hasTask ?? false,
      task_status: rawRuntime.task_status ?? rawRuntime.taskStatus,
      is_processing: rawRuntime.is_processing ?? rawRuntime.isProcessing ?? false,
      pending_confirmations: rawRuntime.pending_confirmations ?? rawRuntime.pendingConfirmations ?? 0,
      turn_id: rawRuntime.turn_id ?? rawRuntime.turnId ?? null,
      supports_midturn_delivery: rawRuntime.supports_midturn_delivery ?? rawRuntime.supportsMidturnDelivery ?? false
    };
    const rawModel = r.model ?? {};
    const model2 = {
      platform: rawModel.platform ?? "",
      name: rawModel.name ?? "",
      use_model: rawModel.use_model ?? rawModel.useModel ?? ""
    };
    return {
      session_id: r.session_id ?? r.sessionId ?? r.conversation_id ?? "",
      turn_id: r.turn_id ?? r.turnId ?? runtime2.turn_id ?? "",
      status: r.status ?? "finished",
      state: r.state ?? (r.status === "finished" ? "ai_waiting_input" : "unknown"),
      detail: r.detail ?? "",
      can_send_message: r.can_send_message ?? r.canSendMessage ?? r.status === "finished",
      runtime: runtime2,
      workspace: r.workspace ?? "",
      model: model2,
      last_message
    };
  }),
  listChanged: wsEmitter("conversation.listChanged"),
  // Uses httpRequest directly (instead of httpGet + withResponseMap) because the
  // response mapper needs `workspace` from params to build fullPath/relativePath,
  // and withResponseMap's map function does not receive the original params.
  getWorkspace: {
    provider: () => {
    },
    invoke: (async (p) => {
      const rel = absoluteToRelativePath(p.path, p.workspace);
      const url = `/api/conversations/${p.conversation_id}/workspace?path=${encodeURIComponent(rel)}${p.search ? `&search=${encodeURIComponent(p.search)}` : ""}`;
      const raw = await httpRequest("GET", url);
      return fromBackendWorkspaceList(raw, p.workspace, rel);
    })
  },
  confirmation: {
    confirm: httpPost(
      (p) => `/api/conversations/${p.conversation_id}/confirmations/${encodeURIComponent(p.call_id)}/confirm`,
      (p) => ({ msg_id: p.msg_id, data: p.data, always_allow: p.always_allow ?? false })
    ),
    list: httpGet(
      (p) => `/api/conversations/${p.conversation_id}/confirmations`
    ),
    remove: wsEmitter("confirmation.remove")
  },
  approval: {
    check: httpGet(
      (p) => `/api/conversations/${p.conversation_id}/approvals/check?action=${encodeURIComponent(p.action)}${p.command_type ? `&command_type=${encodeURIComponent(p.command_type)}` : ""}`
    )
  }
};
const nativeShowOpen = bridge.buildProvider("show-open");
const isElectronRenderer = () => typeof window !== "undefined" && Boolean(window.electronAPI);
const dialog = {
  showOpen: {
    provider: nativeShowOpen.provider,
    invoke: ((options) => {
      return nativeShowOpen.invoke(options);
    })
  }
};
const webListSkillFiles = httpPost("/api/fs/dir");
const webReadSkillFile = httpPost("/api/fs/read");
const nativeListSkillFiles = bridge.buildProvider("skills.files.list");
const nativeReadSkillFile = bridge.buildProvider(
  "skills.files.read"
);
const fs = {
  listSkillFiles: {
    provider: nativeListSkillFiles.provider,
    invoke: async ({ skill_location }) => {
      if (isElectronRenderer()) return nativeListSkillFiles.invoke({ skill_location });
      const root = resolveWebSkillRoot(skill_location);
      const nodes = await webListSkillFiles.invoke({ dir: root, root });
      return fromBackendSkillFileNodes(nodes);
    }
  },
  readSkillFile: {
    provider: nativeReadSkillFile.provider,
    invoke: async ({ skill_location, relative_path }) => {
      if (isElectronRenderer()) return nativeReadSkillFile.invoke({ skill_location, relative_path });
      const content = await webReadSkillFile.invoke(resolveWebSkillFile(skill_location, relative_path));
      if (content === null) throw new Error("Skill file could not be read");
      return content;
    }
  }
};
const database = {
  getConversationMessages: httpGet((p) => {
    const params = new URLSearchParams();
    if (p.limit !== void 0) params.set("limit", String(p.limit));
    if (p.before) params.set("before", p.before);
    if (p.after) params.set("after", p.after);
    if (p.anchor_message_id) params.set("anchor_message_id", p.anchor_message_id);
    if (p.content_mode) params.set("content_mode", p.content_mode);
    const qs = params.toString();
    return `/api/conversations/${p.conversation_id}/messages${qs ? `?${qs}` : ""}`;
  }),
  getConversationMessage: httpGet((p) => `/api/conversations/${p.conversation_id}/messages/${encodeURIComponent(p.message_id)}`),
  /**
   * Newest message of one type, or null. Serves the plan bar: `upsert_message`
   * does not refresh `created_at`, so a plan row stays anchored at the start of
   * its turn and a busy turn buries it outside the paginated load.
   */
  getLatestConversationMessageOfType: httpGet((p) => `/api/conversations/${p.conversation_id}/messages/latest?type=${encodeURIComponent(p.type)}`),
  getUserConversations: withResponseMap(
    httpGet(
      (p) => {
        const params = new URLSearchParams();
        if (p.cursor) params.set("cursor", p.cursor);
        if (p.limit) params.set("limit", String(p.limit));
        const qs = params.toString();
        return `/api/conversations${qs ? `?${qs}` : ""}`;
      }
    ),
    fromApiPaginatedConversations
  ),
  searchConversationMessages: withResponseMap(
    httpGet(
      (p) => `/api/messages/search?keyword=${encodeURIComponent(p.keyword)}&page=${p.page ?? 1}&page_size=${p.page_size ?? 50}`
    ),
    fromApiSearchResult
  )
};
class ElectronWorkerProcess {
  constructor(up) {
    this.up = up;
  }
  postMessage(message) {
    this.up.postMessage(message);
  }
  on(event, handler) {
    this.up.on(event, handler);
    return this;
  }
  kill() {
    this.up.kill();
  }
}
class ElectronPlatformServices {
  paths = {
    getDataDir: () => require$$0$1.app.getPath("userData"),
    getTempDir: () => require$$0$1.app.getPath("temp"),
    getHomeDir: () => require$$0$1.app.getPath("home"),
    getLogsDir: () => {
      try {
        return require$$0$1.app.getPath("logs");
      } catch {
        return path.join(require$$0$1.app.getPath("userData"), "logs");
      }
    },
    getAppPath: () => require$$0$1.app.getAppPath(),
    isPackaged: () => require$$0$1.app.isPackaged,
    getSystemPath: (name2) => require$$0$1.app.getPath(name2),
    getName: () => require$$0$1.app.getName(),
    getVersion: () => require$$0$1.app.getVersion(),
    needsCliSafeSymlinks: () => process.platform === "darwin"
  };
  worker = {
    fork: (modulePath, args2, opts) => new ElectronWorkerProcess(
      require$$0$1.utilityProcess.fork(modulePath, args2, {
        cwd: opts.cwd,
        // Propagate DATA_DIR so utility processes can use NodePlatformServices
        // without needing access to app.getPath (unavailable in utility process).
        env: { DATA_DIR: require$$0$1.app.getPath("userData"), ...opts.env }
      })
    )
  };
  power = {
    preventSleep: () => require$$0$1.powerSaveBlocker.start("prevent-app-suspension"),
    allowSleep: (id) => {
      if (id !== null) require$$0$1.powerSaveBlocker.stop(id);
    },
    preventDisplaySleep: () => require$$0$1.powerSaveBlocker.start("prevent-display-sleep")
  };
  notification = {
    send: ({ title, body }) => {
      new require$$0$1.Notification({ title, body }).show();
    }
  };
  network = {
    fetch: (input, init) => require$$0$1.net.fetch(input instanceof URL ? input.toString() : input, init)
  };
}
registerPlatformServices(new ElectronPlatformServices());
/**
 * @license
 * Copyright 2026 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const buildStorage = (namespace) => {
  const getProvider = bridge.buildProvider(`${namespace}.storage.get`);
  const setProvider = bridge.buildProvider(`${namespace}.storage.set`);
  const removeProvider = bridge.buildProvider(`${namespace}.storage.remove`);
  const clearProvider = bridge.buildProvider(`${namespace}.storage.clear`);
  return {
    namespace,
    get(key) {
      return getProvider.invoke(String(key));
    },
    set(key, data) {
      return setProvider.invoke({ key: String(key), data });
    },
    remove(key) {
      return removeProvider.invoke(String(key));
    },
    clear() {
      return clearProvider.invoke();
    },
    interceptor(interceptor) {
      if (interceptor.get) {
        getProvider.provider((key) => interceptor.get?.(key));
      }
      if (interceptor.set) {
        setProvider.provider(({ key, data }) => interceptor.set?.(key, data));
      }
      if (interceptor.remove) {
        removeProvider.provider(async (key) => {
          await interceptor.remove?.(key);
        });
      }
      if (interceptor.clear) {
        clearProvider.provider(async () => {
          await interceptor.clear?.();
        });
      }
    }
  };
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const ConfigStorage = buildStorage("agent.config");
const EnvStorage = buildStorage("agent.env");
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function getEnvAwareName(baseName) {
  if (getPlatformServices().paths.isPackaged() === true) return baseName;
  const suffix = process.env.UBIDBUDDY_MULTI_INSTANCE === "1" ? "-dev-2" : "-dev";
  return `${baseName}${suffix}`;
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const hasElectronAppPath = () => {
  return typeof process.versions.electron === "string";
};
const getElectronPathOrFallback = (name2) => {
  const paths = getPlatformServices().paths;
  switch (name2) {
    case "temp":
      return paths.getTempDir();
    case "home":
      return paths.getHomeDir();
    case "userData":
      return paths.getDataDir();
  }
};
const getTempPath = () => {
  const rootPath = getElectronPathOrFallback("temp");
  return path.join(rootPath, "ubidbuddy");
};
const ensureCliSafeSymlink = (targetPath, symlinkName) => {
  if (!getPlatformServices().paths.needsCliSafeSymlinks()) {
    return targetPath;
  }
  const homePath = getElectronPathOrFallback("home");
  const symlinkPath = path.join(homePath, symlinkName);
  try {
    const stats = fs$1.lstatSync(symlinkPath);
    if (stats.isSymbolicLink()) {
      const target = fs$1.readlinkSync(symlinkPath);
      if (target === targetPath) {
        if (!fs$1.existsSync(targetPath)) {
          fs$1.mkdirSync(targetPath, { recursive: true });
        }
        return symlinkPath;
      }
      fs$1.unlinkSync(symlinkPath);
    } else if (stats.isDirectory()) {
      return targetPath;
    } else {
      fs$1.unlinkSync(symlinkPath);
    }
  } catch {
  }
  try {
    if (!fs$1.existsSync(targetPath)) {
      fs$1.mkdirSync(targetPath, { recursive: true });
    }
    fs$1.symlinkSync(targetPath, symlinkPath);
    return symlinkPath;
  } catch (error2) {
    return targetPath;
  }
};
const getDataPath = () => {
  const rootPath = getElectronPathOrFallback("userData");
  const dataPath = path.join(rootPath, "ubidbuddy");
  return ensureCliSafeSymlink(dataPath, getEnvAwareName(".ubidbuddy"));
};
const getConfigPath = () => {
  const rootPath = getElectronPathOrFallback("userData");
  const configPath = path.join(rootPath, "config");
  return ensureCliSafeSymlink(configPath, getEnvAwareName(".ubidbuddy-config"));
};
async function copyDirectoryRecursively(src, dest, options = {}) {
  const { overwrite = true } = options;
  const isWindows = process.platform === "win32";
  const normalizedSrc = isWindows ? path.resolve(src).toLowerCase() : path.resolve(src);
  const normalizedDest = isWindows ? path.resolve(dest).toLowerCase() : path.resolve(dest);
  if (normalizedSrc === normalizedDest) {
    throw new Error(`Cannot copy directory into itself: ${src}`);
  }
  if (normalizedDest.startsWith(normalizedSrc + path.sep)) {
    throw new Error(`Cannot copy directory into its subdirectory: ${src} -> ${dest}`);
  }
  if (normalizedSrc.startsWith(normalizedDest + path.sep)) {
    throw new Error(`Cannot copy parent directory into child directory: ${src} -> ${dest}`);
  }
  if (!fs$1.existsSync(dest)) {
    await fs$3.mkdir(dest, { recursive: true });
  }
  const entries = await fs$3.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!fs$1.existsSync(destPath)) {
        await fs$3.mkdir(destPath, { recursive: true });
      }
      await copyDirectoryRecursively(srcPath, destPath, options);
    } else {
      if (!overwrite && fs$1.existsSync(destPath)) {
        continue;
      }
      await fs$3.copyFile(srcPath, destPath);
    }
  }
}
async function verifyDirectoryFiles(dir1, dir2) {
  try {
    if (!fs$1.existsSync(dir1) || !fs$1.existsSync(dir2)) {
      return false;
    }
    const entries1 = await fs$3.readdir(dir1, { withFileTypes: true });
    const entries2 = await fs$3.readdir(dir2, { withFileTypes: true });
    if (entries1.length !== entries2.length) {
      return false;
    }
    entries1.sort((a, b) => a.name.localeCompare(b.name));
    entries2.sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < entries1.length; i++) {
      const entry1 = entries1[i];
      const entry2 = entries2[i];
      if (entry1.name !== entry2.name || entry1.isDirectory() !== entry2.isDirectory()) {
        return false;
      }
      if (entry1.isDirectory()) {
        const path1 = path.join(dir1, entry1.name);
        const path2 = path.join(dir2, entry2.name);
        if (!await verifyDirectoryFiles(path1, path2)) {
          return false;
        }
      }
    }
    return true;
  } catch (error2) {
    console.warn("[uBidBuddy] Error verifying directory files:", error2);
    return false;
  }
}
function ensureDirectory(dirPath) {
  try {
    const stats = fs$1.lstatSync(dirPath);
    if (stats.isDirectory()) {
      return;
    }
    if (stats.isSymbolicLink()) {
      if (fs$1.existsSync(dirPath)) {
        return;
      }
      fs$1.unlinkSync(dirPath);
    } else {
      fs$1.unlinkSync(dirPath);
    }
  } catch {
  }
  fs$1.mkdirSync(dirPath, { recursive: true });
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const BUILTIN_IMAGE_GEN_ID = "builtin-image-gen";
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const runLegacyDatabaseMigrations = async () => ({
  skipped: true,
  migrated: false,
  fromVersion: 0,
  toVersion: 0,
  handoffRepair: { repairedColumns: [] }
});
const nodePath = path;
const STORAGE_PATH = {
  config: "ubidbuddy-config.txt",
  chatMessage: "ubidbuddy-chat-message.txt",
  chat: "ubidbuddy-chat.txt",
  env: ".ubidbuddy-env",
  assistants: "assistants",
  skills: "skills",
  cronSkills: "cron-skills"
};
const LEGACY_BUILTIN_SKILLS_DIR = "builtin-skills";
const getHomePage = getConfigPath;
const mkdirSync = (path2) => {
  return fs$1.mkdirSync(path2, { recursive: true });
};
const migrateLegacyData = async () => {
  const oldDir = getTempPath();
  const newDir = getConfigPath();
  try {
    const isNewDirEmpty = !fs$1.existsSync(newDir) || (() => {
      try {
        return fs$1.existsSync(newDir) && fs$1.readdirSync(newDir).length === 0;
      } catch (error2) {
        console.warn("[uBidBuddy] Warning: Could not read new directory during migration check:", error2);
        return false;
      }
    })();
    if (fs$1.existsSync(oldDir) && isNewDirEmpty) {
      mkdirSync(newDir);
      await copyDirectoryRecursively(oldDir, newDir);
      const isVerified = await verifyDirectoryFiles(oldDir, newDir);
      if (isVerified) {
        if (path.resolve(oldDir) !== path.resolve(newDir)) {
          try {
            await fs$3.rm(oldDir, { recursive: true });
          } catch (cleanupError) {
            console.warn("[uBidBuddy] 原目录清理失败，请手动删除:", oldDir, cleanupError);
          }
        }
      }
      return true;
    }
  } catch (error2) {
    console.error("[uBidBuddy] 数据迁移失败:", error2);
  }
  return false;
};
const WriteFile = async (file_path, data) => {
  const dir = nodePath.dirname(file_path);
  await fs$3.mkdir(dir, { recursive: true });
  return fs$3.writeFile(file_path, data);
};
const JsonFileBuilder = (file_path) => {
  const encode = (data) => btoa(encodeURIComponent(String(data)));
  const decode = (base64) => decodeURIComponent(atob(base64));
  let cache = null;
  const loadSync = () => {
    try {
      const raw = fs$1.readFileSync(file_path).toString();
      if (!raw || raw.trim() === "") return {};
      const decoded = decode(raw);
      if (!decoded || decoded.trim() === "") return {};
      const parsed = JSON.parse(decoded);
      if (file_path.includes("chat.txt") && Object.keys(parsed).length === 0) {
        console.warn(`[Storage] Chat history file appears to be empty: ${file_path}`);
      }
      return parsed;
    } catch {
      return {};
    }
  };
  const ensureLoaded = () => {
    if (cache === null) {
      cache = loadSync();
    }
    return cache;
  };
  let writeChain = Promise.resolve();
  const persist = () => {
    const data = cache ?? {};
    const encoded = encode(JSON.stringify(data));
    const writeOp = writeChain.then(() => WriteFile(file_path, encoded));
    writeChain = writeOp.catch(() => {
    });
    return writeOp.then(
      () => data,
      (err) => {
        console.error(`[Storage] Failed to persist ${file_path}:`, err);
        throw err;
      }
    );
  };
  const toJson = async () => ensureLoaded();
  const setJson = async (data) => {
    cache = data;
    return persist();
  };
  const toJsonSync = () => ensureLoaded();
  return {
    toJson,
    setJson,
    toJsonSync,
    async set(key, value) {
      const data = ensureLoaded();
      data[key] = value;
      await persist();
      return value;
    },
    async get(key) {
      return ensureLoaded()[key];
    },
    async remove(key) {
      const data = ensureLoaded();
      delete data[key];
      return persist();
    },
    clear() {
      cache = {};
      return persist();
    },
    getSync(key) {
      return ensureLoaded()[key];
    },
    update(key, updateFn) {
      const data = ensureLoaded();
      return updateFn(data[key], data).then((value) => {
        data[key] = value;
        return persist();
      });
    },
    backup(fullName) {
      const dir = nodePath.dirname(fullName);
      if (!fs$1.existsSync(dir)) {
        mkdirSync(dir);
      }
      const doCopy = () => fs$3.copyFile(file_path, fullName).then(() => fs$3.rm(file_path, { recursive: true }));
      const backupOp = writeChain.then(doCopy);
      writeChain = backupOp.catch(() => {
      });
      return backupOp.then(
        () => {
        },
        (err) => {
          console.error(`[Storage] Backup failed:`, err);
          throw err;
        }
      );
    }
  };
};
const envFile = JsonFileBuilder(path.join(getHomePage(), STORAGE_PATH.env));
const dirConfig = envFile.getSync("ubidbuddy.dir");
const cacheDir = dirConfig?.cacheDir || getHomePage();
const configFile = JsonFileBuilder(path.join(cacheDir, STORAGE_PATH.config));
const _chatMessageFile = JsonFileBuilder(path.join(cacheDir, STORAGE_PATH.chatMessage));
const _chatFile = JsonFileBuilder(path.join(cacheDir, STORAGE_PATH.chat));
const chatFile = _chatFile;
const buildMessageListStorage = (conversation_id, dir) => {
  const fullName = path.join(dir, "ubidbuddy-chat-history", conversation_id + ".txt");
  if (!fs$1.existsSync(fullName)) {
    mkdirSync(path.join(dir, "ubidbuddy-chat-history"));
  }
  return JsonFileBuilder(path.join(dir, "ubidbuddy-chat-history", conversation_id + ".txt"));
};
const conversationHistoryProxy = (options, dir) => {
  return {
    ...options,
    async set(key, data) {
      const conversation_id = key;
      const storage = buildMessageListStorage(conversation_id, dir);
      return await storage.setJson(data);
    },
    async get(key) {
      const conversation_id = key;
      const storage = buildMessageListStorage(conversation_id, dir);
      const data = await storage.toJson();
      if (Array.isArray(data)) return data;
      return [];
    },
    backup(conversation_id) {
      const storage = buildMessageListStorage(conversation_id, dir);
      return storage.backup(
        path.join(dir, "ubidbuddy-chat-history", "backup", conversation_id + "_" + Date.now() + ".txt")
      );
    }
  };
};
const chatMessageFile = conversationHistoryProxy(_chatMessageFile, cacheDir);
const getAssistantsDir = () => {
  return path.join(cacheDir, STORAGE_PATH.assistants);
};
const getSkillsDir = () => {
  return path.join(cacheDir, STORAGE_PATH.skills);
};
const getCronSkillsDir = () => {
  return path.join(cacheDir, STORAGE_PATH.cronSkills);
};
const cleanupLegacyBuiltinSkillsDir = () => {
  const legacyDir = path.join(cacheDir, LEGACY_BUILTIN_SKILLS_DIR);
  if (!fs$1.existsSync(legacyDir)) return;
  fs$3.rm(legacyDir, { recursive: true, force: true }).then(() => console.log("[uBidBuddy] Cleaned up legacy builtin-skills cache")).catch(() => {
  });
};
const ensureAssistantDirs = async () => {
  const assistantsDir = getAssistantsDir();
  const userSkillsDir = getSkillsDir();
  if (!fs$1.existsSync(userSkillsDir)) mkdirSync(userSkillsDir);
  const cronSkillsDir = getCronSkillsDir();
  if (!fs$1.existsSync(cronSkillsDir)) mkdirSync(cronSkillsDir);
  if (!fs$1.existsSync(assistantsDir)) mkdirSync(assistantsDir);
};
const getBuiltinMcpBaseDir = () => {
  const mainModuleDir = typeof require !== "undefined" && require.main?.filename ? path.dirname(require.main.filename) : __dirname;
  const baseDir = path.basename(mainModuleDir) === "chunks" ? path.dirname(mainModuleDir) : mainModuleDir;
  if (getPlatformServices().paths.isPackaged()) {
    return baseDir.replace("app.asar", "app.asar.unpacked");
  }
  return baseDir;
};
const getBuiltinMcpScriptPath = (scriptName) => {
  return path.resolve(getBuiltinMcpBaseDir(), `${scriptName}.js`);
};
const initStorage = async () => {
  const t0 = performance.now();
  const mark = (label) => console.log(`[uBidBuddy:init] ${label} +${Math.round(performance.now() - t0)}ms`);
  mark("start");
  await migrateLegacyData();
  mark("1. migrateLegacyData");
  ensureDirectory(getHomePage());
  ensureDirectory(getDataPath());
  ConfigStorage.interceptor(configFile);
  EnvStorage.interceptor(envFile);
  mark("3. storage interceptors");
  mark("4. MCP config initialization skipped");
  try {
    await ensureAssistantDirs();
    mark("5. ensureAssistantDirs");
  } catch (error2) {
    console.error("[uBidBuddy] Failed to ensure assistant dirs:", error2);
  }
  cleanupLegacyBuiltinSkillsDir();
  mark("5b. legacyBuiltinSkillsCleanup");
  const legacyDbMigration = await runLegacyDatabaseMigrations();
  const repaired = legacyDbMigration.handoffRepair.repairedColumns.length;
  if (legacyDbMigration.skipped) {
    mark("6. legacyDbMigrations skipped");
  } else if (legacyDbMigration.migrated) {
    mark(
      `6. legacyDbMigrations v${legacyDbMigration.fromVersion}->v${legacyDbMigration.toVersion} handoffRepair=${repaired}`
    );
  } else {
    mark(`6. legacyDbMigrations noop(v${legacyDbMigration.fromVersion}) handoffRepair=${repaired}`);
  }
  if (hasElectronAppPath()) ;
  mark("done");
};
const ProcessConfig = configFile;
const ProcessChat = chatFile;
const ProcessChatMessage = chatMessageFile;
const ProcessEnv = envFile;
const getSystemDir = () => {
  const logDir = dirConfig?.logDir || getPlatformServices().paths.getLogsDir();
  return {
    cacheDir,
    // getDataPath() returns CLI-safe path (symlink on macOS) to avoid spaces
    // getDataPath() 返回 CLI 安全路径（macOS 上的符号链接）以避免空格问题
    workDir: dirConfig?.workDir || getDataPath(),
    logDir,
    platform: process.platform,
    arch: process.arch
  };
};
const initStorage$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BUILTIN_IMAGE_GEN_ID,
  ProcessChat,
  ProcessChatMessage,
  ProcessConfig,
  ProcessEnv,
  default: initStorage,
  getAssistantsDir,
  getBuiltinMcpScriptPath,
  getCronSkillsDir,
  getSkillsDir,
  getSystemDir
}, Symbol.toStringTag, { value: "Module" }));
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
(() => {
  if (process.env.UBIDBUDDY_MULTI_INSTANCE === "1") return 25810;
  return 25809;
})();
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tracks fire-and-forget persistence writes so they can finish flushing to
 * disk before the app exits. Without this, the last write triggered by an
 * action right before quit (e.g. ⌘Q immediately after a window resize or
 * a ⌘+ zoom shortcut) routinely loses the race against process teardown,
 * which manifests to the user as the setting "not being remembered".
 */
const pending = /* @__PURE__ */ new Set();
let installed = false;
let flushing = false;
const ensureHandlerInstalled = () => {
  if (installed) return;
  installed = true;
  require$$0$1.app.on("before-quit", (event) => {
    if (flushing) {
      if (pending.size > 0) {
        event.preventDefault();
      }
      return;
    }
    if (pending.size === 0) return;
    flushing = true;
    event.preventDefault();
    Promise.allSettled(pending).finally(() => {
      require$$0$1.app.quit();
    });
  });
};
const trackPersistedWrite = (promise2) => {
  ensureHandlerInstalled();
  const tracked = promise2.catch(() => {
  });
  pending.add(tracked);
  tracked.finally(() => pending.delete(tracked));
  return promise2;
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const UI_SCALE_DEFAULT = 0.95;
const UI_SCALE_MIN = 0.8;
const UI_SCALE_MAX = 1.3;
const UI_SCALE_STEP = 0.05;
let currentZoomFactor = UI_SCALE_DEFAULT;
const clampZoomFactor = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return UI_SCALE_DEFAULT;
  }
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, value));
};
const initializeZoomFactor = (factor) => {
  currentZoomFactor = clampZoomFactor(factor ?? UI_SCALE_DEFAULT);
  return currentZoomFactor;
};
const applyZoomToWindow = (win) => {
  win.webContents.setZoomFactor(currentZoomFactor);
};
const updateAllWindowsZoom = (factor) => {
  for (const win of require$$0$1.BrowserWindow.getAllWindows()) {
    win.webContents.setZoomFactor(factor);
  }
};
const setZoomFactor = (factor) => {
  const clamped = clampZoomFactor(factor);
  currentZoomFactor = clamped;
  updateAllWindowsZoom(clamped);
  return clamped;
};
const adjustZoomFactor = (delta) => {
  return setZoomFactor(currentZoomFactor + delta);
};
const attachZoomShortcutsToWindow = (win, persistZoomFactor) => {
  win.webContents.on("before-input-event", (event, input) => {
    const action = getZoomShortcutAction(input);
    if (!action) {
      return;
    }
    event.preventDefault();
    const updatedFactor = action === "zoomIn" ? adjustZoomFactor(UI_SCALE_STEP) : action === "zoomOut" ? adjustZoomFactor(-UI_SCALE_STEP) : setZoomFactor(UI_SCALE_DEFAULT);
    void persistZoomFactor?.(updatedFactor);
  });
};
const setupZoomForWindow = (win) => {
  applyZoomToWindow(win);
  attachZoomShortcutsToWindow(win, (factor) => {
    const op = (async () => {
      try {
        const { ProcessConfig: ProcessConfig2 } = await Promise.resolve().then(() => initStorage$1);
        await ProcessConfig2.set("ui.zoomFactor", factor);
      } catch (error2) {
        console.error("[uBidBuddy] Failed to persist zoom factor from keyboard shortcut:", error2);
      }
    })();
    trackPersistedWrite(op);
  });
};
const getZoomShortcutAction = (input, platform = process.platform) => {
  if (input.type !== "keyDown" || input.isComposing || input.alt) {
    return null;
  }
  const hasPrimaryModifier = platform === "darwin" ? input.meta : input.control;
  if (!hasPrimaryModifier) {
    return null;
  }
  switch (input.key) {
    case "+":
    case "=":
      return "zoomIn";
    case "-":
    case "_":
      return "zoomOut";
    case "0":
      return "resetZoom";
  }
  switch (input.code) {
    case "NumpadAdd":
      return "zoomIn";
    case "NumpadSubtract":
      return "zoomOut";
    case "Numpad0":
      return input.key === "Insert" ? null : "resetZoom";
    default:
      return null;
  }
};
/**
 * @license
 * Copyright 2026 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return relative === "" || !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
};
const resolveSkillRoot = async (skillLocation) => {
  if (!path.isAbsolute(skillLocation)) {
    throw new Error("Skill location must be absolute");
  }
  const location = path.resolve(skillLocation);
  const root = path.basename(location).toLowerCase() === "skill.md" ? path.dirname(location) : location;
  return fs$3.realpath(root);
};
const resolveExistingEntry = async (root, relativePath) => {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error("Skill file path must be relative");
  }
  const candidate = path.resolve(root, relativePath);
  if (!isWithin(root, candidate)) {
    throw new Error("Skill file path is outside the skill directory");
  }
  const realTarget = await fs$3.realpath(candidate);
  if (!isWithin(root, realTarget)) {
    throw new Error("Skill file path resolves outside the skill directory");
  }
  return realTarget;
};
const compareEntries = (a, b) => {
  const aPinned = a.relativePath.toLowerCase() === "skill.md";
  const bPinned = b.relativePath.toLowerCase() === "skill.md";
  if (aPinned !== bPinned) return aPinned ? -1 : 1;
  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
  return a.name.localeCompare(b.name, void 0, { sensitivity: "base" });
};
const listDirectory = async (root, directory) => {
  const entries = await fs$3.readdir(directory, { withFileTypes: true });
  const nodes = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath).split(path.sep).join("/");
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        relativePath,
        type: "directory",
        children: await listDirectory(root, absolutePath)
      });
    } else if (entry.isFile()) {
      nodes.push({ name: entry.name, relativePath, type: "file" });
    }
  }
  return nodes.toSorted(compareEntries);
};
const createSkillFileService = () => ({
  async list(skillLocation) {
    const root = await resolveSkillRoot(skillLocation);
    return listDirectory(root, root);
  },
  async read(skillLocation, relativePath) {
    const root = await resolveSkillRoot(skillLocation);
    const target = await resolveExistingEntry(root, relativePath);
    return fs$3.readFile(target, "utf8");
  }
});
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function initApplicationBridgeCore() {
  const skillFiles = createSkillFileService();
  fs.listSkillFiles.provider(({ skill_location }) => skillFiles.list(skill_location));
  fs.readSkillFile.provider(
    ({ skill_location, relative_path }) => skillFiles.read(skill_location, relative_path)
  );
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const START_ON_BOOT_WINDOWS_ARG = "--start-on-boot";
const getStartOnBootWindowsArgs = () => [START_ON_BOOT_WINDOWS_ARG];
const getLoginItemSettings = () => {
  return process.platform === "win32" ? require$$0$1.app.getLoginItemSettings({ args: getStartOnBootWindowsArgs() }) : require$$0$1.app.getLoginItemSettings();
};
function wasLaunchedAtLogin() {
  if (!require$$0$1.app.isPackaged) {
    return false;
  }
  if (process.platform === "darwin") {
    return Boolean(getLoginItemSettings().wasOpenedAtLogin);
  }
  if (process.platform === "win32") {
    return process.argv.includes(START_ON_BOOT_WINDOWS_ARG);
  }
  return false;
}
function initApplicationBridge() {
  initApplicationBridgeCore();
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function initDialogBridge() {
  dialog.showOpen.provider((options) => {
    const parentWindow = require$$0$1.BrowserWindow.getFocusedWindow() || require$$0$1.BrowserWindow.getAllWindows()[0];
    const dialogOptions = {
      defaultPath: options?.defaultPath,
      properties: options?.properties
    };
    const showDialogPromise = parentWindow ? require$$0$1.dialog.showOpenDialog(parentWindow, dialogOptions) : require$$0$1.dialog.showOpenDialog(dialogOptions);
    return showDialogPromise.then((res) => {
      return res.filePaths;
    });
  });
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const AUTO_UPDATE_DIAGNOSTICS_FILE = "auto-update-diagnostics.json";
function getAutoUpdateDiagnosticsPath(userDataPath) {
  return path__namespace$1.join(userDataPath, AUTO_UPDATE_DIAGNOSTICS_FILE);
}
function readDiagnosticsFile(filePath) {
  try {
    const parsed = JSON.parse(fs__namespace$1.readFileSync(filePath, "utf8"));
    if (typeof parsed.currentAppVersion !== "string" || !Array.isArray(parsed.events)) return void 0;
    const events = parsed.events.filter((event) => {
      if (!event || typeof event !== "object") return false;
      return typeof event.at === "string" && typeof event.status === "string";
    });
    return {
      currentAppVersion: parsed.currentAppVersion,
      events,
      lastEvent: events.at(-1),
      lastQuitAndInstallAt: typeof parsed.lastQuitAndInstallAt === "string" ? parsed.lastQuitAndInstallAt : void 0
    };
  } catch {
    return void 0;
  }
}
function writeDiagnosticsFile(filePath, diagnostics) {
  try {
    fs__namespace$1.writeFileSync(filePath, JSON.stringify(diagnostics, null, 2));
  } catch {
  }
}
function appendAutoUpdateDiagnosticEvent(state, event) {
  const events = [...state.events, event].slice(-20);
  return {
    currentAppVersion: state.currentAppVersion,
    events,
    lastEvent: event,
    lastQuitAndInstallAt: event.status === "quit-and-install" ? event.at : state.lastQuitAndInstallAt
  };
}
function eventFromStatus(status2, at) {
  return {
    at,
    error: status2.error,
    progressPercent: status2.progress?.percent,
    status: status2.status,
    total: status2.progress?.total,
    transferred: status2.progress?.transferred,
    version: status2.version
  };
}
function updateAutoUpdateDiagnostics(event, options) {
  const filePath = getAutoUpdateDiagnosticsPath(options.userDataPath);
  const previous = readDiagnosticsFile(filePath) ?? {
    currentAppVersion: options.currentAppVersion,
    events: []
  };
  writeDiagnosticsFile(
    filePath,
    appendAutoUpdateDiagnosticEvent(
      {
        ...previous,
        currentAppVersion: options.currentAppVersion
      },
      event
    )
  );
}
function recordAutoUpdateStatus(status2, options) {
  const at = (options.now ?? (() => /* @__PURE__ */ new Date()))().toISOString();
  updateAutoUpdateDiagnostics(eventFromStatus(status2, at), options);
}
function recordAutoUpdateQuitAndInstall(options) {
  const at = (options.now ?? (() => /* @__PURE__ */ new Date()))().toISOString();
  updateAutoUpdateDiagnostics({ at, status: "quit-and-install" }, options);
}
function recordAutoUpdateNativeInstallReady(event, options) {
  const at = (options.now ?? (() => /* @__PURE__ */ new Date()))().toISOString();
  updateAutoUpdateDiagnostics(
    {
      at,
      elapsedMs: event.elapsedMs,
      platform: "darwin",
      status: "native-update-ready",
      version: event.version
    },
    options
  );
}
function recordAutoUpdateNativeInstallError(event, options) {
  const at = (options.now ?? (() => /* @__PURE__ */ new Date()))().toISOString();
  updateAutoUpdateDiagnostics(
    {
      at,
      elapsedMs: event.elapsedMs,
      error: event.error,
      platform: "darwin",
      status: "native-update-error",
      version: event.version
    },
    options
  );
}
function recordAutoUpdateNativeInstallTimeout(event, options) {
  const at = (options.now ?? (() => /* @__PURE__ */ new Date()))().toISOString();
  updateAutoUpdateDiagnostics(
    {
      at,
      elapsedMs: event.elapsedMs,
      platform: "darwin",
      status: "native-update-timeout",
      version: event.version
    },
    options
  );
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const withTrailingSlash = (url) => url.endsWith("/") ? url : `${url}/`;
class CdnGenericProvider extends GenericProvider.GenericProvider {
  _cdnBaseUrl;
  // Parent stores `updater` privately; keep our own reference to rebuild the
  // channel-file URL for logging (the base `channel` getter is also private).
  _updater;
  constructor(configuration, updater, runtimeOptions) {
    const genericConfiguration = {
      ...configuration,
      provider: "generic"
    };
    super(genericConfiguration, updater, runtimeOptions);
    this._updater = updater;
    this._cdnBaseUrl = new URL(withTrailingSlash(configuration.url));
    log$1.debug("[auto-update] CDN provider initialized", {
      baseUrl: this._cdnBaseUrl.href,
      platform: runtimeOptions.platform,
      isUseMultipleRangeRequest: runtimeOptions.isUseMultipleRangeRequest
    });
  }
  /**
   * Resolve the channel metadata file (e.g. `latest-mac.yml`) the updater fetches
   * to discover the newest version. Mirrors GenericProvider's private `channel`
   * getter, which is not accessible from a subclass.
   */
  resolveLatestVersionUrl() {
    const channelName = this._updater.channel ?? this.getDefaultChannelName();
    const channelFile = util.getChannelFilename(channelName);
    const addNoCacheQuery = Boolean(this._updater.isAddNoCacheQuery);
    return util.newUrlFromBase(channelFile, this._cdnBaseUrl, addNoCacheQuery);
  }
  async getLatestVersion() {
    log$1.info("[auto-update] Checking latest version from URL:", this.resolveLatestVersionUrl().href);
    return super.getLatestVersion();
  }
  resolveFiles(updateInfo) {
    const resolved = Provider.resolveFiles(
      updateInfo,
      this._cdnBaseUrl,
      (filePath) => `${updateInfo.version}/${filePath}`
    );
    log$1.info("[auto-update] Update download URL(s) resolved:", {
      version: updateInfo.version,
      files: resolved.map((file2) => file2.url.href),
      packages: resolved.map((file2) => file2.packageInfo?.path).filter(Boolean)
    });
    return resolved;
  }
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const CDN_UPDATE_BASE_URL = "https://update.ubidbuddy.invalid/releases";
function buildCdnFeedOptions() {
  return {
    provider: "custom",
    url: CDN_UPDATE_BASE_URL,
    updateProvider: CdnGenericProvider
  };
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const FORCE_DEV_AUTO_UPDATE_ENV = "UBIDBUDDY_FORCE_DEV_AUTO_UPDATE";
const DEBUG_AUTO_UPDATE_CURRENT_VERSION_ENV = "UBIDBUDDY_DEBUG_AUTO_UPDATE_CURRENT_VERSION";
const MAC_NATIVE_INSTALL_READY_TIMEOUT_MS = 6e4;
function getUpdateChannel() {
  const { platform, arch } = process;
  if (platform === "win32" && arch === "arm64") {
    return "latest-win-arm64";
  }
  if (platform === "darwin" && arch === "arm64") {
    return "latest-arm64";
  }
  return void 0;
}
class AutoUpdaterService extends require$$2.EventEmitter {
  _isInitialized = false;
  _eventHandlersSetup = false;
  _allowPrerelease = false;
  _statusBroadcastCallback = null;
  _beforeQuitAndInstallCallback = null;
  _activeDownloadPromise = null;
  _activeDownloadCancellationToken = null;
  _ignoreActiveDownloadEvents = false;
  _nativeInstallReady = process.platform !== "darwin";
  _nativeInstallReadyWait = null;
  _downloadedUpdateVersion;
  /** Stores registered autoUpdater event handlers for cleanup and test access */
  _autoUpdaterHandlers = /* @__PURE__ */ new Map();
  _nativeAutoUpdaterHandlers = /* @__PURE__ */ new Map();
  constructor() {
    super();
    electronUpdater.autoUpdater.logger = log$1;
    electronUpdater.autoUpdater.logger.transports.file.level = "debug";
    electronUpdater.autoUpdater.autoDownload = false;
    electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
    this.configureDevAutoUpdateDebug();
    const cdnFeedOptions = buildCdnFeedOptions();
    const channel = getUpdateChannel();
    if (channel !== void 0) {
      electronUpdater.autoUpdater.channel = channel;
      log$1.info(`Update channel set to: ${channel}`);
    }
    electronUpdater.autoUpdater.setFeedURL(cdnFeedOptions);
    log$1.info("Update feed set to CDN provider");
    log$1.debug("[auto-update] CDN feed configured", {
      provider: cdnFeedOptions.provider,
      url: cdnFeedOptions.url,
      channel: channel ?? "latest",
      platform: process.platform,
      arch: process.arch
    });
  }
  configureDevAutoUpdateDebug() {
    if (require$$0$1.app.isPackaged || process.env[FORCE_DEV_AUTO_UPDATE_ENV] !== "1") {
      return;
    }
    electronUpdater.autoUpdater.forceDevUpdateConfig = true;
    log$1.warn(`[auto-update] Forced dev auto-update checks enabled by ${FORCE_DEV_AUTO_UPDATE_ENV}`);
    this.ensureDevUpdateConfig();
    const debugCurrentVersion = process.env[DEBUG_AUTO_UPDATE_CURRENT_VERSION_ENV];
    if (!debugCurrentVersion) {
      return;
    }
    const parsedVersion = semver.parse(debugCurrentVersion);
    if (!parsedVersion) {
      log$1.warn(`[auto-update] Ignoring invalid ${DEBUG_AUTO_UPDATE_CURRENT_VERSION_ENV}: ${debugCurrentVersion}`);
      return;
    }
    Object.defineProperty(electronUpdater.autoUpdater, "currentVersion", {
      configurable: true,
      value: parsedVersion
    });
    log$1.warn(`[auto-update] Debug current version override enabled: ${parsedVersion.version}`);
  }
  /**
   * Write a minimal dev-app-update.yml and point the updater at it, so the
   * download step's `updaterCacheDirName` lookup succeeds in dev mode. The
   * `provider`/`url` here are placeholders — the real feed comes from
   * setFeedURL() — but `updaterCacheDirName` must match the packaged value
   * (electron-builder defaults it to the appId) to reuse the same cache dir.
   */
  ensureDevUpdateConfig() {
    try {
      const cdnFeedOptions = buildCdnFeedOptions();
      const devConfig = [
        "provider: generic",
        `url: ${cdnFeedOptions.url}`,
        "updaterCacheDirName: com.ubidbuddy.app",
        ""
      ].join("\n");
      const configPath = path.join(require$$0$1.app.getPath("userData"), "dev-app-update.yml");
      fs$1.writeFileSync(configPath, devConfig, "utf-8");
      electronUpdater.autoUpdater.updateConfigPath = configPath;
      log$1.warn(`[auto-update] Dev update config written to: ${configPath}`);
    } catch (err) {
      log$1.error("[auto-update] Failed to write dev update config:", err);
    }
  }
  moveCwdOutOfInstallDirForWindowsHandoff() {
    if (process.platform !== "win32") {
      return;
    }
    try {
      const safeCwd = path.join(require$$0$1.app.getPath("temp"), "ubidbuddy-updater-cwd");
      fs$1.mkdirSync(safeCwd, { recursive: true });
      process.chdir(safeCwd);
      log$1.info("[auto-update] Moved process cwd before Windows installer handoff", { cwd: safeCwd });
    } catch (error2) {
      const message = error2 instanceof Error ? error2.message : String(error2);
      log$1.warn("[auto-update] Failed to move process cwd before Windows installer handoff", { error: message });
    }
  }
  /**
   * Initialize the service with an optional status broadcast callback.
   * This decouples the service from any specific window implementation.
   */
  initialize(statusBroadcastCallback) {
    this._statusBroadcastCallback = statusBroadcastCallback ?? null;
    this._isInitialized = true;
    if (!this._eventHandlersSetup) {
      this.setupEventHandlers();
      this._eventHandlersSetup = true;
    }
  }
  /**
   * Set the status broadcast callback (can be called after initialize)
   */
  setStatusBroadcastCallback(callback) {
    this._statusBroadcastCallback = callback;
  }
  setBeforeQuitAndInstall(callback) {
    this._beforeQuitAndInstallCallback = callback;
  }
  /**
   * Check if the service has been initialized
   */
  get isInitialized() {
    return this._isInitialized;
  }
  /**
   * Reset the service state (for production use)
   */
  reset() {
    this._isInitialized = false;
    this._allowPrerelease = false;
    this._statusBroadcastCallback = null;
    this._beforeQuitAndInstallCallback = null;
    this._activeDownloadPromise = null;
    this._activeDownloadCancellationToken = null;
    this._ignoreActiveDownloadEvents = false;
    this.clearNativeInstallReadyWait();
    this._nativeInstallReady = process.platform !== "darwin";
    this._downloadedUpdateVersion = void 0;
  }
  /**
   * Reset the service state completely, including event handlers.
   * Use this only in tests where you need to reset handler state.
   */
  resetForTest() {
    this._isInitialized = false;
    this._eventHandlersSetup = false;
    this._allowPrerelease = false;
    this._statusBroadcastCallback = null;
    this._beforeQuitAndInstallCallback = null;
    this._activeDownloadPromise = null;
    this._activeDownloadCancellationToken = null;
    this._ignoreActiveDownloadEvents = false;
    this.clearNativeInstallReadyWait();
    this._nativeInstallReady = process.platform !== "darwin";
    this._downloadedUpdateVersion = void 0;
    this.removeAllListeners();
    for (const [event, handler] of this._autoUpdaterHandlers) {
      electronUpdater.autoUpdater.removeListener(
        event,
        handler
      );
    }
    this._autoUpdaterHandlers.clear();
    for (const [event, handler] of this._nativeAutoUpdaterHandlers) {
      require$$0$1.autoUpdater.removeListener(
        event,
        handler
      );
    }
    this._nativeAutoUpdaterHandlers.clear();
  }
  /**
   * Trigger a registered autoUpdater event handler by event name with optional arguments.
   * Intended for use in tests only — do not call in production code.
   * Throws if the handler for the given event has not been registered yet.
   */
  triggerEventForTest(event, ...args2) {
    const handler = this._autoUpdaterHandlers.get(event);
    if (!handler) {
      throw new Error(`No handler registered for autoUpdater event "${event}". Did you call initialize() first?`);
    }
    handler(...args2);
  }
  /**
   * Set whether to allow prerelease/dev updates.
   * Only tracks the flag; prerelease filtering is handled by the manual GitHub
   * API check. Does not touch `autoUpdater.allowDowngrade` (see note below).
   */
  setAllowPrerelease(allow) {
    this._allowPrerelease = allow;
    log$1.info(`Prerelease updates ${allow ? "enabled" : "disabled"} (manual check only)`);
  }
  /**
   * Get current prerelease setting
   */
  get allowPrerelease() {
    return this._allowPrerelease;
  }
  setupEventHandlers() {
    const register = (event, handler) => {
      electronUpdater.autoUpdater.on(event, handler);
      this._autoUpdaterHandlers.set(event, handler);
    };
    const registerNative = (event, handler) => {
      require$$0$1.autoUpdater.on(
        event,
        handler
      );
      this._nativeAutoUpdaterHandlers.set(event, handler);
    };
    if (process.platform === "darwin") {
      registerNative("update-downloaded", () => {
        this.handleNativeInstallReady();
      });
      registerNative("error", (error2) => {
        void this.handleNativeInstallError(error2);
      });
    }
    register("checking-for-update", () => {
      log$1.info("Checking for updates...");
      this.resetNativeInstallReady();
      this.broadcastStatus({ status: "checking" });
    });
    register("update-available", (info) => {
      log$1.info(`Update available: ${info.version}`);
      this.resetNativeInstallReady(info.version);
      this.broadcastStatus({
        status: "available",
        version: info.version,
        // Reflects the dev debug override (autoUpdater.currentVersion) when set,
        // so the "current → new" display matches the version used for comparison.
        currentVersion: electronUpdater.autoUpdater.currentVersion?.version,
        releaseDate: info.releaseDate,
        releaseNotes: typeof info.releaseNotes === "string" ? info.releaseNotes : void 0
      });
    });
    register("update-not-available", () => {
      log$1.info("Application is up to date");
      this.broadcastStatus({ status: "not-available" });
    });
    register("download-progress", (progress) => {
      if (this._ignoreActiveDownloadEvents) {
        log$1.debug("[auto-update] Ignoring download-progress after cancellation");
        return;
      }
      log$1.debug(`Download progress: ${progress.percent.toFixed(2)}%`);
      this.broadcastStatus({
        status: "downloading",
        progress: {
          bytesPerSecond: progress.bytesPerSecond,
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total
        }
      });
    });
    register("update-downloaded", (info) => {
      if (this._ignoreActiveDownloadEvents) {
        log$1.debug("[auto-update] Ignoring update-downloaded after cancellation");
        return;
      }
      log$1.info("Update downloaded");
      this._activeDownloadPromise = null;
      this._activeDownloadCancellationToken = null;
      this._downloadedUpdateVersion = info.version;
      if (process.platform === "darwin" && !this._nativeInstallReady) {
        log$1.debug("[auto-update] macOS service-level update-downloaded received before native install readiness", {
          version: info.version
        });
      }
      this.broadcastStatus({
        status: "downloaded",
        version: info.version
      });
    });
    register("update-cancelled", () => {
      log$1.info("Update download cancelled");
      this._activeDownloadPromise = null;
      this._activeDownloadCancellationToken = null;
      this._ignoreActiveDownloadEvents = false;
      this.broadcastStatus({ status: "cancelled" });
    });
    register("error", (error2) => {
      if (this._ignoreActiveDownloadEvents) {
        log$1.debug("[auto-update] Ignoring error after cancellation");
        return;
      }
      log$1.error("Auto-updater error:", error2);
      this._activeDownloadPromise = null;
      this._activeDownloadCancellationToken = null;
      this.broadcastStatus({
        status: "error",
        error: this.describeAutoUpdateError(error2)
      });
    });
  }
  /**
   * In dev mode the running shell is the stock Electron bundle (com.github.Electron),
   * while the downloaded archive contains the packaged app (com.ubidbuddy.app). Squirrel.Mac
   * looks for a bundle matching the *running* id, fails to find it, and reports
   * "Could not locate update bundle". This is expected in dev and cannot be reproduced
   * without a packaged build, so surface a clearer message instead of the raw error.
   */
  describeAutoUpdateError(error2) {
    const message = error2.message;
    if (!require$$0$1.app.isPackaged && /Could not locate update bundle/i.test(message)) {
      return `[dev] Download succeeded; install cannot complete in dev mode (the install step requires a packaged build). Original error: ${message}`;
    }
    return message;
  }
  resetNativeInstallReady(version2) {
    void this.rejectNativeInstallReadyWaitWithLocalizedError("update.errors.prepareInstallFailed");
    this._nativeInstallReady = process.platform !== "darwin";
    this._downloadedUpdateVersion = version2;
  }
  getAutoUpdateDiagnosticOptions() {
    return {
      currentAppVersion: require$$0$1.app.getVersion(),
      userDataPath: require$$0$1.app.getPath("userData")
    };
  }
  getNativeInstallReadyElapsedMs() {
    return this._nativeInstallReadyWait ? Date.now() - this._nativeInstallReadyWait.startedAt : void 0;
  }
  clearNativeInstallReadyWait() {
    if (!this._nativeInstallReadyWait) return;
    clearTimeout(this._nativeInstallReadyWait.timer);
    this._nativeInstallReadyWait = null;
  }
  async rejectNativeInstallReadyWaitWithLocalizedError(i18nKey) {
    const wait = this._nativeInstallReadyWait;
    if (!wait) return;
    this.clearNativeInstallReadyWait();
    const { default: i18n2 } = await Promise.resolve().then(() => index);
    wait.reject(new Error(i18n2.t(i18nKey)));
  }
  handleNativeInstallReady() {
    this._nativeInstallReady = true;
    const elapsedMs = this.getNativeInstallReadyElapsedMs();
    log$1.info("[auto-update] Native Squirrel update ready; continuing install", {
      elapsedMs,
      platform: process.platform,
      version: this._downloadedUpdateVersion
    });
    recordAutoUpdateNativeInstallReady(
      { elapsedMs, version: this._downloadedUpdateVersion },
      this.getAutoUpdateDiagnosticOptions()
    );
    const wait = this._nativeInstallReadyWait;
    this.clearNativeInstallReadyWait();
    wait?.resolve();
  }
  async handleNativeInstallError(error2) {
    const elapsedMs = this.getNativeInstallReadyElapsedMs();
    const message = this.describeAutoUpdateError(error2);
    log$1.error("[auto-update] Native updater readiness failed", {
      elapsedMs,
      error: message,
      platform: process.platform,
      version: this._downloadedUpdateVersion
    });
    recordAutoUpdateNativeInstallError(
      { elapsedMs, error: message, version: this._downloadedUpdateVersion },
      this.getAutoUpdateDiagnosticOptions()
    );
    const { default: i18n2 } = await Promise.resolve().then(() => index);
    const userMessage = i18n2.t("update.errors.prepareInstallFailed");
    this.broadcastStatus({
      status: "error",
      error: userMessage
    });
    const wait = this._nativeInstallReadyWait;
    this.clearNativeInstallReadyWait();
    wait?.reject(new Error(userMessage));
  }
  async waitForNativeInstallReady() {
    if (process.platform !== "darwin" || this._nativeInstallReady) return;
    if (this._nativeInstallReadyWait) return this._nativeInstallReadyWait.promise;
    log$1.info("[auto-update] macOS install requested before native readiness; waiting for native updater", {
      platform: process.platform,
      timeoutMs: MAC_NATIVE_INSTALL_READY_TIMEOUT_MS,
      version: this._downloadedUpdateVersion
    });
    this.broadcastStatus({ status: "preparing-install", version: this._downloadedUpdateVersion });
    const startedAt = Date.now();
    let resolveWait;
    let rejectWait;
    const promise2 = new Promise((resolve, reject) => {
      resolveWait = resolve;
      rejectWait = reject;
    });
    const timer = setTimeout(async () => {
      const elapsedMs = Date.now() - startedAt;
      log$1.warn("[auto-update] Timed out waiting for native Squirrel update readiness", {
        elapsedMs,
        platform: process.platform,
        version: this._downloadedUpdateVersion
      });
      recordAutoUpdateNativeInstallTimeout(
        { elapsedMs, version: this._downloadedUpdateVersion },
        this.getAutoUpdateDiagnosticOptions()
      );
      const { default: i18n2 } = await Promise.resolve().then(() => index);
      const userMessage = i18n2.t("update.errors.prepareInstallTimeout");
      this.broadcastStatus({
        status: "error",
        error: userMessage
      });
      const wait = this._nativeInstallReadyWait;
      this.clearNativeInstallReadyWait();
      wait?.reject(new Error(userMessage));
    }, MAC_NATIVE_INSTALL_READY_TIMEOUT_MS);
    this._nativeInstallReadyWait = { promise: promise2, reject: rejectWait, resolve: resolveWait, startedAt, timer };
    return promise2;
  }
  /**
   * Broadcast status to both EventEmitter listeners and the registered callback
   */
  broadcastStatus(status2) {
    recordAutoUpdateStatus(status2, this.getAutoUpdateDiagnosticOptions());
    this.emit("update-status", status2);
    if (this._statusBroadcastCallback) {
      this._statusBroadcastCallback(status2);
    }
  }
  async checkForUpdates() {
    try {
      if (!this._isInitialized) {
        throw new Error("AutoUpdaterService not initialized");
      }
      log$1.debug("[auto-update] checkForUpdates requested", {
        allowPrerelease: this._allowPrerelease,
        channel: electronUpdater.autoUpdater.channel ?? "latest",
        currentVersion: require$$0$1.app.getVersion(),
        appIsPackaged: require$$0$1.app.isPackaged
      });
      if (this._allowPrerelease) {
        log$1.info("Skipping electron-updater check for prerelease manual mode");
        log$1.debug("[auto-update] CDN stable feed skipped because prerelease mode is handled by GitHub API");
        return { success: true };
      }
      const result = await electronUpdater.autoUpdater.checkForUpdates();
      if (!result) {
        const { default: i18n2 } = await Promise.resolve().then(() => index);
        log$1.debug("[auto-update] checkForUpdates returned null");
        return { success: false, error: i18n2.t("update.errors.checkReturnedNull") };
      }
      if (!result.isUpdateAvailable) {
        log$1.debug("[auto-update] no update available from CDN feed", {
          version: result.updateInfo.version
        });
        return { success: true };
      }
      const feedVersion = semver.parse(result.updateInfo.version);
      const installedVersion = semver.parse(require$$0$1.app.getVersion());
      if (feedVersion && installedVersion && !semver.gt(feedVersion, installedVersion)) {
        log$1.debug("[auto-update] feed version not newer than installed; ignoring", {
          feedVersion: feedVersion.version,
          installedVersion: installedVersion.version
        });
        return { success: true };
      }
      log$1.debug("[auto-update] update available from CDN feed", {
        version: result.updateInfo.version,
        releaseDate: result.updateInfo.releaseDate
      });
      return {
        success: true,
        updateInfo: result.updateInfo
      };
    } catch (error2) {
      const message = error2 instanceof Error ? error2.message : String(error2);
      log$1.error("Check for updates failed:", message);
      return {
        success: false,
        error: message
      };
    }
  }
  async restoreDownloadedUpdateIfAvailable() {
    try {
      if (!this._isInitialized) {
        throw new Error("AutoUpdaterService not initialized");
      }
      const checkResult = await this.checkForUpdates();
      if (!checkResult.success || !checkResult.updateInfo) {
        return {
          success: checkResult.success,
          data: { ready: false },
          error: checkResult.error
        };
      }
      const cachedUpdate = await this.getValidCachedDownloadedUpdate();
      if (!cachedUpdate) {
        return { success: true, data: { ready: false } };
      }
      const downloadResult = await this.downloadUpdate();
      if (!downloadResult.success) {
        return {
          success: false,
          data: { ready: false },
          error: downloadResult.error
        };
      }
      const data = {
        ready: true,
        version: checkResult.updateInfo.version,
        currentVersion: electronUpdater.autoUpdater.currentVersion?.version,
        filePath: cachedUpdate.filePath
      };
      if (typeof checkResult.updateInfo.releaseNotes === "string") {
        data.releaseNotes = checkResult.updateInfo.releaseNotes;
      }
      if (typeof cachedUpdate.fileInfo.info.size === "number") {
        data.size = cachedUpdate.fileInfo.info.size;
      }
      return {
        success: true,
        data
      };
    } catch (error2) {
      const message = error2 instanceof Error ? error2.message : String(error2);
      log$1.error("[auto-update] Restore downloaded update failed:", message);
      return {
        success: false,
        data: { ready: false },
        error: message
      };
    }
  }
  async getValidCachedDownloadedUpdate() {
    const updater = electronUpdater.autoUpdater;
    const updateInfoAndProvider = updater.updateInfoAndProvider;
    if (!updateInfoAndProvider || !updater.getOrCreateDownloadHelper) {
      return null;
    }
    const fileInfo = this.selectAutoUpdateFile(updateInfoAndProvider.provider.resolveFiles(updateInfoAndProvider.info));
    if (!fileInfo) {
      log$1.warn("[auto-update] No platform update file found for cached update restore");
      return null;
    }
    const downloadedUpdateHelper = await updater.getOrCreateDownloadHelper();
    const updateFileName = this.getCacheUpdateFileName(fileInfo);
    const updateFile = path.join(downloadedUpdateHelper.cacheDirForPendingUpdate, updateFileName);
    const filePath = await downloadedUpdateHelper.validateDownloadedPath(
      updateFile,
      updateInfoAndProvider.info,
      fileInfo,
      log$1
    );
    return filePath ? { filePath, fileInfo } : null;
  }
  selectAutoUpdateFile(files) {
    const updaterName = electronUpdater.autoUpdater.constructor?.name;
    if (updaterName === "MacUpdater" || process.platform === "darwin") {
      return Provider.findFile(files, "zip", ["pkg", "dmg"]) ?? null;
    }
    if (updaterName === "NsisUpdater" || process.platform === "win32") {
      return Provider.findFile(files, "exe") ?? null;
    }
    if (updaterName === "DebUpdater") {
      return Provider.findFile(files, "deb", ["AppImage", "rpm", "pacman"]) ?? null;
    }
    if (updaterName === "RpmUpdater") {
      return Provider.findFile(files, "rpm", ["AppImage", "deb", "pacman"]) ?? null;
    }
    if (updaterName === "PacmanUpdater") {
      return Provider.findFile(files, "pacman", ["AppImage", "deb", "rpm"]) ?? null;
    }
    return Provider.findFile(files, "AppImage", ["rpm", "deb", "pacman"]) ?? null;
  }
  getCacheUpdateFileName(fileInfo) {
    const urlPath = decodeURIComponent(fileInfo.url.pathname);
    const extension = path.extname(urlPath);
    if (extension && urlPath.toLowerCase().endsWith(extension.toLowerCase())) {
      return path.basename(urlPath);
    }
    return fileInfo.info.url;
  }
  async downloadUpdate() {
    if (this._activeDownloadPromise) {
      log$1.debug("[auto-update] downloadUpdate reused active download");
      return this._activeDownloadPromise;
    }
    const cancellationToken = new builderUtilRuntime.CancellationToken();
    this._activeDownloadCancellationToken = cancellationToken;
    const runDownload = async () => {
      try {
        if (!this._isInitialized) {
          throw new Error("AutoUpdaterService not initialized");
        }
        log$1.debug("[auto-update] downloadUpdate requested");
        this._ignoreActiveDownloadEvents = false;
        await electronUpdater.autoUpdater.downloadUpdate(cancellationToken);
        log$1.debug("[auto-update] downloadUpdate started");
        return { success: true };
      } catch (error2) {
        if (error2 instanceof builderUtilRuntime.CancellationError || error2 instanceof Error && error2.message === "cancelled") {
          log$1.info("[auto-update] downloadUpdate cancelled");
          return { success: true };
        }
        const message = error2 instanceof Error ? error2.message : String(error2);
        log$1.error("Download update failed:", message);
        return {
          success: false,
          error: message
        };
      }
    };
    this._activeDownloadPromise = runDownload();
    return this._activeDownloadPromise;
  }
  async cancelDownload() {
    if (!this._activeDownloadPromise) {
      this.broadcastStatus({ status: "cancelled" });
      return { success: true };
    }
    log$1.info("[auto-update] Cancelling active auto-update download");
    this._activeDownloadCancellationToken?.cancel();
    this._activeDownloadCancellationToken = null;
    this._activeDownloadPromise = null;
    this._ignoreActiveDownloadEvents = true;
    this.broadcastStatus({ status: "cancelled" });
    return { success: true };
  }
  async quitAndInstall() {
    await this.waitForNativeInstallReady();
    if (this._beforeQuitAndInstallCallback) {
      log$1.info("Running pre-install cleanup before quitAndInstall...");
      try {
        await this._beforeQuitAndInstallCallback();
      } catch (error2) {
        const message = error2 instanceof Error ? error2.message : String(error2);
        log$1.error("[auto-update] pre-install cleanup failed", {
          error: message,
          platform: process.platform,
          version: this._downloadedUpdateVersion
        });
        if (process.platform === "darwin") {
          const { default: i18n2 } = await Promise.resolve().then(() => index);
          this.broadcastStatus({
            status: "error",
            error: i18n2.t("update.errors.prepareInstallFailed")
          });
        }
        throw error2;
      }
    }
    log$1.info("Quitting and installing update...");
    try {
      this.moveCwdOutOfInstallDirForWindowsHandoff();
      electronUpdater.autoUpdater.quitAndInstall(false, true);
      recordAutoUpdateQuitAndInstall(this.getAutoUpdateDiagnosticOptions());
    } catch (error2) {
      const message = error2 instanceof Error ? error2.message : String(error2);
      log$1.error("[auto-update] quitAndInstall handoff failed", {
        error: message,
        platform: process.platform,
        version: this._downloadedUpdateVersion
      });
      const { default: i18n2 } = await Promise.resolve().then(() => index);
      const userMessage = i18n2.t("update.errors.prepareInstallFailed");
      this.broadcastStatus({
        status: "error",
        error: userMessage
      });
      throw new Error(userMessage, { cause: error2 });
    }
    setTimeout(() => {
      require$$0$1.app.exit(0);
    }, 1e3);
  }
  /**
   * Check for updates and notify (for startup)
   */
  async checkForUpdatesAndNotify() {
    try {
      electronUpdater.autoUpdater.allowDowngrade = false;
      await electronUpdater.autoUpdater.checkForUpdatesAndNotify();
    } catch (error2) {
      log$1.error("Auto-update check failed:", error2);
    }
  }
}
new AutoUpdaterService();
const fallbackLanguage = "zh-CN";
const supportedLanguages = ["zh-CN", "en-US", "ja-JP", "zh-TW", "ko-KR", "tr-TR", "ru-RU", "uk-UA", "pt-BR", "de-DE", "es-ES", "fr-FR", "fa-IR"];
const i18nConfig = {
  fallbackLanguage,
  supportedLanguages
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const SUPPORTED_LANGUAGES = i18nConfig.supportedLanguages;
const DEFAULT_LANGUAGE = i18nConfig.fallbackLanguage;
function normalizeLanguageCode(language) {
  const normalized = language.replace(/_/g, "-");
  if (SUPPORTED_LANGUAGES.includes(normalized)) {
    return normalized;
  }
  const lower = normalized.toLowerCase();
  if (lower.startsWith("zh")) {
    return /\bhant\b|-hk\b|-mo\b/.test(lower) ? "zh-TW" : "zh-CN";
  }
  const langOnly = lower.split("-")[0];
  switch (langOnly) {
    case "ja":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    case "tr":
      return "tr-TR";
    case "ru":
      return "ru-RU";
    case "uk":
      return "uk-UA";
    case "pt":
      return "pt-BR";
    case "de":
      return "de-DE";
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "fa":
      return "fa-IR";
    default:
      return DEFAULT_LANGUAGE;
  }
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function mergeWithFallback(fallback, target) {
  const merged = { ...fallback };
  for (const [key, value] of Object.entries(target)) {
    const fallbackValue = merged[key];
    if (isPlainObject(fallbackValue) && isPlainObject(value)) {
      merged[key] = mergeWithFallback(fallbackValue, value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}
async function ensureAndSwitch(i18n2, lang, getTranslation) {
  const normalizedLang = normalizeLanguageCode(lang);
  if (!i18n2.hasResourceBundle(normalizedLang, "translation")) {
    const translation = await getTranslation(normalizedLang);
    i18n2.addResourceBundle(normalizedLang, "translation", translation, true, true);
  }
  await i18n2.changeLanguage(normalizedLang);
}
const send$c = "Send";
const cancel$c = "Cancel";
const save$c = "Save";
const confirm$c = "Confirm";
const file$c = "File";
const folder$c = "Folder";
const upload$c = "Upload";
const model$c = "Model";
const skills$c = "Skills";
const workspace$c = "Project";
const settings$c = "Settings";
const system$c = "System";
const about$c = "About Us";
const back$c = "Back to Chat";
const goBack$c = "Back";
const add$c = "Add";
const edit$c = "Edit";
const website$c = "Website";
const version$c = "Version";
const contact$c = "Contact";
const github$c = "Github";
const loading$c = "Please wait...";
const copy$c = "Copy";
const reply$c = "Reply";
const openInBuiltinBrowser$c = "Open in built-in browser";
const openInSystemBrowser$c = "Open in system browser";
const copySuccess$c = "Copied";
const copyFailed$c = "Copy failed";
const download$c = "Download";
const close$c = "Close";
const retry$c = "Retry";
const reload$c = "Reload";
const technical_details$c = "Technical Details";
const error_details$c = "Error Details";
const troubleshooting$c = "Troubleshooting";
const select$c = "Select";
const expandMore$c = "Expand More";
const collapse$c = "Collapse";
const viewMoreLines$c = "View More ({{count}} lines)";
const viewMoreLines_one$c = "View More ({{count}} line)";
const viewMoreLines_other$c = "View More ({{count}} lines)";
const success$c = "Success";
const error$c = "Error";
const saveSuccess$c = "Saved successfully";
const saveFailed$c = "Failed to save";
const unknownError$c = "Unknown error";
const confirmDelete$c = "Confirm Delete";
const deleteSuccess$c = "Deleted successfully";
const deleteFailed$c = "Failed to delete";
const defaultModel$c = "Default Model";
const escToCancel$c = "esc to cancel";
const create$c = "Create";
const createSuccess$c = "Created successfully";
const failed$c = "Failed";
const browse$c = "Browse";
const remove$c = "Remove";
const show$c = "Show";
const hide$p = "Hide";
const goToSettings$c = "Go to Settings";
const forward$c = "Forward";
const historyBack$c = "Back";
const more$c = "More";
const refresh$c = "Refresh";
const readOnly$c = "Read only";
const backendStartup$c = { "incompatibleRuntime": { "title": "This system is not supported by the bundled backend", "description": "uBidBuddy opened, but the local AionCore backend cannot run on this Linux version. Please upgrade to a supported Linux distribution and restart uBidBuddy.", "requiredVersions": "Required runtime symbols: {{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy installation is incomplete", "description": "This installation is missing required local resources, so AionCore cannot start. Please download and reinstall the latest uBidBuddy. If the issue returns after reinstalling, check whether security or antivirus software quarantined AionCore.", "downloadLatest": "Download latest", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "runtimeComponentDescription": "This installation is missing required bundled runtime components, so {{resource}} cannot start. Reinstall the latest uBidBuddy package. If it still happens after reinstalling, check whether security or antivirus software quarantined uBidBuddy components." }, "packageArchitectureMismatch": { "title": "uBidBuddy package architecture mismatch", "description": "This uBidBuddy package is for {{packageArch}}, but this Mac is {{deviceArch}}. You may have downloaded the wrong package. Please download and install the {{expectedArch}} package." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "A newer version of uBidBuddy is required", "description": "Your local data was created by a newer version of uBidBuddy, and this version can't open it. Update uBidBuddy to the latest version to continue — your data is intact, and no reinstall or data reset is needed.", "descriptionWithVersion": "Your local data was created by a version of uBidBuddy newer than the one installed now (v{{currentVersion}}), so this version can't open it. Update uBidBuddy to the latest version to continue — your data is intact, and no reinstall or data reset is needed." }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy opened, but AionCore stopped while preparing local startup data such as assistant or agent records. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "Local data is corrupted", "description": "uBidBuddy detected that the local database is corrupted and cannot continue startup. After confirmation, uBidBuddy will back up the old database and create a new local database to continue startup. Past conversations will no longer be shown, and the old database will be kept as a backup file.", "confirmRebuild": "Back up old DB and rebuild new DB", "sendDiagnostics": "Send diagnostics", "diagnosticsHint": "Sending diagnostics will not modify the local database.", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "rebuildFailed": "Failed to back up old DB and rebuild new DB", "confirmDialog": { "title": "Rebuild the database?", "content": "This will back up the currently corrupted database and create a brand-new empty one. Past conversations will no longer be shown (the old database is kept as a backup file). Continue?", "okText": "Confirm rebuild", "cancelText": "Cancel" } }, "transientConcurrentStartup": { "title": "uBidBuddy is starting up", "description": "Another uBidBuddy startup was still using the local data when this window opened. This is temporary and your data is safe — no reinstall is needed. Please wait a moment and try again, or restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "If this keeps happening, you can send a diagnostics report." }, "pendingSlow": { "title": "Starting up", "description": "AionCore is starting up, please wait. If it doesn't respond after a while, you can quit and reopen the app." }, "exited": { "title": "Startup didn't complete", "description": "AionCore couldn't finish starting and has exited. Please restart the app; if this keeps happening, please send diagnostics.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics reported", "diagnosticsReportFailed": "Failed to send diagnostics, please retry" }, "portReportTimeout": { "title": "Startup timed out", "description": "AionCore didn't finish starting within the expected time. Please restart the app; if this keeps happening, please send diagnostics.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics reported", "diagnosticsReportFailed": "Failed to send diagnostics, please retry" }, "startupFailed": { "title": "Startup failed", "description": "AionCore failed to start. Please restart the app; if this keeps happening, please send diagnostics.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics reported", "diagnosticsReportFailed": "Failed to send diagnostics, please retry" } };
const expand$c = "Expand";
const name$c = "Name";
const added$c = "Added";
const status$c = "Status";
const agentMode$c = "Agent Mode";
const refreshSuccess$c = "Refreshed";
const processing$c = "Processing...";
const optional$c = "(optional)";
const clear$c = "Clear";
const unit$c = { "minute_short": "m", "second_short": "s" };
const selectedCount$c = "Selected {{count}}";
const selectedSkills$c = "Selected skills";
const aiAssistant$c = "AI Assistant";
const commonEnUS = {
  send: send$c,
  cancel: cancel$c,
  save: save$c,
  "delete": "Delete",
  confirm: confirm$c,
  file: file$c,
  folder: folder$c,
  upload: upload$c,
  model: model$c,
  skills: skills$c,
  workspace: workspace$c,
  settings: settings$c,
  system: system$c,
  about: about$c,
  back: back$c,
  goBack: goBack$c,
  add: add$c,
  edit: edit$c,
  website: website$c,
  version: version$c,
  contact: contact$c,
  github: github$c,
  loading: loading$c,
  copy: copy$c,
  reply: reply$c,
  openInBuiltinBrowser: openInBuiltinBrowser$c,
  openInSystemBrowser: openInSystemBrowser$c,
  copySuccess: copySuccess$c,
  copyFailed: copyFailed$c,
  download: download$c,
  close: close$c,
  retry: retry$c,
  reload: reload$c,
  technical_details: technical_details$c,
  error_details: error_details$c,
  troubleshooting: troubleshooting$c,
  select: select$c,
  expandMore: expandMore$c,
  collapse: collapse$c,
  viewMoreLines: viewMoreLines$c,
  viewMoreLines_one: viewMoreLines_one$c,
  viewMoreLines_other: viewMoreLines_other$c,
  success: success$c,
  error: error$c,
  saveSuccess: saveSuccess$c,
  saveFailed: saveFailed$c,
  unknownError: unknownError$c,
  confirmDelete: confirmDelete$c,
  deleteSuccess: deleteSuccess$c,
  deleteFailed: deleteFailed$c,
  "default": "Default",
  defaultModel: defaultModel$c,
  escToCancel: escToCancel$c,
  create: create$c,
  createSuccess: createSuccess$c,
  failed: failed$c,
  browse: browse$c,
  remove: remove$c,
  show: show$c,
  hide: hide$p,
  goToSettings: goToSettings$c,
  forward: forward$c,
  historyBack: historyBack$c,
  more: more$c,
  refresh: refresh$c,
  readOnly: readOnly$c,
  "tray.showWindow": "Show uBidBuddy",
  "tray.newChat": "New Chat",
  "tray.closeToTray": "Hide to Tray",
  "tray.about": "About uBidBuddy",
  "tray.restart": "Restart App",
  "tray.quit": "Quit",
  "tray.runningTasks": "Running Tasks",
  "tray.pauseAll": "Pause All Tasks",
  "tray.checkUpdate": "Check Update",
  "tray.recentChats": "Recent Chats",
  "tray.untitled": "Untitled",
  backendStartup: backendStartup$c,
  "fileAttach.addFiles": "Add files",
  "fileAttach.myDevice": "Upload from device",
  "fileAttach.failed": "Upload failed",
  "fileAttach.uploading": "Uploading...",
  "fileAttach.uploadSuccess": "Upload successful",
  "fileAttach.cancelUpload": "Cancel upload",
  expand: expand$c,
  name: name$c,
  added: added$c,
  status: status$c,
  agentMode: agentMode$c,
  refreshSuccess: refreshSuccess$c,
  "import": "Import",
  processing: processing$c,
  optional: optional$c,
  clear: clear$c,
  unit: unit$c,
  selectedCount: selectedCount$c,
  selectedSkills: selectedSkills$c,
  aiAssistant: aiAssistant$c
};
const desktopPet$c = "Desktop Pet";
const enable$c = "Enable Desktop Pet";
const size$c = "Pet Size";
const sizeSmall$c = "Small ({{px}}px)";
const sizeMedium$c = "Medium ({{px}}px)";
const sizeLarge$c = "Large ({{px}}px)";
const dnd$c = "Do Not Disturb";
const dndDescription$c = "Pet stays idle, ignores AI events";
const confirmBubble$c = "Show authorizations on the pet";
const confirmBubbleDescription$c = "When off, AI tool authorizations stay in the main chat window";
const pat$c = "Pat";
const resetPosition$c = "Reset Position";
const hide$o = "Hide";
const showHide$c = "Show/Hide";
const desktopOnly$c = "Desktop Pet is only available in the desktop application. It cannot be used in WebUI browser mode.";
const petEnUS = {
  desktopPet: desktopPet$c,
  enable: enable$c,
  size: size$c,
  sizeSmall: sizeSmall$c,
  sizeMedium: sizeMedium$c,
  sizeLarge: sizeLarge$c,
  dnd: dnd$c,
  dndDescription: dndDescription$c,
  confirmBubble: confirmBubble$c,
  confirmBubbleDescription: confirmBubbleDescription$c,
  pat: pat$c,
  resetPosition: resetPosition$c,
  hide: hide$o,
  showHide: showHide$c,
  desktopOnly: desktopOnly$c
};
const send$b = "发送";
const cancel$b = "取消";
const save$b = "保存";
const confirm$b = "确定";
const file$b = "文件";
const folder$b = "文件夹";
const upload$b = "上传";
const model$b = "模型";
const skills$b = "技能";
const workspace$b = "项目";
const settings$b = "设置";
const system$b = "系统";
const about$b = "关于我们";
const back$b = "返回聊天";
const goBack$b = "返回";
const add$b = "添加";
const edit$b = "编辑";
const website$b = "官网";
const version$b = "版本号";
const contact$b = "联系我们";
const github$b = "Github";
const loading$b = "请稍候...";
const copy$b = "复制";
const reply$b = "引用";
const openInBuiltinBrowser$b = "内置浏览器打开";
const openInSystemBrowser$b = "系统浏览器打开";
const copySuccess$b = "已复制";
const copyFailed$b = "Copy failed";
const download$b = "下载";
const close$b = "关闭";
const retry$b = "重试";
const reload$b = "重新加载";
const technical_details$b = "技术详情";
const error_details$b = "错误详情";
const troubleshooting$b = "故障排除";
const select$b = "选择";
const expandMore$b = "展开更多";
const collapse$b = "收起";
const viewMoreLines$b = "查看更多 ({{count}} 行)";
const viewMoreLines_one$b = "查看更多 ({{count}} 行)";
const viewMoreLines_other$b = "查看更多 ({{count}} 行)";
const success$b = "成功";
const error$b = "错误";
const saveSuccess$b = "保存成功";
const saveFailed$b = "保存失败";
const unknownError$b = "未知错误";
const confirmDelete$b = "确认删除";
const deleteSuccess$b = "删除成功";
const deleteFailed$b = "删除失败";
const defaultModel$b = "默认模型";
const escToCancel$b = "按 ESC 取消";
const create$b = "创建";
const createSuccess$b = "创建成功";
const failed$b = "失败";
const browse$b = "浏览";
const remove$b = "移除";
const show$b = "显示";
const hide$n = "隐藏";
const goToSettings$b = "前往设置";
const forward$b = "前进";
const historyBack$b = "后退";
const more$b = "更多";
const refresh$b = "刷新";
const readOnly$b = "只读";
const backendStartup$b = { "incompatibleRuntime": { "title": "当前系统不支持内置后端", "description": "uBidBuddy 已打开，但本地 AionCore 后端无法在当前 Linux 版本上运行。请升级到受支持的 Linux 发行版后重启 uBidBuddy。", "requiredVersions": "需要的运行时符号：{{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy 安装不完整", "description": "当前安装缺少必要的本地资源，AionCore 无法启动。请下载并重新安装最新版 uBidBuddy；如果重新安装后仍然出现，请检查系统安全软件或杀毒软件是否隔离了 AionCore。", "downloadLatest": "下载最新版", "sendDiagnostics": "发送诊断报告", "diagnosticsSent": "诊断报告已发送", "diagnosticsReportSuccess": "诊断报告已发送", "diagnosticsReportFailed": "诊断报告发送失败", "runtimeComponentDescription": "当前安装缺少必要的内置运行组件，{{resource}} 无法启动。请重新安装最新版 uBidBuddy；如果重新安装后仍然出现，请检查系统安全软件或杀毒软件是否隔离了 uBidBuddy 组件。" }, "packageArchitectureMismatch": { "title": "uBidBuddy 安装包架构不匹配", "description": "当前 uBidBuddy 安装包是 {{packageArch}}，但这台 Mac 是 {{deviceArch}}。你可能下载了错误的安装包，请重新下载并安装 {{expectedArch}} 版本。" }, "dataMigration": { "title": "本地数据迁移失败", "description": "uBidBuddy 已打开，但 AionCore 在初始化本地数据时停止。重复安装 uBidBuddy 未必能解决此问题。请发送诊断报告或联系支持，以便检查本地数据库迁移状态。", "sendDiagnostics": "发送诊断报告", "diagnosticsSent": "诊断报告已发送", "diagnosticsReportSuccess": "诊断报告已发送", "diagnosticsReportFailed": "诊断报告发送失败" }, "databaseNewerThanApp": { "title": "需要更新 uBidBuddy", "description": "本地数据由更高版本的 uBidBuddy 创建，当前版本无法打开。请将 uBidBuddy 更新到最新版本即可继续使用，数据完好无损，无需重装或重置数据。", "descriptionWithVersion": "本地数据由比当前版本 v{{currentVersion}} 更新的 uBidBuddy 创建，当前版本无法打开。请将 uBidBuddy 更新到最新版本即可继续使用，数据完好无损，无需重装或重置数据。" }, "localDataRepair": { "title": "本地数据修复失败", "description": "uBidBuddy 已打开，但 AionCore 在准备本地启动数据时停止，例如 assistant 或智能体记录。重新安装 uBidBuddy 可能无法解决此问题。请发送诊断报告或联系支持，以便检查本地数据库。", "sendDiagnostics": "发送诊断", "diagnosticsSent": "诊断已发送", "diagnosticsReportSuccess": "诊断报告已发送", "diagnosticsReportFailed": "诊断报告发送失败" }, "startupDirectory": { "title": "启动目录不可用", "description": "uBidBuddy 已打开，但由于配置的工作目录或日志目录不存在、不可访问或权限受限，AionCore 无法启动。请确认这些目录存在且可写，然后重启 uBidBuddy。", "sendDiagnostics": "发送诊断报告", "diagnosticsSent": "诊断报告已发送", "diagnosticsReportSuccess": "诊断报告已发送", "diagnosticsReportFailed": "诊断报告发送失败" }, "recoverableDatabaseCorruption": { "title": "本地数据已损坏", "description": "检测到本地数据库损坏，uBidBuddy 无法继续启动。确认后将备份旧数据库，并创建新的本地数据库继续启动。历史会话将不再显示，旧数据库会保留为备份文件。", "confirmRebuild": "备份旧库并重建新库", "sendDiagnostics": "发送诊断报告", "diagnosticsHint": "发送诊断报告不会修改本地数据库。", "diagnosticsSent": "诊断报告已发送", "diagnosticsReportSuccess": "诊断报告已发送", "diagnosticsReportFailed": "诊断报告发送失败", "rebuildFailed": "备份旧库并重建新库失败", "confirmDialog": { "title": "确认重建数据库？", "content": "此操作会备份当前损坏的数据库并创建一个全新空库。历史会话将不再显示（旧库会保留为备份文件）。确定继续吗？", "okText": "确认重建", "cancelText": "取消" } }, "transientConcurrentStartup": { "title": "uBidBuddy 正在启动", "description": "此窗口打开时，另一个 uBidBuddy 启动进程仍在使用本地数据。这是暂时的，您的数据是安全的——无需重新安装。请稍候片刻后重试，或重启 uBidBuddy。", "sendDiagnostics": "发送诊断", "diagnosticsSent": "诊断已发送", "diagnosticsReportSuccess": "诊断报告已发送", "diagnosticsReportFailed": "诊断报告发送失败", "diagnosticsHint": "如果该问题反复出现，您可以发送诊断报告。" }, "pendingSlow": { "title": "正在启动", "description": "AionCore 正在启动，请稍候。若长时间无响应，可退出应用后重试。" }, "exited": { "title": "启动未完成", "description": "AionCore 未能完成启动并已退出。请重启应用；若反复出现，请上报诊断信息。", "sendDiagnostics": "发送诊断", "diagnosticsSent": "诊断已发送", "diagnosticsReportSuccess": "诊断信息已上报", "diagnosticsReportFailed": "诊断上报失败，请稍后重试" }, "portReportTimeout": { "title": "启动超时", "description": "AionCore 未在预期时间内完成启动。请重启应用；若反复出现，请发送诊断。", "sendDiagnostics": "发送诊断", "diagnosticsSent": "诊断已发送", "diagnosticsReportSuccess": "诊断信息已上报", "diagnosticsReportFailed": "诊断上报失败，请稍后重试" }, "startupFailed": { "title": "启动失败", "description": "AionCore 启动失败。请重启应用；若反复出现，请发送诊断。", "sendDiagnostics": "发送诊断", "diagnosticsSent": "诊断已发送", "diagnosticsReportSuccess": "诊断信息已上报", "diagnosticsReportFailed": "诊断上报失败，请稍后重试" } };
const expand$b = "展开";
const name$b = "名称";
const added$b = "已添加";
const status$b = "状态";
const agentMode$b = "Agent 模式";
const refreshSuccess$b = "刷新成功";
const processing$b = "处理中...";
const optional$b = "（可选）";
const clear$b = "清除";
const unit$b = { "minute_short": "分", "second_short": "秒" };
const selectedCount$b = "已选 {{count}}";
const selectedSkills$b = "已选技能";
const aiAssistant$b = "AI 助手";
const commonZhCN = {
  send: send$b,
  cancel: cancel$b,
  save: save$b,
  "delete": "删除",
  confirm: confirm$b,
  file: file$b,
  folder: folder$b,
  upload: upload$b,
  model: model$b,
  skills: skills$b,
  workspace: workspace$b,
  settings: settings$b,
  system: system$b,
  about: about$b,
  back: back$b,
  goBack: goBack$b,
  add: add$b,
  edit: edit$b,
  website: website$b,
  version: version$b,
  contact: contact$b,
  github: github$b,
  loading: loading$b,
  copy: copy$b,
  reply: reply$b,
  openInBuiltinBrowser: openInBuiltinBrowser$b,
  openInSystemBrowser: openInSystemBrowser$b,
  copySuccess: copySuccess$b,
  copyFailed: copyFailed$b,
  download: download$b,
  close: close$b,
  retry: retry$b,
  reload: reload$b,
  technical_details: technical_details$b,
  error_details: error_details$b,
  troubleshooting: troubleshooting$b,
  select: select$b,
  expandMore: expandMore$b,
  collapse: collapse$b,
  viewMoreLines: viewMoreLines$b,
  viewMoreLines_one: viewMoreLines_one$b,
  viewMoreLines_other: viewMoreLines_other$b,
  success: success$b,
  error: error$b,
  saveSuccess: saveSuccess$b,
  saveFailed: saveFailed$b,
  unknownError: unknownError$b,
  confirmDelete: confirmDelete$b,
  deleteSuccess: deleteSuccess$b,
  deleteFailed: deleteFailed$b,
  "default": "默认",
  defaultModel: defaultModel$b,
  escToCancel: escToCancel$b,
  create: create$b,
  createSuccess: createSuccess$b,
  failed: failed$b,
  browse: browse$b,
  remove: remove$b,
  show: show$b,
  hide: hide$n,
  goToSettings: goToSettings$b,
  forward: forward$b,
  historyBack: historyBack$b,
  more: more$b,
  refresh: refresh$b,
  readOnly: readOnly$b,
  "tray.showWindow": "显示 uBidBuddy",
  "tray.newChat": "新建对话",
  "tray.closeToTray": "隐藏到托盘",
  "tray.about": "关于 uBidBuddy",
  "tray.restart": "重启应用",
  "tray.quit": "退出",
  "tray.runningTasks": "运行中的任务",
  "tray.pauseAll": "暂停所有任务",
  "tray.checkUpdate": "检查更新",
  "tray.recentChats": "最近对话",
  "tray.untitled": "未命名",
  backendStartup: backendStartup$b,
  "fileAttach.addFiles": "添加文件",
  "fileAttach.myDevice": "从设备上传",
  "fileAttach.failed": "上传失败",
  "fileAttach.uploading": "上传中...",
  "fileAttach.uploadSuccess": "上传成功",
  "fileAttach.cancelUpload": "取消上传",
  expand: expand$b,
  name: name$b,
  added: added$b,
  status: status$b,
  agentMode: agentMode$b,
  refreshSuccess: refreshSuccess$b,
  "import": "导入",
  processing: processing$b,
  optional: optional$b,
  clear: clear$b,
  unit: unit$b,
  selectedCount: selectedCount$b,
  selectedSkills: selectedSkills$b,
  aiAssistant: aiAssistant$b
};
const desktopPet$b = "桌面宠物";
const enable$b = "启用桌面宠物";
const size$b = "宠物大小";
const sizeSmall$b = "小 ({{px}}px)";
const sizeMedium$b = "中 ({{px}}px)";
const sizeLarge$b = "大 ({{px}}px)";
const dnd$b = "免打扰";
const dndDescription$b = "宠物保持空闲，忽略 AI 事件";
const confirmBubble$b = "在宠物窗口显示授权";
const confirmBubbleDescription$b = "关闭后，AI 工具授权请求只在主聊天窗口显示";
const pat$b = "摸摸";
const resetPosition$b = "重置位置";
const hide$m = "隐藏";
const showHide$b = "显示/隐藏";
const desktopOnly$b = "桌面宠物仅在桌面应用中可用，无法在 WebUI 浏览器模式下使用。";
const petZhCN = {
  desktopPet: desktopPet$b,
  enable: enable$b,
  size: size$b,
  sizeSmall: sizeSmall$b,
  sizeMedium: sizeMedium$b,
  sizeLarge: sizeLarge$b,
  dnd: dnd$b,
  dndDescription: dndDescription$b,
  confirmBubble: confirmBubble$b,
  confirmBubbleDescription: confirmBubbleDescription$b,
  pat: pat$b,
  resetPosition: resetPosition$b,
  hide: hide$m,
  showHide: showHide$b,
  desktopOnly: desktopOnly$b
};
const send$a = "發送";
const cancel$a = "取消";
const save$a = "儲存";
const confirm$a = "確認";
const file$a = "檔案";
const folder$a = "資料夾";
const upload$a = "上傳";
const model$a = "模型";
const skills$a = "技能";
const workspace$a = "專案";
const settings$a = "設定";
const system$a = "系統";
const about$a = "關於我們";
const back$a = "返回聊天";
const goBack$a = "返回";
const add$a = "新增";
const edit$a = "編輯";
const website$a = "官網";
const version$a = "版本號";
const contact$a = "聯絡我們";
const github$a = "Github";
const loading$a = "請稍候...";
const copy$a = "複製";
const reply$a = "引用";
const openInBuiltinBrowser$a = "內建瀏覽器開啟";
const openInSystemBrowser$a = "系統瀏覽器開啟";
const copySuccess$a = "已複製";
const copyFailed$a = "複製失敗";
const download$a = "下載";
const close$a = "Close";
const retry$a = "重試";
const reload$a = "重新載入";
const technical_details$a = "技術詳情";
const error_details$a = "錯誤詳情";
const troubleshooting$a = "疑難排解";
const select$a = "選擇";
const expandMore$a = "展開更多";
const collapse$a = "收起";
const viewMoreLines$a = "檢視更多 ({{count}} 行)";
const viewMoreLines_one$a = "檢視更多 ({{count}} 行)";
const viewMoreLines_other$a = "檢視更多 ({{count}} 行)";
const success$a = "Success";
const error$a = "Error";
const saveSuccess$a = "Saved successfully";
const saveFailed$a = "Failed to save";
const unknownError$a = "未知錯誤";
const confirmDelete$a = "確認刪除";
const deleteSuccess$a = "刪除成功";
const deleteFailed$a = "刪除失敗";
const defaultModel$a = "預設模型";
const escToCancel$a = "按 ESC 取消";
const create$a = "建立";
const createSuccess$a = "建立成功";
const failed$a = "失敗";
const browse$a = "瀏覽";
const remove$a = "移除";
const show$a = "顯示";
const hide$l = "隱藏";
const goToSettings$a = "前往設定";
const forward$a = "前進";
const historyBack$a = "後退";
const more$a = "更多";
const refresh$a = "重新整理";
const readOnly$a = "唯讀";
const backendStartup$a = { "incompatibleRuntime": { "title": "目前系統不支援內建後端", "description": "uBidBuddy 已開啟，但本機 AionCore 後端無法在目前 Linux 版本上執行。請升級到受支援的 Linux 發行版後重新啟動 uBidBuddy。", "requiredVersions": "需要的執行階段符號：{{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy 安裝不完整", "description": "目前安裝缺少必要的本機資源，AionCore 無法啟動。請下載並重新安裝最新版 uBidBuddy；如果重新安裝後仍然出現，請檢查系統安全軟體或防毒軟體是否隔離了 AionCore。", "downloadLatest": "下載最新版", "sendDiagnostics": "傳送診斷報告", "diagnosticsSent": "診斷報告已傳送", "diagnosticsReportSuccess": "診斷報告已傳送", "diagnosticsReportFailed": "診斷報告傳送失敗", "runtimeComponentDescription": "目前安裝缺少必要的內建執行元件，{{resource}} 無法啟動。請重新安裝最新版 uBidBuddy；如果重新安裝後仍然出現，請檢查系統安全軟體或防毒軟體是否隔離了 uBidBuddy 元件。" }, "packageArchitectureMismatch": { "title": "uBidBuddy 安裝包架構不相符", "description": "目前 uBidBuddy 安裝包是 {{packageArch}}，但這台 Mac 是 {{deviceArch}}。你可能下載了錯誤的安裝包，請重新下載並安裝 {{expectedArch}} 版本。" }, "dataMigration": { "title": "本地資料遷移失敗", "description": "uBidBuddy 已開啟，但 AionCore 在初始化本地資料時停止。重新安裝 uBidBuddy 未必能解決此問題。請傳送診斷報告或聯絡支援，以便檢查本地資料庫遷移狀態。", "sendDiagnostics": "傳送診斷報告", "diagnosticsSent": "診斷報告已傳送", "diagnosticsReportSuccess": "診斷報告已傳送", "diagnosticsReportFailed": "診斷報告傳送失敗" }, "databaseNewerThanApp": { "title": "需要更新 uBidBuddy", "description": "本機資料由較新版本的 uBidBuddy 建立，目前版本無法開啟。請將 uBidBuddy 更新至最新版本即可繼續使用，資料完好無損，無需重新安裝或重設資料。", "descriptionWithVersion": "本機資料由比目前版本 v{{currentVersion}} 更新的 uBidBuddy 建立，目前版本無法開啟。請將 uBidBuddy 更新至最新版本即可繼續使用，資料完好無損，無需重新安裝或重設資料。" }, "localDataRepair": { "title": "本機資料修復失敗", "description": "uBidBuddy 已開啟，但 AionCore 在準備本機啟動資料時停止，例如 assistant 或代理記錄。重新安裝 uBidBuddy 可能無法解決此問題。請傳送診斷報告或聯絡支援，以便檢查本機資料庫。", "sendDiagnostics": "傳送診斷", "diagnosticsSent": "診斷已傳送", "diagnosticsReportSuccess": "診斷報告已傳送", "diagnosticsReportFailed": "診斷報告傳送失敗" }, "startupDirectory": { "title": "啟動目錄無法使用", "description": "uBidBuddy 已開啟，但因為設定的工作目錄或日誌目錄不存在、無法存取或權限受限，AionCore 無法啟動。請確認這些目錄存在且可寫入，然後重新啟動 uBidBuddy。", "sendDiagnostics": "傳送診斷報告", "diagnosticsSent": "診斷報告已傳送", "diagnosticsReportSuccess": "診斷報告已傳送", "diagnosticsReportFailed": "診斷報告傳送失敗" }, "recoverableDatabaseCorruption": { "title": "本機資料已損壞", "description": "偵測到本機資料庫損壞，uBidBuddy 無法繼續啟動。確認後將備份舊資料庫，並建立新的本機資料庫繼續啟動。歷史對話將不再顯示，舊資料庫會保留為備份檔案。", "confirmRebuild": "備份舊資料庫並重建新資料庫", "sendDiagnostics": "傳送診斷報告", "diagnosticsHint": "傳送診斷報告不會修改本機資料庫。", "diagnosticsSent": "診斷報告已傳送", "diagnosticsReportSuccess": "診斷報告已傳送", "diagnosticsReportFailed": "診斷報告傳送失敗", "rebuildFailed": "備份舊資料庫並重建新資料庫失敗", "confirmDialog": { "title": "確認重建資料庫？", "content": "此操作會備份目前損壞的資料庫並建立一個全新空庫。歷史對話將不再顯示（舊庫會保留為備份檔案）。確定要繼續嗎？", "okText": "確認重建", "cancelText": "取消" } }, "transientConcurrentStartup": { "title": "uBidBuddy 正在啟動", "description": "此視窗開啟時，另一個 uBidBuddy 啟動程序仍在使用本機資料。這是暫時的，您的資料是安全的——無需重新安裝。請稍候片刻後重試，或重新啟動 uBidBuddy。", "sendDiagnostics": "傳送診斷", "diagnosticsSent": "診斷已傳送", "diagnosticsReportSuccess": "診斷報告已傳送", "diagnosticsReportFailed": "診斷報告傳送失敗", "diagnosticsHint": "如果此問題反覆出現，您可以傳送診斷報告。" }, "pendingSlow": { "title": "正在啟動", "description": "AionCore 正在啟動，請稍候。若長時間無回應，可結束應用程式後再試。" }, "exited": { "title": "啟動未完成", "description": "AionCore 未能完成啟動並已結束。請重新啟動應用程式；若反覆出現，請回報診斷資訊。", "sendDiagnostics": "傳送診斷", "diagnosticsSent": "診斷已傳送", "diagnosticsReportSuccess": "診斷資訊已回報", "diagnosticsReportFailed": "診斷回報失敗，請稍後再試" }, "portReportTimeout": { "title": "啟動逾時", "description": "AionCore 未在預期時間內完成啟動。請重新啟動應用程式；若反覆出現，請傳送診斷。", "sendDiagnostics": "傳送診斷", "diagnosticsSent": "診斷已傳送", "diagnosticsReportSuccess": "診斷資訊已回報", "diagnosticsReportFailed": "診斷回報失敗，請稍後再試" }, "startupFailed": { "title": "啟動失敗", "description": "AionCore 啟動失敗。請重新啟動應用程式；若反覆出現，請傳送診斷。", "sendDiagnostics": "傳送診斷", "diagnosticsSent": "診斷已傳送", "diagnosticsReportSuccess": "診斷資訊已回報", "diagnosticsReportFailed": "診斷回報失敗，請稍後再試" } };
const expand$a = "展開";
const name$a = "名稱";
const added$a = "已新增";
const status$a = "狀態";
const agentMode$a = "Agent 模式";
const refreshSuccess$a = "重新整理成功";
const processing$a = "處理中...";
const optional$a = "（選填）";
const clear$a = "清除";
const unit$a = { "minute_short": "分", "second_short": "秒" };
const selectedCount$a = "已選 {{count}}";
const selectedSkills$a = "已選技能";
const aiAssistant$a = "AI 助手";
const commonZhTW = {
  send: send$a,
  cancel: cancel$a,
  save: save$a,
  "delete": "刪除",
  confirm: confirm$a,
  file: file$a,
  folder: folder$a,
  upload: upload$a,
  model: model$a,
  skills: skills$a,
  workspace: workspace$a,
  settings: settings$a,
  system: system$a,
  about: about$a,
  back: back$a,
  goBack: goBack$a,
  add: add$a,
  edit: edit$a,
  website: website$a,
  version: version$a,
  contact: contact$a,
  github: github$a,
  loading: loading$a,
  copy: copy$a,
  reply: reply$a,
  openInBuiltinBrowser: openInBuiltinBrowser$a,
  openInSystemBrowser: openInSystemBrowser$a,
  copySuccess: copySuccess$a,
  copyFailed: copyFailed$a,
  download: download$a,
  close: close$a,
  retry: retry$a,
  reload: reload$a,
  technical_details: technical_details$a,
  error_details: error_details$a,
  troubleshooting: troubleshooting$a,
  select: select$a,
  expandMore: expandMore$a,
  collapse: collapse$a,
  viewMoreLines: viewMoreLines$a,
  viewMoreLines_one: viewMoreLines_one$a,
  viewMoreLines_other: viewMoreLines_other$a,
  success: success$a,
  error: error$a,
  saveSuccess: saveSuccess$a,
  saveFailed: saveFailed$a,
  unknownError: unknownError$a,
  confirmDelete: confirmDelete$a,
  deleteSuccess: deleteSuccess$a,
  deleteFailed: deleteFailed$a,
  "default": "預設",
  defaultModel: defaultModel$a,
  escToCancel: escToCancel$a,
  create: create$a,
  createSuccess: createSuccess$a,
  failed: failed$a,
  browse: browse$a,
  remove: remove$a,
  show: show$a,
  hide: hide$l,
  goToSettings: goToSettings$a,
  forward: forward$a,
  historyBack: historyBack$a,
  more: more$a,
  refresh: refresh$a,
  readOnly: readOnly$a,
  "tray.showWindow": "顯示 uBidBuddy",
  "tray.newChat": "新建對話",
  "tray.closeToTray": "隱藏到托盤",
  "tray.about": "關於 uBidBuddy",
  "tray.restart": "重啟應用",
  "tray.quit": "結束",
  "tray.runningTasks": "運行中的任務",
  "tray.pauseAll": "暫停所有任務",
  "tray.checkUpdate": "檢查更新",
  "tray.recentChats": "最近對話",
  "tray.untitled": "未命名",
  backendStartup: backendStartup$a,
  "fileAttach.addFiles": "新增檔案",
  "fileAttach.myDevice": "我的裝置",
  "fileAttach.failed": "上傳失敗",
  "fileAttach.uploading": "上傳中...",
  "fileAttach.uploadSuccess": "上傳成功",
  "fileAttach.cancelUpload": "取消上傳",
  expand: expand$a,
  name: name$a,
  added: added$a,
  status: status$a,
  agentMode: agentMode$a,
  refreshSuccess: refreshSuccess$a,
  "import": "匯入",
  processing: processing$a,
  optional: optional$a,
  clear: clear$a,
  unit: unit$a,
  selectedCount: selectedCount$a,
  selectedSkills: selectedSkills$a,
  aiAssistant: aiAssistant$a
};
const desktopPet$a = "桌面寵物";
const enable$a = "啟用桌面寵物";
const size$a = "寵物大小";
const sizeSmall$a = "小 ({{px}}px)";
const sizeMedium$a = "中 ({{px}}px)";
const sizeLarge$a = "大 ({{px}}px)";
const dnd$a = "勿擾模式";
const dndDescription$a = "寵物保持閒置，忽略 AI 事件";
const confirmBubble$a = "在寵物視窗顯示授權";
const confirmBubbleDescription$a = "關閉後，AI 工具授權請求只在主聊天視窗顯示";
const pat$a = "摸摸";
const resetPosition$a = "重設位置";
const hide$k = "隱藏";
const showHide$a = "顯示/隱藏";
const desktopOnly$a = "桌面寵物僅在桌面應用中可用，無法在 WebUI 瀏覽器模式下使用。";
const petZhTW = {
  desktopPet: desktopPet$a,
  enable: enable$a,
  size: size$a,
  sizeSmall: sizeSmall$a,
  sizeMedium: sizeMedium$a,
  sizeLarge: sizeLarge$a,
  dnd: dnd$a,
  dndDescription: dndDescription$a,
  confirmBubble: confirmBubble$a,
  confirmBubbleDescription: confirmBubbleDescription$a,
  pat: pat$a,
  resetPosition: resetPosition$a,
  hide: hide$k,
  showHide: showHide$a,
  desktopOnly: desktopOnly$a
};
const send$9 = "送信";
const cancel$9 = "キャンセル";
const save$9 = "保存";
const confirm$9 = "確認";
const file$9 = "ファイル";
const folder$9 = "フォルダ";
const upload$9 = "アップロード";
const model$9 = "モデル";
const skills$9 = "スキル";
const workspace$9 = "プロジェクト";
const settings$9 = "設定";
const system$9 = "システム";
const about$9 = "私たちについて";
const back$9 = "チャットに戻る";
const goBack$9 = "戻る";
const add$9 = "追加";
const edit$9 = "編集";
const website$9 = "公式サイト";
const version$9 = "バージョン";
const contact$9 = "お問い合わせ";
const github$9 = "Github";
const loading$9 = "お待ちください...";
const copy$9 = "コピー";
const reply$9 = "引用";
const openInBuiltinBrowser$9 = "内蔵ブラウザで開く";
const openInSystemBrowser$9 = "システムブラウザで開く";
const copySuccess$9 = "コピーしました";
const copyFailed$9 = "コピーに失敗しました";
const download$9 = "ダウンロード";
const close$9 = "閉じる";
const retry$9 = "再試行";
const reload$9 = "再読み込み";
const technical_details$9 = "技術詳細";
const error_details$9 = "エラー詳細";
const troubleshooting$9 = "トラブルシューティング";
const select$9 = "選択";
const expandMore$9 = "さらに表示";
const collapse$9 = "折りたたむ";
const viewMoreLines$9 = "もっと見る ({{count}} 行)";
const viewMoreLines_one$9 = "もっと見る ({{count}} 行)";
const viewMoreLines_other$9 = "もっと見る ({{count}} 行)";
const success$9 = "成功";
const error$9 = "エラー";
const saveSuccess$9 = "保存に成功しました";
const saveFailed$9 = "保存に失敗しました";
const unknownError$9 = "不明なエラー";
const confirmDelete$9 = "削除の確認";
const deleteSuccess$9 = "削除に成功しました";
const deleteFailed$9 = "削除に失敗しました";
const defaultModel$9 = "デフォルトモデル";
const escToCancel$9 = "ESC でキャンセル";
const create$9 = "作成";
const createSuccess$9 = "作成に成功しました";
const failed$9 = "失敗";
const browse$9 = "参照";
const remove$9 = "削除";
const show$9 = "表示";
const hide$j = "非表示";
const goToSettings$9 = "設定に移動";
const forward$9 = "進む";
const historyBack$9 = "戻る";
const more$9 = "その他";
const refresh$9 = "更新";
const readOnly$9 = "読み取り専用";
const backendStartup$9 = { "incompatibleRuntime": { "title": "このシステムは同梱バックエンドに対応していません", "description": "uBidBuddy は開きましたが、ローカルの AionCore バックエンドはこの Linux バージョンでは実行できません。対応している Linux ディストリビューションにアップグレードしてから uBidBuddy を再起動してください。", "requiredVersions": "必要なランタイムシンボル: {{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy のインストールが不完全です", "description": "このインストールには必要なローカルリソースが不足しているため、AionCore を起動できません。最新の uBidBuddy をダウンロードして再インストールしてください。再インストール後も問題が再発する場合は、セキュリティソフトまたはウイルス対策ソフトが AionCore を隔離していないか確認してください。", "downloadLatest": "最新版をダウンロード", "sendDiagnostics": "診断レポートを送信", "diagnosticsSent": "診断レポートを送信済み", "diagnosticsReportSuccess": "診断レポートを送信しました", "diagnosticsReportFailed": "診断レポートの送信に失敗しました", "runtimeComponentDescription": "このインストールには必要な組み込み実行コンポーネントが不足しているため、{{resource}} を起動できません。最新版の uBidBuddy パッケージを再インストールしてください。再インストール後も続く場合は、セキュリティソフトまたはウイルス対策ソフトが uBidBuddy コンポーネントを隔離していないか確認してください。" }, "packageArchitectureMismatch": { "title": "uBidBuddy package architecture mismatch", "description": "This uBidBuddy package is for {{packageArch}}, but this Mac is {{deviceArch}}. You may have downloaded the wrong package. Please download and install the {{expectedArch}} package." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "新しいバージョンの uBidBuddy が必要です", "description": "ローカルデータはより新しいバージョンの uBidBuddy で作成されたため、このバージョンでは開けません。uBidBuddy を最新バージョンに更新すれば続行できます。データは保持され、再インストールやリセットは不要です。", "descriptionWithVersion": "ローカルデータは現在のバージョン v{{currentVersion}} より新しい uBidBuddy で作成されたため、このバージョンでは開けません。uBidBuddy を最新バージョンに更新すれば続行できます。データは保持され、再インストールやリセットは不要です。" }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy は開きましたが、AionCore は assistant またはエージェントのレコードなどのローカル起動データを準備中に停止しました。uBidBuddy を再インストールしても解決しない可能性があります。ローカルデータベースを確認できるよう、診断レポートを送信するかサポートに連絡してください。", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "ローカルデータが破損しています", "description": "ローカルデータベースの破損を検出したため、uBidBuddy は起動を続行できません。確認後、古いデータベースをバックアップし、新しいローカルデータベースを作成して起動を続行します。過去の会話は表示されなくなり、古いデータベースはバックアップファイルとして保持されます。", "confirmRebuild": "古いDBをバックアップして新しいDBを再作成", "sendDiagnostics": "診断レポートを送信", "diagnosticsHint": "診断レポートの送信ではローカルデータベースは変更されません。", "diagnosticsSent": "診断レポートを送信しました", "diagnosticsReportSuccess": "診断レポートを送信しました", "diagnosticsReportFailed": "診断レポートの送信に失敗しました", "rebuildFailed": "古いDBのバックアップと新しいDBの再作成に失敗しました", "confirmDialog": { "title": "データベースを再構築しますか？", "content": "この操作は現在の破損したデータベースをバックアップし、まったく新しい空のデータベースを作成します。過去の会話は表示されなくなります（古いデータベースはバックアップファイルとして保持されます）。続行しますか？", "okText": "再構築を確認", "cancelText": "キャンセル" } }, "transientConcurrentStartup": { "title": "uBidBuddy を起動しています", "description": "このウィンドウを開いたとき、別の uBidBuddy の起動処理がまだローカルデータを使用していました。これは一時的なもので、データは安全です。再インストールの必要はありません。少し待ってから再試行するか、uBidBuddy を再起動してください。", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "この現象が繰り返し発生する場合は、診断レポートを送信できます。" }, "pendingSlow": { "title": "起動中", "description": "AionCore を起動しています。しばらくお待ちください。しばらく応答がない場合は、アプリを終了してから再度お試しください。" }, "exited": { "title": "起動が完了しませんでした", "description": "AionCore は起動を完了できずに終了しました。アプリを再起動してください。繰り返し発生する場合は、診断情報を送信してください。", "sendDiagnostics": "診断を送信", "diagnosticsSent": "診断を送信しました", "diagnosticsReportSuccess": "診断情報を送信しました", "diagnosticsReportFailed": "診断の送信に失敗しました。しばらくしてから再試行してください。" }, "portReportTimeout": { "title": "起動がタイムアウトしました", "description": "AionCore は想定時間内に起動を完了できませんでした。アプリを再起動してください。繰り返し発生する場合は、診断情報を送信してください。", "sendDiagnostics": "診断を送信", "diagnosticsSent": "診断を送信しました", "diagnosticsReportSuccess": "診断情報を送信しました", "diagnosticsReportFailed": "診断の送信に失敗しました。しばらくしてから再試行してください。" }, "startupFailed": { "title": "起動に失敗しました", "description": "AionCore を起動できませんでした。アプリを再起動してください。繰り返し発生する場合は、診断情報を送信してください。", "sendDiagnostics": "診断を送信", "diagnosticsSent": "診断を送信しました", "diagnosticsReportSuccess": "診断情報を送信しました", "diagnosticsReportFailed": "診断の送信に失敗しました。しばらくしてから再試行してください。" } };
const expand$9 = "展開";
const name$9 = "名前";
const added$9 = "追加済み";
const status$9 = "ステータス";
const agentMode$9 = "エージェントモード";
const refreshSuccess$9 = "更新しました";
const processing$9 = "処理中...";
const optional$9 = "（任意）";
const clear$9 = "クリア";
const unit$9 = { "minute_short": "分", "second_short": "秒" };
const selectedCount$9 = "選択済み {{count}}";
const selectedSkills$9 = "選択済みスキル";
const aiAssistant$9 = "AI アシスタント";
const commonJaJP = {
  send: send$9,
  cancel: cancel$9,
  save: save$9,
  "delete": "削除",
  confirm: confirm$9,
  file: file$9,
  folder: folder$9,
  upload: upload$9,
  model: model$9,
  skills: skills$9,
  workspace: workspace$9,
  settings: settings$9,
  system: system$9,
  about: about$9,
  back: back$9,
  goBack: goBack$9,
  add: add$9,
  edit: edit$9,
  website: website$9,
  version: version$9,
  contact: contact$9,
  github: github$9,
  loading: loading$9,
  copy: copy$9,
  reply: reply$9,
  openInBuiltinBrowser: openInBuiltinBrowser$9,
  openInSystemBrowser: openInSystemBrowser$9,
  copySuccess: copySuccess$9,
  copyFailed: copyFailed$9,
  download: download$9,
  close: close$9,
  retry: retry$9,
  reload: reload$9,
  technical_details: technical_details$9,
  error_details: error_details$9,
  troubleshooting: troubleshooting$9,
  select: select$9,
  expandMore: expandMore$9,
  collapse: collapse$9,
  viewMoreLines: viewMoreLines$9,
  viewMoreLines_one: viewMoreLines_one$9,
  viewMoreLines_other: viewMoreLines_other$9,
  success: success$9,
  error: error$9,
  saveSuccess: saveSuccess$9,
  saveFailed: saveFailed$9,
  unknownError: unknownError$9,
  confirmDelete: confirmDelete$9,
  deleteSuccess: deleteSuccess$9,
  deleteFailed: deleteFailed$9,
  "default": "デフォルト",
  defaultModel: defaultModel$9,
  escToCancel: escToCancel$9,
  create: create$9,
  createSuccess: createSuccess$9,
  failed: failed$9,
  browse: browse$9,
  remove: remove$9,
  show: show$9,
  hide: hide$j,
  goToSettings: goToSettings$9,
  forward: forward$9,
  historyBack: historyBack$9,
  more: more$9,
  refresh: refresh$9,
  readOnly: readOnly$9,
  "tray.showWindow": "uBidBuddy を表示",
  "tray.newChat": "新しいチャット",
  "tray.closeToTray": "トレイに隠す",
  "tray.about": "uBidBuddy について",
  "tray.restart": "アプリを再起動",
  "tray.quit": "終了",
  "tray.runningTasks": "実行中のタスク",
  "tray.pauseAll": "すべてのタスクを一時停止",
  "tray.checkUpdate": "更新を確認",
  "tray.recentChats": "最近のチャット",
  "tray.untitled": "無題",
  backendStartup: backendStartup$9,
  "fileAttach.addFiles": "ファイルを追加",
  "fileAttach.myDevice": "マイデバイス",
  "fileAttach.failed": "アップロードに失敗しました",
  "fileAttach.uploading": "アップロード中...",
  "fileAttach.uploadSuccess": "アップロード成功",
  "fileAttach.cancelUpload": "アップロードをキャンセル",
  expand: expand$9,
  name: name$9,
  added: added$9,
  status: status$9,
  agentMode: agentMode$9,
  refreshSuccess: refreshSuccess$9,
  "import": "インポート",
  processing: processing$9,
  optional: optional$9,
  clear: clear$9,
  unit: unit$9,
  selectedCount: selectedCount$9,
  selectedSkills: selectedSkills$9,
  aiAssistant: aiAssistant$9
};
const desktopPet$9 = "デスクトップペット";
const enable$9 = "デスクトップペットを有効にする";
const size$9 = "ペットのサイズ";
const sizeSmall$9 = "小 ({{px}}px)";
const sizeMedium$9 = "中 ({{px}}px)";
const sizeLarge$9 = "大 ({{px}}px)";
const dnd$9 = "おやすみモード";
const dndDescription$9 = "ペットはアイドル状態を維持し、AIイベントを無視します";
const confirmBubble$9 = "認可をペットウィンドウに表示";
const confirmBubbleDescription$9 = "オフにすると、AI ツールの認可リクエストはメインチャットウィンドウに表示されます";
const pat$9 = "なでなで";
const resetPosition$9 = "位置をリセット";
const hide$i = "非表示";
const showHide$9 = "表示/非表示";
const desktopOnly$9 = "デスクトップペットはデスクトップアプリでのみ利用可能です。WebUIブラウザモードでは使用できません。";
const petJaJP = {
  desktopPet: desktopPet$9,
  enable: enable$9,
  size: size$9,
  sizeSmall: sizeSmall$9,
  sizeMedium: sizeMedium$9,
  sizeLarge: sizeLarge$9,
  dnd: dnd$9,
  dndDescription: dndDescription$9,
  confirmBubble: confirmBubble$9,
  confirmBubbleDescription: confirmBubbleDescription$9,
  pat: pat$9,
  resetPosition: resetPosition$9,
  hide: hide$i,
  showHide: showHide$9,
  desktopOnly: desktopOnly$9
};
const send$8 = "전송";
const cancel$8 = "취소";
const save$8 = "저장";
const confirm$8 = "확인";
const file$8 = "파일";
const folder$8 = "폴더";
const upload$8 = "업로드";
const model$8 = "모델";
const skills$8 = "스킬";
const workspace$8 = "프로젝트";
const settings$8 = "설정";
const system$8 = "시스템";
const about$8 = "소개";
const back$8 = "채팅으로 돌아가기";
const goBack$8 = "뒤로";
const add$8 = "추가";
const edit$8 = "편집";
const website$8 = "웹사이트";
const version$8 = "버전";
const contact$8 = "연락처";
const github$8 = "Github";
const loading$8 = "기다려주세요...";
const copy$8 = "복사";
const reply$8 = "인용";
const openInBuiltinBrowser$8 = "내장 브라우저로 열기";
const openInSystemBrowser$8 = "시스템 브라우저로 열기";
const copySuccess$8 = "복사됨";
const copyFailed$8 = "복사 실패";
const download$8 = "다운로드";
const close$8 = "닫기";
const retry$8 = "재시도";
const reload$8 = "새로고침";
const technical_details$8 = "기술적 세부사항";
const error_details$8 = "오류 세부사항";
const troubleshooting$8 = "문제 해결";
const select$8 = "선택";
const expandMore$8 = "더 보기";
const collapse$8 = "접기";
const viewMoreLines$8 = "더 보기 ({{count}}줄)";
const viewMoreLines_one$8 = "더 보기 ({{count}}줄)";
const viewMoreLines_other$8 = "더 보기 ({{count}}줄)";
const success$8 = "성공";
const error$8 = "오류";
const saveSuccess$8 = "저장 성공";
const saveFailed$8 = "저장 실패";
const unknownError$8 = "알 수 없는 오류";
const confirmDelete$8 = "삭제 확인";
const deleteSuccess$8 = "삭제 성공";
const deleteFailed$8 = "삭제 실패";
const defaultModel$8 = "기본 모델";
const escToCancel$8 = "취소하려면 esc";
const create$8 = "생성";
const createSuccess$8 = "생성 성공";
const failed$8 = "실패";
const browse$8 = "찾아보기";
const remove$8 = "제거";
const show$8 = "표시";
const hide$h = "숨기기";
const goToSettings$8 = "설정으로 이동";
const forward$8 = "앞으로";
const historyBack$8 = "뒤로";
const more$8 = "더보기";
const refresh$8 = "새로고침";
const readOnly$8 = "읽기 전용";
const backendStartup$8 = { "incompatibleRuntime": { "title": "이 시스템은 번들 백엔드를 지원하지 않습니다", "description": "uBidBuddy는 열렸지만 로컬 AionCore 백엔드를 이 Linux 버전에서 실행할 수 없습니다. 지원되는 Linux 배포판으로 업그레이드한 뒤 uBidBuddy를 다시 시작하세요.", "requiredVersions": "필요한 런타임 심볼: {{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy 설치가 불완전합니다", "description": "현재 설치에 필요한 로컬 리소스가 없어 AionCore를 시작할 수 없습니다. 최신 uBidBuddy를 다운로드하여 다시 설치하세요. 다시 설치한 후에도 문제가 반복되면 보안 또는 바이러스 백신 소프트웨어가 AionCore를 격리했는지 확인하세요.", "downloadLatest": "최신 버전 다운로드", "sendDiagnostics": "진단 보고서 보내기", "diagnosticsSent": "진단 보고서를 보냈습니다", "diagnosticsReportSuccess": "진단 보고서를 보냈습니다", "diagnosticsReportFailed": "진단 보고서를 보내지 못했습니다", "runtimeComponentDescription": "현재 설치에 필요한 내장 런타임 구성 요소가 없어 {{resource}}을(를) 시작할 수 없습니다. 최신 uBidBuddy 패키지를 다시 설치하세요. 다시 설치한 후에도 문제가 계속되면 보안 또는 백신 소프트웨어가 uBidBuddy 구성 요소를 격리했는지 확인하세요." }, "packageArchitectureMismatch": { "title": "uBidBuddy package architecture mismatch", "description": "This uBidBuddy package is for {{packageArch}}, but this Mac is {{deviceArch}}. You may have downloaded the wrong package. Please download and install the {{expectedArch}} package." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "최신 버전의 uBidBuddy가 필요합니다", "description": "로컬 데이터가 더 최신 버전의 uBidBuddy에서 생성되어 현재 버전에서는 열 수 없습니다. uBidBuddy를 최신 버전으로 업데이트하면 계속 사용할 수 있습니다. 데이터는 그대로 유지되며 재설치나 초기화는 필요하지 않습니다.", "descriptionWithVersion": "로컬 데이터가 현재 버전 v{{currentVersion}}보다 최신 버전의 uBidBuddy에서 생성되어 현재 버전에서는 열 수 없습니다. uBidBuddy를 최신 버전으로 업데이트하면 계속 사용할 수 있습니다. 데이터는 그대로 유지되며 재설치나 초기화는 필요하지 않습니다." }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy는 열렸지만 AionCore가 assistant 또는 에이전트 레코드 같은 로컬 시작 데이터를 준비하는 동안 중지되었습니다. uBidBuddy를 다시 설치해도 문제가 해결되지 않을 수 있습니다. 로컬 데이터베이스를 검사할 수 있도록 진단 보고서를 보내거나 지원팀에 문의하세요.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "로컬 데이터가 손상되었습니다", "description": "로컬 데이터베이스 손상이 감지되어 uBidBuddy가 시작을 계속할 수 없습니다. 확인하면 이전 데이터베이스를 백업하고 새 로컬 데이터베이스를 만들어 시작을 계속합니다. 기존 대화는 더 이상 표시되지 않으며 이전 데이터베이스는 백업 파일로 보관됩니다.", "confirmRebuild": "이전 DB 백업 후 새 DB 재생성", "sendDiagnostics": "진단 보고서 보내기", "diagnosticsHint": "진단 보고서를 보내도 로컬 데이터베이스는 수정되지 않습니다.", "diagnosticsSent": "진단 보고서가 전송되었습니다", "diagnosticsReportSuccess": "진단 보고서가 전송되었습니다", "diagnosticsReportFailed": "진단 보고서 전송 실패", "rebuildFailed": "이전 DB 백업 및 새 DB 재생성 실패", "confirmDialog": { "title": "데이터베이스를 재생성하시겠습니까?", "content": "이 작업은 현재 손상된 데이터베이스를 백업하고 완전히 새로운 빈 데이터베이스를 생성합니다. 기존 대화는 더 이상 표시되지 않습니다(이전 데이터베이스는 백업 파일로 보관됩니다). 계속하시겠습니까?", "okText": "재생성 확인", "cancelText": "취소" } }, "transientConcurrentStartup": { "title": "uBidBuddy를 시작하는 중입니다", "description": "이 창이 열릴 때 다른 uBidBuddy 시작 프로세스가 아직 로컬 데이터를 사용하고 있었습니다. 이는 일시적인 현상이며 데이터는 안전합니다. 다시 설치할 필요가 없습니다. 잠시 기다린 후 다시 시도하거나 uBidBuddy를 다시 시작하세요.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "이 문제가 계속 발생하면 진단 보고서를 보낼 수 있습니다." }, "pendingSlow": { "title": "시작 중", "description": "AionCore를 시작하고 있습니다. 잠시 기다려 주세요. 한동안 응답이 없으면 앱을 종료한 후 다시 시도할 수 있습니다." }, "exited": { "title": "시작이 완료되지 않았습니다", "description": "AionCore가 시작을 완료하지 못하고 종료되었습니다. 앱을 다시 시작해 주세요. 계속 발생하면 진단 정보를 보내 주세요.", "sendDiagnostics": "진단 보내기", "diagnosticsSent": "진단을 보냈습니다", "diagnosticsReportSuccess": "진단 정보를 보고했습니다", "diagnosticsReportFailed": "진단 전송에 실패했습니다. 나중에 다시 시도해 주세요." }, "portReportTimeout": { "title": "시작 시간 초과", "description": "AionCore가 예상 시간 내에 시작을 완료하지 못했습니다. 앱을 다시 시작해 주세요. 계속 발생하면 진단 정보를 보내 주세요.", "sendDiagnostics": "진단 보내기", "diagnosticsSent": "진단을 보냈습니다", "diagnosticsReportSuccess": "진단 정보를 보고했습니다", "diagnosticsReportFailed": "진단 전송에 실패했습니다. 나중에 다시 시도해 주세요." }, "startupFailed": { "title": "시작 실패", "description": "AionCore를 시작하지 못했습니다. 앱을 다시 시작해 주세요. 계속 발생하면 진단 정보를 보내 주세요.", "sendDiagnostics": "진단 보내기", "diagnosticsSent": "진단을 보냈습니다", "diagnosticsReportSuccess": "진단 정보를 보고했습니다", "diagnosticsReportFailed": "진단 전송에 실패했습니다. 나중에 다시 시도해 주세요." } };
const expand$8 = "펼치기";
const name$8 = "이름";
const added$8 = "추가됨";
const status$8 = "상태";
const agentMode$8 = "에이전트 모드";
const refreshSuccess$8 = "새로고침 완료";
const processing$8 = "처리 중...";
const optional$8 = "(선택 사항)";
const clear$8 = "지우기";
const unit$8 = { "minute_short": "분", "second_short": "초" };
const selectedCount$8 = "선택됨 {{count}}";
const selectedSkills$8 = "선택된 스킬";
const aiAssistant$8 = "AI 어시스턴트";
const commonKoKR = {
  send: send$8,
  cancel: cancel$8,
  save: save$8,
  "delete": "삭제",
  confirm: confirm$8,
  file: file$8,
  folder: folder$8,
  upload: upload$8,
  model: model$8,
  skills: skills$8,
  workspace: workspace$8,
  settings: settings$8,
  system: system$8,
  about: about$8,
  back: back$8,
  goBack: goBack$8,
  add: add$8,
  edit: edit$8,
  website: website$8,
  version: version$8,
  contact: contact$8,
  github: github$8,
  loading: loading$8,
  copy: copy$8,
  reply: reply$8,
  openInBuiltinBrowser: openInBuiltinBrowser$8,
  openInSystemBrowser: openInSystemBrowser$8,
  copySuccess: copySuccess$8,
  copyFailed: copyFailed$8,
  download: download$8,
  close: close$8,
  retry: retry$8,
  reload: reload$8,
  technical_details: technical_details$8,
  error_details: error_details$8,
  troubleshooting: troubleshooting$8,
  select: select$8,
  expandMore: expandMore$8,
  collapse: collapse$8,
  viewMoreLines: viewMoreLines$8,
  viewMoreLines_one: viewMoreLines_one$8,
  viewMoreLines_other: viewMoreLines_other$8,
  success: success$8,
  error: error$8,
  saveSuccess: saveSuccess$8,
  saveFailed: saveFailed$8,
  unknownError: unknownError$8,
  confirmDelete: confirmDelete$8,
  deleteSuccess: deleteSuccess$8,
  deleteFailed: deleteFailed$8,
  "default": "기본",
  defaultModel: defaultModel$8,
  escToCancel: escToCancel$8,
  create: create$8,
  createSuccess: createSuccess$8,
  failed: failed$8,
  browse: browse$8,
  remove: remove$8,
  show: show$8,
  hide: hide$h,
  goToSettings: goToSettings$8,
  forward: forward$8,
  historyBack: historyBack$8,
  more: more$8,
  refresh: refresh$8,
  readOnly: readOnly$8,
  "tray.showWindow": "uBidBuddy 표시",
  "tray.newChat": "새 채팅",
  "tray.closeToTray": "트레이에 숨기기",
  "tray.about": "uBidBuddy 소개",
  "tray.restart": "앱 재시작",
  "tray.quit": "종료",
  "tray.runningTasks": "실행 중인 작업",
  "tray.pauseAll": "모든 작업 일시 중지",
  "tray.checkUpdate": "업데이트 확인",
  "tray.recentChats": "최근 채팅",
  "tray.untitled": "제목 없음",
  backendStartup: backendStartup$8,
  "fileAttach.addFiles": "파일 추가",
  "fileAttach.myDevice": "내 기기",
  "fileAttach.failed": "업로드 실패",
  "fileAttach.uploading": "업로드 중...",
  "fileAttach.uploadSuccess": "업로드 성공",
  "fileAttach.cancelUpload": "업로드 취소",
  expand: expand$8,
  name: name$8,
  added: added$8,
  status: status$8,
  agentMode: agentMode$8,
  refreshSuccess: refreshSuccess$8,
  "import": "가져오기",
  processing: processing$8,
  optional: optional$8,
  clear: clear$8,
  unit: unit$8,
  selectedCount: selectedCount$8,
  selectedSkills: selectedSkills$8,
  aiAssistant: aiAssistant$8
};
const desktopPet$8 = "데스크톱 펫";
const enable$8 = "데스크톱 펫 활성화";
const size$8 = "펫 크기";
const sizeSmall$8 = "소 ({{px}}px)";
const sizeMedium$8 = "중 ({{px}}px)";
const sizeLarge$8 = "대 ({{px}}px)";
const dnd$8 = "방해 금지";
const dndDescription$8 = "펫이 유휴 상태를 유지하고 AI 이벤트를 무시합니다";
const confirmBubble$8 = "펫 창에 권한 요청 표시";
const confirmBubbleDescription$8 = "끄면 AI 도구 권한 요청이 메인 채팅 창에만 표시됩니다";
const pat$8 = "쓰다듬기";
const resetPosition$8 = "위치 초기화";
const hide$g = "숨기기";
const showHide$8 = "표시/숨기기";
const desktopOnly$8 = "데스크톱 펫은 데스크톱 애플리케이션에서만 사용할 수 있습니다. WebUI 브라우저 모드에서는 사용할 수 없습니다.";
const petKoKR = {
  desktopPet: desktopPet$8,
  enable: enable$8,
  size: size$8,
  sizeSmall: sizeSmall$8,
  sizeMedium: sizeMedium$8,
  sizeLarge: sizeLarge$8,
  dnd: dnd$8,
  dndDescription: dndDescription$8,
  confirmBubble: confirmBubble$8,
  confirmBubbleDescription: confirmBubbleDescription$8,
  pat: pat$8,
  resetPosition: resetPosition$8,
  hide: hide$g,
  showHide: showHide$8,
  desktopOnly: desktopOnly$8
};
const send$7 = "Gönder";
const cancel$7 = "İptal";
const save$7 = "Kaydet";
const confirm$7 = "Onayla";
const file$7 = "Dosya";
const folder$7 = "Klasör";
const upload$7 = "Yükle";
const model$7 = "Model";
const skills$7 = "Beceriler";
const workspace$7 = "Proje";
const settings$7 = "Ayarlar";
const system$7 = "Sistem";
const about$7 = "Hakkımızda";
const back$7 = "Sohbete Dön";
const goBack$7 = "Geri";
const add$7 = "Ekle";
const edit$7 = "Düzenle";
const website$7 = "Web Sitesi";
const version$7 = "Sürüm";
const contact$7 = "İletişim";
const github$7 = "Github";
const loading$7 = "Lütfen bekleyin...";
const copy$7 = "Kopyala";
const reply$7 = "Alıntı";
const openInBuiltinBrowser$7 = "Yerleşik tarayıcıda aç";
const openInSystemBrowser$7 = "Sistem tarayıcısında aç";
const copySuccess$7 = "Kopyalandı";
const copyFailed$7 = "Kopyalama başarısız";
const download$7 = "İndir";
const close$7 = "Kapat";
const retry$7 = "Tekrar Dene";
const reload$7 = "Yenile";
const technical_details$7 = "Teknik Detaylar";
const error_details$7 = "Hata Detayları";
const troubleshooting$7 = "Sorun Giderme";
const select$7 = "Seç";
const expandMore$7 = "Daha Fazla";
const collapse$7 = "Daralt";
const viewMoreLines$7 = "Daha Fazla Göster ({{count}} satır)";
const viewMoreLines_one$7 = "Daha Fazla Göster ({{count}} satır)";
const viewMoreLines_other$7 = "Daha Fazla Göster ({{count}} satır)";
const success$7 = "Başarılı";
const error$7 = "Hata";
const saveSuccess$7 = "Başarıyla kaydedildi";
const saveFailed$7 = "Kaydetme başarısız";
const unknownError$7 = "Bilinmeyen hata";
const confirmDelete$7 = "Silmeyi Onayla";
const deleteSuccess$7 = "Başarıyla silindi";
const deleteFailed$7 = "Silme başarısız";
const defaultModel$7 = "Varsayılan Model";
const escToCancel$7 = "iptal için esc";
const create$7 = "Oluştur";
const createSuccess$7 = "Başarıyla oluşturuldu";
const failed$7 = "Başarısız";
const browse$7 = "Gözat";
const remove$7 = "Kaldır";
const show$7 = "Göster";
const hide$f = "Gizle";
const goToSettings$7 = "Ayarlara Git";
const forward$7 = "İleri";
const historyBack$7 = "Geri";
const more$7 = "Daha Fazla";
const refresh$7 = "Yenile";
const readOnly$7 = "Salt okunur";
const backendStartup$7 = { "incompatibleRuntime": { "title": "Bu sistem paketlenmiş backend tarafından desteklenmiyor", "description": "uBidBuddy açıldı, ancak yerel AionCore backend bu Linux sürümünde çalışamaz. Desteklenen bir Linux dağıtımına yükseltip uBidBuddy'yi yeniden başlatın.", "requiredVersions": "Gerekli çalışma zamanı sembolleri: {{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy kurulumu eksik", "description": "Bu kurulumda gerekli yerel kaynaklar eksik, bu yüzden AionCore başlatılamıyor. Lütfen en son uBidBuddy sürümünü indirip yeniden kurun. Yeniden kurulumdan sonra sorun tekrarlarsa güvenlik veya antivirüs yazılımının AionCore'u karantinaya alıp almadığını kontrol edin.", "downloadLatest": "Son sürümü indir", "sendDiagnostics": "Tanı raporu gönder", "diagnosticsSent": "Tanı raporu gönderildi", "diagnosticsReportSuccess": "Tanı raporu gönderildi", "diagnosticsReportFailed": "Tanı raporu gönderilemedi", "runtimeComponentDescription": "Bu kurulumda gerekli yerleşik çalışma zamanı bileşenleri eksik olduğu için {{resource}} başlatılamıyor. En son uBidBuddy paketini yeniden yükleyin. Yeniden yükledikten sonra da devam ederse güvenlik veya antivirüs yazılımının uBidBuddy bileşenlerini karantinaya alıp almadığını kontrol edin." }, "packageArchitectureMismatch": { "title": "uBidBuddy package architecture mismatch", "description": "This uBidBuddy package is for {{packageArch}}, but this Mac is {{deviceArch}}. You may have downloaded the wrong package. Please download and install the {{expectedArch}} package." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "Daha yeni bir uBidBuddy sürümü gerekli", "description": "Yerel verileriniz uBidBuddy'nin daha yeni bir sürümü tarafından oluşturuldu ve bu sürüm bunları açamıyor. Devam etmek için uBidBuddy'yi en son sürüme güncelleyin; verileriniz sağlam, yeniden yükleme veya sıfırlama gerekmez.", "descriptionWithVersion": "Yerel verileriniz şu an yüklü olandan (v{{currentVersion}}) daha yeni bir uBidBuddy sürümü tarafından oluşturuldu; bu sürüm bunları açamıyor. Devam etmek için uBidBuddy'yi en son sürüme güncelleyin; verileriniz sağlam, yeniden yükleme veya sıfırlama gerekmez." }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy açıldı, ancak AionCore assistant veya agent kayıtları gibi yerel başlangıç verilerini hazırlarken durdu. uBidBuddy'yi yeniden yüklemek bu sorunu çözmeyebilir. Yerel veritabanının incelenebilmesi için tanılama raporu gönderin veya destek ekibiyle iletişime geçin.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "Yerel veriler bozulmuş", "description": "uBidBuddy yerel veritabanının bozulduğunu algıladı ve başlatmaya devam edemiyor. Onaydan sonra eski veritabanı yedeklenecek ve başlatmaya devam etmek için yeni bir yerel veritabanı oluşturulacak. Geçmiş sohbetler artık gösterilmeyecek ve eski veritabanı yedek dosyası olarak saklanacak.", "confirmRebuild": "Eski DB'yi yedekle ve yeni DB oluştur", "sendDiagnostics": "Tanılama gönder", "diagnosticsHint": "Tanılama göndermek yerel veritabanını değiştirmez.", "diagnosticsSent": "Tanılama gönderildi", "diagnosticsReportSuccess": "Tanılama raporu gönderildi", "diagnosticsReportFailed": "Tanılama raporu gönderilemedi", "rebuildFailed": "Eski DB yedeklenip yeni DB oluşturulamadı", "confirmDialog": { "title": "Veritabanı yeniden oluşturulsun mu?", "content": "Bu işlem, mevcut bozuk veritabanını yedekler ve tamamen yeni, boş bir veritabanı oluşturur. Geçmiş sohbetler artık gösterilmeyecek (eski veritabanı yedek dosyası olarak saklanır). Devam edilsin mi?", "okText": "Yeniden oluşturmayı onayla", "cancelText": "İptal" } }, "transientConcurrentStartup": { "title": "uBidBuddy başlatılıyor", "description": "Bu pencere açıldığında başka bir uBidBuddy başlatma işlemi yerel verileri hâlâ kullanıyordu. Bu geçicidir ve verileriniz güvende — yeniden yükleme gerekmez. Lütfen biraz bekleyip tekrar deneyin veya uBidBuddy'yi yeniden başlatın.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "Bu durum tekrar ederse bir tanılama raporu gönderebilirsiniz." }, "pendingSlow": { "title": "Başlatılıyor", "description": "AionCore başlatılıyor, lütfen bekleyin. Bir süre yanıt vermezse uygulamadan çıkıp yeniden açabilirsiniz." }, "exited": { "title": "Başlatma tamamlanmadı", "description": "AionCore başlatmayı tamamlayamadı ve kapandı. Lütfen uygulamayı yeniden başlatın; sorun devam ederse tanılama gönderin.", "sendDiagnostics": "Tanılama gönder", "diagnosticsSent": "Tanılama gönderildi", "diagnosticsReportSuccess": "Tanılama bildirildi", "diagnosticsReportFailed": "Tanılama gönderilemedi, lütfen tekrar deneyin" }, "portReportTimeout": { "title": "Başlatma zaman aşımına uğradı", "description": "AionCore beklenen süre içinde başlatmayı tamamlayamadı. Lütfen uygulamayı yeniden başlatın; sorun devam ederse tanılama gönderin.", "sendDiagnostics": "Tanılama gönder", "diagnosticsSent": "Tanılama gönderildi", "diagnosticsReportSuccess": "Tanılama bildirildi", "diagnosticsReportFailed": "Tanılama gönderilemedi, lütfen tekrar deneyin" }, "startupFailed": { "title": "Başlatma başarısız oldu", "description": "AionCore başlatılamadı. Lütfen uygulamayı yeniden başlatın; sorun devam ederse tanılama gönderin.", "sendDiagnostics": "Tanılama gönder", "diagnosticsSent": "Tanılama gönderildi", "diagnosticsReportSuccess": "Tanılama bildirildi", "diagnosticsReportFailed": "Tanılama gönderilemedi, lütfen tekrar deneyin" } };
const expand$7 = "Genişlet";
const name$7 = "Ad";
const added$7 = "Eklendi";
const status$7 = "Durum";
const agentMode$7 = "Agent Modu";
const refreshSuccess$7 = "Yenilendi";
const processing$7 = "İşleniyor...";
const optional$7 = "(isteğe bağlı)";
const clear$7 = "Temizle";
const unit$7 = { "minute_short": "dk", "second_short": "sn" };
const selectedCount$7 = "{{count}} seçili";
const selectedSkills$7 = "Seçili beceriler";
const aiAssistant$7 = "Yapay Zekâ Asistanı";
const commonTrTR = {
  send: send$7,
  cancel: cancel$7,
  save: save$7,
  "delete": "Sil",
  confirm: confirm$7,
  file: file$7,
  folder: folder$7,
  upload: upload$7,
  model: model$7,
  skills: skills$7,
  workspace: workspace$7,
  settings: settings$7,
  system: system$7,
  about: about$7,
  back: back$7,
  goBack: goBack$7,
  add: add$7,
  edit: edit$7,
  website: website$7,
  version: version$7,
  contact: contact$7,
  github: github$7,
  loading: loading$7,
  copy: copy$7,
  reply: reply$7,
  openInBuiltinBrowser: openInBuiltinBrowser$7,
  openInSystemBrowser: openInSystemBrowser$7,
  copySuccess: copySuccess$7,
  copyFailed: copyFailed$7,
  download: download$7,
  close: close$7,
  retry: retry$7,
  reload: reload$7,
  technical_details: technical_details$7,
  error_details: error_details$7,
  troubleshooting: troubleshooting$7,
  select: select$7,
  expandMore: expandMore$7,
  collapse: collapse$7,
  viewMoreLines: viewMoreLines$7,
  viewMoreLines_one: viewMoreLines_one$7,
  viewMoreLines_other: viewMoreLines_other$7,
  success: success$7,
  error: error$7,
  saveSuccess: saveSuccess$7,
  saveFailed: saveFailed$7,
  unknownError: unknownError$7,
  confirmDelete: confirmDelete$7,
  deleteSuccess: deleteSuccess$7,
  deleteFailed: deleteFailed$7,
  "default": "Varsayılan",
  defaultModel: defaultModel$7,
  escToCancel: escToCancel$7,
  create: create$7,
  createSuccess: createSuccess$7,
  failed: failed$7,
  browse: browse$7,
  remove: remove$7,
  show: show$7,
  hide: hide$f,
  goToSettings: goToSettings$7,
  forward: forward$7,
  historyBack: historyBack$7,
  more: more$7,
  refresh: refresh$7,
  readOnly: readOnly$7,
  "tray.showWindow": "uBidBuddy'yi Göster",
  "tray.newChat": "Yeni Sohbet",
  "tray.closeToTray": "Tepsiye Gizle",
  "tray.about": "uBidBuddy Hakkında",
  "tray.restart": "Uygulamayı Yeniden Başlat",
  "tray.quit": "Çıkış",
  "tray.runningTasks": "Çalışan Görevler",
  "tray.pauseAll": "Tüm Görevleri Duraklat",
  "tray.checkUpdate": "Güncelleştirme Kontrolü",
  "tray.recentChats": "Son Sohbetler",
  "tray.untitled": "Adsız",
  backendStartup: backendStartup$7,
  "fileAttach.addFiles": "Dosya ekle",
  "fileAttach.myDevice": "Cihazım",
  "fileAttach.failed": "Yükleme başarısız",
  "fileAttach.uploading": "Yükleniyor...",
  "fileAttach.uploadSuccess": "Yükleme başarılı",
  "fileAttach.cancelUpload": "Yüklemeyi iptal et",
  expand: expand$7,
  name: name$7,
  added: added$7,
  status: status$7,
  agentMode: agentMode$7,
  refreshSuccess: refreshSuccess$7,
  "import": "İçe Aktar",
  processing: processing$7,
  optional: optional$7,
  clear: clear$7,
  unit: unit$7,
  selectedCount: selectedCount$7,
  selectedSkills: selectedSkills$7,
  aiAssistant: aiAssistant$7
};
const desktopPet$7 = "Masaüstü Pet";
const enable$7 = "Masaüstü Pet'i Etkinleştir";
const size$7 = "Pet Boyutu";
const sizeSmall$7 = "Küçük ({{px}}px)";
const sizeMedium$7 = "Orta ({{px}}px)";
const sizeLarge$7 = "Büyük ({{px}}px)";
const dnd$7 = "Rahatsız Etmeyin";
const dndDescription$7 = "Pet boşta kalır, AI olaylarını yok sayar";
const confirmBubble$7 = "Yetkilendirmeleri pet penceresinde göster";
const confirmBubbleDescription$7 = "Kapalıyken, AI araç yetkilendirmeleri ana sohbet penceresinde kalır";
const pat$7 = "Okşa";
const resetPosition$7 = "Konumu Sıfırla";
const hide$e = "Gizle";
const showHide$7 = "Göster/Gizle";
const desktopOnly$7 = "Masaüstü evcil hayvanı yalnızca masaüstü uygulamasında kullanılabilir. WebUI tarayıcı modunda kullanılamaz.";
const petTrTR = {
  desktopPet: desktopPet$7,
  enable: enable$7,
  size: size$7,
  sizeSmall: sizeSmall$7,
  sizeMedium: sizeMedium$7,
  sizeLarge: sizeLarge$7,
  dnd: dnd$7,
  dndDescription: dndDescription$7,
  confirmBubble: confirmBubble$7,
  confirmBubbleDescription: confirmBubbleDescription$7,
  pat: pat$7,
  resetPosition: resetPosition$7,
  hide: hide$e,
  showHide: showHide$7,
  desktopOnly: desktopOnly$7
};
const send$6 = "Отправить";
const cancel$6 = "Отмена";
const save$6 = "Сохранить";
const confirm$6 = "Подтвердить";
const file$6 = "Файл";
const folder$6 = "Папка";
const upload$6 = "Загрузить";
const model$6 = "Модель";
const skills$6 = "Навыки";
const workspace$6 = "Проект";
const settings$6 = "Настройки";
const system$6 = "Система";
const about$6 = "О программе";
const back$6 = "Назад к чату";
const goBack$6 = "Назад";
const add$6 = "Добавить";
const edit$6 = "Редактировать";
const website$6 = "Сайт";
const version$6 = "Версия";
const contact$6 = "Контакты";
const github$6 = "GitHub";
const loading$6 = "Пожалуйста, подождите...";
const copy$6 = "Копировать";
const reply$6 = "Ответить";
const openInBuiltinBrowser$6 = "Открыть во встроенном браузере";
const openInSystemBrowser$6 = "Открыть в системном браузере";
const copySuccess$6 = "Скопировано";
const copyFailed$6 = "Не удалось скопировать";
const download$6 = "Скачать";
const close$6 = "Закрыть";
const retry$6 = "Повторить";
const reload$6 = "Обновить";
const technical_details$6 = "Технические детали";
const error_details$6 = "Детали ошибки";
const troubleshooting$6 = "Устранение неполадок";
const select$6 = "Выбрать";
const expandMore$6 = "Показать больше";
const collapse$6 = "Свернуть";
const viewMoreLines$6 = "Показать ещё ({{count}} строк)";
const viewMoreLines_one$6 = "Показать ещё ({{count}} строка)";
const viewMoreLines_other$6 = "Показать ещё ({{count}} строк)";
const viewMoreLines_few$1 = "Показать ещё ({{count}} строки)";
const viewMoreLines_many$1 = "Показать ещё ({{count}} строк)";
const success$6 = "Успешно";
const error$6 = "Ошибка";
const saveSuccess$6 = "Сохранено успешно";
const saveFailed$6 = "Не удалось сохранить";
const unknownError$6 = "Неизвестная ошибка";
const confirmDelete$6 = "Подтвердить удаление";
const deleteSuccess$6 = "Удалено успешно";
const deleteFailed$6 = "Не удалось удалить";
const defaultModel$6 = "Модель по умолчанию";
const escToCancel$6 = "ESC для отмены";
const create$6 = "Создать";
const createSuccess$6 = "Создано успешно";
const failed$6 = "Ошибка";
const browse$6 = "Обзор";
const remove$6 = "Удалить";
const show$6 = "Показать";
const hide$d = "Скрыть";
const goToSettings$6 = "Перейти к настройкам";
const forward$6 = "Вперёд";
const more$6 = "Ещё";
const refresh$6 = "Обновить";
const readOnly$6 = "Только чтение";
const backendStartup$6 = { "incompatibleRuntime": { "title": "Эта система не поддерживается встроенным backend", "description": "uBidBuddy открылся, но локальный backend AionCore не может работать в этой версии Linux. Обновитесь до поддерживаемого дистрибутива Linux и перезапустите uBidBuddy.", "requiredVersions": "Требуемые символы среды выполнения: {{versions}}" }, "incompleteInstallation": { "title": "Установка uBidBuddy неполная", "description": "В этой установке отсутствуют обязательные локальные ресурсы, поэтому AionCore не может запуститься. Загрузите и переустановите последнюю версию uBidBuddy. Если проблема повторится после переустановки, проверьте, не поместило ли защитное или антивирусное ПО AionCore в карантин.", "downloadLatest": "Скачать последнюю версию", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностический отчет отправлен", "diagnosticsReportFailed": "Не удалось отправить диагностический отчет", "runtimeComponentDescription": "В этой установке отсутствуют необходимые встроенные компоненты среды выполнения, поэтому {{resource}} не может запуститься. Переустановите последнюю версию uBidBuddy. Если проблема повторится после переустановки, проверьте, не поместило ли защитное или антивирусное ПО компоненты uBidBuddy в карантин." }, "packageArchitectureMismatch": { "title": "Архитектура пакета uBidBuddy не совпадает", "description": "Этот пакет uBidBuddy предназначен для {{packageArch}}, а этот Mac использует {{deviceArch}}. Возможно, скачан неверный пакет. Скачайте и установите пакет для {{expectedArch}}." }, "dataMigration": { "title": "Не удалось перенести локальные данные", "description": "uBidBuddy открылся, но AionCore остановился при инициализации локальных данных. Переустановка uBidBuddy может не помочь. Отправьте диагностический отчёт или обратитесь в поддержку, чтобы проверить миграцию локальной базы данных.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностический отчёт отправлен", "diagnosticsReportFailed": "Не удалось отправить диагностический отчёт" }, "databaseNewerThanApp": { "title": "Требуется более новая версия uBidBuddy", "description": "Ваши локальные данные созданы более новой версией uBidBuddy, и эта версия не может их открыть. Обновите uBidBuddy до последней версии, чтобы продолжить — данные не повреждены, переустановка или сброс не требуются.", "descriptionWithVersion": "Ваши локальные данные созданы версией uBidBuddy новее установленной сейчас (v{{currentVersion}}), поэтому эта версия не может их открыть. Обновите uBidBuddy до последней версии, чтобы продолжить — данные не повреждены, переустановка или сброс не требуются." }, "localDataRepair": { "title": "Не удалось восстановить локальные данные", "description": "uBidBuddy открылся, но AionCore остановился при подготовке локальных данных запуска, таких как записи assistants или агентов. Переустановка uBidBuddy может не помочь. Отправьте диагностический отчёт или обратитесь в поддержку, чтобы проверить локальную базу данных.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностический отчёт отправлен", "diagnosticsReportFailed": "Не удалось отправить диагностический отчёт" }, "startupDirectory": { "title": "Папка запуска недоступна", "description": "uBidBuddy открылся, но AionCore не смог запуститься: настроенная рабочая папка или папка логов отсутствует, недоступна либо заблокирована правами. Убедитесь, что эти папки существуют и доступны для записи, затем перезапустите uBidBuddy.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностический отчёт отправлен", "diagnosticsReportFailed": "Не удалось отправить диагностический отчёт" }, "recoverableDatabaseCorruption": { "title": "Локальные данные повреждены", "description": "uBidBuddy обнаружил повреждение локальной базы данных и не может продолжить запуск. После подтверждения старая база данных будет сохранена как резервная копия, а для продолжения запуска будет создана новая локальная база данных. Прежние беседы больше не будут отображаться, старая база данных будет сохранена как файл резервной копии.", "confirmRebuild": "Сохранить старую БД и создать новую", "sendDiagnostics": "Отправить диагностику", "diagnosticsHint": "Отправка диагностики не изменит локальную базу данных.", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностический отчет отправлен", "diagnosticsReportFailed": "Не удалось отправить диагностический отчет", "rebuildFailed": "Не удалось сохранить старую БД и создать новую", "confirmDialog": { "title": "Пересоздать базу данных?", "content": "Это действие создаст резервную копию текущей повреждённой базы данных и создаст совершенно новую пустую базу. Прежние беседы больше не будут отображаться (старая база данных сохраняется как файл резервной копии). Продолжить?", "okText": "Подтвердить пересоздание", "cancelText": "Отмена" } }, "transientConcurrentStartup": { "title": "uBidBuddy запускается", "description": "При открытии этого окна другой процесс запуска uBidBuddy всё ещё использовал локальные данные. Это временно, и ваши данные в безопасности — переустановка не требуется. Подождите немного и повторите попытку или перезапустите uBidBuddy.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностический отчёт отправлен", "diagnosticsReportFailed": "Не удалось отправить диагностический отчёт", "diagnosticsHint": "Если это повторяется, вы можете отправить отчёт диагностики." }, "pendingSlow": { "title": "Запуск", "description": "AionCore запускается, подождите. Если он долго не отвечает, закройте приложение и откройте его снова." }, "exited": { "title": "Запуск не завершён", "description": "AionCore не смог завершить запуск и был закрыт. Перезапустите приложение; если это повторяется, отправьте диагностику.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностика отправлена", "diagnosticsReportFailed": "Не удалось отправить диагностику, повторите попытку позже" }, "portReportTimeout": { "title": "Время запуска истекло", "description": "AionCore не завершил запуск за ожидаемое время. Перезапустите приложение; если это повторяется, отправьте диагностику.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностика отправлена", "diagnosticsReportFailed": "Не удалось отправить диагностику, повторите попытку позже" }, "startupFailed": { "title": "Сбой запуска", "description": "AionCore не удалось запустить. Перезапустите приложение; если это повторяется, отправьте диагностику.", "sendDiagnostics": "Отправить диагностику", "diagnosticsSent": "Диагностика отправлена", "diagnosticsReportSuccess": "Диагностика отправлена", "diagnosticsReportFailed": "Не удалось отправить диагностику, повторите попытку позже" } };
const expand$6 = "Развернуть";
const name$6 = "Имя";
const added$6 = "Добавлено";
const status$6 = "Статус";
const refreshSuccess$6 = "Обновлено";
const processing$6 = "Обработка...";
const optional$6 = "(необязательно)";
const clear$6 = "Очистить";
const historyBack$6 = "Назад";
const agentMode$6 = "Режим агента";
const unit$6 = { "minute_short": "мин", "second_short": "с" };
const selectedCount$6 = "Выбрано {{count}}";
const selectedSkills$6 = "Выбранные навыки";
const aiAssistant$6 = "ИИ-ассистент";
const commonRuRU = {
  send: send$6,
  cancel: cancel$6,
  save: save$6,
  "delete": "Удалить",
  confirm: confirm$6,
  file: file$6,
  folder: folder$6,
  upload: upload$6,
  model: model$6,
  skills: skills$6,
  workspace: workspace$6,
  settings: settings$6,
  system: system$6,
  about: about$6,
  back: back$6,
  goBack: goBack$6,
  add: add$6,
  edit: edit$6,
  website: website$6,
  version: version$6,
  contact: contact$6,
  github: github$6,
  loading: loading$6,
  copy: copy$6,
  reply: reply$6,
  openInBuiltinBrowser: openInBuiltinBrowser$6,
  openInSystemBrowser: openInSystemBrowser$6,
  copySuccess: copySuccess$6,
  copyFailed: copyFailed$6,
  download: download$6,
  close: close$6,
  retry: retry$6,
  reload: reload$6,
  technical_details: technical_details$6,
  error_details: error_details$6,
  troubleshooting: troubleshooting$6,
  select: select$6,
  expandMore: expandMore$6,
  collapse: collapse$6,
  viewMoreLines: viewMoreLines$6,
  viewMoreLines_one: viewMoreLines_one$6,
  viewMoreLines_other: viewMoreLines_other$6,
  viewMoreLines_few: viewMoreLines_few$1,
  viewMoreLines_many: viewMoreLines_many$1,
  success: success$6,
  error: error$6,
  saveSuccess: saveSuccess$6,
  saveFailed: saveFailed$6,
  unknownError: unknownError$6,
  confirmDelete: confirmDelete$6,
  deleteSuccess: deleteSuccess$6,
  deleteFailed: deleteFailed$6,
  "default": "По умолчанию",
  defaultModel: defaultModel$6,
  escToCancel: escToCancel$6,
  create: create$6,
  createSuccess: createSuccess$6,
  failed: failed$6,
  browse: browse$6,
  remove: remove$6,
  show: show$6,
  hide: hide$d,
  goToSettings: goToSettings$6,
  forward: forward$6,
  more: more$6,
  refresh: refresh$6,
  readOnly: readOnly$6,
  "tray.showWindow": "Показать uBidBuddy",
  "tray.newChat": "Новый чат",
  "tray.closeToTray": "Свернуть в трей",
  "tray.about": "О программе uBidBuddy",
  "tray.restart": "Перезапустить",
  "tray.quit": "Выход",
  "tray.runningTasks": "Запущенные задачи",
  "tray.pauseAll": "Приостановить все задачи",
  "tray.checkUpdate": "Проверить обновления",
  "tray.recentChats": "Недавние чаты",
  "tray.untitled": "Без названия",
  backendStartup: backendStartup$6,
  "fileAttach.addFiles": "Добавить файлы",
  "fileAttach.myDevice": "Моё устройство",
  "fileAttach.failed": "Ошибка загрузки",
  "fileAttach.uploading": "Загрузка...",
  "fileAttach.uploadSuccess": "Загружено успешно",
  "fileAttach.cancelUpload": "Отменить загрузку",
  expand: expand$6,
  name: name$6,
  added: added$6,
  status: status$6,
  refreshSuccess: refreshSuccess$6,
  "import": "Импорт",
  processing: processing$6,
  optional: optional$6,
  clear: clear$6,
  historyBack: historyBack$6,
  agentMode: agentMode$6,
  unit: unit$6,
  selectedCount: selectedCount$6,
  selectedSkills: selectedSkills$6,
  aiAssistant: aiAssistant$6
};
const desktopPet$6 = "Питомец на рабочем столе";
const enable$6 = "Включить питомца на рабочем столе";
const size$6 = "Размер питомца";
const sizeSmall$6 = "Маленький ({{px}}px)";
const sizeMedium$6 = "Средний ({{px}}px)";
const sizeLarge$6 = "Большой ({{px}}px)";
const dnd$6 = "Не беспокоить";
const dndDescription$6 = "Питомец остаётся в покое и игнорирует события ИИ";
const confirmBubble$6 = "Показывать подтверждения на питомце";
const confirmBubbleDescription$6 = "Если отключить, подтверждения инструментов ИИ будут отображаться только в основном окне чата";
const pat$6 = "Погладить";
const resetPosition$6 = "Сбросить положение";
const hide$c = "Скрыть";
const showHide$6 = "Показать/скрыть";
const desktopOnly$6 = "Настольный питомец доступен только в настольном приложении. Он не может использоваться в режиме браузера WebUI.";
const petRuRU = {
  desktopPet: desktopPet$6,
  enable: enable$6,
  size: size$6,
  sizeSmall: sizeSmall$6,
  sizeMedium: sizeMedium$6,
  sizeLarge: sizeLarge$6,
  dnd: dnd$6,
  dndDescription: dndDescription$6,
  confirmBubble: confirmBubble$6,
  confirmBubbleDescription: confirmBubbleDescription$6,
  pat: pat$6,
  resetPosition: resetPosition$6,
  hide: hide$c,
  showHide: showHide$6,
  desktopOnly: desktopOnly$6
};
const send$5 = "Надіслати";
const cancel$5 = "Скасувати";
const save$5 = "Зберегти";
const confirm$5 = "Підтвердити";
const file$5 = "Файл";
const folder$5 = "Папка";
const upload$5 = "Завантажити";
const model$5 = "Модель";
const skills$5 = "Навички";
const workspace$5 = "Проєкт";
const settings$5 = "Налаштування";
const system$5 = "Система";
const about$5 = "Про нас";
const back$5 = "Назад до чату";
const goBack$5 = "Назад";
const add$5 = "Додати";
const edit$5 = "Редагувати";
const website$5 = "Вебсайт";
const version$5 = "Версія";
const contact$5 = "Контакти";
const github$5 = "Github";
const loading$5 = "Будь ласка, зачекайте...";
const copy$5 = "Копіювати";
const reply$5 = "Відповісти";
const openInBuiltinBrowser$5 = "Відкрити у вбудованому браузері";
const openInSystemBrowser$5 = "Відкрити в системному браузері";
const copySuccess$5 = "Скопійовано";
const copyFailed$5 = "Не вдалося скопіювати";
const download$5 = "Завантажити";
const close$5 = "Закрити";
const retry$5 = "Повторити";
const reload$5 = "Оновити";
const technical_details$5 = "Технічні деталі";
const error_details$5 = "Деталі помилки";
const troubleshooting$5 = "Усунення несправностей";
const select$5 = "Вибрати";
const expandMore$5 = "Розгорнути більше";
const collapse$5 = "Згорнути";
const viewMoreLines$5 = "Показати ще ({{count}} рядків)";
const viewMoreLines_one$5 = "Показати ще ({{count}} рядок)";
const viewMoreLines_other$5 = "Показати ще ({{count}} рядків)";
const viewMoreLines_few = "Показати ще ({{count}} рядки)";
const viewMoreLines_many = "Показати ще ({{count}} рядків)";
const success$5 = "Успішно";
const error$5 = "Помилка";
const saveSuccess$5 = "Збережено успішно";
const saveFailed$5 = "Не вдалося зберегти";
const unknownError$5 = "Невідома помилка";
const confirmDelete$5 = "Підтвердити видалення";
const deleteSuccess$5 = "Видалено успішно";
const deleteFailed$5 = "Не вдалося видалити";
const defaultModel$5 = "Модель за замовчуванням";
const escToCancel$5 = "ESC для скасування";
const create$5 = "Створити";
const createSuccess$5 = "Створено успішно";
const failed$5 = "Помилка";
const browse$5 = "Огляд";
const remove$5 = "Видалити";
const show$5 = "Показати";
const hide$b = "Приховати";
const goToSettings$5 = "Перейти до налаштувань";
const forward$5 = "Вперед";
const historyBack$5 = "Назад";
const more$5 = "Більше";
const refresh$5 = "Оновити";
const readOnly$5 = "Лише читання";
const backendStartup$5 = { "incompatibleRuntime": { "title": "Ця система не підтримується вбудованим backend", "description": "uBidBuddy відкрився, але локальний backend AionCore не може працювати в цій версії Linux. Оновіться до підтримуваного дистрибутива Linux і перезапустіть uBidBuddy.", "requiredVersions": "Потрібні символи середовища виконання: {{versions}}" }, "incompleteInstallation": { "title": "Встановлення uBidBuddy неповне", "description": "У цьому встановленні бракує потрібних локальних ресурсів, тому AionCore не може запуститися. Завантажте та перевстановіть останню версію uBidBuddy. Якщо проблема повториться після перевстановлення, перевірте, чи захисне або антивірусне ПЗ не помістило AionCore у карантин.", "downloadLatest": "Завантажити останню версію", "sendDiagnostics": "Надіслати діагностику", "diagnosticsSent": "Діагностику надіслано", "diagnosticsReportSuccess": "Діагностичний звіт надіслано", "diagnosticsReportFailed": "Не вдалося надіслати діагностичний звіт", "runtimeComponentDescription": "У цій інсталяції бракує потрібних вбудованих компонентів середовища виконання, тому {{resource}} не може запуститися. Перевстановіть найновіший пакет uBidBuddy. Якщо проблема повториться після перевстановлення, перевірте, чи не помістило програмне забезпечення безпеки або антивірус компоненти uBidBuddy у карантин." }, "packageArchitectureMismatch": { "title": "uBidBuddy package architecture mismatch", "description": "This uBidBuddy package is for {{packageArch}}, but this Mac is {{deviceArch}}. You may have downloaded the wrong package. Please download and install the {{expectedArch}} package." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "Потрібна новіша версія uBidBuddy", "description": "Ваші локальні дані створено новішою версією uBidBuddy, і ця версія не може їх відкрити. Оновіть uBidBuddy до останньої версії, щоб продовжити — дані цілі, перевстановлення чи скидання не потрібні.", "descriptionWithVersion": "Ваші локальні дані створено версією uBidBuddy, новішою за встановлену зараз (v{{currentVersion}}), тому ця версія не може їх відкрити. Оновіть uBidBuddy до останньої версії, щоб продовжити — дані цілі, перевстановлення чи скидання не потрібні." }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy відкрився, але AionCore зупинився під час підготовки локальних даних запуску, як-от записи assistants або агентів. Повторне встановлення uBidBuddy може не вирішити проблему. Надішліть діагностичний звіт або зверніться до підтримки, щоб можна було перевірити локальну базу даних.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "Локальні дані пошкоджено", "description": "uBidBuddy виявив пошкодження локальної бази даних і не може продовжити запуск. Після підтвердження стару базу даних буде збережено як резервну копію, а для продовження запуску буде створено нову локальну базу даних. Попередні розмови більше не відображатимуться, стара база даних збережеться як файл резервної копії.", "confirmRebuild": "Зберегти стару БД і створити нову", "sendDiagnostics": "Надіслати діагностику", "diagnosticsHint": "Надсилання діагностики не змінить локальну базу даних.", "diagnosticsSent": "Діагностику надіслано", "diagnosticsReportSuccess": "Діагностичний звіт надіслано", "diagnosticsReportFailed": "Не вдалося надіслати діагностичний звіт", "rebuildFailed": "Не вдалося зберегти стару БД і створити нову", "confirmDialog": { "title": "Відтворити базу даних?", "content": "Ця дія створить резервну копію поточної пошкодженої бази даних і створить абсолютно нову порожню базу. Попередні розмови більше не відображатимуться (стара база даних зберігається як файл резервної копії). Продовжити?", "okText": "Підтвердити відтворення", "cancelText": "Скасувати" } }, "transientConcurrentStartup": { "title": "uBidBuddy запускається", "description": "Коли це вікно відкрилося, інший процес запуску uBidBuddy усе ще використовував локальні дані. Це тимчасово, і ваші дані в безпеці — перевстановлення не потрібне. Зачекайте трохи та повторіть спробу або перезапустіть uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "Якщо це повторюється, ви можете надіслати звіт діагностики." }, "pendingSlow": { "title": "Запуск", "description": "AionCore запускається, зачекайте. Якщо він довго не відповідає, закрийте застосунок і відкрийте його знову." }, "exited": { "title": "Запуск не завершено", "description": "AionCore не зміг завершити запуск і закрився. Перезапустіть застосунок; якщо це повторюється, надішліть діагностику.", "sendDiagnostics": "Надіслати діагностику", "diagnosticsSent": "Діагностику надіслано", "diagnosticsReportSuccess": "Діагностику надіслано", "diagnosticsReportFailed": "Не вдалося надіслати діагностику, повторіть спробу пізніше" }, "portReportTimeout": { "title": "Час запуску вичерпано", "description": "AionCore не завершив запуск за очікуваний час. Перезапустіть застосунок; якщо це повторюється, надішліть діагностику.", "sendDiagnostics": "Надіслати діагностику", "diagnosticsSent": "Діагностику надіслано", "diagnosticsReportSuccess": "Діагностику надіслано", "diagnosticsReportFailed": "Не вдалося надіслати діагностику, повторіть спробу пізніше" }, "startupFailed": { "title": "Не вдалося запустити", "description": "AionCore не вдалося запустити. Перезапустіть застосунок; якщо це повторюється, надішліть діагностику.", "sendDiagnostics": "Надіслати діагностику", "diagnosticsSent": "Діагностику надіслано", "diagnosticsReportSuccess": "Діагностику надіслано", "diagnosticsReportFailed": "Не вдалося надіслати діагностику, повторіть спробу пізніше" } };
const expand$5 = "Розгорнути";
const name$5 = "Ім'я";
const added$5 = "Додано";
const status$5 = "Статус";
const agentMode$5 = "Режим Агента";
const refreshSuccess$5 = "Оновлено";
const processing$5 = "Обробка...";
const optional$5 = "(необов'язково)";
const clear$5 = "Очистити";
const unit$5 = { "minute_short": "хв", "second_short": "с" };
const selectedCount$5 = "Вибрано {{count}}";
const selectedSkills$5 = "Вибрані навички";
const aiAssistant$5 = "ШІ-асистент";
const commonUkUA = {
  send: send$5,
  cancel: cancel$5,
  save: save$5,
  "delete": "Видалити",
  confirm: confirm$5,
  file: file$5,
  folder: folder$5,
  upload: upload$5,
  model: model$5,
  skills: skills$5,
  workspace: workspace$5,
  settings: settings$5,
  system: system$5,
  about: about$5,
  back: back$5,
  goBack: goBack$5,
  add: add$5,
  edit: edit$5,
  website: website$5,
  version: version$5,
  contact: contact$5,
  github: github$5,
  loading: loading$5,
  copy: copy$5,
  reply: reply$5,
  openInBuiltinBrowser: openInBuiltinBrowser$5,
  openInSystemBrowser: openInSystemBrowser$5,
  copySuccess: copySuccess$5,
  copyFailed: copyFailed$5,
  download: download$5,
  close: close$5,
  retry: retry$5,
  reload: reload$5,
  technical_details: technical_details$5,
  error_details: error_details$5,
  troubleshooting: troubleshooting$5,
  select: select$5,
  expandMore: expandMore$5,
  collapse: collapse$5,
  viewMoreLines: viewMoreLines$5,
  viewMoreLines_one: viewMoreLines_one$5,
  viewMoreLines_other: viewMoreLines_other$5,
  viewMoreLines_few,
  viewMoreLines_many,
  success: success$5,
  error: error$5,
  saveSuccess: saveSuccess$5,
  saveFailed: saveFailed$5,
  unknownError: unknownError$5,
  confirmDelete: confirmDelete$5,
  deleteSuccess: deleteSuccess$5,
  deleteFailed: deleteFailed$5,
  "default": "За замовчуванням",
  defaultModel: defaultModel$5,
  escToCancel: escToCancel$5,
  create: create$5,
  createSuccess: createSuccess$5,
  failed: failed$5,
  browse: browse$5,
  remove: remove$5,
  show: show$5,
  hide: hide$b,
  goToSettings: goToSettings$5,
  forward: forward$5,
  historyBack: historyBack$5,
  more: more$5,
  refresh: refresh$5,
  readOnly: readOnly$5,
  "tray.showWindow": "Показати uBidBuddy",
  "tray.newChat": "Новий чат",
  "tray.closeToTray": "Згорнути в трей",
  "tray.about": "Про uBidBuddy",
  "tray.restart": "Перезапустити програму",
  "tray.quit": "Вийти",
  "tray.runningTasks": "Запущені завдання",
  "tray.pauseAll": "Призупинити всі завдання",
  "tray.checkUpdate": "Перевірити оновлення",
  "tray.recentChats": "Недавні чати",
  "tray.untitled": "Без назви",
  backendStartup: backendStartup$5,
  "fileAttach.addFiles": "Додати файли",
  "fileAttach.myDevice": "Мій пристрій",
  "fileAttach.tooLarge": "Файл перевищує ліміт {{max}} МБ",
  "fileAttach.failed": "Помилка завантаження",
  "fileAttach.uploading": "Завантаження...",
  "fileAttach.uploadSuccess": "Завантажено успішно",
  "fileAttach.cancelUpload": "Скасувати завантаження",
  expand: expand$5,
  name: name$5,
  added: added$5,
  status: status$5,
  agentMode: agentMode$5,
  refreshSuccess: refreshSuccess$5,
  "import": "Імпорт",
  processing: processing$5,
  optional: optional$5,
  clear: clear$5,
  unit: unit$5,
  selectedCount: selectedCount$5,
  selectedSkills: selectedSkills$5,
  aiAssistant: aiAssistant$5
};
const desktopPet$5 = "Настільний улюбленець";
const enable$5 = "Увімкнути настільного улюбленця";
const size$5 = "Розмір улюбленця";
const sizeSmall$5 = "Малий ({{px}}px)";
const sizeMedium$5 = "Середній ({{px}}px)";
const sizeLarge$5 = "Великий ({{px}}px)";
const dnd$5 = "Не турбувати";
const dndDescription$5 = "Улюбленець залишається неактивним, ігнорує події ШІ";
const confirmBubble$5 = "Показувати авторизації над улюбленцем";
const confirmBubbleDescription$5 = "Якщо вимкнено, авторизації інструментів ШІ залишаються в основному вікні чату";
const pat$5 = "Погладити";
const resetPosition$5 = "Скинути позицію";
const hide$a = "Приховати";
const showHide$5 = "Показати/Приховати";
const desktopOnly$5 = "Настільний улюбленець доступний лише в десктопній програмі. Його неможливо використовувати в режимі браузера WebUI.";
const petUkUA = {
  desktopPet: desktopPet$5,
  enable: enable$5,
  size: size$5,
  sizeSmall: sizeSmall$5,
  sizeMedium: sizeMedium$5,
  sizeLarge: sizeLarge$5,
  dnd: dnd$5,
  dndDescription: dndDescription$5,
  confirmBubble: confirmBubble$5,
  confirmBubbleDescription: confirmBubbleDescription$5,
  pat: pat$5,
  resetPosition: resetPosition$5,
  hide: hide$a,
  showHide: showHide$5,
  desktopOnly: desktopOnly$5
};
const send$4 = "Enviar";
const cancel$4 = "Cancelar";
const save$4 = "Salvar";
const confirm$4 = "Confirmar";
const file$4 = "Arquivo";
const folder$4 = "Pasta";
const upload$4 = "Upload";
const model$4 = "Modelo";
const skills$4 = "Habilidades";
const workspace$4 = "Projeto";
const settings$4 = "Configurações";
const system$4 = "Sistema";
const about$4 = "Sobre Nós";
const back$4 = "Voltar ao Chat";
const goBack$4 = "Voltar";
const add$4 = "Adicionar";
const edit$4 = "Editar";
const website$4 = "Site";
const version$4 = "Versão";
const contact$4 = "Contato";
const github$4 = "Github";
const loading$4 = "Por favor, aguarde...";
const copy$4 = "Copiar";
const reply$4 = "Responder";
const openInBuiltinBrowser$4 = "Abrir no navegador integrado";
const openInSystemBrowser$4 = "Abrir no navegador do sistema";
const copySuccess$4 = "Copiado";
const copyFailed$4 = "Falha ao copiar";
const download$4 = "Baixar";
const close$4 = "Fechar";
const retry$4 = "Tentar novamente";
const reload$4 = "Recarregar";
const technical_details$4 = "Detalhes Técnicos";
const error_details$4 = "Detalhes do Erro";
const troubleshooting$4 = "Solução de Problemas";
const select$4 = "Selecionar";
const expandMore$4 = "Expandir Mais";
const collapse$4 = "Recolher";
const viewMoreLines$4 = "Ver Mais ({{count}} linhas)";
const viewMoreLines_one$4 = "Ver Mais ({{count}} linha)";
const viewMoreLines_other$4 = "Ver Mais ({{count}} linhas)";
const success$4 = "Sucesso";
const error$4 = "Erro";
const saveSuccess$4 = "Salvo com sucesso";
const saveFailed$4 = "Falha ao salvar";
const unknownError$4 = "Erro desconhecido";
const confirmDelete$4 = "Confirmar Exclusão";
const deleteSuccess$4 = "Excluído com sucesso";
const deleteFailed$4 = "Falha ao excluir";
const defaultModel$4 = "Modelo Padrão";
const escToCancel$4 = "esc para cancelar";
const create$4 = "Criar";
const createSuccess$4 = "Criado com sucesso";
const failed$4 = "Falhou";
const browse$4 = "Procurar";
const remove$4 = "Remover";
const show$4 = "Mostrar";
const hide$9 = "Ocultar";
const goToSettings$4 = "Ir para Configurações";
const forward$4 = "Encaminhar";
const historyBack$4 = "Voltar";
const more$4 = "Mais";
const refresh$4 = "Atualizar";
const readOnly$4 = "Somente leitura";
const backendStartup$4 = { "incompatibleRuntime": { "title": "Este sistema não é suportado pelo backend integrado", "description": "O uBidBuddy abriu, mas o backend local do AionCore não pode ser executado nesta versão do Linux. Por favor, atualize para uma distribuição Linux suportada e reinicie o uBidBuddy.", "requiredVersions": "Símbolos de runtime necessários: {{versions}}" }, "incompleteInstallation": { "title": "A instalação do uBidBuddy está incompleta", "description": "Esta instalação está faltando recursos locais necessários, portanto o AionCore não pode ser iniciado. Por favor, baixe e reinstale a versão mais recente do uBidBuddy.", "downloadLatest": "Baixar mais recente", "sendDiagnostics": "Enviar diagnósticos", "diagnosticsSent": "Diagnósticos enviados", "diagnosticsReportSuccess": "Relatório de diagnóstico enviado", "diagnosticsReportFailed": "Falha ao enviar o relatório de diagnóstico", "runtimeComponentDescription": "Esta instalação não tem os componentes de runtime integrados necessários, portanto {{resource}} não pode iniciar. Reinstale o pacote mais recente do uBidBuddy. Se isso continuar após a reinstalação, verifique se algum software de segurança ou antivírus colocou componentes do uBidBuddy em quarentena." }, "packageArchitectureMismatch": { "title": "uBidBuddy package architecture mismatch", "description": "This uBidBuddy package is for {{packageArch}}, but this Mac is {{deviceArch}}. You may have downloaded the wrong package. Please download and install the {{expectedArch}} package." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "É necessária uma versão mais recente do uBidBuddy", "description": "Seus dados locais foram criados por uma versão mais recente do uBidBuddy e esta versão não consegue abri-los. Atualize o uBidBuddy para a versão mais recente para continuar; seus dados estão intactos e não é preciso reinstalar nem redefinir nada.", "descriptionWithVersion": "Seus dados locais foram criados por uma versão do uBidBuddy mais recente do que a instalada agora (v{{currentVersion}}), então esta versão não consegue abri-los. Atualize o uBidBuddy para a versão mais recente para continuar; seus dados estão intactos e não é preciso reinstalar nem redefinir nada." }, "localDataRepair": { "title": "Local data repair failed", "description": "O uBidBuddy abriu, mas o AionCore parou ao preparar dados locais de inicialização, como registros de assistants ou agentes. Reinstalar o uBidBuddy pode não corrigir o problema. Envie um relatório de diagnóstico ou entre em contato com o suporte para que o banco de dados local possa ser inspecionado.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Diretório de inicialização indisponível", "description": "O uBidBuddy abriu, mas o AionCore não pôde iniciar porque o diretório de trabalho ou de logs configurado não existe, está indisponível ou foi bloqueado por permissões. Verifique se os diretórios existem e permitem escrita, depois reinicie o uBidBuddy.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Relatório de diagnóstico enviado", "diagnosticsReportFailed": "Falha ao enviar relatório de diagnóstico" }, "recoverableDatabaseCorruption": { "title": "Os dados locais estão corrompidos", "description": "O uBidBuddy detectou que o banco de dados local está corrompido e não pode continuar a inicialização. Após a confirmação, o banco de dados antigo será salvo como backup e um novo banco de dados local será criado para continuar a inicialização. As conversas anteriores não serão mais exibidas, e o banco antigo será mantido como arquivo de backup.", "confirmRebuild": "Fazer backup do DB antigo e criar novo DB", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsHint": "Enviar diagnóstico não modificará o banco de dados local.", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Relatório de diagnóstico enviado", "diagnosticsReportFailed": "Falha ao enviar relatório de diagnóstico", "rebuildFailed": "Falha ao fazer backup do DB antigo e criar novo DB", "confirmDialog": { "title": "Reconstruir o banco de dados?", "content": "Esta ação fará backup do banco de dados corrompido atual e criará um totalmente novo e vazio. As conversas anteriores não serão mais exibidas (o banco antigo é mantido como arquivo de backup). Deseja continuar?", "okText": "Confirmar reconstrução", "cancelText": "Cancelar" } }, "transientConcurrentStartup": { "title": "O uBidBuddy está iniciando", "description": "Quando esta janela foi aberta, outra inicialização do uBidBuddy ainda estava usando os dados locais. Isso é temporário e seus dados estão seguros — não é necessário reinstalar. Aguarde um momento e tente novamente ou reinicie o uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "Se isso continuar acontecendo, você pode enviar um relatório de diagnóstico." }, "pendingSlow": { "title": "Iniciando", "description": "O AionCore está iniciando, aguarde. Se não responder após um tempo, você pode sair do aplicativo e abri-lo novamente." }, "exited": { "title": "A inicialização não foi concluída", "description": "O AionCore não conseguiu concluir a inicialização e foi encerrado. Reinicie o aplicativo; se isso continuar acontecendo, envie o diagnóstico.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Diagnóstico enviado", "diagnosticsReportFailed": "Falha ao enviar o diagnóstico, tente novamente" }, "portReportTimeout": { "title": "Tempo de inicialização esgotado", "description": "O AionCore não concluiu a inicialização dentro do tempo esperado. Reinicie o aplicativo; se isso continuar acontecendo, envie o diagnóstico.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Diagnóstico enviado", "diagnosticsReportFailed": "Falha ao enviar o diagnóstico, tente novamente" }, "startupFailed": { "title": "Falha na inicialização", "description": "O AionCore não conseguiu iniciar. Reinicie o aplicativo; se isso continuar acontecendo, envie o diagnóstico.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Diagnóstico enviado", "diagnosticsReportFailed": "Falha ao enviar o diagnóstico, tente novamente" } };
const expand$4 = "Expandir";
const name$4 = "Nome";
const added$4 = "Adicionado";
const status$4 = "Status";
const agentMode$4 = "Modo do Agente";
const refreshSuccess$4 = "Atualizado";
const processing$4 = "Processando...";
const optional$4 = "(opcional)";
const clear$4 = "Limpar";
const unit$4 = { "minute_short": "m", "second_short": "s" };
const selectedCount$4 = "{{count}} selecionado(s)";
const selectedSkills$4 = "Habilidades selecionadas";
const aiAssistant$4 = "Assistente de IA";
const commonPtBR = {
  send: send$4,
  cancel: cancel$4,
  save: save$4,
  "delete": "Excluir",
  confirm: confirm$4,
  file: file$4,
  folder: folder$4,
  upload: upload$4,
  model: model$4,
  skills: skills$4,
  workspace: workspace$4,
  settings: settings$4,
  system: system$4,
  about: about$4,
  back: back$4,
  goBack: goBack$4,
  add: add$4,
  edit: edit$4,
  website: website$4,
  version: version$4,
  contact: contact$4,
  github: github$4,
  loading: loading$4,
  copy: copy$4,
  reply: reply$4,
  openInBuiltinBrowser: openInBuiltinBrowser$4,
  openInSystemBrowser: openInSystemBrowser$4,
  copySuccess: copySuccess$4,
  copyFailed: copyFailed$4,
  download: download$4,
  close: close$4,
  retry: retry$4,
  reload: reload$4,
  technical_details: technical_details$4,
  error_details: error_details$4,
  troubleshooting: troubleshooting$4,
  select: select$4,
  expandMore: expandMore$4,
  collapse: collapse$4,
  viewMoreLines: viewMoreLines$4,
  viewMoreLines_one: viewMoreLines_one$4,
  viewMoreLines_other: viewMoreLines_other$4,
  success: success$4,
  error: error$4,
  saveSuccess: saveSuccess$4,
  saveFailed: saveFailed$4,
  unknownError: unknownError$4,
  confirmDelete: confirmDelete$4,
  deleteSuccess: deleteSuccess$4,
  deleteFailed: deleteFailed$4,
  "default": "Padrão",
  defaultModel: defaultModel$4,
  escToCancel: escToCancel$4,
  create: create$4,
  createSuccess: createSuccess$4,
  failed: failed$4,
  browse: browse$4,
  remove: remove$4,
  show: show$4,
  hide: hide$9,
  goToSettings: goToSettings$4,
  forward: forward$4,
  historyBack: historyBack$4,
  more: more$4,
  refresh: refresh$4,
  readOnly: readOnly$4,
  "tray.showWindow": "Mostrar uBidBuddy",
  "tray.newChat": "Novo Chat",
  "tray.closeToTray": "Ocultar na Bandeja",
  "tray.about": "Sobre o uBidBuddy",
  "tray.restart": "Reiniciar Aplicativo",
  "tray.quit": "Sair",
  "tray.runningTasks": "Tarefas em Execução",
  "tray.pauseAll": "Pausar Todas as Tarefas",
  "tray.checkUpdate": "Verificar Atualização",
  "tray.recentChats": "Chats Recentes",
  "tray.untitled": "Sem título",
  backendStartup: backendStartup$4,
  "fileAttach.addFiles": "Adicionar arquivos",
  "fileAttach.myDevice": "Upload do dispositivo",
  "fileAttach.failed": "Falha no upload",
  "fileAttach.uploading": "Enviando...",
  "fileAttach.uploadSuccess": "Upload bem-sucedido",
  "fileAttach.cancelUpload": "Cancelar upload",
  expand: expand$4,
  name: name$4,
  added: added$4,
  status: status$4,
  agentMode: agentMode$4,
  refreshSuccess: refreshSuccess$4,
  "import": "Importar",
  processing: processing$4,
  optional: optional$4,
  clear: clear$4,
  unit: unit$4,
  selectedCount: selectedCount$4,
  selectedSkills: selectedSkills$4,
  aiAssistant: aiAssistant$4
};
const desktopPet$4 = "Mascote de Mesa";
const enable$4 = "Habilitar Mascote de Mesa";
const size$4 = "Tamanho do Mascote";
const sizeSmall$4 = "Pequeno ({{px}}px)";
const sizeMedium$4 = "Médio ({{px}}px)";
const sizeLarge$4 = "Grande ({{px}}px)";
const dnd$4 = "Não Perturbe";
const dndDescription$4 = "Mascote fica ocioso, ignora eventos de IA";
const confirmBubble$4 = "Mostrar autorizações no mascote";
const confirmBubbleDescription$4 = "Quando desativado, autorizações de ferramentas de IA permanecem na janela principal de chat";
const pat$4 = "Acariciar";
const resetPosition$4 = "Redefinir Posição";
const hide$8 = "Ocultar";
const showHide$4 = "Mostrar/Ocultar";
const desktopOnly$4 = "O Mascote de Mesa está disponível apenas no aplicativo para desktop. Ele não pode ser usado no modo navegador WebUI.";
const petPtBR = {
  desktopPet: desktopPet$4,
  enable: enable$4,
  size: size$4,
  sizeSmall: sizeSmall$4,
  sizeMedium: sizeMedium$4,
  sizeLarge: sizeLarge$4,
  dnd: dnd$4,
  dndDescription: dndDescription$4,
  confirmBubble: confirmBubble$4,
  confirmBubbleDescription: confirmBubbleDescription$4,
  pat: pat$4,
  resetPosition: resetPosition$4,
  hide: hide$8,
  showHide: showHide$4,
  desktopOnly: desktopOnly$4
};
const send$3 = "Senden";
const cancel$3 = "Abbrechen";
const save$3 = "Speichern";
const confirm$3 = "Bestätigen";
const file$3 = "Datei";
const folder$3 = "Ordner";
const upload$3 = "Hochladen";
const model$3 = "Model";
const skills$3 = "Skills";
const workspace$3 = "Arbeitsbereich";
const settings$3 = "Einstellungen";
const system$3 = "System";
const about$3 = "Über uns";
const back$3 = "Zurück zum Chat";
const add$3 = "Hinzufügen";
const edit$3 = "Bearbeiten";
const website$3 = "Website";
const version$3 = "Version";
const contact$3 = "Kontakt";
const github$3 = "Github";
const loading$3 = "Bitte warten...";
const copy$3 = "Kopieren";
const reply$3 = "Antworten";
const openInBuiltinBrowser$3 = "Im integrierten Browser öffnen";
const openInSystemBrowser$3 = "Im Systembrowser öffnen";
const copySuccess$3 = "Kopiert";
const copyFailed$3 = "Kopieren fehlgeschlagen";
const download$3 = "Herunterladen";
const close$3 = "Schließen";
const retry$3 = "Erneut versuchen";
const reload$3 = "Neu laden";
const technical_details$3 = "Technische Details";
const error_details$3 = "Fehlerdetails";
const troubleshooting$3 = "Fehlerbehebung";
const select$3 = "Auswählen";
const expandMore$3 = "Mehr anzeigen";
const collapse$3 = "Einklappen";
const viewMoreLines$3 = "Mehr anzeigen ({{count}} Zeilen)";
const viewMoreLines_one$3 = "Mehr anzeigen ({{count}} Zeile)";
const viewMoreLines_other$3 = "Mehr anzeigen ({{count}} Zeilen)";
const success$3 = "Erfolgreich";
const error$3 = "Fehler";
const saveSuccess$3 = "Erfolgreich gespeichert";
const saveFailed$3 = "Speichern fehlgeschlagen";
const unknownError$3 = "Unbekannter Fehler";
const confirmDelete$3 = "Löschen bestätigen";
const deleteSuccess$3 = "Erfolgreich gelöscht";
const deleteFailed$3 = "Löschen fehlgeschlagen";
const defaultModel$3 = "Standardmodell";
const escToCancel$3 = "Esc zum Abbrechen";
const create$3 = "Erstellen";
const createSuccess$3 = "Erfolgreich erstellt";
const failed$3 = "Fehlgeschlagen";
const browse$3 = "Durchsuchen";
const remove$3 = "Entfernen";
const show$3 = "Anzeigen";
const hide$7 = "Ausblenden";
const goToSettings$3 = "Zu den Einstellungen";
const forward$3 = "Weiterleiten";
const historyBack$3 = "Zurück";
const more$3 = "Mehr";
const refresh$3 = "Aktualisieren";
const readOnly$3 = "Schreibgeschützt";
const backendStartup$3 = { "incompatibleRuntime": { "title": "Dieses System wird vom gebündelten Backend nicht unterstützt", "description": "uBidBuddy wurde geöffnet, aber das lokale AionCore-Backend kann auf dieser Linux-Version nicht ausgeführt werden. Bitte upgrade auf eine unterstützte Linux-Distribution und starte uBidBuddy neu.", "requiredVersions": "Erforderliche Runtime-Symbole: {{versions}}" }, "incompleteInstallation": { "title": "uBidBuddy-Installation ist unvollständig", "description": "Diese Installation fehlen erforderliche lokale Ressourcen, daher kann AionCore nicht starten. Bitte lade die neueste Version von uBidBuddy herunter und installiere sie neu. Wenn das Problem nach der Neuinstallation erneut auftritt, überprüfe, ob Sicherheits- oder Antivirus-Software AionCore unter Quarantäne gestellt hat.", "downloadLatest": "Neueste Version herunterladen", "sendDiagnostics": "Diagnose senden", "diagnosticsSent": "Diagnose gesendet", "diagnosticsReportSuccess": "Diagnosebericht gesendet", "diagnosticsReportFailed": "Fehler beim Senden des Diagnoseberichts", "runtimeComponentDescription": "Diese Installation fehlen erforderliche gebündelte Runtime-Komponenten, daher kann {{resource}} nicht starten. Installiere das neueste uBidBuddy-Paket neu. Wenn es nach der Neuinstallation immer noch auftritt, überprüfe, ob Sicherheits- oder Antivirus-Software uBidBuddy-Komponenten unter Quarantäne gestellt hat." }, "packageArchitectureMismatch": { "title": "uBidBuddy-Paket-Architektur-Fehlanpassung", "description": "Dieses uBidBuddy-Paket ist für {{packageArch}}, aber dieser Mac ist {{deviceArch}}. Möglicherweise hast du das falsche Paket heruntergeladen. Bitte lade das {{expectedArch}}-Paket herunter und installiere es." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "Neuere uBidBuddy-Version erforderlich", "description": "Ihre lokalen Daten wurden von einer neueren uBidBuddy-Version erstellt und können von dieser Version nicht geöffnet werden. Aktualisieren Sie uBidBuddy auf die neueste Version — Ihre Daten bleiben erhalten, eine Neuinstallation oder ein Zurücksetzen ist nicht nötig.", "descriptionWithVersion": "Ihre lokalen Daten wurden von einer uBidBuddy-Version erstellt, die neuer ist als die aktuell installierte (v{{currentVersion}}), daher kann diese Version sie nicht öffnen. Aktualisieren Sie uBidBuddy auf die neueste Version — Ihre Daten bleiben erhalten, eine Neuinstallation oder ein Zurücksetzen ist nicht nötig." }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy wurde geöffnet, aber AionCore wurde beim Vorbereiten lokaler Startdaten wie Assistant- oder Agent-Datensätzen beendet. Eine Neuinstallation von uBidBuddy behebt dies möglicherweise nicht. Senden Sie einen Diagnosebericht oder wenden Sie sich an den Support, damit die lokale Datenbank geprüft werden kann.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "Lokale Daten sind beschädigt", "description": "uBidBuddy hat erkannt, dass die lokale Datenbank beschädigt ist und den Start nicht fortsetzen kann. Nach der Bestätigung wird die alte Datenbank gesichert und eine neue lokale Datenbank erstellt, um den Start fortzusetzen. Frühere Unterhaltungen werden nicht mehr angezeigt, und die alte Datenbank bleibt als Sicherungsdatei erhalten.", "confirmRebuild": "Alte DB sichern und neue DB erstellen", "sendDiagnostics": "Diagnose senden", "diagnosticsHint": "Das Senden der Diagnose ändert die lokale Datenbank nicht.", "diagnosticsSent": "Diagnose gesendet", "diagnosticsReportSuccess": "Diagnosebericht gesendet", "diagnosticsReportFailed": "Diagnosebericht konnte nicht gesendet werden", "rebuildFailed": "Alte DB konnte nicht gesichert und neue DB nicht erstellt werden", "confirmDialog": { "title": "Datenbank neu aufbauen?", "content": "Dieser Vorgang sichert die aktuell beschädigte Datenbank und erstellt eine völlig neue leere Datenbank. Frühere Unterhaltungen werden nicht mehr angezeigt (die alte Datenbank bleibt als Sicherungsdatei erhalten). Fortfahren?", "okText": "Neuaufbau bestätigen", "cancelText": "Abbrechen" } }, "transientConcurrentStartup": { "title": "uBidBuddy wird gestartet", "description": "Beim Öffnen dieses Fensters verwendete ein anderer uBidBuddy-Startvorgang noch die lokalen Daten. Das ist vorübergehend und Ihre Daten sind sicher – eine Neuinstallation ist nicht erforderlich. Bitte warten Sie einen Moment und versuchen Sie es erneut oder starten Sie uBidBuddy neu.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "Wenn dies wiederholt auftritt, können Sie einen Diagnosebericht senden." }, "pendingSlow": { "title": "Wird gestartet", "description": "AionCore wird gestartet, bitte warten. Wenn es nach einer Weile nicht reagiert, können Sie die App beenden und erneut öffnen." }, "exited": { "title": "Start nicht abgeschlossen", "description": "AionCore konnte den Start nicht abschließen und wurde beendet. Bitte starten Sie die App neu; wenn dies wiederholt auftritt, senden Sie bitte eine Diagnose.", "sendDiagnostics": "Diagnose senden", "diagnosticsSent": "Diagnose gesendet", "diagnosticsReportSuccess": "Diagnose gemeldet", "diagnosticsReportFailed": "Diagnose konnte nicht gesendet werden, bitte erneut versuchen" }, "portReportTimeout": { "title": "Zeitüberschreitung beim Start", "description": "AionCore konnte den Start nicht innerhalb der erwarteten Zeit abschließen. Bitte starten Sie die App neu; wenn dies wiederholt auftritt, senden Sie bitte eine Diagnose.", "sendDiagnostics": "Diagnose senden", "diagnosticsSent": "Diagnose gesendet", "diagnosticsReportSuccess": "Diagnose gemeldet", "diagnosticsReportFailed": "Diagnose konnte nicht gesendet werden, bitte erneut versuchen" }, "startupFailed": { "title": "Start fehlgeschlagen", "description": "AionCore konnte nicht gestartet werden. Bitte starten Sie die App neu; wenn dies wiederholt auftritt, senden Sie bitte eine Diagnose.", "sendDiagnostics": "Diagnose senden", "diagnosticsSent": "Diagnose gesendet", "diagnosticsReportSuccess": "Diagnose gemeldet", "diagnosticsReportFailed": "Diagnose konnte nicht gesendet werden, bitte erneut versuchen" } };
const expand$3 = "Ausklappen";
const name$3 = "Name";
const added$3 = "Hinzugefügt";
const status$3 = "Status";
const agentMode$3 = "Agentenmodus";
const refreshSuccess$3 = "Aktualisiert";
const processing$3 = "Wird verarbeitet...";
const optional$3 = "(optional)";
const clear$3 = "Leeren";
const unit$3 = { "minute_short": "Min", "second_short": "Sek" };
const goBack$3 = "Zurück";
const selectedCount$3 = "{{count}} ausgewählt";
const selectedSkills$3 = "Ausgewählte Skills";
const aiAssistant$3 = "KI-Assistent";
const commonDeDE = {
  send: send$3,
  cancel: cancel$3,
  save: save$3,
  "delete": "Löschen",
  confirm: confirm$3,
  file: file$3,
  folder: folder$3,
  upload: upload$3,
  model: model$3,
  skills: skills$3,
  workspace: workspace$3,
  settings: settings$3,
  system: system$3,
  about: about$3,
  back: back$3,
  add: add$3,
  edit: edit$3,
  website: website$3,
  version: version$3,
  contact: contact$3,
  github: github$3,
  loading: loading$3,
  copy: copy$3,
  reply: reply$3,
  openInBuiltinBrowser: openInBuiltinBrowser$3,
  openInSystemBrowser: openInSystemBrowser$3,
  copySuccess: copySuccess$3,
  copyFailed: copyFailed$3,
  download: download$3,
  close: close$3,
  retry: retry$3,
  reload: reload$3,
  technical_details: technical_details$3,
  error_details: error_details$3,
  troubleshooting: troubleshooting$3,
  select: select$3,
  expandMore: expandMore$3,
  collapse: collapse$3,
  viewMoreLines: viewMoreLines$3,
  viewMoreLines_one: viewMoreLines_one$3,
  viewMoreLines_other: viewMoreLines_other$3,
  success: success$3,
  error: error$3,
  saveSuccess: saveSuccess$3,
  saveFailed: saveFailed$3,
  unknownError: unknownError$3,
  confirmDelete: confirmDelete$3,
  deleteSuccess: deleteSuccess$3,
  deleteFailed: deleteFailed$3,
  "default": "Standard",
  defaultModel: defaultModel$3,
  escToCancel: escToCancel$3,
  create: create$3,
  createSuccess: createSuccess$3,
  failed: failed$3,
  browse: browse$3,
  remove: remove$3,
  show: show$3,
  hide: hide$7,
  goToSettings: goToSettings$3,
  forward: forward$3,
  historyBack: historyBack$3,
  more: more$3,
  refresh: refresh$3,
  readOnly: readOnly$3,
  "tray.showWindow": "uBidBuddy anzeigen",
  "tray.newChat": "Neuer Chat",
  "tray.closeToTray": "In Taskleiste minimieren",
  "tray.about": "Über uBidBuddy",
  "tray.restart": "App neu starten",
  "tray.quit": "Beenden",
  "tray.runningTasks": "Laufende Aufgaben",
  "tray.pauseAll": "Alle Aufgaben pausieren",
  "tray.checkUpdate": "Auf Updates prüfen",
  "tray.recentChats": "Letzte Chats",
  "tray.untitled": "Ohne Titel",
  backendStartup: backendStartup$3,
  "fileAttach.addFiles": "Dateien hinzufügen",
  "fileAttach.myDevice": "Mein Gerät",
  "fileAttach.failed": "Hochladen fehlgeschlagen",
  "fileAttach.uploading": "Wird hochgeladen...",
  "fileAttach.uploadSuccess": "Erfolgreich hochgeladen",
  "fileAttach.cancelUpload": "Upload abbrechen",
  expand: expand$3,
  name: name$3,
  added: added$3,
  status: status$3,
  agentMode: agentMode$3,
  refreshSuccess: refreshSuccess$3,
  "import": "Importieren",
  processing: processing$3,
  optional: optional$3,
  clear: clear$3,
  unit: unit$3,
  goBack: goBack$3,
  selectedCount: selectedCount$3,
  selectedSkills: selectedSkills$3,
  aiAssistant: aiAssistant$3
};
const desktopPet$3 = "Desktop-Begleiter";
const enable$3 = "Desktop-Begleiter aktivieren";
const size$3 = "Begleitergröße";
const sizeSmall$3 = "Klein ({{px}}px)";
const sizeMedium$3 = "Mittel ({{px}}px)";
const sizeLarge$3 = "Groß ({{px}}px)";
const dnd$3 = "Nicht stören";
const dndDescription$3 = "Begleiter bleibt inaktiv, ignoriert KI-Ereignisse";
const confirmBubble$3 = "Genehmigungen beim Begleiter anzeigen";
const confirmBubbleDescription$3 = "Wenn deaktiviert, bleiben KI-Tool-Genehmigungen im Hauptchat-Fenster";
const pat$3 = "Streicheln";
const resetPosition$3 = "Position zurücksetzen";
const hide$6 = "Ausblenden";
const showHide$3 = "Anzeigen/Ausblenden";
const desktopOnly$3 = "Desktop-Begleiter ist nur in der Desktop-Anwendung verfügbar. Er kann nicht im WebUI-Browser-Modus verwendet werden.";
const petDeDE = {
  desktopPet: desktopPet$3,
  enable: enable$3,
  size: size$3,
  sizeSmall: sizeSmall$3,
  sizeMedium: sizeMedium$3,
  sizeLarge: sizeLarge$3,
  dnd: dnd$3,
  dndDescription: dndDescription$3,
  confirmBubble: confirmBubble$3,
  confirmBubbleDescription: confirmBubbleDescription$3,
  pat: pat$3,
  resetPosition: resetPosition$3,
  hide: hide$6,
  showHide: showHide$3,
  desktopOnly: desktopOnly$3
};
const send$2 = "Enviar";
const cancel$2 = "Cancelar";
const save$2 = "Guardar";
const confirm$2 = "Confirmar";
const file$2 = "Archivo";
const folder$2 = "Carpeta";
const upload$2 = "Subir";
const model$2 = "Modelo";
const skills$2 = "Habilidades";
const workspace$2 = "Proyecto";
const settings$2 = "Configuración";
const system$2 = "Sistema";
const about$2 = "Acerca de";
const back$2 = "Volver al chat";
const add$2 = "Agregar";
const edit$2 = "Editar";
const website$2 = "Sitio web";
const version$2 = "Versión";
const contact$2 = "Contacto";
const github$2 = "Github";
const loading$2 = "Por favor espera...";
const copy$2 = "Copiar";
const reply$2 = "Responder";
const openInBuiltinBrowser$2 = "Abrir en el navegador integrado";
const openInSystemBrowser$2 = "Abrir en el navegador del sistema";
const copySuccess$2 = "Copiado";
const copyFailed$2 = "Error al copiar";
const download$2 = "Descargar";
const close$2 = "Cerrar";
const retry$2 = "Reintentar";
const reload$2 = "Recargar";
const technical_details$2 = "Detalles técnicos";
const error_details$2 = "Detalles del error";
const troubleshooting$2 = "Solución de problemas";
const select$2 = "Seleccionar";
const expandMore$2 = "Ver más";
const collapse$2 = "Contraer";
const viewMoreLines$2 = "Ver más ({{count}} líneas)";
const viewMoreLines_one$2 = "Ver más ({{count}} línea)";
const viewMoreLines_other$2 = "Ver más ({{count}} líneas)";
const success$2 = "Éxito";
const error$2 = "Error";
const saveSuccess$2 = "Guardado correctamente";
const saveFailed$2 = "Error al guardar";
const unknownError$2 = "Error desconocido";
const confirmDelete$2 = "Confirmar eliminación";
const deleteSuccess$2 = "Eliminado correctamente";
const deleteFailed$2 = "Error al eliminar";
const defaultModel$2 = "Modelo predeterminado";
const escToCancel$2 = "esc para cancelar";
const create$2 = "Crear";
const createSuccess$2 = "Creado correctamente";
const failed$2 = "Falló";
const browse$2 = "Examinar";
const remove$2 = "Quitar";
const show$2 = "Mostrar";
const hide$5 = "Ocultar";
const goToSettings$2 = "Ir a configuración";
const forward$2 = "Reenviar";
const historyBack$2 = "Atrás";
const more$2 = "Más";
const refresh$2 = "Actualizar";
const readOnly$2 = "Solo lectura";
const backendStartup$2 = { "incompatibleRuntime": { "title": "Este sistema no es compatible con el backend incluido", "description": "uBidBuddy se abrió, pero el backend local AionCore no puede ejecutarse en esta versión de Linux. Actualiza a una distribución de Linux compatible y reinicia uBidBuddy.", "requiredVersions": "Símbolos de runtime requeridos: {{versions}}" }, "incompleteInstallation": { "title": "La instalación de uBidBuddy está incompleta", "description": "Esta instalación no tiene los recursos locales necesarios, por lo que AionCore no puede iniciar. Descarga e instala la última versión de uBidBuddy. Si el problema persiste después de reinstalar, verifica si el software de seguridad o antivirus puso en cuarentena AionCore.", "downloadLatest": "Descargar la última versión", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Reporte de diagnóstico enviado", "diagnosticsReportFailed": "Error al enviar el reporte de diagnóstico", "runtimeComponentDescription": "Esta instalación no tiene los componentes de runtime necesarios, por lo que {{resource}} no puede iniciar. Reinstala el último paquete de uBidBuddy. Si sigue fallando, verifica si el software de seguridad o antivirus puso en cuarentena componentes de uBidBuddy." }, "packageArchitectureMismatch": { "title": "Incompatibilidad de arquitectura del paquete uBidBuddy", "description": "Este paquete de uBidBuddy es para {{packageArch}}, pero esta Mac es {{deviceArch}}. Es posible que hayas descargado el paquete incorrecto. Descarga e instala el paquete {{expectedArch}}." }, "dataMigration": { "title": "Local data migration failed", "description": "uBidBuddy opened, but AionCore stopped while initializing local data. Reinstalling uBidBuddy may not fix this. Send a diagnostics report or contact support so the local database migration can be inspected.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "databaseNewerThanApp": { "title": "Se requiere una versión más reciente de uBidBuddy", "description": "Tus datos locales fueron creados por una versión más reciente de uBidBuddy y esta versión no puede abrirlos. Actualiza uBidBuddy a la última versión para continuar; tus datos están intactos y no es necesario reinstalar ni restablecer nada.", "descriptionWithVersion": "Tus datos locales fueron creados por una versión de uBidBuddy más reciente que la instalada ahora (v{{currentVersion}}), por lo que esta versión no puede abrirlos. Actualiza uBidBuddy a la última versión para continuar; tus datos están intactos y no es necesario reinstalar ni restablecer nada." }, "localDataRepair": { "title": "Local data repair failed", "description": "uBidBuddy se abrió, pero AionCore se detuvo al preparar datos locales de inicio, como registros de asistentes o agentes. Reinstalar uBidBuddy puede no solucionar este problema. Envía un informe de diagnóstico o contacta con soporte para que se pueda inspeccionar la base de datos local.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "startupDirectory": { "title": "Startup directory is unavailable", "description": "uBidBuddy opened, but AionCore could not start because the configured work or log directory is missing, unavailable, or blocked by permissions. Check that the configured directories exist and are writable, then restart uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report" }, "recoverableDatabaseCorruption": { "title": "Local data is corrupted", "description": "uBidBuddy detectó que la base de datos local está dañada y no puede continuar el inicio. Tras la confirmación, uBidBuddy hará una copia de seguridad de la base de datos antigua y creará una nueva base de datos local para continuar el inicio. Las conversaciones anteriores ya no se mostrarán y la base de datos antigua se conservará como archivo de copia de seguridad.", "confirmRebuild": "Back up old DB and rebuild new DB", "sendDiagnostics": "Send diagnostics", "diagnosticsHint": "Sending diagnostics will not modify the local database.", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "rebuildFailed": "Failed to back up old DB and rebuild new DB", "confirmDialog": { "title": "¿Reconstruir la base de datos?", "content": "Esta acción hará una copia de seguridad de la base de datos dañada actual y creará una totalmente nueva y vacía. Las conversaciones anteriores ya no se mostrarán (la base de datos antigua se conserva como archivo de copia de seguridad). ¿Desea continuar?", "okText": "Confirmar reconstrucción", "cancelText": "Cancelar" } }, "transientConcurrentStartup": { "title": "uBidBuddy se está iniciando", "description": "Cuando se abrió esta ventana, otro proceso de inicio de uBidBuddy todavía estaba usando los datos locales. Esto es temporal y tus datos están seguros: no es necesario reinstalar. Espera un momento e inténtalo de nuevo, o reinicia uBidBuddy.", "sendDiagnostics": "Send diagnostics", "diagnosticsSent": "Diagnostics sent", "diagnosticsReportSuccess": "Diagnostics report sent", "diagnosticsReportFailed": "Failed to send diagnostics report", "diagnosticsHint": "Si esto sigue ocurriendo, puedes enviar un informe de diagnóstico." }, "pendingSlow": { "title": "Iniciando", "description": "AionCore se está iniciando, espera un momento. Si no responde después de un rato, puedes salir de la aplicación y volver a abrirla." }, "exited": { "title": "El inicio no se completó", "description": "AionCore no pudo completar el inicio y se cerró. Reinicia la aplicación; si esto sigue ocurriendo, envía un diagnóstico.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Diagnóstico enviado", "diagnosticsReportFailed": "No se pudo enviar el diagnóstico, inténtalo de nuevo" }, "portReportTimeout": { "title": "Tiempo de inicio agotado", "description": "AionCore no terminó de iniciarse en el tiempo previsto. Reinicia la aplicación; si esto sigue ocurriendo, envía un diagnóstico.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Diagnóstico enviado", "diagnosticsReportFailed": "No se pudo enviar el diagnóstico, inténtalo de nuevo" }, "startupFailed": { "title": "Error al iniciar", "description": "AionCore no pudo iniciarse. Reinicia la aplicación; si esto sigue ocurriendo, envía un diagnóstico.", "sendDiagnostics": "Enviar diagnóstico", "diagnosticsSent": "Diagnóstico enviado", "diagnosticsReportSuccess": "Diagnóstico enviado", "diagnosticsReportFailed": "No se pudo enviar el diagnóstico, inténtalo de nuevo" } };
const expand$2 = "Expandir";
const name$2 = "Nombre";
const added$2 = "Agregado";
const status$2 = "Estado";
const agentMode$2 = "Modo agente";
const refreshSuccess$2 = "Actualizado";
const processing$2 = "Procesando...";
const optional$2 = "(opcional)";
const clear$2 = "Limpiar";
const unit$2 = { "minute_short": "m", "second_short": "s" };
const goBack$2 = "Back";
const selectedCount$2 = "{{count}} seleccionado(s)";
const selectedSkills$2 = "Habilidades seleccionadas";
const aiAssistant$2 = "Asistente de IA";
const commonEsES = {
  send: send$2,
  cancel: cancel$2,
  save: save$2,
  "delete": "Eliminar",
  confirm: confirm$2,
  file: file$2,
  folder: folder$2,
  upload: upload$2,
  model: model$2,
  skills: skills$2,
  workspace: workspace$2,
  settings: settings$2,
  system: system$2,
  about: about$2,
  back: back$2,
  add: add$2,
  edit: edit$2,
  website: website$2,
  version: version$2,
  contact: contact$2,
  github: github$2,
  loading: loading$2,
  copy: copy$2,
  reply: reply$2,
  openInBuiltinBrowser: openInBuiltinBrowser$2,
  openInSystemBrowser: openInSystemBrowser$2,
  copySuccess: copySuccess$2,
  copyFailed: copyFailed$2,
  download: download$2,
  close: close$2,
  retry: retry$2,
  reload: reload$2,
  technical_details: technical_details$2,
  error_details: error_details$2,
  troubleshooting: troubleshooting$2,
  select: select$2,
  expandMore: expandMore$2,
  collapse: collapse$2,
  viewMoreLines: viewMoreLines$2,
  viewMoreLines_one: viewMoreLines_one$2,
  viewMoreLines_other: viewMoreLines_other$2,
  success: success$2,
  error: error$2,
  saveSuccess: saveSuccess$2,
  saveFailed: saveFailed$2,
  unknownError: unknownError$2,
  confirmDelete: confirmDelete$2,
  deleteSuccess: deleteSuccess$2,
  deleteFailed: deleteFailed$2,
  "default": "Predeterminado",
  defaultModel: defaultModel$2,
  escToCancel: escToCancel$2,
  create: create$2,
  createSuccess: createSuccess$2,
  failed: failed$2,
  browse: browse$2,
  remove: remove$2,
  show: show$2,
  hide: hide$5,
  goToSettings: goToSettings$2,
  forward: forward$2,
  historyBack: historyBack$2,
  more: more$2,
  refresh: refresh$2,
  readOnly: readOnly$2,
  "tray.showWindow": "Mostrar uBidBuddy",
  "tray.newChat": "Nuevo chat",
  "tray.closeToTray": "Minimizar a bandeja",
  "tray.about": "Acerca de uBidBuddy",
  "tray.restart": "Reiniciar aplicación",
  "tray.quit": "Salir",
  "tray.runningTasks": "Tareas en ejecución",
  "tray.pauseAll": "Pausar todas las tareas",
  "tray.checkUpdate": "Buscar actualizaciones",
  "tray.recentChats": "Chats recientes",
  "tray.untitled": "Sin título",
  backendStartup: backendStartup$2,
  "fileAttach.addFiles": "Agregar archivos",
  "fileAttach.myDevice": "Subir desde el dispositivo",
  "fileAttach.failed": "Error al subir",
  "fileAttach.uploading": "Subiendo...",
  "fileAttach.uploadSuccess": "Subida exitosa",
  "fileAttach.cancelUpload": "Cancelar subida",
  expand: expand$2,
  name: name$2,
  added: added$2,
  status: status$2,
  agentMode: agentMode$2,
  refreshSuccess: refreshSuccess$2,
  "import": "Importar",
  processing: processing$2,
  optional: optional$2,
  clear: clear$2,
  unit: unit$2,
  goBack: goBack$2,
  selectedCount: selectedCount$2,
  selectedSkills: selectedSkills$2,
  aiAssistant: aiAssistant$2
};
const desktopPet$2 = "Mascota de escritorio";
const enable$2 = "Activar mascota de escritorio";
const size$2 = "Tamaño de la mascota";
const sizeSmall$2 = "Pequeño ({{px}}px)";
const sizeMedium$2 = "Mediano ({{px}}px)";
const sizeLarge$2 = "Grande ({{px}}px)";
const dnd$2 = "No molestar";
const dndDescription$2 = "La mascota permanece inactiva, ignora eventos de IA";
const confirmBubble$2 = "Mostrar autorizaciones en la mascota";
const confirmBubbleDescription$2 = "Cuando está desactivado, las autorizaciones de herramientas de IA permanecen en la ventana principal del chat";
const pat$2 = "Acariciar";
const resetPosition$2 = "Restablecer posición";
const hide$4 = "Ocultar";
const showHide$2 = "Mostrar/Ocultar";
const desktopOnly$2 = "La mascota de escritorio solo está disponible en la aplicación de escritorio. No se puede usar en modo navegador WebUI.";
const petEsES = {
  desktopPet: desktopPet$2,
  enable: enable$2,
  size: size$2,
  sizeSmall: sizeSmall$2,
  sizeMedium: sizeMedium$2,
  sizeLarge: sizeLarge$2,
  dnd: dnd$2,
  dndDescription: dndDescription$2,
  confirmBubble: confirmBubble$2,
  confirmBubbleDescription: confirmBubbleDescription$2,
  pat: pat$2,
  resetPosition: resetPosition$2,
  hide: hide$4,
  showHide: showHide$2,
  desktopOnly: desktopOnly$2
};
const send$1 = "Envoyer";
const cancel$1 = "Annuler";
const save$1 = "Enregistrer";
const confirm$1 = "Confirmer";
const file$1 = "Fichier";
const folder$1 = "Dossier";
const upload$1 = "Téléverser";
const model$1 = "Modèle";
const skills$1 = "Compétences";
const workspace$1 = "Espace de travail";
const settings$1 = "Paramètres";
const system$1 = "Système";
const about$1 = "À propos";
const back$1 = "Retour au chat";
const goBack$1 = "Dos";
const add$1 = "Ajouter";
const edit$1 = "Modifier";
const website$1 = "Site web";
const version$1 = "Version";
const contact$1 = "Contact";
const github$1 = "Github";
const loading$1 = "Veuillez patienter...";
const copy$1 = "Copier";
const reply$1 = "Répondre";
const openInBuiltinBrowser$1 = "Ouvrir dans le navigateur intégré";
const openInSystemBrowser$1 = "Ouvrir dans le navigateur système";
const copySuccess$1 = "Copié";
const copyFailed$1 = "Échec de la copie";
const download$1 = "Télécharger";
const close$1 = "Fermer";
const retry$1 = "Réessayer";
const reload$1 = "Recharger";
const technical_details$1 = "Détails techniques";
const error_details$1 = "Détails de l'erreur";
const troubleshooting$1 = "Dépannage";
const select$1 = "Sélectionner";
const expandMore$1 = "Voir plus";
const collapse$1 = "Réduire";
const viewMoreLines$1 = "Voir plus ({{count}} lignes)";
const viewMoreLines_one$1 = "Voir plus ({{count}} ligne)";
const viewMoreLines_other$1 = "Voir plus ({{count}} lignes)";
const success$1 = "Succès";
const error$1 = "Erreur";
const saveSuccess$1 = "Enregistré avec succès";
const saveFailed$1 = "Échec de l'enregistrement";
const unknownError$1 = "Erreur inconnue";
const confirmDelete$1 = "Confirmer la suppression";
const deleteSuccess$1 = "Supprimé avec succès";
const deleteFailed$1 = "Échec de la suppression";
const defaultModel$1 = "Modèle par défaut";
const escToCancel$1 = "Échap pour annuler";
const create$1 = "Créer";
const createSuccess$1 = "Créé avec succès";
const failed$1 = "Échec";
const browse$1 = "Parcourir";
const remove$1 = "Retirer";
const show$1 = "Afficher";
const hide$3 = "Masquer";
const goToSettings$1 = "Aller aux paramètres";
const forward$1 = "Suivant";
const historyBack$1 = "Retour";
const more$1 = "Plus";
const refresh$1 = "Actualiser";
const readOnly$1 = "Lecture seule";
const backendStartup$1 = { "incompatibleRuntime": { "title": "Ce système n'est pas pris en charge par le backend fourni", "description": "uBidBuddy s'est ouvert, mais le backend local AionCore ne peut pas fonctionner sur cette version de Linux. Veuillez effectuer une mise à niveau vers une distribution Linux prise en charge et redémarrer uBidBuddy.", "requiredVersions": "Symboles d'exécution requis : {{versions}}" }, "incompleteInstallation": { "title": "L'installation d'uBidBuddy est incomplète", "description": "Cette installation ne dispose pas des ressources locales requises, AionCore ne peut donc pas démarrer. Veuillez télécharger et réinstaller la dernière version d'uBidBuddy. Si le problème réapparaît après la réinstallation, vérifiez si un logiciel de sécurité ou antivirus a mis AionCore en quarantaine.", "downloadLatest": "Télécharger le dernier", "sendDiagnostics": "Envoyer des diagnostics", "diagnosticsSent": "Diagnostics envoyés", "diagnosticsReportSuccess": "Rapport de diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du rapport de diagnostic", "runtimeComponentDescription": "Il manque les composants d'exécution groupés requis dans cette installation, donc {{resource}} ne peut pas démarrer. Réinstallez le dernier package uBidBuddy. Si cela se produit toujours après la réinstallation, vérifiez si un logiciel de sécurité ou un antivirus a mis en quarantaine les composants uBidBuddy." }, "packageArchitectureMismatch": { "title": "Inadéquation de l'architecture du package uBidBuddy", "description": "Ce package uBidBuddy est pour {{packageArch}}, mais ce Mac est {{deviceArch}}. Vous avez peut-être téléchargé le mauvais package. Veuillez télécharger et installer le package {{expectedArch}}." }, "dataMigration": { "title": "Échec de la migration des données locales", "description": "uBidBuddy s'est ouvert, mais AionCore s'est arrêté lors de l'initialisation des données locales. La réinstallation d'uBidBuddy ne résoudra peut-être pas ce problème. Envoyez un rapport de diagnostic ou contactez le support afin que la migration de la base de données locale puisse être inspectée.", "sendDiagnostics": "Envoyer des diagnostics", "diagnosticsSent": "Diagnostics envoyés", "diagnosticsReportSuccess": "Rapport de diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du rapport de diagnostic" }, "databaseNewerThanApp": { "title": "Une version plus récente d'uBidBuddy est requise", "description": "Vos données locales ont été créées par une version plus récente d'uBidBuddy et cette version ne peut pas les ouvrir. Mettez à jour uBidBuddy vers la dernière version pour continuer : vos données sont intactes, aucune réinstallation ni réinitialisation n'est nécessaire.", "descriptionWithVersion": "Vos données locales ont été créées par une version d'uBidBuddy plus récente que celle installée actuellement (v{{currentVersion}}), cette version ne peut donc pas les ouvrir. Mettez à jour uBidBuddy vers la dernière version pour continuer : vos données sont intactes, aucune réinstallation ni réinitialisation n'est nécessaire." }, "localDataRepair": { "title": "La réparation des données locales a échoué", "description": "uBidBuddy s'est ouvert, mais AionCore s'est arrêté lors de la préparation des données locales de démarrage, comme les enregistrements d'assistants ou d'agents. La réinstallation d'uBidBuddy ne résoudra peut-être pas ce problème. Envoyez un rapport de diagnostic ou contactez l'assistance afin que la base de données locale puisse être inspectée.", "sendDiagnostics": "Envoyer des diagnostics", "diagnosticsSent": "Diagnostics envoyés", "diagnosticsReportSuccess": "Rapport de diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du rapport de diagnostic" }, "startupDirectory": { "title": "Le répertoire de démarrage n'est pas disponible", "description": "uBidBuddy s'est ouvert, mais AionCore n'a pas pu démarrer car le répertoire de travail ou de journal configuré est manquant, indisponible ou bloqué par les autorisations. Vérifiez que les répertoires configurés existent et sont accessibles en écriture, puis redémarrez uBidBuddy.", "sendDiagnostics": "Envoyer des diagnostics", "diagnosticsSent": "Diagnostics envoyés", "diagnosticsReportSuccess": "Rapport de diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du rapport de diagnostic" }, "recoverableDatabaseCorruption": { "title": "Les données locales sont corrompues", "description": "uBidBuddy a détecté que la base de données locale est corrompue et ne peut pas continuer le démarrage. Après confirmation, uBidBuddy sauvegardera l'ancienne base de données et créera une nouvelle base de données locale pour continuer le démarrage. Les conversations passées ne seront plus affichées et l'ancienne base de données sera conservée comme fichier de sauvegarde.", "confirmRebuild": "Sauvegarder l'ancienne base de données et reconstruire la nouvelle base de données", "sendDiagnostics": "Envoyer des diagnostics", "diagnosticsHint": "L'envoi de diagnostics ne modifiera pas la base de données locale.", "diagnosticsSent": "Diagnostics envoyés", "diagnosticsReportSuccess": "Rapport de diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du rapport de diagnostic", "rebuildFailed": "Échec de la sauvegarde de l'ancienne base de données et de la reconstruction de la nouvelle base de données", "confirmDialog": { "title": "Reconstruire la base de données ?", "content": "Cette opération sauvegardera la base de données actuellement corrompue et créera une toute nouvelle base vide. Les conversations passées ne seront plus affichées (l'ancienne base est conservée comme fichier de sauvegarde). Continuer ?", "okText": "Confirmer la reconstruction", "cancelText": "Annuler" } }, "transientConcurrentStartup": { "title": "uBidBuddy démarre", "description": "À l'ouverture de cette fenêtre, un autre démarrage d'uBidBuddy utilisait encore les données locales. C'est temporaire et vos données sont en sécurité — aucune réinstallation n'est nécessaire. Veuillez patienter un instant et réessayer, ou redémarrer uBidBuddy.", "sendDiagnostics": "Envoyer des diagnostics", "diagnosticsSent": "Diagnostics envoyés", "diagnosticsReportSuccess": "Rapport de diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du rapport de diagnostic", "diagnosticsHint": "Si cela se reproduit, vous pouvez envoyer un rapport de diagnostic." }, "pendingSlow": { "title": "Démarrage", "description": "AionCore est en cours de démarrage, veuillez patienter. S'il ne répond pas au bout d'un moment, vous pouvez quitter l'application et la rouvrir." }, "exited": { "title": "Le démarrage ne s'est pas terminé", "description": "AionCore n'a pas pu terminer son démarrage et s'est fermé. Veuillez redémarrer l'application ; si le problème persiste, envoyez un diagnostic.", "sendDiagnostics": "Envoyer le diagnostic", "diagnosticsSent": "Diagnostic envoyé", "diagnosticsReportSuccess": "Diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du diagnostic, veuillez réessayer" }, "portReportTimeout": { "title": "Délai de démarrage dépassé", "description": "AionCore n'a pas terminé son démarrage dans le délai prévu. Veuillez redémarrer l'application ; si le problème persiste, envoyez un diagnostic.", "sendDiagnostics": "Envoyer le diagnostic", "diagnosticsSent": "Diagnostic envoyé", "diagnosticsReportSuccess": "Diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du diagnostic, veuillez réessayer" }, "startupFailed": { "title": "Échec du démarrage", "description": "AionCore n'a pas pu démarrer. Veuillez redémarrer l'application ; si le problème persiste, envoyez un diagnostic.", "sendDiagnostics": "Envoyer le diagnostic", "diagnosticsSent": "Diagnostic envoyé", "diagnosticsReportSuccess": "Diagnostic envoyé", "diagnosticsReportFailed": "Échec de l'envoi du diagnostic, veuillez réessayer" } };
const expand$1 = "Développer";
const name$1 = "Nom";
const added$1 = "Ajouté";
const status$1 = "Statut";
const agentMode$1 = "Mode agent";
const refreshSuccess$1 = "Actualisé";
const processing$1 = "Traitement...";
const optional$1 = "(optionnel)";
const clear$1 = "Effacer";
const unit$1 = { "minute_short": "m", "second_short": "s" };
const selectedCount$1 = "{{count}} sélectionné(s)";
const selectedSkills$1 = "Compétences sélectionnées";
const aiAssistant$1 = "Assistant IA";
const commonFrFR = {
  send: send$1,
  cancel: cancel$1,
  save: save$1,
  "delete": "Supprimer",
  confirm: confirm$1,
  file: file$1,
  folder: folder$1,
  upload: upload$1,
  model: model$1,
  skills: skills$1,
  workspace: workspace$1,
  settings: settings$1,
  system: system$1,
  about: about$1,
  back: back$1,
  goBack: goBack$1,
  add: add$1,
  edit: edit$1,
  website: website$1,
  version: version$1,
  contact: contact$1,
  github: github$1,
  loading: loading$1,
  copy: copy$1,
  reply: reply$1,
  openInBuiltinBrowser: openInBuiltinBrowser$1,
  openInSystemBrowser: openInSystemBrowser$1,
  copySuccess: copySuccess$1,
  copyFailed: copyFailed$1,
  download: download$1,
  close: close$1,
  retry: retry$1,
  reload: reload$1,
  technical_details: technical_details$1,
  error_details: error_details$1,
  troubleshooting: troubleshooting$1,
  select: select$1,
  expandMore: expandMore$1,
  collapse: collapse$1,
  viewMoreLines: viewMoreLines$1,
  viewMoreLines_one: viewMoreLines_one$1,
  viewMoreLines_other: viewMoreLines_other$1,
  success: success$1,
  error: error$1,
  saveSuccess: saveSuccess$1,
  saveFailed: saveFailed$1,
  unknownError: unknownError$1,
  confirmDelete: confirmDelete$1,
  deleteSuccess: deleteSuccess$1,
  deleteFailed: deleteFailed$1,
  "default": "Par défaut",
  defaultModel: defaultModel$1,
  escToCancel: escToCancel$1,
  create: create$1,
  createSuccess: createSuccess$1,
  failed: failed$1,
  browse: browse$1,
  remove: remove$1,
  show: show$1,
  hide: hide$3,
  goToSettings: goToSettings$1,
  forward: forward$1,
  historyBack: historyBack$1,
  more: more$1,
  refresh: refresh$1,
  readOnly: readOnly$1,
  "tray.showWindow": "Afficher uBidBuddy",
  "tray.newChat": "Nouveau chat",
  "tray.closeToTray": "Réduire dans la barre système",
  "tray.about": "À propos d'uBidBuddy",
  "tray.restart": "Redémarrer l'application",
  "tray.quit": "Quitter",
  "tray.runningTasks": "Tâches en cours",
  "tray.pauseAll": "Tout mettre en pause",
  "tray.checkUpdate": "Vérifier les mises à jour",
  "tray.recentChats": "Chats récents",
  "tray.untitled": "Sans titre",
  backendStartup: backendStartup$1,
  "fileAttach.addFiles": "Ajouter des fichiers",
  "fileAttach.myDevice": "Mon appareil",
  "fileAttach.failed": "Échec du téléversement",
  "fileAttach.uploading": "Téléversement...",
  "fileAttach.uploadSuccess": "Téléversement réussi",
  "fileAttach.cancelUpload": "Annuler le téléchargement",
  expand: expand$1,
  name: name$1,
  added: added$1,
  status: status$1,
  agentMode: agentMode$1,
  refreshSuccess: refreshSuccess$1,
  "import": "Importer",
  processing: processing$1,
  optional: optional$1,
  clear: clear$1,
  unit: unit$1,
  selectedCount: selectedCount$1,
  selectedSkills: selectedSkills$1,
  aiAssistant: aiAssistant$1
};
const desktopPet$1 = "Mascotte de bureau";
const enable$1 = "Activer la mascotte de bureau";
const size$1 = "Taille de la mascotte";
const sizeSmall$1 = "Petite ({{px}}px)";
const sizeMedium$1 = "Moyenne ({{px}}px)";
const sizeLarge$1 = "Grande ({{px}}px)";
const dnd$1 = "Ne pas déranger";
const dndDescription$1 = "La mascotte reste inactive, ignore les événements IA";
const confirmBubble$1 = "Afficher les autorisations sur la mascotte";
const confirmBubbleDescription$1 = "Désactivé, les autorisations des outils IA restent dans la fenêtre de chat principale";
const pat$1 = "Caresser";
const resetPosition$1 = "Réinitialiser la position";
const hide$2 = "Masquer";
const showHide$1 = "Afficher/Masquer";
const desktopOnly$1 = "La mascotte de bureau est uniquement disponible dans l'application de bureau. Elle ne peut pas être utilisée en mode navigateur WebUI.";
const petFrFR = {
  desktopPet: desktopPet$1,
  enable: enable$1,
  size: size$1,
  sizeSmall: sizeSmall$1,
  sizeMedium: sizeMedium$1,
  sizeLarge: sizeLarge$1,
  dnd: dnd$1,
  dndDescription: dndDescription$1,
  confirmBubble: confirmBubble$1,
  confirmBubbleDescription: confirmBubbleDescription$1,
  pat: pat$1,
  resetPosition: resetPosition$1,
  hide: hide$2,
  showHide: showHide$1,
  desktopOnly: desktopOnly$1
};
const send = "ارسال";
const cancel = "لغو";
const save = "ذخیره";
const confirm = "تأیید";
const file = "فایل";
const folder = "پوشه";
const upload = "آپلود";
const model = "مدل";
const skills = "مهارت‌ها";
const workspace = "پروژه";
const settings = "تنظیمات";
const system = "سیستم";
const about = "درباره ما";
const back = "بازگشت به چت";
const goBack = "بازگشت";
const add = "افزودن";
const edit = "ویرایش";
const website = "وب‌سایت";
const version = "نسخه";
const contact = "تماس";
const github = "GitHub";
const loading = "لطفاً صبر کنید...";
const copy = "کپی";
const reply = "پاسخ";
const openInBuiltinBrowser = "باز کردن در مرورگر داخلی";
const openInSystemBrowser = "باز کردن در مرورگر سیستم";
const copySuccess = "کپی شد";
const copyFailed = "کپی ناموفق بود";
const download = "دانلود";
const close = "بستن";
const retry = "تلاش مجدد";
const reload = "بازخوانی";
const technical_details = "جزئیات فنی";
const error_details = "جزئیات خطا";
const troubleshooting = "عیب‌یابی";
const select = "انتخاب";
const expandMore = "نمایش بیشتر";
const collapse = "جمع کردن";
const viewMoreLines = "نمایش بیشتر ({{count}} خط)";
const viewMoreLines_one = "نمایش بیشتر ({{count}} خط)";
const viewMoreLines_other = "نمایش بیشتر ({{count}} خط)";
const success = "موفقیت";
const error = "خطا";
const saveSuccess = "با موفقیت ذخیره شد";
const saveFailed = "ذخیره ناموفق بود";
const unknownError = "خطای ناشناخته";
const confirmDelete = "تأیید حذف";
const deleteSuccess = "با موفقیت حذف شد";
const deleteFailed = "حذف ناموفق بود";
const defaultModel = "مدل پیش‌فرض";
const escToCancel = "برای لغو esc را بزنید";
const create = "ایجاد";
const createSuccess = "با موفقیت ایجاد شد";
const failed = "ناموفق";
const browse = "مرور";
const remove = "حذف";
const show = "نمایش";
const hide$1 = "مخفی کردن";
const goToSettings = "رفتن به تنظیمات";
const forward = "جلو";
const historyBack = "عقب";
const more = "بیشتر";
const refresh = "بازخوانی";
const readOnly = "فقط خواندنی";
const backendStartup = { "incompatibleRuntime": { "title": "این سیستم توسط بک‌اند همراه پشتیبانی نمی‌شود", "description": "uBidBuddy باز شد، اما بک‌اند محلی AionCore نمی‌تواند روی این نسخه لینوکس اجرا شود. لطفاً به یک توزیع لینوکس پشتیبانی‌شده ارتقا دهید و uBidBuddy را مجدداً راه‌اندازی کنید.", "requiredVersions": "نمادهای زمان اجرای مورد نیاز: {{versions}}" }, "incompleteInstallation": { "title": "نصب uBidBuddy ناقص است", "description": "این نصب فاقد منابع محلی مورد نیاز است، بنابراین AionCore نمی‌تواند شروع شود. لطفاً آخرین نسخه uBidBuddy را دانلود و مجدداً نصب کنید. اگر مشکل پس از نصب مجدد تکرار شد، بررسی کنید آیا نرم‌افزار امنیتی یا آنتی‌ویروس AionCore را قرنطینه کرده است.", "downloadLatest": "دانلود آخرین نسخه", "sendDiagnostics": "ارسال گزارش تشخیصی", "diagnosticsSent": "گزارش تشخیصی ارسال شد", "diagnosticsReportSuccess": "گزارش تشخیصی ارسال شد", "diagnosticsReportFailed": "ارسال گزارش تشخیصی ناموفق بود", "runtimeComponentDescription": "این نصب فاقد مؤلفه‌های زمان اجرای همراه مورد نیاز است، بنابراین {{resource}} نمی‌تواند شروع شود. آخرین بسته uBidBuddy را مجدداً نصب کنید. اگر پس از نصب مجدد همچنان رخ داد، بررسی کنید آیا نرم‌افزار امنیتی یا آنتی‌ویروس مؤلفه‌های uBidBuddy را قرنطینه کرده است." }, "packageArchitectureMismatch": { "title": "عدم تطابق معماری بسته uBidBuddy", "description": "این بسته uBidBuddy برای {{packageArch}} است، اما این مک {{deviceArch}} است. ممکن است بسته اشتباهی را دانلود کرده باشید. لطفاً بسته {{expectedArch}} را دانلود و نصب کنید." }, "dataMigration": { "title": "مهاجرت داده‌های محلی ناموفق بود", "description": "uBidBuddy باز شد، اما AionCore هنگام مقداردهی اولیه داده‌های محلی متوقف شد. نصب مجدد uBidBuddy ممکن است این مشکل را رفع نکند. گزارش تشخیصی بفرستید یا با پشتیبانی تماس بگیرید تا مهاجرت پایگاه داده محلی بررسی شود.", "sendDiagnostics": "ارسال گزارش تشخیصی", "diagnosticsSent": "گزارش تشخیصی ارسال شد", "diagnosticsReportSuccess": "گزارش تشخیصی ارسال شد", "diagnosticsReportFailed": "ارسال گزارش تشخیصی ناموفق بود" }, "databaseNewerThanApp": { "title": "به نسخه جدیدتر uBidBuddy نیاز است", "description": "داده‌های محلی شما توسط نسخه جدیدتری از uBidBuddy ایجاد شده‌اند و این نسخه نمی‌تواند آن‌ها را باز کند. برای ادامه، uBidBuddy را به آخرین نسخه به‌روزرسانی کنید؛ داده‌های شما سالم هستند و نیازی به نصب مجدد یا بازنشانی نیست.", "descriptionWithVersion": "داده‌های محلی شما توسط نسخه‌ای از uBidBuddy جدیدتر از نسخه فعلی (v{{currentVersion}}) ایجاد شده‌اند و این نسخه نمی‌تواند آن‌ها را باز کند. برای ادامه، uBidBuddy را به آخرین نسخه به‌روزرسانی کنید؛ داده‌های شما سالم هستند و نیازی به نصب مجدد یا بازنشانی نیست." }, "localDataRepair": { "title": "ترمیم داده‌های محلی ناموفق بود", "description": "uBidBuddy باز شد، اما AionCore هنگام آماده‌سازی داده‌های محلی راه‌اندازی مانند رکوردهای assistant یا ایجنت متوقف شد. نصب مجدد uBidBuddy ممکن است این مشکل را رفع نکند. گزارش تشخیصی بفرستید یا با پشتیبانی تماس بگیرید تا پایگاه داده محلی بررسی شود.", "sendDiagnostics": "ارسال گزارش تشخیصی", "diagnosticsSent": "گزارش تشخیصی ارسال شد", "diagnosticsReportSuccess": "گزارش تشخیصی ارسال شد", "diagnosticsReportFailed": "ارسال گزارش تشخیصی ناموفق بود" }, "startupDirectory": { "title": "پوشه راه‌اندازی در دسترس نیست", "description": "uBidBuddy باز شد، اما AionCore نتوانست شروع شود چون پوشه کاری یا پوشه لاگ پیکربندی‌شده وجود ندارد، در دسترس نیست یا به دلیل مجوزها مسدود شده است. بررسی کنید پوشه‌ها وجود دارند و قابل نوشتن هستند، سپس uBidBuddy را دوباره راه‌اندازی کنید.", "sendDiagnostics": "ارسال گزارش تشخیصی", "diagnosticsSent": "گزارش تشخیصی ارسال شد", "diagnosticsReportSuccess": "گزارش تشخیصی ارسال شد", "diagnosticsReportFailed": "ارسال گزارش تشخیصی ناموفق بود" }, "recoverableDatabaseCorruption": { "title": "داده‌های محلی خراب شده‌اند", "description": "uBidBuddy تشخیص داد پایگاه داده محلی خراب است و نمی‌تواند راه‌اندازی را ادامه دهد. پس از تأیید، uBidBuddy از پایگاه داده قدیمی نسخه پشتیبان می‌گیرد و یک پایگاه داده محلی جدید می‌سازد تا راه‌اندازی ادامه پیدا کند. گفتگوهای گذشته دیگر نمایش داده نمی‌شوند و پایگاه داده قدیمی به‌عنوان فایل پشتیبان نگه داشته می‌شود.", "confirmRebuild": "پشتیبان‌گیری از DB قدیمی و ساخت DB جدید", "sendDiagnostics": "ارسال گزارش تشخیصی", "diagnosticsHint": "ارسال گزارش تشخیصی پایگاه داده محلی را تغییر نمی‌دهد.", "diagnosticsSent": "گزارش تشخیصی ارسال شد", "diagnosticsReportSuccess": "گزارش تشخیصی ارسال شد", "diagnosticsReportFailed": "ارسال گزارش تشخیصی ناموفق بود", "rebuildFailed": "پشتیبان‌گیری از DB قدیمی و ساخت DB جدید ناموفق بود", "confirmDialog": { "title": "پایگاه داده بازسازی شود؟", "content": "این عملیات از پایگاه داده خراب فعلی نسخه پشتیبان می‌گیرد و یک پایگاه داده کاملاً جدید و خالی می‌سازد. گفتگوهای گذشته دیگر نمایش داده نمی‌شوند (پایگاه داده قدیمی به‌عنوان فایل پشتیبان نگه داشته می‌شود). ادامه می‌دهید؟", "okText": "تأیید بازسازی", "cancelText": "لغو" } }, "transientConcurrentStartup": { "title": "uBidBuddy در حال راه‌اندازی است", "description": "هنگام باز شدن این پنجره، یک فرایند راه‌اندازی دیگر uBidBuddy هنوز از داده‌های محلی استفاده می‌کرد. این وضعیت موقتی است و داده‌های شما ایمن هستند — نیازی به نصب مجدد نیست. لطفاً کمی صبر کنید و دوباره تلاش کنید، یا uBidBuddy را دوباره راه‌اندازی کنید.", "sendDiagnostics": "ارسال گزارش تشخیصی", "diagnosticsSent": "گزارش تشخیصی ارسال شد", "diagnosticsReportSuccess": "گزارش تشخیصی ارسال شد", "diagnosticsReportFailed": "ارسال گزارش تشخیصی ناموفق بود", "diagnosticsHint": "اگر این مشکل ادامه یافت، می‌توانید یک گزارش تشخیصی ارسال کنید." }, "pendingSlow": { "title": "در حال راه‌اندازی", "description": "AionCore در حال راه‌اندازی است، لطفاً صبر کنید. اگر پس از مدتی پاسخ نداد، می‌توانید برنامه را ببندید و دوباره باز کنید." }, "exited": { "title": "راه‌اندازی کامل نشد", "description": "AionCore نتوانست راه‌اندازی را کامل کند و بسته شد. لطفاً برنامه را دوباره راه‌اندازی کنید؛ اگر این مشکل تکرار شد، اطلاعات تشخیصی را ارسال کنید.", "sendDiagnostics": "ارسال تشخیص", "diagnosticsSent": "تشخیص ارسال شد", "diagnosticsReportSuccess": "تشخیص گزارش شد", "diagnosticsReportFailed": "ارسال تشخیص ناموفق بود، لطفاً بعداً دوباره تلاش کنید" }, "portReportTimeout": { "title": "مهلت راه‌اندازی به پایان رسید", "description": "AionCore نتوانست راه‌اندازی را در زمان مورد انتظار کامل کند. لطفاً برنامه را دوباره راه‌اندازی کنید؛ اگر این مشکل تکرار شد، اطلاعات تشخیصی را ارسال کنید.", "sendDiagnostics": "ارسال تشخیص", "diagnosticsSent": "تشخیص ارسال شد", "diagnosticsReportSuccess": "تشخیص گزارش شد", "diagnosticsReportFailed": "ارسال تشخیص ناموفق بود، لطفاً بعداً دوباره تلاش کنید" }, "startupFailed": { "title": "راه‌اندازی ناموفق بود", "description": "AionCore نتوانست راه‌اندازی شود. لطفاً برنامه را دوباره راه‌اندازی کنید؛ اگر این مشکل تکرار شد، اطلاعات تشخیصی را ارسال کنید.", "sendDiagnostics": "ارسال تشخیص", "diagnosticsSent": "تشخیص ارسال شد", "diagnosticsReportSuccess": "تشخیص گزارش شد", "diagnosticsReportFailed": "ارسال تشخیص ناموفق بود، لطفاً بعداً دوباره تلاش کنید" } };
const expand = "باز کردن";
const name = "نام";
const added = "افزوده شد";
const status = "وضعیت";
const agentMode = "حالت عامل";
const refreshSuccess = "بازخوانی شد";
const processing = "در حال پردازش...";
const optional = "(اختیاری)";
const clear = "پاک کردن";
const unit = { "minute_short": "د", "second_short": "ث" };
const selectedCount = "{{count}} انتخاب‌شده";
const selectedSkills = "مهارت‌های انتخاب‌شده";
const aiAssistant = "دستیار هوش مصنوعی";
const commonFaIR = {
  send,
  cancel,
  save,
  "delete": "حذف",
  confirm,
  file,
  folder,
  upload,
  model,
  skills,
  workspace,
  settings,
  system,
  about,
  back,
  goBack,
  add,
  edit,
  website,
  version,
  contact,
  github,
  loading,
  copy,
  reply,
  openInBuiltinBrowser,
  openInSystemBrowser,
  copySuccess,
  copyFailed,
  download,
  close,
  retry,
  reload,
  technical_details,
  error_details,
  troubleshooting,
  select,
  expandMore,
  collapse,
  viewMoreLines,
  viewMoreLines_one,
  viewMoreLines_other,
  success,
  error,
  saveSuccess,
  saveFailed,
  unknownError,
  confirmDelete,
  deleteSuccess,
  deleteFailed,
  "default": "پیش‌فرض",
  defaultModel,
  escToCancel,
  create,
  createSuccess,
  failed,
  browse,
  remove,
  show,
  hide: hide$1,
  goToSettings,
  forward,
  historyBack,
  more,
  refresh,
  readOnly,
  "tray.showWindow": "نمایش uBidBuddy",
  "tray.newChat": "چت جدید",
  "tray.closeToTray": "مخفی کردن در سینی",
  "tray.about": "درباره uBidBuddy",
  "tray.restart": "راه‌اندازی مجدد برنامه",
  "tray.quit": "خروج",
  "tray.runningTasks": "وظایف در حال اجرا",
  "tray.pauseAll": "مکث همه وظایف",
  "tray.checkUpdate": "بررسی به‌روزرسانی",
  "tray.recentChats": "چت‌های اخیر",
  "tray.untitled": "بدون عنوان",
  backendStartup,
  "fileAttach.addFiles": "افزودن فایل‌ها",
  "fileAttach.myDevice": "آپلود از دستگاه",
  "fileAttach.failed": "آپلود ناموفق بود",
  "fileAttach.uploading": "در حال آپلود...",
  "fileAttach.uploadSuccess": "آپلود موفقیت‌آمیز بود",
  "fileAttach.cancelUpload": "لغو آپلود",
  expand,
  name,
  added,
  status,
  agentMode,
  refreshSuccess,
  "import": "وارد کردن",
  processing,
  optional,
  clear,
  unit,
  selectedCount,
  selectedSkills,
  aiAssistant
};
const desktopPet = "حیوان خانگی دسکتاپ";
const enable = "فعال‌سازی حیوان خانگی دسکتاپ";
const size = "اندازه حیوان خانگی";
const sizeSmall = "کوچک ({{px}} پیکسل)";
const sizeMedium = "متوسط ({{px}} پیکسل)";
const sizeLarge = "بزرگ ({{px}} پیکسل)";
const dnd = "مزاحم نشوید";
const dndDescription = "حیوان خانگی بی‌کار می‌ماند و رویدادهای هوش مصنوعی را نادیده می‌گیرد";
const confirmBubble = "نمایش مجوزها روی حیوان خانگی";
const confirmBubbleDescription = "وقتی غیرفعال است، مجوزهای ابزار هوش مصنوعی در پنجره اصلی چت باقی می‌مانند";
const pat = "نوازش";
const resetPosition = "بازنشانی موقعیت";
const hide = "مخفی کردن";
const showHide = "نمایش/مخفی کردن";
const desktopOnly = "حیوان خانگی دسکتاپ فقط در برنامه دسکتاپ در دسترس است. در حالت مرورگر WebUI قابل استفاده نیست.";
const petFaIR = {
  desktopPet,
  enable,
  size,
  sizeSmall,
  sizeMedium,
  sizeLarge,
  dnd,
  dndDescription,
  confirmBubble,
  confirmBubbleDescription,
  pat,
  resetPosition,
  hide,
  showHide,
  desktopOnly
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const localeData = {
  "en-US": { common: commonEnUS, pet: petEnUS },
  "zh-CN": { common: commonZhCN, pet: petZhCN },
  "zh-TW": { common: commonZhTW, pet: petZhTW },
  "ja-JP": { common: commonJaJP, pet: petJaJP },
  "ko-KR": { common: commonKoKR, pet: petKoKR },
  "tr-TR": { common: commonTrTR, pet: petTrTR },
  "ru-RU": { common: commonRuRU, pet: petRuRU },
  "uk-UA": { common: commonUkUA, pet: petUkUA },
  "pt-BR": { common: commonPtBR, pet: petPtBR },
  "de-DE": { common: commonDeDE, pet: petDeDE },
  "es-ES": { common: commonEsES, pet: petEsES },
  "fr-FR": { common: commonFrFR, pet: petFrFR },
  "fa-IR": { common: commonFaIR, pet: petFaIR }
};
const fallbackData = localeData[DEFAULT_LANGUAGE] ?? {};
function getLocaleModules(locale) {
  const data = localeData[locale];
  if (!data) return fallbackData;
  if (locale === DEFAULT_LANGUAGE) return data;
  return mergeWithFallback(fallbackData, data);
}
const i18nReady = (async () => {
  await i18n.init({
    resources: {
      [DEFAULT_LANGUAGE]: { translation: getLocaleModules(DEFAULT_LANGUAGE) }
    },
    fallbackLng: DEFAULT_LANGUAGE,
    debug: false,
    interpolation: { escapeValue: false }
  });
  const language = await ProcessConfig.get("language");
  if (language) {
    await ensureAndSwitch(i18n, language, getLocaleModules);
  }
})().catch((error2) => {
  console.error("[Main Process] Failed to initialize i18n:", error2);
});
async function setInitialLanguage(language) {
  await i18nReady;
  if (language) {
    await ensureAndSwitch(i18n, language, getLocaleModules);
  }
}
async function changeLanguage(language) {
  await i18nReady;
  await ensureAndSwitch(i18n, language, getLocaleModules);
}
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  changeLanguage,
  default: i18n,
  i18nReady,
  normalizeLanguageCode,
  setInitialLanguage
}, Symbol.toStringTag, { value: "Module" }));
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function loadElectron() {
  if (process.versions?.electron) {
    return require("electron");
  }
  return null;
}
const _electron = loadElectron();
const electronApp = _electron?.app ?? null;
_electron?.utilityProcess ?? null;
_electron?.powerSaveBlocker ?? null;
_electron?.BrowserWindow ?? null;
_electron?.Notification ?? null;
const electronMenu = _electron?.Menu ?? null;
const electronNativeImage = _electron?.nativeImage ?? null;
const electronTray = _electron?.Tray ?? null;
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
let tray = null;
let closeToTrayEnabled = false;
let isQuitting = false;
let mainWindowRef$1 = null;
let cachedActiveCount = 0;
const setTrayMainWindow = (win) => {
  mainWindowRef$1 = win;
};
const getCloseToTrayEnabled = () => closeToTrayEnabled;
const setCloseToTrayEnabled = (enabled) => {
  closeToTrayEnabled = enabled;
};
const getIsQuitting = () => isQuitting;
const setIsQuitting = (quitting) => {
  isQuitting = quitting;
};
const shouldShowFromTray = (isVisible, isMinimized) => {
  return !isVisible || isMinimized;
};
const showAndFocusMainWindow$1 = () => {
  if (!mainWindowRef$1 || mainWindowRef$1.isDestroyed()) return;
  if (process.platform === "darwin" && electronApp.dock) {
    void electronApp.dock.show();
  }
  if (mainWindowRef$1.isMinimized()) {
    mainWindowRef$1.restore();
  }
  mainWindowRef$1.show();
  mainWindowRef$1.focus();
};
const hideMainWindowToTray = () => {
  if (!mainWindowRef$1 || mainWindowRef$1.isDestroyed()) return;
  mainWindowRef$1.hide();
  if (process.platform === "darwin" && electronApp.dock) {
    void electronApp.dock.hide();
  }
};
const toggleMainWindowFromTray = () => {
  if (!mainWindowRef$1 || mainWindowRef$1.isDestroyed()) return;
  if (shouldShowFromTray(mainWindowRef$1.isVisible(), mainWindowRef$1.isMinimized())) {
    showAndFocusMainWindow$1();
  } else {
    hideMainWindowToTray();
  }
};
const getTrayIcon = () => {
  const resourcesPath = electronApp.isPackaged ? process.resourcesPath : path__namespace.join(process.cwd(), "resources");
  const icon = electronNativeImage.createFromPath(path__namespace.join(resourcesPath, "app.png"));
  if (process.platform === "darwin") {
    return icon.resize({ width: 16, height: 16 });
  }
  return icon.resize({ width: 32, height: 32 });
};
const buildTrayContextMenu = async () => {
  const getRecentConversations = async () => {
    try {
      const result = await database.getUserConversations.invoke({ limit: 5 });
      return (result.items || []).slice(0, 5).map((conv) => ({
        id: conv.id,
        title: conv.name || i18n.t("common.tray.untitled")
      }));
    } catch {
      return [];
    }
  };
  const getRunningTasksCount = () => cachedActiveCount;
  const recentConversations = await getRecentConversations();
  const runningTasksCount = getRunningTasksCount();
  const template = [
    {
      label: i18n.t("common.tray.showWindow"),
      click: showAndFocusMainWindow$1
    },
    {
      label: i18n.t("common.tray.closeToTray"),
      click: hideMainWindowToTray
    },
    { type: "separator" },
    {
      label: i18n.t("common.tray.newChat"),
      click: () => {
        showAndFocusMainWindow$1();
        mainWindowRef$1?.webContents.send("tray:navigate-to-guid");
      }
    }
  ];
  if (recentConversations.length > 0) {
    template.push({ type: "separator" });
    template.push({
      label: i18n.t("common.tray.recentChats"),
      enabled: false
    });
    for (const conv of recentConversations) {
      const displayTitle = conv.title.length > 20 ? conv.title.slice(0, 20) + "..." : conv.title;
      template.push({
        label: displayTitle,
        click: () => {
          showAndFocusMainWindow$1();
          mainWindowRef$1?.webContents.send("tray:navigate-to-conversation", {
            conversation_id: conv.id
          });
        }
      });
    }
  }
  template.push({ type: "separator" });
  template.push({
    label: `${i18n.t("common.tray.runningTasks")}: ${runningTasksCount}`,
    enabled: false
  });
  template.push({
    label: i18n.t("common.tray.pauseAll"),
    click: () => {
      showAndFocusMainWindow$1();
      mainWindowRef$1?.webContents.send("tray:pause-all-tasks");
    }
  });
  template.push({ type: "separator" });
  template.push({
    label: `🐾 ${i18n.t("pet.desktopPet")}`,
    submenu: [
      {
        label: i18n.t("pet.showHide"),
        click: async () => {
          try {
            const petManager = await Promise.resolve().then(() => require("./chunks/petManager-B86Slr6G.cjs"));
            petManager.showPetWindow();
          } catch {
          }
        }
      },
      { type: "separator" },
      {
        label: i18n.t("pet.sizeSmall", { px: 200 }),
        click: async () => {
          try {
            const { resizePetWindow } = await Promise.resolve().then(() => require("./chunks/petManager-B86Slr6G.cjs"));
            resizePetWindow(200);
          } catch {
          }
        }
      },
      {
        label: i18n.t("pet.sizeMedium", { px: 280 }),
        click: async () => {
          try {
            const { resizePetWindow } = await Promise.resolve().then(() => require("./chunks/petManager-B86Slr6G.cjs"));
            resizePetWindow(280);
          } catch {
          }
        }
      },
      {
        label: i18n.t("pet.sizeLarge", { px: 360 }),
        click: async () => {
          try {
            const { resizePetWindow } = await Promise.resolve().then(() => require("./chunks/petManager-B86Slr6G.cjs"));
            resizePetWindow(360);
          } catch {
          }
        }
      }
    ]
  });
  template.push({ type: "separator" });
  template.push({
    label: i18n.t("common.tray.checkUpdate"),
    click: () => {
      showAndFocusMainWindow$1();
      mainWindowRef$1?.webContents.send("tray:check-update");
    }
  });
  template.push({ type: "separator" });
  template.push({
    label: i18n.t("common.tray.about"),
    click: () => {
      showAndFocusMainWindow$1();
      mainWindowRef$1?.webContents.send("tray:open-about");
    }
  });
  template.push({
    label: i18n.t("common.tray.restart"),
    click: () => {
      isQuitting = true;
      electronApp.relaunch();
      electronApp.exit(0);
    }
  });
  template.push({ type: "separator" });
  template.push({
    label: i18n.t("common.tray.quit"),
    click: () => {
      isQuitting = true;
      electronApp.quit();
    }
  });
  return electronMenu.buildFromTemplate(template);
};
const createOrUpdateTray = () => {
  if (tray) {
    return;
  }
  try {
    const icon = getTrayIcon();
    tray = new electronTray(icon);
    tray.setToolTip("uBidBuddy");
    void buildTrayContextMenu().then((menu) => tray?.setContextMenu(menu));
    tray.on("double-click", () => {
      showAndFocusMainWindow$1();
    });
    tray.on("click", () => {
      if (process.platform === "darwin") {
        void buildTrayContextMenu().then((menu) => tray?.setContextMenu(menu));
        return;
      }
      toggleMainWindowFromTray();
    });
    void fetchActiveCountAndMaybeRebuild();
  } catch (err) {
    console.error("[Tray] Failed to create tray:", err);
  }
};
const rebuildTrayMenu = () => {
  if (!tray) return;
  void buildTrayContextMenu().then((menu) => tray?.setContextMenu(menu));
};
const fetchActiveCountAndMaybeRebuild = async () => {
  try {
    const { count } = await conversation.activeCount.invoke();
    if (count !== cachedActiveCount) {
      cachedActiveCount = count;
      rebuildTrayMenu();
    }
  } catch {
  }
};
const refreshTrayMenu = async () => {
  rebuildTrayMenu();
  await fetchActiveCountAndMaybeRebuild();
};
const destroyTray = () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const CLOSE_TO_TRAY_CONFIG_KEY = "system.closeToTray";
const LEGACY_BACKEND_CLOSE_TO_TRAY_KEY = "closeToTray";
const readBackendBoolean = async (key) => {
  try {
    const value = await httpRequest(
      "GET",
      `/api/settings/client?keys=${encodeURIComponent(key)}`,
      void 0,
      {
        silentStatuses: [404]
      }
    );
    const entry = value?.[key];
    return typeof entry === "boolean" ? entry : void 0;
  } catch {
    return void 0;
  }
};
const readCloseToTraySetting = async () => {
  const localValue = await ProcessConfig.get(CLOSE_TO_TRAY_CONFIG_KEY);
  if (typeof localValue === "boolean") {
    return localValue;
  }
  const backendValue = await readBackendBoolean(CLOSE_TO_TRAY_CONFIG_KEY) ?? await readBackendBoolean(LEGACY_BACKEND_CLOSE_TO_TRAY_KEY);
  if (typeof backendValue === "boolean") {
    try {
      await writeCloseToTraySetting(backendValue);
    } catch {
      await ProcessConfig.set(CLOSE_TO_TRAY_CONFIG_KEY, backendValue).catch(() => {
      });
    }
    return backendValue;
  }
  return false;
};
const writeCloseToTraySetting = async (enabled) => {
  await httpRequest("PUT", "/api/settings/client", { [CLOSE_TO_TRAY_CONFIG_KEY]: enabled });
  await ProcessConfig.set(CLOSE_TO_TRAY_CONFIG_KEY, enabled);
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function registerWindowMaximizeListeners(window2) {
  window2.on("maximize", () => {
  });
  window2.on("unmaximize", () => {
  });
}
function initWindowControlsBridge() {
  const allWindows = require$$0$1.BrowserWindow.getAllWindows();
  allWindows.forEach((window2) => {
    registerWindowMaximizeListeners(window2);
  });
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function initAllBridges(_deps = {}) {
  initDialogBridge();
  initApplicationBridge();
  initWindowControlsBridge();
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
initAllBridges();
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
if (require$$0$1.app.isPackaged) {
  process.env.PREBUILDS_ONLY = "1";
}
const initializeProcess = async () => {
  const t0 = performance.now();
  const mark = (label) => console.log(`[uBidBuddy:process] ${label} +${Math.round(performance.now() - t0)}ms`);
  await initStorage();
  mark("initStorage");
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const DEFAULT_QUIT_CLEANUP_TIMEOUT_MS = 1e4;
async function runWithTimeout(work, timeoutMs, logWarn) {
  let timeoutId;
  let timedOut = false;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      logWarn("[uBidBuddy] Cleanup timed out after 10s, forcing quit");
      resolve();
    }, timeoutMs);
  });
  await Promise.race([work, timeout]);
  if (!timedOut && timeoutId) {
    clearTimeout(timeoutId);
  }
}
async function runQuitCleanup(deps) {
  deps.logInfo("[uBidBuddy] before-quit");
  deps.setIsQuitting(true);
  deps.markExplicitQuit();
  deps.destroyTray();
  const cleanup = async () => {
    deps.disposeCronResumeListener();
    await deps.stopBackend().catch((err) => deps.logError("[App] Failed to stop backend:", err));
    try {
      await deps.destroyPetWindow();
    } catch {
    }
  };
  await runWithTimeout(cleanup(), deps.timeoutMs ?? DEFAULT_QUIT_CLEANUP_TIMEOUT_MS, deps.logWarn);
}
function installQuitCleanup(deps) {
  let cleanupStarted = false;
  let cleanupCompleted = false;
  deps.onBeforeQuit((event) => {
    if (cleanupCompleted) {
      return;
    }
    event.preventDefault();
    if (cleanupStarted) {
      return;
    }
    cleanupStarted = true;
    void runQuitCleanup(deps).finally(() => {
      cleanupCompleted = true;
      deps.quitApp();
    });
  });
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const LOG_SUFFIXES = [".log", ".aioncore.log", ".aionrs.log"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;
const YEAR_DIR_PATTERN = /^\d{4}$/;
const MONTH_OR_DAY_DIR_PATTERN = /^\d{2}$/;
const DEFAULT_LOG_DAYS = 3;
function isFeedbackLogFileForDate(file2, date) {
  return LOG_SUFFIXES.some((suffix) => file2 === `${date}${suffix}`);
}
function normalizeLogDirs(logsDirs) {
  const dirs = Array.isArray(logsDirs) ? logsDirs : [logsDirs];
  const seen = /* @__PURE__ */ new Set();
  const normalizedDirs = [];
  for (const dir of dirs) {
    const normalizedDir = path__namespace$1.resolve(dir);
    if (!seen.has(normalizedDir)) {
      seen.add(normalizedDir);
      normalizedDirs.push(normalizedDir);
    }
  }
  return normalizedDirs;
}
function getRecentFeedbackLogPathsFromDirs(logsDirs, days = DEFAULT_LOG_DAYS) {
  const pathsByDate = /* @__PURE__ */ new Map();
  for (const logsDir of normalizeLogDirs(logsDirs)) {
    for (const candidate of collectFeedbackLogCandidates(logsDir)) {
      let paths = pathsByDate.get(candidate.date);
      if (!paths) {
        paths = /* @__PURE__ */ new Set();
        pathsByDate.set(candidate.date, paths);
      }
      paths.add(candidate.path);
    }
  }
  const recentDates = [...pathsByDate.keys()].toSorted().toReversed().slice(0, days);
  return recentDates.flatMap((dateStr) => [...pathsByDate.get(dateStr) ?? []].toSorted());
}
function collectFeedbackLogCandidates(logsDir) {
  const candidates = [];
  let yearsOrFiles;
  try {
    yearsOrFiles = fs__namespace$1.readdirSync(logsDir);
  } catch {
    return candidates;
  }
  for (const name2 of yearsOrFiles) {
    const fullPath = path__namespace$1.join(logsDir, name2);
    try {
      const stat = fs__namespace$1.statSync(fullPath);
      if (stat.isFile()) {
        const match = DATE_PATTERN.exec(name2);
        if (match && isFeedbackLogFileForDate(name2, match[0])) {
          candidates.push({ date: match[0], path: fullPath });
        }
        continue;
      }
      if (stat.isDirectory() && YEAR_DIR_PATTERN.test(name2)) {
        collectDatedLogCandidates(candidates, fullPath, name2);
      }
    } catch {
    }
  }
  return candidates;
}
function collectDatedLogCandidates(candidates, yearDir, year) {
  for (const month of readDirNames(yearDir)) {
    if (!MONTH_OR_DAY_DIR_PATTERN.test(month)) {
      continue;
    }
    const monthDir = path__namespace$1.join(yearDir, month);
    if (!isDirectory(monthDir)) {
      continue;
    }
    for (const day of readDirNames(monthDir)) {
      if (!MONTH_OR_DAY_DIR_PATTERN.test(day)) {
        continue;
      }
      const dayDir = path__namespace$1.join(monthDir, day);
      if (!isDirectory(dayDir)) {
        continue;
      }
      const date = `${year}-${month}-${day}`;
      for (const file2 of readDirNames(dayDir)) {
        const filePath = path__namespace$1.join(dayDir, file2);
        if (isFile(filePath) && isFeedbackLogFileForDate(file2, date)) {
          candidates.push({ date, path: filePath });
        }
      }
    }
  }
}
function readDirNames(dir) {
  try {
    return fs__namespace$1.readdirSync(dir);
  } catch {
    return [];
  }
}
function isDirectory(filePath) {
  try {
    return fs__namespace$1.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}
function isFile(filePath) {
  try {
    return fs__namespace$1.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
function getLogHeaderName(logPath, rootDir, showRelativePath) {
  const relativePath = path__namespace$1.relative(rootDir, logPath);
  if (!relativePath || relativePath.startsWith("..") || path__namespace$1.isAbsolute(relativePath)) {
    return path__namespace$1.basename(logPath);
  }
  return relativePath.split(path__namespace$1.sep).join("/");
}
function getRecentFeedbackLogPaths(logsDir, days = DEFAULT_LOG_DAYS) {
  const normalizedDir = normalizeLogDirs(logsDir)[0];
  return getRecentFeedbackLogPathsFromDirs([normalizedDir], days);
}
function collectFeedbackLogAttachment(logsDirs) {
  const normalizedDirs = normalizeLogDirs(logsDirs);
  const logPaths = normalizedDirs.length === 1 ? getRecentFeedbackLogPaths(normalizedDirs[0]) : getRecentFeedbackLogPathsFromDirs(normalizedDirs);
  if (logPaths.length === 0) {
    return null;
  }
  const parts = [];
  for (const logPath of logPaths) {
    const basename = getLogHeaderName(logPath, normalizedDirs[0]);
    const content = fs__namespace$1.readFileSync(logPath, "utf8");
    parts.push(`=== ${basename} ===
${content}
`);
  }
  return {
    filename: "logs.gz",
    data: zlib__namespace.gzipSync(Buffer.from(parts.join("\n"), "utf8")),
    contentType: "application/gzip"
  };
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function normalizeRendererFeedbackLogPayload(payload) {
  const level = payload.level === "warn" || payload.level === "error" ? payload.level : "info";
  const message = typeof payload.message === "string" && payload.message.trim() ? payload.message : "feedback log";
  return {
    level,
    message,
    details: payload.details
  };
}
require$$0$1.ipcMain.on("feedback:renderer-log", (_event, payload) => {
  const log2 = normalizeRendererFeedbackLogPayload(payload ?? {});
  const args2 = [`[FeedbackReport:renderer] ${log2.message}`];
  if (log2.details !== void 0) {
    args2.push(log2.details);
  }
  if (log2.level === "error") {
    console.error(...args2);
  } else if (log2.level === "warn") {
    console.warn(...args2);
  } else {
    console.info(...args2);
  }
});
require$$0$1.ipcMain.handle("feedback:collect-logs", async () => {
  try {
    let logsDir;
    try {
      logsDir = require$$0$1.app.getPath("logs");
    } catch {
      logsDir = path__namespace.join(require$$0$1.app.getPath("userData"), "logs");
    }
    const logDirs = [logsDir, path__namespace.join(logsDir, "logs")];
    const attachment = collectFeedbackLogAttachment(logDirs);
    if (!attachment) return null;
    return {
      filename: attachment.filename,
      data: Array.from(attachment.data)
    };
  } catch (error2) {
    console.error("[feedbackBridge] Failed to collect logs:", error2);
    return null;
  }
});
require$$0$1.ipcMain.handle("feedback:capture-screenshot", async (event) => {
  try {
    const win = require$$0$1.BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) {
      return null;
    }
    const image = await win.webContents.capturePage();
    const png = image.toPNG();
    if (!png || png.length === 0) {
      return null;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    return {
      filename: `screenshot-${timestamp}.png`,
      data: Array.from(png)
    };
  } catch (error2) {
    console.error("[feedbackBridge] Failed to capture screenshot:", error2);
    return null;
  }
});
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
function setupApplicationMenu() {
  const isMac = process.platform === "darwin";
  const template = [];
  if (isMac) {
    template.push({
      label: require$$0$1.app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    });
  }
  template.push({
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      ...isMac ? [{ role: "pasteAndMatchStyle" }, { role: "delete" }, { role: "selectAll" }] : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]
    ]
  });
  template.push({
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" }
    ]
  });
  template.push({
    label: "Help",
    submenu: [
      {
        label: "Check for Updates...",
        click: () => {
        }
      }
    ]
  });
  const menu = require$$0$1.Menu.buildFromTemplate(template);
  require$$0$1.Menu.setApplicationMenu(menu);
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const USER_PATH_REGISTRY_KEY = "HKCU\\Environment";
const MACHINE_PATH_REGISTRY_KEY = "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment";
function buildEnvLookup(env2) {
  const lookup = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(env2)) {
    if (typeof value === "string") {
      lookup.set(key.toUpperCase(), value);
    }
  }
  return lookup;
}
function expandWindowsEnvVars(value, env2) {
  const lookup = buildEnvLookup(env2);
  return value.replace(/%([^%]+)%/g, (match, name2) => lookup.get(name2.toUpperCase()) ?? match);
}
function expandShellEnvVars(value, env2) {
  const lookup = buildEnvLookup(env2);
  return expandWindowsEnvVars(value, env2).replace(/\$(?:env:)?([A-Za-z_][A-Za-z0-9_]*)/g, (match, name2) => lookup.get(name2.toUpperCase()) ?? match).replace(
    /\$\{(?:env:)?([A-Za-z_][A-Za-z0-9_]*)\}/g,
    (match, name2) => lookup.get(name2.toUpperCase()) ?? match
  );
}
function splitWindowsPathEntries(value) {
  return value.split(";").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function dedupeWindowsPathEntries(entries) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const entry of entries) {
    const key = entry.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}
function splitProfilePathList(value) {
  const entries = [];
  let current = "";
  for (let index2 = 0; index2 < value.length; index2 += 1) {
    const char = value[index2];
    const previous = value[index2 - 1] ?? "";
    const next = value[index2 + 1] ?? "";
    const drivePrefixStart = value[index2 - 2] ?? "";
    const isWindowsDriveSeparator = char === ":" && /^[A-Za-z]$/.test(previous) && (next === "\\" || next === "/") && (index2 === 1 || drivePrefixStart === ";" || drivePrefixStart === ":" || /\s/.test(drivePrefixStart));
    if ((char === ";" || char === ":") && !isWindowsDriveSeparator) {
      entries.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  entries.push(current);
  return entries;
}
function normalizeProfilePathEntry(entry, env2) {
  const trimmed = entry.trim().replace(/^['"]|['"]$/g, "").trim();
  if (!trimmed || /^\$env:PATH$/i.test(trimmed) || /^\$PATH$/i.test(trimmed) || /^%PATH%$/i.test(trimmed)) {
    return null;
  }
  let expanded = expandShellEnvVars(trimmed, env2);
  const home = env2.USERPROFILE || env2.HOME;
  if (home && (expanded === "~" || expanded.startsWith("~/") || expanded.startsWith("~\\"))) {
    expanded = path$1.win32.join(home, expanded.slice(2));
  }
  const msysDrivePath = expanded.match(/^\/([A-Za-z])\/(.+)$/);
  if (msysDrivePath) {
    expanded = `${msysDrivePath[1].toUpperCase()}:\\${msysDrivePath[2].replace(/\//g, "\\")}`;
  } else if (/^[A-Za-z]:[\\/]/.test(expanded)) {
    expanded = expanded.replace(/\//g, "\\");
  }
  return /^[A-Za-z]:\\/.test(expanded) ? expanded.replace(/[\\/]+$/, "") : null;
}
function parseWindowsRegistryPathOutput(output, env2) {
  const pathLine = output.split(/\r?\n/).map((line) => line.trim()).find((line) => /^Path\s+REG_\w+\s+/i.test(line));
  if (!pathLine) return [];
  const value = pathLine.replace(/^Path\s+REG_\w+\s+/i, "");
  return dedupeWindowsPathEntries(splitWindowsPathEntries(expandWindowsEnvVars(value, env2)));
}
function parseWindowsProfilePathEntries(content, env2) {
  const entries = [];
  const stringLiteralPattern = /(['"])([^'"\r\n]+)\1/g;
  for (const line of content.split(/\r?\n/)) {
    if (!/\bPATH\b|\$env:Path|%PATH%|\$PATH/i.test(line)) continue;
    let match;
    while ((match = stringLiteralPattern.exec(line)) !== null) {
      const expandedLiteral = expandShellEnvVars(match[2].replace(/\$env:PATH|%PATH%|\$PATH/gi, ""), env2);
      for (const part of splitProfilePathList(expandedLiteral)) {
        const normalized = normalizeProfilePathEntry(part, env2);
        if (normalized) entries.push(normalized);
      }
    }
  }
  return dedupeWindowsPathEntries(entries);
}
function buildWindowsHydratedPath(options) {
  const machinePaths = parseWindowsRegistryPathOutput(options.machineRegistryOutput, options.env);
  const userPaths = parseWindowsRegistryPathOutput(options.userRegistryOutput, options.env);
  const profilePaths = dedupeWindowsPathEntries(
    (options.profileContents ?? []).flatMap((content) => parseWindowsProfilePathEntries(content, options.env))
  );
  const fallbackPaths = dedupeWindowsPathEntries(options.fallbackPathEntries ?? []);
  const currentPaths = splitWindowsPathEntries(options.currentPath);
  return dedupeWindowsPathEntries([
    ...machinePaths,
    ...userPaths,
    ...profilePaths,
    ...fallbackPaths,
    ...currentPaths
  ]).join(";");
}
function readWindowsRegistryPath(registryKey, execFileSyncImpl = node_child_process.execFileSync) {
  try {
    return execFileSyncImpl("reg", ["query", registryKey, "/v", "Path"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true
    });
  } catch {
    return "";
  }
}
function getCurrentWindowsPath(env2) {
  return env2.PATH || env2.Path || "";
}
function setCurrentWindowsPath(env2, value) {
  env2.PATH = value;
  env2.Path = value;
}
function isExistingDirectory(directoryPath) {
  try {
    return fs$2.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}
function readTextFileIfPresent(filePath) {
  try {
    if (!fs$2.existsSync(filePath)) return "";
    return fs$2.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}
function getWindowsProfileFilePaths(env2) {
  const userProfile = env2.USERPROFILE || env2.HOME;
  if (!userProfile) return [];
  const documents = path$1.win32.join(userProfile, "Documents");
  return [
    path$1.win32.join(documents, "PowerShell", "Microsoft.PowerShell_profile.ps1"),
    path$1.win32.join(documents, "PowerShell", "profile.ps1"),
    path$1.win32.join(documents, "WindowsPowerShell", "Microsoft.PowerShell_profile.ps1"),
    path$1.win32.join(documents, "WindowsPowerShell", "profile.ps1"),
    path$1.win32.join(userProfile, ".bashrc"),
    path$1.win32.join(userProfile, ".bash_profile"),
    path$1.win32.join(userProfile, ".profile"),
    path$1.win32.join(userProfile, ".zshrc")
  ];
}
function readWindowsProfileContents(env2) {
  return getWindowsProfileFilePaths(env2).map(readTextFileIfPresent).filter((content) => content.length > 0);
}
function getExistingWindowsFallbackPathEntries(env2) {
  const userProfile = env2.USERPROFILE || env2.HOME || "";
  const appData = env2.APPDATA || (userProfile ? path$1.win32.join(userProfile, "AppData", "Roaming") : "");
  const localAppData = env2.LOCALAPPDATA || (userProfile ? path$1.win32.join(userProfile, "AppData", "Local") : "");
  const scoop = env2.SCOOP || (userProfile ? path$1.win32.join(userProfile, "scoop") : "");
  const scoopGlobal = env2.SCOOP_GLOBAL || "C:\\ProgramData\\scoop";
  const candidates = [
    scoop && path$1.win32.join(scoop, "shims"),
    path$1.win32.join(scoopGlobal, "shims"),
    "C:\\Scoop\\shims",
    "D:\\Scoop\\shims",
    appData && path$1.win32.join(appData, "npm"),
    localAppData && path$1.win32.join(localAppData, "Microsoft", "WindowsApps"),
    userProfile && path$1.win32.join(userProfile, ".bun", "bin"),
    userProfile && path$1.win32.join(userProfile, ".cargo", "bin"),
    userProfile && path$1.win32.join(userProfile, ".local", "bin")
  ].filter((candidate) => Boolean(candidate));
  return dedupeWindowsPathEntries(candidates.filter(isExistingDirectory));
}
function hydrateWindowsProcessPath(env2 = process.env) {
  const hydratedPath = buildWindowsHydratedPath({
    currentPath: getCurrentWindowsPath(env2),
    userRegistryOutput: readWindowsRegistryPath(USER_PATH_REGISTRY_KEY),
    machineRegistryOutput: readWindowsRegistryPath(MACHINE_PATH_REGISTRY_KEY),
    profileContents: readWindowsProfileContents(env2),
    fallbackPathEntries: getExistingWindowsFallbackPathEntries(env2),
    env: env2
  });
  if (hydratedPath.length > 0) {
    setCurrentWindowsPath(env2, hydratedPath);
  }
  return getCurrentWindowsPath(env2);
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const WINDOWS_APP_USER_MODEL_ID = "com.ubidbuddy.app";
function registerWindowsAppUserModelId(options) {
  const { app, platform = process.platform, execPath = process.execPath } = options;
  if (platform !== "win32") {
    return;
  }
  app.setAppUserModelId(app.isPackaged ? WINDOWS_APP_USER_MODEL_ID : execPath);
}
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main-window bounds persistence: restore the last-known size and position
 * when the app re-opens, and write back the user's adjustments as they
 * resize or move the window.
 *
 * Mirrors the shape of process/utils/zoom.ts so there is one
 * load-at-startup + attach-per-window pattern per persisted window property.
 */
const MIN_WINDOW_WIDTH = 400;
const MIN_WINDOW_HEIGHT = 600;
const DEFAULT_WIDTH_RATIO = 0.8;
const DEFAULT_HEIGHT_RATIO = 0.95;
const PERSIST_DEBOUNCE_MS = 300;
let cachedBounds;
const loadSavedWindowBounds = (saved) => {
  cachedBounds = saved;
};
const resolveInitialBounds = () => {
  const primary = require$$0$1.screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primary.workAreaSize;
  const defaults = {
    width: Math.floor(screenWidth * DEFAULT_WIDTH_RATIO),
    height: Math.floor(screenHeight * DEFAULT_HEIGHT_RATIO)
  };
  if (!cachedBounds) return defaults;
  if (cachedBounds.width < MIN_WINDOW_WIDTH || cachedBounds.height < MIN_WINDOW_HEIGHT) return defaults;
  if (!boundsOverlapAnyDisplay(cachedBounds)) return defaults;
  return cachedBounds;
};
const boundsOverlapAnyDisplay = (bounds) => {
  if (bounds.x === void 0 || bounds.y === void 0) return true;
  const x1 = bounds.x;
  const y1 = bounds.y;
  const x2 = bounds.x + bounds.width;
  const y2 = bounds.y + bounds.height;
  return require$$0$1.screen.getAllDisplays().some((d) => {
    const wa = d.workArea;
    const ox1 = wa.x;
    const oy1 = wa.y;
    const ox2 = wa.x + wa.width;
    const oy2 = wa.y + wa.height;
    return x1 < ox2 && x2 > ox1 && y1 < oy2 && y2 > oy1;
  });
};
const attachWindowBoundsPersistence = (win, persist) => {
  let saveTimer = null;
  const fireWrite = (bounds) => {
    cachedBounds = bounds;
    const op = Promise.resolve(persist(bounds)).catch((error2) => {
      console.error("[uBidBuddy] Failed to persist window bounds:", error2);
    });
    trackPersistedWrite(op);
  };
  const saveNow = () => {
    if (win.isDestroyed()) return;
    if (win.isMaximized() || win.isFullScreen() || win.isMinimized()) return;
    fireWrite(win.getNormalBounds());
  };
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, PERSIST_DEBOUNCE_MS);
  };
  win.on("resize", scheduleSave);
  win.on("move", scheduleSave);
  win.on("close", () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    saveNow();
  });
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const PROTOCOL_SCHEME = "ubidbuddy";
const parseDeepLinkUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${PROTOCOL_SCHEME}:`) return null;
    const hostname = parsed.hostname || "";
    const pathname = parsed.pathname.replace(/^\/+/, "");
    const action = pathname ? `${hostname}/${pathname}` : hostname;
    const params = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    if (params.data) {
      try {
        const json = JSON.parse(Buffer.from(params.data, "base64").toString("utf-8"));
        if (json && typeof json === "object") {
          Object.assign(params, json);
        }
      } catch {
      }
      delete params.data;
    }
    return { action, params };
  } catch {
    return null;
  }
};
let mainWindowRef = null;
let pendingDeepLinkUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`)) || null;
const setDeepLinkMainWindow = (win) => {
  mainWindowRef = win;
};
const getPendingDeepLinkUrl = () => pendingDeepLinkUrl;
const clearPendingDeepLinkUrl = () => {
  pendingDeepLinkUrl = null;
};
const handleDeepLinkUrl = (url) => {
  const parsed = parseDeepLinkUrl(url);
  if (!parsed) return;
  if (!mainWindowRef || mainWindowRef.isDestroyed()) {
    pendingDeepLinkUrl = url;
    return;
  }
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 */
const bindMainWindowReferences = (window2) => {
  setTrayMainWindow(window2);
  setDeepLinkMainWindow(window2);
};
const showAndFocusMainWindow = (window2) => {
  if (window2.isMinimized()) {
    window2.restore();
  }
  window2.show();
  window2.focus();
};
const showOrCreateMainWindow = ({
  mainWindow: mainWindow2,
  createWindow: createWindow2
}) => {
  if (mainWindow2 && !mainWindow2.isDestroyed()) {
    showAndFocusMainWindow(mainWindow2);
    return;
  }
  createWindow2();
};
/**
 * @license
 * Copyright 2025 uBidBuddy
 * SPDX-License-Identifier: Apache-2.0
 *
 * Electron main process entry for ubidbuddy-frontend's desktop shell.
 *
 * This is a trimmed port of uBidBuddy's own `packages/desktop/src/index.ts`:
 * window/tray/menu/zoom/bounds, deep links, single-instance lock, auto-update,
 * native dialogs, notifications, theme sync, feedback, and the desktop-pet
 * overlay are all kept. Everything about spawning/managing the aioncore
 * backend subprocess (BackendLifecycleManager, binaryResolver, backend
 * migrations/admin-user bootstrap, the CDP-bridge-for-agent-browser wiring,
 * reset-password CLI mode) and the webui-LAN-sharing bridge (which only makes
 * sense once an aioncore instance is already running) have been removed.
 * Crash reporting (Sentry) was dropped too — see ubidbuddy-frontend's port plan.
 */
const isE2ETestMode = process.env.UBIDBUDDY_E2E_TEST === "1";
const skipSingleInstanceLock = isE2ETestMode || process.env.UBIDBUDDY_MULTI_INSTANCE === "1";
const deepLinkFromArgv = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
const gotTheLock = skipSingleInstanceLock ? true : require$$0$1.app.requestSingleInstanceLock({ deepLinkUrl: deepLinkFromArgv });
if (!gotTheLock) {
  console.warn("[uBidBuddy] Another instance is already running; current process will exit.");
  require$$0$1.app.quit();
} else {
  require$$0$1.app.on("second-instance", (_event, argv, _workingDirectory, additionalData) => {
    const deepLinkUrl = additionalData?.deepLinkUrl || argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
    if (deepLinkUrl) {
      handleDeepLinkUrl(deepLinkUrl);
    }
    if (!appReadyDone) return;
    if (require$$0$1.app.isReady()) {
      showOrCreateMainWindow({
        mainWindow,
        createWindow: () => {
          console.log("[uBidBuddy] second-instance received with no active main window, recreating main window");
          createWindow();
        }
      });
    }
  });
}
if (process.platform === "darwin" || process.platform === "linux") {
  fixPath();
  const nvmDir = process.env.NVM_DIR || path__namespace.join(process.env.HOME || "", ".nvm");
  const nvmVersionsDir = path__namespace.join(nvmDir, "versions", "node");
  if (fs__namespace.existsSync(nvmVersionsDir)) {
    try {
      const versions = fs__namespace.readdirSync(nvmVersionsDir);
      const nvmPaths = versions.map((v) => path__namespace.join(nvmVersionsDir, v, "bin")).filter((p) => fs__namespace.existsSync(p));
      if (nvmPaths.length > 0) {
        const currentPath = process.env.PATH || "";
        const missingPaths = nvmPaths.filter((p) => !currentPath.includes(p));
        if (missingPaths.length > 0) {
          process.env.PATH = [...missingPaths, currentPath].join(path__namespace.delimiter);
        }
      }
    } catch {
    }
  }
} else if (process.platform === "win32") {
  hydrateWindowsProcessPath();
  registerWindowsAppUserModelId({ app: require$$0$1.app });
}
if (electronSquirrelStartup) {
  require$$0$1.app.quit();
}
process.on("uncaughtException", (error2, origin) => {
  logUncaught(describeUncaughtError(error2, origin));
});
process.on("unhandledRejection", (reason, _promise) => {
  logUncaught(describeUncaughtError(reason, "unhandledRejection"));
});
function logUncaught(diagnostics) {
  try {
    console.error(`[uBidBuddy] ${diagnostics.origin}:`, diagnostics);
  } catch {
  }
}
const hasCommand = (cmd) => process.argv.includes(cmd);
const isVersionMode = hasCommand("--version") || hasCommand("-v");
let appReadyDone = false;
let mainWindow;
require$$0$1.ipcMain.on("get-backend-port", (event) => {
  event.returnValue = Number(process.env.UBIDBUDDY_BACKEND_PORT) || 0;
});
require$$0$1.ipcMain.on("get-backend-startup-failed", (event) => {
  event.returnValue = false;
});
require$$0$1.ipcMain.on("get-backend-startup-failure", (event) => {
  event.returnValue = null;
});
let rendererInitialLanguage = null;
require$$0$1.ipcMain.on("get-initial-language", (event) => {
  event.returnValue = rendererInitialLanguage;
});
const createWindow = ({ showOnReady = true } = {}) => {
  console.log("[uBidBuddy] Creating main window...");
  const { x: windowX, y: windowY, width: windowWidth, height: windowHeight } = resolveInitialBounds();
  let devIcon;
  if (!require$$0$1.app.isPackaged) {
    try {
      const iconFile = process.platform === "win32" ? "app.ico" : "app_dev.png";
      const iconPath = path__namespace.join(process.cwd(), "resources", iconFile);
      if (fs__namespace.existsSync(iconPath)) {
        devIcon = require$$0$1.nativeImage.createFromPath(iconPath);
        if (devIcon.isEmpty()) devIcon = void 0;
      }
    } catch {
    }
  }
  mainWindow = new require$$0$1.BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    ...windowX !== void 0 && windowY !== void 0 ? { x: windowX, y: windowY } : {},
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    show: false,
    // Hide until CSS is loaded to prevent FOUC
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    // Set icon for Windows/Linux in development mode
    ...devIcon && process.platform !== "darwin" ? { icon: devIcon } : {},
    // Custom titlebar configuration / 自定义标题栏配置
    ...process.platform === "darwin" ? {
      titleBarStyle: "hidden",
      trafficLightPosition: { x: 10, y: 13 }
    } : { frame: false },
    webPreferences: {
      preload: path__namespace.join(__dirname, "../preload/main.cjs"),
      webviewTag: true
      // 启用 webview 标签用于 HTML 预览 / Enable webview tag for HTML preview
    }
  });
  console.log(`[uBidBuddy] Main window created (id=${mainWindow.id})`);
  if (showOnReady) {
    const showWindow = () => {
      if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        console.log("[uBidBuddy] Showing main window");
        mainWindow.show();
        mainWindow.focus();
      }
    };
    mainWindow.once("ready-to-show", () => {
      console.log("[uBidBuddy] Window ready-to-show");
      showWindow();
    });
    mainWindow.webContents.once("did-finish-load", () => {
      console.log("[uBidBuddy] Renderer did-finish-load");
      showWindow();
    });
    setTimeout(showWindow, 5e3);
  } else if (process.platform === "darwin" && require$$0$1.app.dock) {
    void require$$0$1.app.dock.hide();
  }
  initMainAdapterWithWindow(mainWindow);
  bindMainWindowReferences(mainWindow);
  setupApplicationMenu();
  setupZoomForWindow(mainWindow);
  registerWindowMaximizeListeners(mainWindow);
  attachWindowBoundsPersistence(mainWindow, (bounds) => ProcessConfig.set("window.bounds", bounds));
  console.log("[uBidBuddy] Auto-updater disabled (no update feed configured)");
  const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
  const fallbackFile = path__namespace.join(__dirname, "../renderer/index.html");
  if (!require$$0$1.app.isPackaged && rendererUrl) {
    console.log(`[uBidBuddy] Loading renderer URL: ${rendererUrl}`);
    mainWindow.loadURL(rendererUrl).catch((error2) => {
      console.error("[uBidBuddy] loadURL failed, falling back to file:", error2.message || error2);
      mainWindow.loadFile(fallbackFile).catch((e2) => {
        console.error("[uBidBuddy] loadFile fallback also failed:", e2.message || e2);
      });
    });
  } else {
    console.log(`[uBidBuddy] Loading renderer file: ${fallbackFile}`);
    mainWindow.loadFile(fallbackFile).catch((error2) => {
      console.error("[uBidBuddy] loadFile failed:", error2.message || error2);
    });
  }
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error("[uBidBuddy] did-fail-load:", { errorCode, errorDescription, validatedURL, isMainFrame });
  });
  const rendererRecovery = createRendererRecoveryPolicy();
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[uBidBuddy] render-process-gone:", details);
    if (mainWindow.isDestroyed()) return;
    const action = rendererRecovery.onCrash(details.reason);
    if (action.kind === "relaunch") {
      console.warn(`[uBidBuddy] renderer cannot be recovered in-place (reason=${details.reason}); relaunching app`);
      require$$0$1.app.relaunch();
      require$$0$1.app.exit(0);
      return;
    }
    if (action.kind === "give-up") {
      console.error(`[uBidBuddy] renderer recovery exhausted (reason=${details.reason}); not retrying`);
      return;
    }
    const reload2 = () => {
      if (mainWindow.isDestroyed()) return;
      console.log("[uBidBuddy] Attempting to recover from renderer crash by reloading...");
      if (!require$$0$1.app.isPackaged && rendererUrl) {
        mainWindow.loadURL(rendererUrl).catch((error2) => {
          console.error("[uBidBuddy] Recovery loadURL failed:", error2.message || error2);
        });
      } else {
        mainWindow.loadFile(fallbackFile).catch((error2) => {
          console.error("[uBidBuddy] Recovery loadFile failed:", error2.message || error2);
        });
      }
    };
    if (action.delayMs === 0) {
      reload2();
    } else {
      setTimeout(reload2, action.delayMs);
    }
  });
  mainWindow.webContents.on("unresponsive", () => {
    console.warn("[uBidBuddy] Renderer became unresponsive");
  });
  mainWindow.on("closed", () => {
    console.log("[uBidBuddy] Main window closed");
  });
  mainWindow.webContents.on("devtools-opened", () => {
  });
  mainWindow.webContents.on("devtools-closed", () => {
  });
  mainWindow.on("close", (event) => {
    if (mainWindow.isDestroyed()) return;
    if (getCloseToTrayEnabled() && !getIsQuitting()) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};
const handleAppReady = async () => {
  const t0 = performance.now();
  const mark = (label) => console.log(`[uBidBuddy:ready] ${label} +${Math.round(performance.now() - t0)}ms`);
  mark("start");
  if (!require$$0$1.app.isPackaged) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await Promise.resolve().then(() => require("./chunks/index-CvX6r-zd.cjs")).then((n) => n.index);
      await installExtension(REACT_DEVELOPER_TOOLS);
      console.log("[DevTools] React Developer Tools installed");
    } catch (e) {
      console.warn("[DevTools] Failed to install React DevTools:", e);
    }
  }
  if (isVersionMode) {
    console.log(require$$0$1.app.getVersion());
    require$$0$1.app.exit(0);
    return;
  }
  if (process.platform === "darwin" && !require$$0$1.app.isPackaged && require$$0$1.app.dock) {
    try {
      const iconPath = path__namespace.join(process.cwd(), "resources", "app_dev.png");
      if (fs__namespace.existsSync(iconPath)) {
        const icon = require$$0$1.nativeImage.createFromPath(iconPath);
        if (!icon.isEmpty()) {
          require$$0$1.app.dock.setIcon(icon);
        }
      }
    } catch {
    }
  }
  require$$0$1.session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true);
  });
  try {
    await initializeProcess();
    rendererInitialLanguage = ProcessConfig.getSync("language") ?? null;
    mark("initializeProcess");
  } catch (error2) {
    console.error("Failed to initialize process:", error2);
    require$$0$1.app.exit(1);
    return;
  }
  try {
    initializeZoomFactor(await ProcessConfig.get("ui.zoomFactor"));
    mark("initializeZoomFactor");
  } catch (error2) {
    console.error("[uBidBuddy] Failed to restore zoom factor:", error2);
    initializeZoomFactor(void 0);
  }
  try {
    loadSavedWindowBounds(await ProcessConfig.get("window.bounds"));
    mark("restoreWindowBounds");
  } catch (error2) {
    console.error("[uBidBuddy] Failed to restore window bounds:", error2);
    loadSavedWindowBounds(void 0);
  }
  if (isE2ETestMode) {
    setCloseToTrayEnabled(false);
    destroyTray();
  } else {
    try {
      const savedCloseToTray = await readCloseToTraySetting();
      setCloseToTrayEnabled(savedCloseToTray);
      if (getCloseToTrayEnabled()) {
        createOrUpdateTray();
      }
    } catch {
    }
  }
  const showMainWindowOnReady = !(wasLaunchedAtLogin() && getCloseToTrayEnabled());
  createWindow({ showOnReady: showMainWindowOnReady });
  appReadyDone = true;
  mark("createWindow");
  setTimeout(() => {
    void (async () => {
      try {
        const petEnabled = await ProcessConfig.get("pet.enabled");
        if (petEnabled === true) {
          const confirmEnabled = await ProcessConfig.get("pet.confirmEnabled") ?? true;
          const { createPetWindow, setPetConfirmEnabled } = await Promise.resolve().then(() => require("./chunks/petManager-B86Slr6G.cjs"));
          setPetConfirmEnabled(confirmEnabled);
          createPetWindow();
        }
      } catch (error2) {
        console.error("[Pet] Failed to initialize:", error2);
      }
    })();
  }, 3e3);
  try {
    const savedLanguage = await ProcessConfig.get("language");
    await setInitialLanguage(savedLanguage);
    await refreshTrayMenu();
  } catch (error2) {
    console.error("[index] Failed to initialize i18n language:", error2);
  }
  const pendingUrl = getPendingDeepLinkUrl();
  if (pendingUrl) {
    clearPendingDeepLinkUrl();
    mainWindow.webContents.once("did-finish-load", () => {
      handleDeepLinkUrl(pendingUrl);
    });
  }
};
if (process.defaultApp) {
  require$$0$1.app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [path__namespace.resolve(process.argv[1])]);
} else {
  require$$0$1.app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
}
require$$0$1.app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLinkUrl(url);
  if (!require$$0$1.app.isReady()) {
    return;
  }
  showOrCreateMainWindow({ mainWindow, createWindow });
});
installGpuCrashHandler();
if (gotTheLock) {
  void require$$0$1.app.whenReady().then(handleAppReady).catch((error2) => {
    console.error("[uBidBuddy] App initialization failed:", error2);
    require$$0$1.app.quit();
  });
}
require$$0$1.app.on("window-all-closed", () => {
  if (getCloseToTrayEnabled()) {
    return;
  }
  if (process.platform !== "darwin") {
    require$$0$1.app.quit();
  }
});
require$$0$1.app.on("activate", () => {
  if (!appReadyDone) return;
  if (require$$0$1.app.isReady()) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      showAndFocusMainWindow(mainWindow);
      if (process.platform === "darwin" && require$$0$1.app.dock) {
        void require$$0$1.app.dock.show();
      }
    } else {
      createWindow();
    }
  }
});
installQuitCleanup({
  onBeforeQuit: (handler) => require$$0$1.app.on("before-quit", (event) => handler(event)),
  quitApp: () => require$$0$1.app.quit(),
  setIsQuitting,
  markExplicitQuit: () => {
  },
  destroyTray,
  disposeCronResumeListener: () => {
  },
  stopBackend: () => Promise.resolve(),
  destroyPetWindow: async () => {
    const { destroyPetWindow } = await Promise.resolve().then(() => require("./chunks/petManager-B86Slr6G.cjs"));
    destroyPetWindow();
  },
  logInfo: console.log,
  logWarn: console.warn,
  logError: console.error
});
require$$0$1.app.on("will-quit", () => {
  console.log("[uBidBuddy] will-quit — all cleanup should be complete");
});
require$$0$1.app.on("quit", (_event, exitCode) => {
  console.log(`[uBidBuddy] quit (exitCode=${exitCode})`);
});
exports.commonjsGlobal = commonjsGlobal;
exports.conversation = conversation;
exports.getDefaultExportFromCjs = getDefaultExportFromCjs;
exports.setPetNotifyHook = setPetNotifyHook;
