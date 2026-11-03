#!/usr/bin/env node
// brand-guard.mjs — stop the build when a trace of the original product,
// an outside address or a download command comes back into the app.
//
// Usage:
//   node scripts/brand-guard.mjs --src              the repository source
//   node scripts/brand-guard.mjs --dist [folder…]   built files: dist/ by
//                                                   default, or the folders
//                                                   given (dist/ or a staged
//                                                   release folder)
//
// Every problem is printed as "file:line: rule: excerpt" and the exit code
// is 1. Rules:
//   owner   names of the original product and its owner, and the old
//           update-download markers. The internal storage keys and event
//           names that are kept on purpose are allowed, as exact tokens.
//   url     an http(s) address whose host is not on the allow-list below.
//   script  a download command (or npm / winget) in a shipped launcher or
//           PowerShell script. Addresses on this computer are allowed.
//   icon    an image byte-identical to the retired upstream artwork.
//   name    a file or folder name that carries an owner trace.
// Credits to code-hosting handles in comments are listed as warnings.
//
// Never scanned: node_modules, the bundled Node runtime, vendor/, licence
// texts (LICENSE*, OFL.txt, THIRD-PARTY-NOTICES.txt, *.LICENSE.txt), data,
// logs and other local folders. Zero dependencies.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

// ---------------------------------------------------------------- rules --

const OWNER_PATTERNS = [
  /dice[\s_-]*codes/gi,
  /ram[\s_-]*garhia/gi,
  /free[\s_-]*gst[\s_-]*bill/gi,
  /\bGST\s+Billing\b/g,
  /gst[\s_-]*biller/gi,
  /supporters\.json/gi,
  /\b(?:api|codeload|raw|objects|release-assets)\.github[a-z]*\.com\b/gi,
  /\breleases\/latest\b/gi,
];

// Internal identifiers kept on purpose (stored data and event names). Each
// match of an owner pattern is widened to its whole token first, so only
// these exact shapes pass.
const ALLOWED_TOKENS = [
  /^_*freegstbill_[A-Za-z0-9_]*$/,   // freegstbill_* storage keys, __freegstbill_backup
  /^freegstbill-lock[A-Za-z0-9_-]*$/, // freegstbill-lock* event names
];

// Hosts the app may name. Everything else fails the url rule.
const ALLOWED_HOSTS = new Set([
  'localhost', '127.0.0.1', '[::1]',
  // Google Drive (only on an explicit "Save to Drive" or backup upload)
  'accounts.google.com', 'www.googleapis.com', 'oauth2.googleapis.com',
  'console.cloud.google.com', 'www.google.com',
  // government portals and references (opened only on a click)
  'gst.gov.in', 'services.gst.gov.in', 'www.tin-nsdl.com', 'cbic-gst.gov.in',
  // XML / SVG / spreadsheet schema namespaces (identifiers, never fetched)
  'www.w3.org', 'w3.org', 'schemas.openxmlformats.org',
]);

// Names reserved for documentation and tests; they can never reach a real
// server (example.com / .net / .org and the .example, .test, .invalid and
// .localhost domains).
const RESERVED_HOST = /(?:^|\.)(?:example\.(?:com|net|org)|example|test|invalid|localhost)$/i;

// Built files only: fixed strings inside third-party libraries that are
// never fetched. Matched against the start of the address, so any other
// address on the same host still fails.
const INERT_LIBRARY_URLS = [
  /^https:\/\/react\.dev\/errors\//,                 // React: error-decoder link in error text
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/(?:tesseract\.js(?:-core)?@|@tesseract\.js-data\/)/, // tesseract.js defaults; the app always passes its own /tesseract/ paths
  /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdfobject\//, // jsPDF 'pdfobjectnewwindow' output, never used
  /^http:\/\/jspdf\.default\.namespaceuri\//,       // jsPDF XML namespace identifier
  /^https:\/\/github\.com\/zloirock\/core-js(?:\/|$)/, // core-js copyright string (jsPDF's optional chain)
  /^https:\/\/bit\.ly\/wb-precache$/,               // Workbox precache error text
];

const URL_RE = /\bhttps?:\/\/(\[[0-9A-Fa-f:.]+\]|[A-Za-z0-9.-]+)[^\s'"`<>()\\]*/gi;
const LOOPBACK_URL = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?:[:/]|$)/i;

const DOWNLOAD_RE = new RegExp([
  '\\b(?:Invoke-WebRequest|Invoke-RestMethod|iwr|irm|curl(?:\\.exe)?|wget|Start-BitsTransfer|bitsadmin|certutil)\\b',
  'Net\\.WebClient', 'DownloadString', 'DownloadFile', 'XMLHTTP', 'WinHttpRequest',
  '\\bwinget\\b', '\\bnpx\\b', '\\bnpm(?:\\.cmd)?\\s+(?:install|i|ci|update|exec)\\b',
  'Start-Process\\s+["\']?https?:',
].join('|'), 'i');
const SCRIPT_FILE = /\.(?:ps1|psm1|hta|bat|cmd|vbs)$/i;
const COMMENT_LINE = /^\s*(?:#|\/\/|<#|\/\*|\*|::|'|rem\s)/i;

const HANDLE_RES = [
  /\(#\d+[^()\n]{0,40}?,\s*@[A-Za-z0-9][A-Za-z0-9-]{1,38}\)/g,
  /\b(?:reported by|thanks to|thanks|credit to)\s+@[A-Za-z0-9][A-Za-z0-9-]{1,38}\b/gi,
];

// SHA-256 of the retired upstream artwork (favicon.svg, the PWA icons and
// app-icon.ico). These files must never ship again.
const RETIRED_ARTWORK = new Set([
  '188b32fe4b08b23dee922ec79af499ed83d6d0fdda9ff253d4365b2f174be772',
  'dedf0749a6ccc53177d2b93d0f1f1b1ae32877211b41412e506441df832fbd16',
  '76ca15ab32bfce8a39bf286c11579e46d4257bdcd775f95520d044dfa5695c4e',
  'dcaafd424b0e06dddb761e2c8758069d6539d53050620229e50946b3ecab9bc0',
  'f7eda996efcf5d2c1c96bdf0a19b455e90528ae40f7caa831a0622aa6783e1b2',
  'ee6c3f95e41ddfb04aab1dc851f4396db6345df254a006ea8ef7dd8fc581aa89',
  '91f87f4bd4a805e8c18a067bf89dba2b3f973a62eede81d2614e939d916d7d2e',
]);

// ---------------------------------------------------------------- files --

const TEXT_EXT = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.html', '.htm', '.css',
  '.md', '.txt', '.ps1', '.psm1', '.hta', '.bat', '.cmd', '.vbs', '.yml', '.yaml',
  '.svg', '.webmanifest', '.xml', '.csv', '.ini', '.map',
]);
const TEXT_NAMES = new Set(['.gitignore', '.gitattributes', '.npmrc', '.editorconfig']);
const IMAGE_EXT = new Set(['.png', '.ico', '.svg', '.jpg', '.jpeg', '.gif', '.webp']);
const LICENCE_FILE = /^(?:licen[cs]e|copying|notice|ofl|third-party-notices)(?:\.(?:md|txt))?$|\.licen[cs]e\.txt$/i;

// Folders skipped in --src (relative to the repo root, "/" separators).
const SRC_SKIP = new Set([
  'node_modules', '.git', 'dist', 'dist-ssr', 'release-build', 'data', 'Saved Invoices',
  'Trash', 'logs', 'Backups', 'vendor', 'public/tesseract', '.claude', '.zcode',
  '.vscode', '.idea', '.npm-cache', 'coverage',
]);

function walk(root, skipDir) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDir(full, entry.name, dir)) stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

// ---------------------------------------------------------------- check --

const problems = [];
const warnings = [];

const excerpt = (line, index, length) => {
  const start = Math.max(0, index - 50);
  const text = line.slice(start, index + length + 50).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + text + (index + length + 50 < line.length ? '…' : '');
};

const tokenAt = (line, index, length) => {
  let s = index;
  let e = index + length;
  while (s > 0 && /[A-Za-z0-9_-]/.test(line[s - 1])) s--;
  while (e < line.length && /[A-Za-z0-9_-]/.test(line[e])) e++;
  return line.slice(s, e);
};

function ownerHits(text) {
  const hits = [];
  for (const re of OWNER_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const token = tokenAt(text, m.index, m[0].length);
      if (!ALLOWED_TOKENS.some((ok) => ok.test(token))) hits.push(m);
    }
  }
  // One report per place, even when two patterns match the same words.
  hits.sort((a, b) => a.index - b.index);
  let end = -1;
  return hits.filter((m) => {
    if (m.index < end) return false;
    end = m.index + m[0].length;
    return true;
  });
}

function hostAllowed(url, host, mode) {
  const h = host.toLowerCase().replace(/\.$/, '');
  if (ALLOWED_HOSTS.has(h) || RESERVED_HOST.test(h)) return true;
  return mode === 'dist' && INERT_LIBRARY_URLS.some((re) => re.test(url));
}

function checkFile(file, label, { mode, scriptRule, urlRule }) {
  const name = basename(file);
  const ext = extname(name).toLowerCase();

  if (IMAGE_EXT.has(ext)) {
    const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (RETIRED_ARTWORK.has(sha)) problems.push(`${label}:1: icon: retired upstream artwork; replace it with the HC Fashion House image`);
  }
  if (!(TEXT_EXT.has(ext) || TEXT_NAMES.has(name))) return;
  if (statSync(file).size > 20 * 1024 * 1024) return;

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const isScript = scriptRule && SCRIPT_FILE.test(name);
  lines.forEach((line, i) => {
    const at = `${label}:${i + 1}`;
    for (const m of ownerHits(line)) problems.push(`${at}: owner: ${excerpt(line, m.index, m[0].length)}`);

    const urls = [];
    URL_RE.lastIndex = 0;
    let m;
    while ((m = URL_RE.exec(line))) urls.push(m);
    if (urlRule) {
      for (const u of urls) {
        if (!hostAllowed(u[0], u[1], mode)) problems.push(`${at}: url: ${excerpt(line, u.index, u[0].length)}`);
      }
    }

    if (isScript && !COMMENT_LINE.test(line)) {
      const d = DOWNLOAD_RE.exec(line);
      const localOnly = urls.length > 0 && urls.every((u) => LOOPBACK_URL.test(u[0]));
      if (d && !localOnly) problems.push(`${at}: script: ${excerpt(line, d.index, d[0].length)}`);
    }

    for (const re of HANDLE_RES) {
      re.lastIndex = 0;
      let h;
      while ((h = re.exec(line))) warnings.push(`${at}: handle: ${excerpt(line, h.index, h[0].length)}`);
    }
  });
}

// path: the file's path inside the scanned tree (its own and folder names).
function checkName(path, label) {
  for (const m of ownerHits(path)) {
    problems.push(`${label}:0: name: "${m[0]}" in a file or folder name`);
  }
}

function scanSource() {
  const files = walk(REPO_ROOT, (full) => SRC_SKIP.has(relative(REPO_ROOT, full).split('\\').join('/')));
  for (const file of files) {
    const label = relative(REPO_ROOT, file).split('\\').join('/');
    checkName(label, label);
    if (LICENCE_FILE.test(basename(file))) continue;
    checkFile(file, label, {
      mode: 'src',
      scriptRule: label.startsWith('release-templates/'),
      // The lockfile lists registry download addresses for every package;
      // only its names are checked.
      urlRule: label !== 'package-lock.json',
    });
  }
  return files.length;
}

function scanBuilt(folder) {
  const files = walk(folder, (full, name, parent) =>
    name === 'node_modules' || name === '.git' || (name === 'node' && basename(parent) === '_system'));
  for (const file of files) {
    const inRepo = !relative(REPO_ROOT, file).startsWith('..');
    const label = (inRepo ? relative(REPO_ROOT, file) : file).split('\\').join('/');
    checkName(relative(folder, file).split('\\').join('/'), label);
    if (LICENCE_FILE.test(basename(file))) continue;
    checkFile(file, label, { mode: 'dist', scriptRule: true, urlRule: true });
  }
  return files.length;
}

// ----------------------------------------------------------------- main --

const args = process.argv.slice(2);
const mode = args.includes('--src') ? 'src' : args.includes('--dist') ? 'dist' : null;
if (!mode) {
  console.error('Usage: node scripts/brand-guard.mjs --src | --dist [folder ...]');
  process.exit(2);
}

let scanned = 0;
if (mode === 'src') {
  scanned = scanSource();
} else {
  const folders = args.filter((a) => !a.startsWith('--')).map((a) => resolve(process.cwd(), a));
  if (folders.length === 0) folders.push(join(REPO_ROOT, 'dist'));
  for (const folder of folders) {
    if (!existsSync(folder) || !statSync(folder).isDirectory()) {
      console.error(`  x ${folder} not found. Run npm run build first.`);
      process.exit(2);
    }
    scanned += scanBuilt(folder);
  }
}

for (const w of warnings) console.log(`warning: ${w}`);
if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  console.error(`\n  x brand-guard --${mode}: ${new Set(problems).size} problem(s) in ${scanned} file(s) scanned.`);
  console.error('    Remove the trace or address. Kept internal ids and allowed hosts are listed in scripts/brand-guard.mjs.\n');
  process.exit(1);
}
console.log(`  → brand-guard --${mode}: ${scanned} file(s) clean${warnings.length ? `, ${warnings.length} warning(s)` : ''}`);
