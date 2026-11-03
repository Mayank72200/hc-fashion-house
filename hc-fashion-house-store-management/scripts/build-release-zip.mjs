#!/usr/bin/env node
// build-release-zip.mjs — assembles the HC Fashion House release ZIP.
//
// Repo tree (developer-friendly): package.json / server.js / src /
// scripts / … all at root, plus release-templates/ holding the
// launcher files. This script combines them into a Windows distributable
// with the "one visible file" flat layout:
//
//   HC-Fashion-House/
//   ├── HC Fashion House - WINDOWS.hta
//   ├── READ ME FIRST.txt
//   └── _system/
//       ├── package.json      (runtime fields only)
//       ├── .npmrc            (ignore-scripts=true; npm is never run)
//       ├── server.js, egress-guard.mjs, src/utils.js (every file server.js imports)
//       ├── dist/             (pre-built app, OCR files included)
//       ├── node_modules/     (express + pdf-lib and their dependencies only)
//       ├── node/             (portable Node.js: node.exe + its LICENSE)
//       ├── licenses/THIRD-PARTY-NOTICES.txt
//       ├── LICENSE, README.md
//       ├── data/             (empty)
//       └── (hcfh-paths, install / start / stop / backup / restore / move /
//            uninstall scripts, ensure-node and app-icon.ico flattened in)
//
// Nothing is downloaded: node_modules is copied from this checkout's
// `npm ci` install and Node.js from the official ZIP the maintainer puts
// in vendor/node/, checked against the SHA-256 pinned below.
//
// Usage:
//   node scripts/build-release-zip.mjs
//   node scripts/build-release-zip.mjs --outDir=release-build
//
// Prerequisites (the script refuses to proceed without them): Windows,
// `npm ci`, `npm run build` (dist/), and the pinned Node.js ZIP in vendor/node/.

import {
  readdirSync, statSync, existsSync, mkdirSync, mkdtempSync, rmSync, copyFileSync,
  readFileSync, writeFileSync,
} from 'fs';
import { join, resolve, dirname, relative, basename, sep } from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { builtinModules } from 'module';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { TRAINEDDATA_SHA256 } from './bundle-tesseract-assets.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(__filename, '..', '..');

const ZIP_ROOT = 'HC-Fashion-House';
const LAUNCHER = 'HC Fashion House - WINDOWS.hta';

// Portable Node.js runtime (Windows x64), shipped as _system/node/node.exe.
// Once per Node release: download node-v<version>-win-x64.zip of a Node.js 24
// LTS release from the official Node.js site, check it against the
// SHASUMS256.txt published with that release, copy it to vendor/node/
// (git-ignored) and record its version and SHA-256 here. Builds refuse any
// other file.
const NODE_VERSION = '';     // e.g. '24.x.y'
const NODE_ZIP_SHA256 = '';  // the SHASUMS256.txt hash of node-v<NODE_VERSION>-win-x64.zip

// SHA-256 of the upstream MIT notice that licenses/THIRD-PARTY-NOTICES.txt
// must carry verbatim (its "MIT License" line through "SOFTWARE.").
const UPSTREAM_NOTICE_SHA256 = 'a0d3c899ce674dea1c8458aa4e3d55cba2c9d4153bfc5d6778e30a57865011be';

// The only outside hosts the page's Content-Security-Policy may name: Google
// Drive, used only when someone clicks "Save to Drive" or ticks the backup
// upload box.
const CSP_EXTERNAL_HOSTS = new Set(['accounts.google.com', 'www.googleapis.com', 'oauth2.googleapis.com']);

// Packages whose code ends up inside dist/: the browser bundle, the service
// worker and the copied OCR worker/core. Their licences (and their
// dependencies' licences, unless ownCode) go into the shipped notices.
const DIST_PACKAGES = [
  { name: 'react' }, { name: 'react-dom' }, { name: 'jspdf' }, { name: 'html2canvas' },
  { name: 'dompurify' }, { name: 'qrcode' }, { name: 'fflate' }, { name: 'lucide-react' },
  { name: 'tesseract.js' }, { name: 'tesseract.js-core' },
  { name: 'workbox-window' }, { name: 'workbox-core' }, { name: 'workbox-precaching' },
  { name: 'workbox-routing' }, { name: 'workbox-strategies' }, { name: 'workbox-expiration' },
  { name: 'workbox-cacheable-response' },
  // Only these packages' own helper code ships, not their build-time dependencies.
  { name: 'vite-plugin-pwa', ownCode: true },
  { name: '@trickfilm400/rollup-plugin-off-main-thread', ownCode: true },
  { name: 'vite', ownCode: true, cutAt: /\n#+\s*Licenses of bundled dependencies/i },
];
// Build, lint and test tools: nothing from them ships.
const TOOLING_PACKAGES = new Set([
  '@eslint/js', '@types/react', '@types/react-dom', '@vitejs/plugin-react', 'eslint',
  'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
]);

const fail = (msg, detail = '') => {
  console.error(`\n  x ${msg}`);
  if (detail) console.error(detail);
  console.error('');
  process.exit(1);
};
const rel = (p) => relative(REPO_ROOT, p).split(sep).join('/');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const samePath = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();
const isInside = (child, parent) => {
  const r = relative(resolve(parent), resolve(child));
  return r === '' || (!!r && !r.startsWith('..') && !/^[A-Za-z]:/.test(r) && !r.startsWith(sep));
};

console.log('\n  HC Fashion House — Release ZIP Builder\n');

// --- Where the output goes (and what may be deleted) ---
// Only the staging folder and the ZIP this script creates are ever deleted,
// never the output folder itself. A bad --outDir once could wipe the app
// folder with its data, so these targets are refused outright.
const outArg = process.argv.find((a) => a.startsWith('--outDir='));
const outRaw = outArg ? outArg.slice('--outDir='.length).trim() : 'release-build';
if (!outRaw) fail('--outDir is empty. Leave it out to use release-build/.');
const OUT_DIR = resolve(REPO_ROOT, outRaw);
const LOCAL_DATA = ['data', 'Saved Invoices', 'Trash', 'logs', 'Backups'];
const COPIED_FROM = ['dist', 'release-templates', 'node_modules', 'vendor', 'src', 'public', 'scripts', 'licenses'];
if (isInside(REPO_ROOT, OUT_DIR)) {
  fail(`--outDir ${OUT_DIR} is the app folder or one of its parents. Pick a separate folder such as release-build.`);
}
if (existsSync(join(OUT_DIR, 'data'))) {
  fail(`--outDir ${OUT_DIR} contains a data folder. Pick an empty folder such as release-build.`);
}
for (const f of [...LOCAL_DATA, ...COPIED_FROM]) {
  if (isInside(OUT_DIR, join(REPO_ROOT, f))) fail(`--outDir must not be inside ${f}/. Pick a folder such as release-build.`);
}
const STAGING = join(OUT_DIR, ZIP_ROOT);
const SYSTEM = join(STAGING, '_system');

// --- Sanity checks (nothing is deleted before these pass) ---
if (process.platform !== 'win32') {
  fail('Release ZIPs are built on Windows: the app ships a Windows Node.js and is packed with Windows tar.exe.');
}
const TAR = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
if (!existsSync(TAR)) fail(`${TAR} was not found. It ships with Windows 10 (1803) and later.`);

const distPath = join(REPO_ROOT, 'dist');
if (!existsSync(join(distPath, 'index.html'))) fail('dist/ not found. Run `npm run build` first.');
const templates = join(REPO_ROOT, 'release-templates');
if (!existsSync(templates)) fail('release-templates/ not found. Repo is missing files.');
if (!existsSync(join(templates, LAUNCHER))) fail(`release-templates/${LAUNCHER} not found.`);
for (const f of ['LICENSE', 'README.md', 'server.js', 'egress-guard.mjs', join('licenses', 'THIRD-PARTY-NOTICES.txt')]) {
  if (!existsSync(join(REPO_ROOT, f))) fail(`${f.split(sep).join('/')} is missing. Every release must carry it.`);
}
const pkgJson = readJson(join(REPO_ROOT, 'package.json'));
const version = pkgJson.version;
if (!/^\d+\.\d+\.\d+$/.test(version || '')) fail(`package.json version "${version}" is not a plain x.y.z number.`);

// The upstream MIT notice stays verbatim in the notices file (licence condition).
const repoNotices = readFileSync(join(REPO_ROOT, 'licenses', 'THIRD-PARTY-NOTICES.txt'), 'utf8').replace(/\r\n/g, '\n');
{
  const start = repoNotices.indexOf('MIT License\n');
  const end = start < 0 ? -1 : repoNotices.indexOf('SOFTWARE.\n', start);
  const block = end < 0 ? '' : repoNotices.slice(start, end + 'SOFTWARE.\n'.length);
  if (sha256(block) !== UPSTREAM_NOTICE_SHA256) {
    fail('licenses/THIRD-PARTY-NOTICES.txt no longer carries the original MIT notice word for word.',
      '    That notice must ship with every copy. Restore section 1 of the file.');
  }
}

// The OCR model in dist/ is the pinned one (bundle-tesseract-assets.mjs checks the source).
{
  const model = join(distPath, 'tesseract', 'lang', 'eng.traineddata');
  if (!existsSync(model)) fail('dist/tesseract/lang/eng.traineddata is missing. Run `npm run build` again.');
  if (sha256(readFileSync(model)) !== TRAINEDDATA_SHA256) {
    fail('dist/tesseract/lang/eng.traineddata does not match its pinned SHA-256. Run `npm run build` again.');
  }
}

// Self-hosted fonts must travel with their licence (SIL OFL).
{
  const fonts = join(distPath, 'fonts');
  const woff = existsSync(fonts) ? readdirSync(fonts).filter((f) => /\.woff2?$/i.test(f)) : [];
  if (woff.length && !existsSync(join(fonts, 'OFL.txt'))) fail('dist/fonts has font files but no OFL.txt. Restore public/fonts/OFL.txt.');
}

// The page's Content-Security-Policy may name no outside host except Drive's.
{
  const html = readFileSync(join(distPath, 'index.html'), 'utf8');
  const meta = html.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i);
  const content = meta && meta[0].match(/content=(["'])([\s\S]*?)\1/i);
  if (!content) fail('dist/index.html has no Content-Security-Policy meta tag.');
  const bad = content[2].split(/[\s;]+/).filter((src) => {
    if (/^https?:$/i.test(src)) return true;                    // a bare scheme allows every host
    const m = src.match(/^https?:\/\/([^/:]+)/i);
    if (!m) return false;
    const host = m[1].toLowerCase();
    return !(host === 'localhost' || host === '127.0.0.1' || CSP_EXTERNAL_HOSTS.has(host));
  });
  if (bad.length) fail(`dist/index.html allows outside sources in its Content-Security-Policy: ${[...new Set(bad)].join(' ')}`);
}

// The server loads the egress guard before anything else.
{
  const firstImport = readFileSync(join(REPO_ROOT, 'server.js'), 'utf8').match(/^\s*import\b[^\n]*/m);
  if (!firstImport || !/^\s*import\s*['"]\.\/egress-guard\.mjs['"]/.test(firstImport[0])) {
    fail("server.js must load the egress guard first: its first import must be  import './egress-guard.mjs';");
  }
}

// --- What the server imports ---
// Every relative file reachable from server.js is copied, and every package
// it names must be a "dependencies" entry (and the other way round), so the
// shipped node_modules holds exactly what the server needs.
const IMPORT_RES = [
  /^\s*import\s*['"]([^'"]+)['"]/gm,                              // import './x.mjs'
  /^\s*(?:import|export)\b[^'";]*?\bfrom\s*['"]([^'"]+)['"]/gm,  // import x from 'y' / export … from
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                       // await import('y')
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                      // require('y')
];
const importSpecifiers = (text) => {
  const specs = new Set();
  for (const re of IMPORT_RES) for (const m of text.matchAll(re)) specs.add(m[1]);
  return [...specs];
};
const isBuiltin = (spec) => builtinModules.includes(spec) || builtinModules.includes(spec.replace(/^node:/, '')) || spec.startsWith('node:');
const packageOf = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

function serverClosure(root) {
  const files = new Set();
  const packages = new Set();
  const missing = [];
  const visit = (fileAbs, from) => {
    if (files.has(fileAbs)) return;
    if (!existsSync(fileAbs) || !statSync(fileAbs).isFile()) {
      missing.push(`    ${relative(root, fileAbs).split(sep).join('/')}  (imported from ${from})`);
      return;
    }
    if (!isInside(fileAbs, root)) fail(`server code imports ${fileAbs}, outside ${root}.`);
    files.add(fileAbs);
    for (const spec of importSpecifiers(readFileSync(fileAbs, 'utf8'))) {
      if (spec.startsWith('.') || spec.startsWith('/')) visit(resolve(dirname(fileAbs), spec), relative(root, fileAbs).split(sep).join('/'));
      else if (!isBuiltin(spec)) packages.add(packageOf(spec));
    }
  };
  visit(join(root, 'server.js'), '(entry point)');
  return { files: [...files], packages: [...packages].sort(), missing };
}

const source = serverClosure(REPO_ROOT);
if (source.missing.length) fail('server.js imports files that do not exist:', source.missing.join('\n'));
const runtimeDeps = Object.keys(pkgJson.dependencies || {}).sort();
for (const p of source.packages) {
  if (!runtimeDeps.includes(p)) fail(`server code imports "${p}", which is not in package.json "dependencies".`);
}
for (const p of runtimeDeps) {
  if (!source.packages.includes(p)) {
    fail(`package.json "dependencies" lists "${p}", but the server never imports it.`,
      '    Browser libraries belong in "devDependencies" (Vite compiles them into dist/).');
  }
}
// Every development package must be classified, so its licence ships when its code does.
for (const p of Object.keys(pkgJson.devDependencies || {})) {
  if (!TOOLING_PACKAGES.has(p) && !DIST_PACKAGES.some((d) => d.name === p)) {
    fail(`devDependency "${p}" is not classified in scripts/build-release-zip.mjs.`,
      '    Add it to DIST_PACKAGES if any of its code reaches dist/, else to TOOLING_PACKAGES.');
  }
}

// --- npm packages: Node-style lookup inside this checkout only ---
function resolvePackageDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
    if (samePath(dir, REPO_ROOT)) return null;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function packageClosure(entries) {
  const found = new Map();
  const missing = [];
  const queue = entries.map((e) => ({ ...e, from: REPO_ROOT, root: true }));
  while (queue.length) {
    const item = queue.shift();
    const dir = resolvePackageDir(item.name, item.from);
    if (!dir) {
      if (!item.optional) missing.push(item.name);
      continue;
    }
    if (found.has(dir)) continue;
    const pkg = readJson(join(dir, 'package.json'));
    found.set(dir, { name: pkg.name || item.name, version: pkg.version || '?', dir, pkg, cutAt: item.root ? item.cutAt : undefined });
    if (item.ownCode) continue;
    for (const d of Object.keys(pkg.dependencies || {})) queue.push({ name: d, from: dir });
    for (const d of Object.keys(pkg.optionalDependencies || {})) queue.push({ name: d, from: dir, optional: true });
  }
  return { packages: [...found.values()], missing };
}

const server = packageClosure(runtimeDeps.map((name) => ({ name })));
if (server.missing.length) fail(`Server packages are not installed: ${server.missing.join(', ')}. Run npm ci first.`);
{
  const lockPath = join(REPO_ROOT, 'package-lock.json');
  if (!existsSync(lockPath)) fail('package-lock.json is missing; the shipped packages must match it.');
  const lock = readJson(lockPath).packages || {};
  for (const p of server.packages) {
    const key = rel(p.dir);
    if (!lock[key] || lock[key].version !== p.version) {
      fail(`${key} ${p.version} does not match package-lock.json. Run npm ci, then build again.`);
    }
    const s = p.pkg.scripts || {};
    if (s.preinstall || s.install || s.postinstall || p.pkg.gypfile || existsSync(join(p.dir, 'binding.gyp'))) {
      fail(`${key} has an install script; the release ships no package that needs one.`);
    }
  }
}

// --- Portable Node.js (checked before anything is deleted) ---
const nodeDir = join(REPO_ROOT, 'vendor', 'node');
const nodeFolder = `node-v${NODE_VERSION}-win-x64`;
const nodeZip = join(nodeDir, `${nodeFolder}.zip`);
if (!NODE_VERSION || !/^[0-9a-f]{64}$/.test(NODE_ZIP_SHA256)) {
  const found = existsSync(nodeDir) ? readdirSync(nodeDir).filter((f) => /^node-v[\d.]+-win-x64\.zip$/i.test(f)) : [];
  fail('The portable Node.js runtime is not pinned yet.',
    '    Download the Windows x64 ZIP of a Node.js 24 LTS release and its SHASUMS256.txt from the\n' +
    '    official Node.js site, put the ZIP in vendor/node/, and set NODE_VERSION and NODE_ZIP_SHA256\n' +
    '    at the top of scripts/build-release-zip.mjs to that release and its SHASUMS256.txt hash.' +
    found.map((f) => `\n    Found vendor/node/${f}: SHA-256 ${sha256(readFileSync(join(nodeDir, f)))}`).join(''));
}
if (!existsSync(nodeZip)) {
  fail(`vendor/node/${nodeFolder}.zip is missing.`,
    `    Copy the official Node.js ${NODE_VERSION} Windows x64 ZIP there (checked against SHASUMS256.txt).`);
}
{
  const actual = sha256(readFileSync(nodeZip));
  if (actual !== NODE_ZIP_SHA256) {
    fail(`vendor/node/${nodeFolder}.zip does not match its pinned SHA-256.`,
      `    expected ${NODE_ZIP_SHA256}\n    found    ${actual}\n    Use the official file, or re-pin on purpose.`);
  }
}

// Windows PowerShell 5.1 reads a BOM-less .ps1 using the machine's ANSI
// codepage, not UTF-8. A UTF-8 arrow or em dash then decodes into a curly
// quote, and PowerShell treats curly quotes as real string delimiters -- so
// the string terminates mid-line and the whole script dies with "The string
// is missing the terminator". That once broke Backup, Move and Start for
// every user. Keep these scripts, the HTA and READ ME FIRST pure ASCII; it is
// the only encoding every codepage agrees on.
function assertAsciiOnly(dir, files) {
  const offenders = [];
  for (const f of files) {
    if (!/\.(ps1|bat|cmd|hta)$/i.test(f) && f !== 'READ ME FIRST.txt') continue;
    readFileSync(join(dir, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const hit = line.match(/[^\x00-\x7F]/g);
        if (hit) offenders.push(`    ${f}:${i + 1}  ${[...new Set(hit)].join(' ')}`);
      });
  }
  if (offenders.length) {
    console.error('\n  x Non-ASCII characters found in Windows scripts:');
    console.error(offenders.join('\n'));
    console.error('\n    These break PowerShell 5.1 parsing. Use ASCII instead:');
    console.error('    "-" for em dash, "..." for ellipsis, "->" for arrow.\n');
    process.exit(1);
  }
}

// The release is Windows-only: Mac / Linux launchers and shell scripts never ship.
const windowsOnly = (dir, files) => files.filter((f) => {
  if (!statSync(join(dir, f)).isFile()) return false;
  if (/\.(sh|command|bash)$/i.test(f)) {
    console.log(`  ! Skipping ${rel(join(dir, f))} (Windows-only release)`);
    return false;
  }
  return true;
});

const launcherFiles = windowsOnly(templates, readdirSync(templates));
assertAsciiOnly(templates, launcherFiles);
const scriptsSrc = join(templates, '_system-scripts');
const scriptFiles = existsSync(scriptsSrc) ? windowsOnly(scriptsSrc, readdirSync(scriptsSrc)) : [];
assertAsciiOnly(scriptsSrc, scriptFiles);
// The install marker is written by install-windows.ps1 on the shop PC. One
// shipped in the ZIP would make a freshly extracted copy look installed (the
// launcher would offer Open App on a second, empty set of books).
if ([...launcherFiles, ...scriptFiles].includes('hcfh-installed.json')) {
  fail('release-templates holds hcfh-installed.json. Delete it: a shipped install marker makes a fresh ZIP look installed.');
}

// --- Clean staging area ---
// Never delete a staging folder that has been used as a real install.
if (existsSync(STAGING)) {
  const used = LOCAL_DATA.filter((f) => f !== 'data' && existsSync(join(SYSTEM, f))).map((f) => `_system/${f}`);
  if (existsSync(join(SYSTEM, 'data')) && readdirSync(join(SYSTEM, 'data')).length) used.unshift('_system/data');
  if (existsSync(join(STAGING, 'Backups'))) used.push('Backups');
  if (used.length) fail(`${STAGING} holds ${used.join(', ')}; it looks like a copy in use. Move it away first.`);
  rmSync(STAGING, { recursive: true, force: true });
}
const zipName = `${ZIP_ROOT}-v${version}.zip`;
const zipPath = join(OUT_DIR, zipName);
rmSync(zipPath, { force: true });
mkdirSync(SYSTEM, { recursive: true });

// --- Copy launcher files to root of staging ---
console.log('  → Copying launcher files…');
for (const f of launcherFiles) copyFileSync(join(templates, f), join(STAGING, f));

// --- Copy _system-scripts contents INTO _system/ (flattened, no subfolder) ---
console.log('  → Copying Windows scripts into _system/…');
for (const f of scriptFiles) copyFileSync(join(scriptsSrc, f), join(SYSTEM, f));

// --- Runtime files into _system/ ---
// Ship only what the RUNTIME needs: dist/ (the built app, which already
// holds everything from public/), the server and the files it imports, the
// server's packages and Node.js itself. No source, tests or tooling.
console.log('  → Copying app build + runtime files into _system/…');
writeFileSync(join(SYSTEM, 'package.json'), `${JSON.stringify({
  name: pkgJson.name,
  version,
  private: true,
  description: pkgJson.description,
  author: pkgJson.author,
  license: pkgJson.license,
  type: pkgJson.type,
  engines: pkgJson.engines,
  dependencies: pkgJson.dependencies,
}, null, 2)}\n`);
writeFileSync(join(SYSTEM, '.npmrc'), [
  '# This copy never runs npm: its packages ship in node_modules.',
  'ignore-scripts=true',
  'update-notifier=false',
  'fund=false',
  'audit=false',
  '',
].join('\n'));
for (const f of ['LICENSE', 'README.md']) copyFileSync(join(REPO_ROOT, f), join(SYSTEM, f));

// server.js and every file it imports, at the same relative paths. (A server
// that imported one file the ZIP left out once exited before binding, and the
// launcher could only say "Server did not respond".)
for (const file of source.files) {
  const dst = join(SYSTEM, relative(REPO_ROOT, file));
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(file, dst);
}
copyFileSync(join(REPO_ROOT, 'egress-guard.mjs'), join(SYSTEM, 'egress-guard.mjs'));

copyDirRecursive(distPath, join(SYSTEM, 'dist'));

// --- Server packages (express + pdf-lib and their dependencies) ---
console.log(`  → Copying ${server.packages.length} server package(s) into _system/node_modules/…`);
for (const p of server.packages) copyDirRecursive(p.dir, join(SYSTEM, relative(REPO_ROOT, p.dir)));

// --- Portable Node.js: node.exe and its licence only (no npm) ---
console.log(`  → Adding Node.js ${NODE_VERSION} (node.exe + LICENSE)…`);
{
  const tmp = mkdtempSync(join(tmpdir(), 'hcfh-'));
  let error = null;
  try {
    execFileSync(TAR, ['-x', '-f', nodeZip, '-C', tmp, `${nodeFolder}/node.exe`, `${nodeFolder}/LICENSE`], { stdio: 'inherit' });
    mkdirSync(join(SYSTEM, 'node'), { recursive: true });
    copyFileSync(join(tmp, nodeFolder, 'node.exe'), join(SYSTEM, 'node', 'node.exe'));
    copyFileSync(join(tmp, nodeFolder, 'LICENSE'), join(SYSTEM, 'node', 'LICENSE'));
  } catch (e) {
    error = e;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (error) fail(`Could not take node.exe and LICENSE from vendor/node/${nodeFolder}.zip: ${error.message}`);
  const reported = execFileSync(join(SYSTEM, 'node', 'node.exe'), ['--version'], { encoding: 'utf8' }).trim();
  if (reported !== `v${NODE_VERSION}`) fail(`The bundled node.exe reports ${reported}, not v${NODE_VERSION}.`);
}

// --- Licence notices: the repo file, the full licence texts it refers to,
// then every npm package in the release ---
console.log('  → Writing licenses/THIRD-PARTY-NOTICES.txt…');
{
  const rule = '='.repeat(70);
  // Licence texts are kept as written: only blank lines around them go.
  const tidy = (text) => text.replace(/\r\n/g, '\n').replace(/^\s*\n/, '').trimEnd();
  const section = (title, body) => `${rule}\n${title}\n${rule}\n\n${tidy(body)}\n`;
  const parts = [repoNotices.trimEnd(), ''];
  parts.push(section('Apache License, Version 2.0 (full text; applies to section 3 and to the Apache-2.0 packages below)',
    readFileSync(join(REPO_ROOT, 'vendor', 'tessdata', 'LICENSE'), 'utf8')));
  const ofl = join(REPO_ROOT, 'public', 'fonts', 'OFL.txt');
  if (existsSync(ofl)) parts.push(section('SIL Open Font License, Version 1.1 (full text; applies to section 2)', readFileSync(ofl, 'utf8')));
  parts.push(section(`Node.js ${NODE_VERSION} runtime (node/node.exe)`,
    'Node.js is shipped unmodified. Its licence, which covers the components built into node.exe, is in node/LICENSE.'));

  const dist = packageClosure(DIST_PACKAGES);
  for (const name of dist.missing) console.log(`  ! ${name} is not installed; its licence is not listed`);
  const seen = new Set();
  const licenceField = (pkg) => {
    const l = pkg.license || pkg.licenses;
    if (Array.isArray(l)) return l.map((x) => x.type || x).join(' OR ');
    return (l && l.type) || l || 'licence not stated';
  };
  const entries = [
    ...server.packages.map((p) => ({ ...p, where: `Shipped in ${rel(p.dir)}` })),
    ...dist.packages.map((p) => ({ ...p, where: 'Compiled into dist/ (the app, its service worker or the OCR files)' })),
  ].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  let listed = 0;
  for (const p of entries) {
    const id = `${p.name}@${p.version}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const texts = readdirSync(p.dir)
      .filter((f) => /^(?:licen[cs]e|copying|notice)(?:[.-][\w.-]*)?$/i.test(f) && statSync(join(p.dir, f)).isFile())
      .sort()
      .map((f) => {
        let t = readFileSync(join(p.dir, f), 'utf8');
        if (p.cutAt) {
          const at = t.search(p.cutAt);
          if (at > 0) t = t.slice(0, at);
        }
        return tidy(t);
      });
    const body = texts.length ? texts.join('\n\n') : `(The package contains no licence file. Its package.json declares: ${licenceField(p.pkg)}.)`;
    parts.push(section(`${p.name} ${p.version} - ${licenceField(p.pkg)}\n${p.where}`, body));
    listed++;
  }
  mkdirSync(join(SYSTEM, 'licenses'), { recursive: true });
  writeFileSync(join(SYSTEM, 'licenses', 'THIRD-PARTY-NOTICES.txt'), `${parts.join('\n')}\n`);
  console.log(`  → Listed the licences of ${listed} npm package(s)`);
}

// --- Create empty data folder so first-run doesn't need to mkdir ---
mkdirSync(join(SYSTEM, 'data'), { recursive: true });

// Refuse to ship a server that cannot start.
//
// Nothing used to check the packaged output: the dev tree always has every
// file, so tests passed while the downloaded artefact was dead on arrival.
// This walks every import reachable from server.js INSIDE the staging folder
// (side-effect and dynamic imports included) and fails the build if a file
// or a package is missing. Static check: no server is started here.
function assertServerImportsResolve() {
  const staged = serverClosure(SYSTEM);
  const missing = [...staged.missing];
  for (const p of staged.packages) {
    if (!existsSync(join(SYSTEM, 'node_modules', p, 'package.json'))) missing.push(`    node_modules/${p}  (package)`);
  }
  if (missing.length) {
    console.error('\n  x The packaged server has imports that do not exist in _system/:');
    console.error(missing.join('\n'));
    console.error('\n    Users would see only "Server did not respond".\n');
    process.exit(1);
  }
  console.log(`  → Verified ${staged.files.length} server file(s) and ${staged.packages.length} package(s) resolve inside _system/`);
}
assertServerImportsResolve();

// No trace of the original product, no outside address and no download
// command in anything that ships (dist/, launchers, scripts, server code).
// This also covers the old dead URL-protocol links.
console.log('  → Checking the staged release with brand-guard…');
{
  const guard = spawnSync(process.execPath, [join(REPO_ROOT, 'scripts', 'brand-guard.mjs'), '--dist', STAGING], { stdio: 'inherit' });
  if (guard.status !== 0) fail('brand-guard found problems in the staged release (listed above). No ZIP was made.');
}

// --- ZIP it up ---
// Windows' built-in tar.exe (bsdtar, present since Windows 10 1803) instead
// of Compress-Archive: Windows PowerShell 5.1's Compress-Archive stores entry
// names with BACKSLASHES, which the ZIP specification forbids.
console.log(`  → Creating ${zipName}…`);
try {
  // Argument arrays, no shell: nothing in a path is ever interpreted.
  execFileSync(TAR, ['-a', '-c', '-f', zipPath, '-C', OUT_DIR, ZIP_ROOT], { stdio: 'inherit' });
} catch (e) {
  fail(`Zip step failed: ${e.message}`);
}
assertPortableZip(zipPath);

/**
 * Read the finished archive back: every entry name must use "/" (the ZIP
 * specification's only separator), sit under the one root folder, and the
 * files the launcher relies on must be where it looks for them.
 */
function assertPortableZip(file) {
  const names = zipEntryNames(file);
  const backslashed = names.filter((n) => n.includes('\\'));
  if (backslashed.length) {
    fail(`${backslashed.length} ZIP entries use "\\" as a path separator, e.g.:`, backslashed.slice(0, 5).map((n) => `    ${n}`).join('\n'));
  }
  const stray = names.filter((n) => !n.startsWith(`${ZIP_ROOT}/`));
  if (stray.length) fail(`ZIP entries outside ${ZIP_ROOT}/, e.g. ${stray[0]}`);
  const unix = names.filter((n) => /\.(sh|command|bash)$/i.test(n));
  if (unix.length) fail(`The Windows-only ZIP contains ${unix[0]}`);
  const required = [
    LAUNCHER, 'READ ME FIRST.txt', '_system/server.js', '_system/egress-guard.mjs', '_system/package.json', '_system/.npmrc',
    '_system/dist/index.html', '_system/node/node.exe', '_system/node/LICENSE',
    '_system/node_modules/express/package.json', '_system/node_modules/pdf-lib/package.json',
    '_system/licenses/THIRD-PARTY-NOTICES.txt', '_system/LICENSE', '_system/README.md',
    '_system/backup-windows.ps1', // the Control Panel finds its scripts by this file
    // what the launcher, its shortcuts and the Control Panel run or show
    '_system/hcfh-paths.ps1', '_system/install-windows.ps1', '_system/start-windows.ps1', '_system/ensure-node.ps1',
    '_system/restore-windows.ps1', '_system/move-windows.ps1', '_system/stop-windows.ps1', '_system/uninstall-windows.ps1',
    '_system/app-icon.ico', '_system/dist/brand/hc-monogram-128.png',
  ].map((n) => `${ZIP_ROOT}/${n}`);
  const absent = required.filter((n) => !names.includes(n));
  if (absent.length) fail('The ZIP layout is wrong; missing:', absent.map((n) => `    ${n}`).join('\n'));
  // Never in a release: the install marker, logs, anything inside data/ (the
  // empty folder only), the port files, the branding master, vendor/ (the
  // Node.js ZIP among it) or any nested ZIP.
  const forbidden = names.filter((n) => {
    const inside = n.slice(ZIP_ROOT.length + 1);
    return inside === '_system/hcfh-installed.json'
      || /^_system\/logs(\/|$)/.test(inside)
      || /^_system\/data\/./.test(inside)
      || /(^|\/)port\.(run|txt)$/.test(inside)
      || /^(_system\/)?(branding|vendor)(\/|$)/.test(inside)
      || /\.zip$/i.test(inside);
  });
  if (forbidden.length) fail('The ZIP holds files a release must never ship:', forbidden.slice(0, 10).map((n) => `    ${n}`).join('\n'));
  console.log(`  → Verified ${names.length} ZIP entries use portable "/" paths under ${ZIP_ROOT}/`);
}

// Entry names from the ZIP central directory (ZIP64 end records included).
function zipEntryNames(file) {
  const buf = readFileSync(file);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) fail('The ZIP has no central directory - it is not a valid archive.');
  let count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || p === 0xffffffff) {
    const loc = eocd - 20;
    if (loc < 0 || buf.readUInt32LE(loc) !== 0x07064b50) fail('The ZIP64 end record is missing.');
    const z64 = Number(buf.readBigUInt64LE(loc + 8));
    if (buf.readUInt32LE(z64) !== 0x06064b50) fail('The ZIP64 end record is corrupt.');
    count = Number(buf.readBigUInt64LE(z64 + 32));
    p = Number(buf.readBigUInt64LE(z64 + 48));
  }
  const names = [];
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(p) !== 0x02014b50) fail('The ZIP central directory is corrupt.');
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    names.push(buf.toString('utf8', p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}

const sizeMB = (statSync(zipPath).size / 1024 / 1024).toFixed(2);
console.log(`\n  ✅ Release built — ${sizeMB} MB`);
console.log(`     ${zipPath}\n`);
console.log('  Next steps:');
console.log('   1. npm run verify:release (run automatically by npm run release:zip): extracts the ZIP,');
console.log('      starts it with the bundled Node.js and runs the smoke suite against it.');
console.log('   2. Install it on a clean Windows PC with the network off and use it once before handing it over.\n');

function copyDirRecursive(src, dst) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dst, entry.name);
    if (entry.name === 'node_modules') continue;   // nested packages are copied on their own
    if (entry.name === '.git') continue;
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else if (entry.isFile()) copyFileSync(s, d);
  }
}
