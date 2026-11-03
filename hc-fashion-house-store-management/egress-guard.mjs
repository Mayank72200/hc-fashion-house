// HC Fashion House - egress guard for the local server process.
//
// server.js imports this file as its very first statement, so the guard is in
// place before Express or anything else loads. The app only ever talks to this
// PC, so the guard allows loopback (127.0.0.0/8, ::1, ::ffff:127.x.x.x and the
// name "localhost") and local named pipes, and refuses every other way out:
//   - TCP and TLS sockets, which also carry http, https and fetch
//     (net.Socket.prototype.connect), and UDP (dgram);
//   - DNS: dns.lookup of any name except "localhost", and every resolve*() or
//     reverse() query, because those always ask a DNS server;
//   - fetch(): a non-loopback http(s) URL is rejected before any connection;
//   - child processes: only powershell.exe running one of the Control Panel
//     scripts, (backup|restore|move|stop)-windows.ps1, from this folder (or from
//     release-templates/_system-scripts in a source checkout), and explorer.exe
//     opening one existing local folder. Anything else throws.
// A refused call fails as if the network were unreachable (error code
// EEGRESSBLOCKED) and appends one JSON line (ts, kind, target, mode, pid,
// stack) to <APP_HOME>\logs\egress-guard.log. APP_HOME is HCFH_HOME when that
// is set, otherwise this folder. Any line in that log means a code path still
// tries to go online: treat it as a defect.
//
// Log-only mode, for a diagnosis session only: start the server with
// HCFH_EGRESS=log (Command Prompt: set HCFH_EGRESS=log, PowerShell:
// $env:HCFH_EGRESS = 'log'). The same events are logged but the calls go
// through. Any other value, or none, blocks.
//
// To check it by hand, preload it (node --import ./egress-guard.mjs -e "...")
// and fetch any outside address: the call fails with EEGRESSBLOCKED and one
// line is logged. No dependencies; Node 18 or later.

import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import dgram from 'node:dgram';
import dns from 'node:dns';
import childProcess from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { syncBuiltinESMExports } from 'node:module';

const STATE_KEY = Symbol.for('hcfh.egress-guard');
const GUARD_URL = import.meta.url;
const GUARD_DIR = path.dirname(fileURLToPath(GUARD_URL));
const APP_HOME = process.env.HCFH_HOME ? path.resolve(process.env.HCFH_HOME) : GUARD_DIR;
const LOG_DIR = path.join(APP_HOME, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'egress-guard.log');
const LOG_MAX_BYTES = 1024 * 1024; // then it is renamed to egress-guard.log.1
const NOTICE_LIMIT = 50;           // console notices; the log keeps every event
const MODE = String(process.env.HCFH_EGRESS || '').trim().toLowerCase() === 'log' ? 'log' : 'block';
const IS_WINDOWS = process.platform === 'win32';

const WEB_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:']);
const BLOCKED_HOST = 'egress-blocked.invalid';
const kLookupWatched = Symbol('hcfh.lookupWatched');

const CONTROL_SCRIPT = /^(?:backup|restore|move|stop)-windows\.ps1$/i;
const PS_SWITCHES = new Set(['noprofile', 'noninteractive', 'nologo', 'sta', 'mta']);
const PS_SWITCHES_WITH_VALUE = new Set(['executionpolicy', 'windowstyle']);
const SYSTEM_ROOT = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
const SYSTEM_PROGRAMS = {
  powershell: ['System32', 'SysWOW64', 'Sysnative']
    .map((dir) => path.win32.join(SYSTEM_ROOT, dir, 'WindowsPowerShell', 'v1.0', 'powershell.exe')),
  explorer: [path.win32.join(SYSTEM_ROOT, 'explorer.exe'), path.win32.join(SYSTEM_ROOT, 'SysWOW64', 'explorer.exe')],
};

let state = globalThis[STATE_KEY];
let notices = 0;

// ---- what counts as this PC -------------------------------------------------

const stripBrackets = (host) => (host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host);

// The eight 16-bit groups of a valid IPv6 address (zone dropped, a dotted
// IPv4 tail folded into the last two groups).
function ipv6Groups(ip) {
  let s = ip.split('%')[0];
  const lastColon = s.lastIndexOf(':');
  const tail = s.slice(lastColon + 1);
  if (tail.includes('.')) {
    const o = tail.split('.').map(Number);
    s = `${s.slice(0, lastColon + 1)}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const [head, rest] = s.split('::');
  const left = head ? head.split(':') : [];
  const right = rest ? rest.split(':') : [];
  const groups = rest === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right];
  return groups.map((g) => parseInt(g, 16));
}

function isLoopbackIp(value) {
  const ip = stripBrackets(String(value ?? '').trim().toLowerCase());
  const family = net.isIP(ip);
  if (family === 4) return ip.startsWith('127.');
  if (family !== 6) return false;
  const g = ipv6Groups(ip);
  const zeros = (n) => g.slice(0, n).every((x) => x === 0);
  return (zeros(7) && g[7] === 1) || (zeros(5) && g[5] === 0xffff && g[6] >> 8 === 127);
}

const isLocalhostName = (value) => /^localhost\.?$/i.test(String(value ?? '').trim());
const isLoopbackHost = (value) => isLocalhostName(value) || isLoopbackIp(value);

// Named pipes on this PC (\\.\pipe\...) and Unix socket files are local;
// \\server\pipe\... would cross the network.
function isLocalPipe(pipePath) {
  if (!IS_WINDOWS) return true;
  const s = String(pipePath).replace(/\//g, '\\');
  return /^\\\\[.?]\\pipe\\/i.test(s) || !s.startsWith('\\\\');
}

// ---- event log -----------------------------------------------------------------

const clip = (text, max = 300) => (text.length > max ? `${text.slice(0, max)}...` : text);

function shortStack() {
  const holder = {};
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 30;
  Error.captureStackTrace(holder, shortStack);
  Error.stackTraceLimit = limit;
  return String(holder.stack || '').split('\n').slice(1)
    .map((line) => line.trim())
    .filter((line) => line && !line.includes(GUARD_URL))
    .slice(0, 8);
}

function writeLog(event) {
  try {
    // A missing HCFH_HOME is never created here: an empty data home must not
    // appear by accident.
    if (!fs.existsSync(APP_HOME)) return false;
    fs.mkdirSync(LOG_DIR, { recursive: true });
    try {
      if (fs.statSync(LOG_FILE).size > LOG_MAX_BYTES) fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    } catch { /* no log yet */ }
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(event)}\n`);
    return true;
  } catch {
    return false; // a log that cannot be written must not stop the guard
  }
}

function notify(event, logged) {
  notices += 1;
  if (notices > NOTICE_LIMIT) return;
  const outcome = event.mode === 'block' ? 'blocked' : 'allowed (HCFH_EGRESS=log)';
  const where = logged ? `logged to ${LOG_FILE}` : 'log not writable';
  const more = notices === NOTICE_LIMIT ? ' Further notices go to the log only.' : '';
  try {
    process.stderr.write(`[egress-guard] ${outcome} ${event.kind} ${event.target} (${where}).${more}\n`);
  } catch { /* no console */ }
}

// Records one outbound attempt. Returns the error to fail it with, or null in
// log-only mode.
function report(kind, target) {
  state.events += 1;
  const event = { ts: new Date().toISOString(), kind, target: clip(String(target)), mode: state.mode, pid: process.pid, stack: shortStack() };
  notify(event, writeLog(event));
  if (state.mode !== 'block') return null;
  state.blocked += 1;
  const err = new Error(`Outbound access blocked by the HC Fashion House egress guard (${kind} ${event.target}).`);
  err.code = 'EEGRESSBLOCKED';
  return err;
}

// ---- sockets: net, tls, http, https and fetch; UDP -----------------------------

// The argument shapes net.Socket#connect accepts. net.connect() and
// tls.connect() pass an already normalised [options, callback] pair.
function connectArgs(args) {
  if (Array.isArray(args[0])) return { options: args[0][0] || {}, callback: args[0][1] || null };
  const last = args[args.length - 1];
  const callback = typeof last === 'function' ? last : null;
  if (args[0] !== null && typeof args[0] === 'object') return { options: args[0], callback };
  if (typeof args[0] === 'string' && !(Number(args[0]) >= 0)) return { options: { path: args[0] }, callback };
  return { options: { port: args[0], host: typeof args[1] === 'string' ? args[1] : undefined }, callback };
}

// "localhost" is resolved by the system: make sure it really lands on this PC.
function watchLookup(socket, host) {
  if (socket[kLookupWatched]) return;
  socket[kLookupWatched] = true;
  socket.on('lookup', (err, address) => {
    if (err || !address || isLoopbackIp(address)) return;
    const blocked = report('net', `${host} -> ${address}`);
    if (blocked && !socket.destroyed) socket.destroy(blocked);
  });
}

function guardSockets() {
  const connect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function guardedConnect(...args) {
    const { options, callback } = connectArgs(args);
    let target;
    let allowed;
    if (options.path) {
      target = String(options.path);
      allowed = isLocalPipe(target);
    } else {
      const host = options.host ? String(options.host) : 'localhost';
      target = `${host}:${options.port}`;
      allowed = isLoopbackHost(host);
      if (allowed && !net.isIP(host)) watchLookup(this, host);
    }
    if (allowed) return Reflect.apply(connect, this, args);
    const err = report('net', target);
    if (!err) return Reflect.apply(connect, this, args);
    // Fail the way an unknown host does: nothing is sent, and the socket
    // errors on a later tick, once the caller has attached its listeners.
    const lookup = (hostname, dnsOptions, done) => setImmediate(done, err);
    const blocked = { port: 9, host: BLOCKED_HOST, lookup };
    return Reflect.apply(connect, this, callback ? [blocked, callback] : [blocked]);
  };

  const { connect: udpConnect, send: udpSend } = dgram.Socket.prototype;
  const failUdp = (socket, err, callback) => setImmediate(() => (callback ? callback(err) : socket.emit('error', err)));
  dgram.Socket.prototype.connect = function guardedUdpConnect(port, address, callback) {
    const host = typeof address === 'string' ? address : '';
    if (!host || isLoopbackHost(host)) return Reflect.apply(udpConnect, this, arguments);
    const err = report('udp', `${host}:${port}`);
    if (!err) return Reflect.apply(udpConnect, this, arguments);
    failUdp(this, err, typeof callback === 'function' ? callback : null);
    return undefined;
  };
  dgram.Socket.prototype.send = function guardedUdpSend(...args) {
    let connected = true;
    try {
      this.remoteAddress();
    } catch {
      connected = false;
    }
    if (!connected) {
      // Read the arguments as dgram does: (msg, offset, length, port, address,
      // cb) or (msg, port, address, cb). No address means loopback.
      let port = args[3];
      let address = args[4];
      if (!(address || (port && typeof port !== 'function'))) {
        port = args[1];
        address = args[2];
      }
      const host = typeof address === 'string' ? address : '';
      if (host && !isLoopbackHost(host)) {
        const err = report('udp', `${host}:${port}`);
        if (err) {
          const last = args[args.length - 1];
          failUdp(this, err, typeof last === 'function' ? last : null);
          return undefined;
        }
      }
    }
    return Reflect.apply(udpSend, this, args);
  };
}

// ---- DNS -----------------------------------------------------------------------

function copySymbols(from, to) {
  for (const key of Object.getOwnPropertySymbols(from)) {
    Object.defineProperty(to, key, Object.getOwnPropertyDescriptor(from, key));
  }
  return to;
}

// A refused DNS call: a rejected promise, or the callback on a later tick.
function refuseDns(err, syscall, hostname, promise, args) {
  Object.assign(err, { syscall, hostname: String(hostname) });
  if (promise) return Promise.reject(err);
  const callback = args[args.length - 1];
  if (typeof callback !== 'function') throw err;
  setImmediate(callback, err);
  return undefined;
}

function guardDns() {
  for (const [api, promise] of [[dns, false], [dns.promises, true]]) {
    const { lookup, lookupService } = api;
    // An IP address or "localhost" is answered on this PC; any other name
    // would go to a DNS server.
    api.lookup = copySymbols(lookup, function guardedLookup(...args) {
      const [hostname] = args;
      if (!hostname || net.isIP(String(hostname)) || isLocalhostName(hostname)) return Reflect.apply(lookup, this, args);
      const err = report('dns', `lookup ${hostname}`);
      return err ? refuseDns(err, 'getaddrinfo', hostname, promise, args) : Reflect.apply(lookup, this, args);
    });
    api.lookupService = copySymbols(lookupService, function guardedLookupService(...args) {
      if (isLoopbackIp(args[0])) return Reflect.apply(lookupService, this, args);
      const err = report('dns', `lookupService ${args[0]}`);
      return err ? refuseDns(err, 'getnameinfo', args[0], promise, args) : Reflect.apply(lookupService, this, args);
    });
    // resolve*() and reverse() always query a DNS server, whatever the name.
    for (const target of [api, api.Resolver.prototype]) {
      for (const name of Object.getOwnPropertyNames(target)) {
        if (!name.startsWith('resolve') && name !== 'reverse') continue;
        const query = target[name];
        if (typeof query !== 'function') continue;
        target[name] = copySymbols(query, function guardedQuery(...args) {
          const err = report('dns', `${name} ${args[0]}`);
          return err ? refuseDns(err, name, args[0], promise, args) : Reflect.apply(query, this, args);
        });
      }
    }
  }
}

// ---- fetch ---------------------------------------------------------------------

function requestUrl(input) {
  try {
    if (input instanceof URL) return input;
    if (input !== null && typeof input === 'object' && typeof input.url === 'string') return new URL(input.url);
    return new URL(String(input));
  } catch {
    return null; // fetch itself reports a malformed URL
  }
}

function guardFetch() {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const original = globalThis.fetch; // reading it also loads a lazily defined fetch
  if (!descriptor || typeof original !== 'function') return;
  const guardedFetch = function fetch(input) {
    const url = requestUrl(input);
    if (url && WEB_PROTOCOLS.has(url.protocol) && !isLoopbackHost(url.hostname)) {
      // Origin and path only: a query string can carry tokens.
      const err = report('fetch', `${url.protocol}//${url.host}${url.pathname}`);
      if (err) return Promise.reject(err);
    }
    return Reflect.apply(original, this, arguments);
  };
  Object.defineProperty(globalThis, 'fetch', { configurable: true, enumerable: descriptor.enumerable, writable: true, value: guardedFetch });
}

// ---- child processes -----------------------------------------------------------

function realOrResolved(p) {
  const abs = path.resolve(p);
  try {
    return fs.realpathSync.native(abs);
  } catch {
    return abs;
  }
}

// Where the Control Panel scripts live: beside this file in an install
// (_system), or release-templates/_system-scripts in a source checkout.
const SCRIPT_DIRS = [GUARD_DIR, path.join(GUARD_DIR, 'release-templates', '_system-scripts')].map(realOrResolved);
const samePath = (a, b) => (IS_WINDOWS ? a.toLowerCase() === b.toLowerCase() : a === b);

// 'powershell' or 'explorer' when `file` names one of them (bare, as server.js
// starts them, or at its Windows location), else null.
function programName(file) {
  if (typeof file !== 'string' || !file) return null;
  const name = path.win32.basename(file).toLowerCase().replace(/\.exe$/, '');
  if (!Object.hasOwn(SYSTEM_PROGRAMS, name)) return null;
  if (!/[\\/]/.test(file)) return name;
  const full = path.win32.resolve(file).toLowerCase();
  return SYSTEM_PROGRAMS[name].some((p) => p.toLowerCase() === full) ? name : null;
}

// The script `powershell.exe <argv>` would run. Only harmless switches may
// come before -File, never -Command, -EncodedCommand or a bare command.
function powershellScript(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const m = /^(?:--?|\/)([a-z]+)$/i.exec(argv[i]);
    if (!m) return null;
    const name = m[1].toLowerCase();
    if (name === 'file') return argv[i + 1] ?? null; // what follows goes to the script
    if (PS_SWITCHES_WITH_VALUE.has(name)) i += 1;
    else if (!PS_SWITCHES.has(name)) return null;
  }
  return null;
}

function isControlScript(file) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || !CONTROL_SCRIPT.test(path.basename(file))) return false;
  const real = realOrResolved(file);
  return CONTROL_SCRIPT.test(path.basename(real)) && SCRIPT_DIRS.some((dir) => samePath(dir, path.dirname(real)));
}

// Explorer may only open an existing folder on a local drive: never a file
// (it would run it), a URL (it would open a browser) or a \\server share.
function isLocalFolder(arg) {
  if (typeof arg !== 'string') return false;
  if (IS_WINDOWS ? !/^[a-z]:[\\/]/i.test(arg) : !path.isAbsolute(arg)) return false;
  try {
    return fs.statSync(arg).isDirectory();
  } catch {
    return false;
  }
}

// Whether spawn / execFile(file, args, options) starts an allowed program.
function spawnAllowed(file, args, options) {
  let argv = args;
  let opts = options;
  if (!Array.isArray(argv)) {
    if (argv !== null && typeof argv === 'object') opts = argv;
    argv = [];
  }
  if (opts && typeof opts === 'object' && (opts.shell || opts.windowsVerbatimArguments)) return false;
  argv = argv.map(String);
  const program = programName(file);
  if (program === 'powershell') return isControlScript(powershellScript(argv));
  if (program === 'explorer') return argv.length === 1 && isLocalFolder(argv[0]);
  return false;
}

function guardChildProcesses() {
  // spawn and execFile start one program directly. exec always goes through
  // cmd.exe and fork starts another Node process, so those never pass.
  const checks = {
    spawn: spawnAllowed,
    spawnSync: spawnAllowed,
    execFile: spawnAllowed,
    execFileSync: spawnAllowed,
    exec: () => false,
    execSync: () => false,
    fork: () => false,
  };
  for (const [name, allowed] of Object.entries(checks)) {
    const original = childProcess[name];
    const gate = (args) => {
      if (allowed(...args)) return;
      const command = [args[0], ...(Array.isArray(args[1]) ? args[1] : [])].map(String).join(' ');
      const err = report('child_process', `${name} ${command}`);
      if (err) throw Object.assign(err, { syscall: name, path: String(args[0]) });
    };
    const guarded = function (...args) {
      gate(args);
      return Reflect.apply(original, this, args);
    };
    // util.promisify(exec / execFile) uses this hook, which would otherwise
    // call the original function directly.
    const custom = original[promisify.custom];
    if (typeof custom === 'function') {
      Object.defineProperty(guarded, promisify.custom, {
        configurable: true,
        value(...args) {
          try {
            gate(args);
          } catch (err) {
            return Promise.reject(err);
          }
          return Reflect.apply(custom, this, args);
        },
      });
    }
    childProcess[name] = guarded;
  }
}

// ---- install -------------------------------------------------------------------

function install() {
  state = { mode: MODE, events: 0, blocked: 0, logFile: LOG_FILE };
  globalThis[STATE_KEY] = state;
  guardSockets();
  guardDns();
  guardFetch();
  guardChildProcesses();
  // ES-module named imports (import { spawn } from 'child_process') see the wrappers too.
  syncBuiltinESMExports();
  if (MODE === 'log') {
    try {
      process.stderr.write(`[egress-guard] LOG-ONLY mode (HCFH_EGRESS=log): outbound attempts are logged to ${LOG_FILE} but NOT blocked.\n`);
    } catch { /* no console */ }
  }
}

if (!state) install(); // loaded twice (also preloaded with --import): patch once

// Counts since start, for an optional status line.
export function egressGuardStatus() {
  const { mode, events, blocked, logFile } = globalThis[STATE_KEY];
  return { mode, events, blocked, logFile };
}
