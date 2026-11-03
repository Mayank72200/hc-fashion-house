#!/usr/bin/env node
/**
 * verify-release.mjs — prove the ZIP a shop installs actually works.
 *
 * WHY THIS EXISTS
 * ---------------
 * The packaged server once imported a file the release ZIP had left out, so
 * it exited before binding and the launcher could only report "Server did
 * not respond". Nothing caught it because every check — the smoke suite, the
 * linter, all manual testing — ran against the DEVELOPMENT TREE, where every
 * file is always present. The artefact people actually installed had never
 * been started once.
 *
 * So this script refuses to take the repo's word for anything. It:
 *   1. extracts the release ZIP (picked by its exact name) the way a user would,
 *   2. checks what must ship: the launcher, the server and its egress guard,
 *      the server packages, the bundled Node.js, the notices and the pinned
 *      OCR model (npm is never run: the packages ship inside the ZIP),
 *   3. starts the packaged server with the bundled node.exe and waits for it to bind,
 *   4. exercises the real HTTP surface,
 *   5. runs the full smoke suite against THAT server,
 *   6. fails if the egress guard or the CSP report log recorded anything,
 *   7. renames the ZIP to "…-FAILED.zip" if any of it fails, so a broken
 *      build cannot ship (it is kept for inspection, not deleted).
 *
 * Everything runs on this computer; nothing touches the network.
 * Run automatically as the last step of `npm run release:zip`.
 * Standalone: `npm run verify:release` (add `-- --outDir=<folder>` for a
 * ZIP built with --outDir).
 */
import { existsSync, readdirSync, rmSync, mkdirSync, readFileSync, renameSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { spawn, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { TRAINEDDATA_SHA256 } from './bundle-tesseract-assets.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const ZIP_ROOT = 'HC-Fashion-House';
const LAUNCHER = 'HC Fashion House - WINDOWS.hta';
const outArg = process.argv.find((a) => a.startsWith('--outDir='));
const OUT_DIR = resolve(REPO_ROOT, (outArg && outArg.slice('--outDir='.length).trim()) || 'release-build');
const { version } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
const zipName = `${ZIP_ROOT}-v${version}.zip`;
const zipPath = join(OUT_DIR, zipName);
const failedPath = join(OUT_DIR, `${ZIP_ROOT}-v${version}-FAILED.zip`);

const log = (msg) => process.stdout.write(`${msg}\n`);
const fail = (msg, detail = '') => {
  log(`\n  x RELEASE VERIFICATION FAILED\n    ${msg}`);
  if (detail) log(`\n${detail}`);
  throw Object.assign(new Error(msg), { reported: true });
};
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

/**
 * Extract with Windows' own PowerShell, as close as a build machine gets to
 * what a user's Explorer does, so the real round trip is exercised rather
 * than the staging folder still on disk.
 */
function extract(zip, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  // Argument arrays and paths passed through the environment: nothing in a
  // path is ever parsed as code. It also works for paths with spaces.
  const run = spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    "$ProgressPreference = 'SilentlyContinue'; Expand-Archive -LiteralPath $env:HCFH_ZIP -DestinationPath $env:HCFH_DEST -Force",
  ], { stdio: 'pipe', encoding: 'utf8', env: { ...process.env, HCFH_ZIP: zip, HCFH_DEST: dest } });
  if (run.status !== 0) fail('Could not extract the ZIP.', run.stderr || run.stdout || '');
}

/** Every file below `dir`, skipping the bundled runtime and packages. */
function listFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'node') listFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Start the packaged server with its own node.exe; resolve with its URL once it binds. */
function startServer(systemDir) {
  // A clean environment: data in the extracted copy (never a developer's
  // HCFH_HOME), the egress guard in its normal blocking mode, no injected
  // Node options.
  const env = { ...process.env };
  for (const k of ['HCFH_HOME', 'HCFH_EGRESS', 'HCFH_BACKUP_DIR', 'NODE_OPTIONS']) delete env[k];
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(join(systemDir, 'node', 'node.exe'), ['server.js'], { cwd: systemDir, stdio: ['ignore', 'pipe', 'pipe'], env });
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill();
      rejectPromise(new Error(`server never bound within 30s.\n\n${stderr.trim()}`));
    }, 30_000);

    proc.stdout.on('data', (d) => {
      const m = String(d).match(/http:\/\/localhost:(\d+)/);
      if (m) { clearTimeout(timer); resolvePromise({ proc, url: m[0] }); }
    });
    // The failure that started all this was on stderr and nobody looked.
    proc.stderr.on('data', (d) => { stderr += String(d); });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      rejectPromise(new Error(`server exited with code ${code} before binding.\n\n${stderr.trim()}`));
    });
    proc.on('error', (err) => { clearTimeout(timer); rejectPromise(err); });
  });
}

const work = join(tmpdir(), `hcfh-verify-${Date.now()}`);
let server = null;

log(`\n  Verifying the packaged release — ${zipName}\n`);

try {
  if (process.platform !== 'win32') fail('Release verification runs on Windows: the ZIP ships a Windows node.exe.');
  if (!existsSync(zipPath)) fail(`${zipPath} not found. Run \`npm run release:zip\` first.`);

  log('  1/6  extracting the ZIP as a user would…');
  extract(zipPath, work);
  const root = join(work, ZIP_ROOT);
  const systemDir = join(root, '_system');
  if (!existsSync(systemDir)) fail(`No ${ZIP_ROOT}/_system/ folder inside the ZIP — the layout is wrong.`);

  // Cheap structural checks first, so an obvious omission fails in seconds.
  log('  2/6  checking the packaged files…');
  const required = [
    [root, LAUNCHER],
    [systemDir, 'server.js'], [systemDir, 'egress-guard.mjs'], [systemDir, 'package.json'],
    [systemDir, '.npmrc'], [systemDir, 'LICENSE'], [systemDir, 'README.md'],
    [systemDir, join('licenses', 'THIRD-PARTY-NOTICES.txt')],
    [systemDir, join('dist', 'index.html')], [systemDir, join('dist', 'tesseract', 'lang', 'eng.traineddata')],
    [systemDir, join('node', 'node.exe')], [systemDir, join('node', 'LICENSE')],
    [systemDir, join('node_modules', 'express', 'package.json')],
    [systemDir, join('node_modules', 'pdf-lib', 'package.json')],
    // The Control Panel finds its scripts by this file; without it Backup,
    // Restore, Move and Stop all say "Not available here".
    [systemDir, 'backup-windows.ps1'],
  ];
  for (const [base, f] of required) {
    if (!existsSync(join(base, f))) fail(`${base === root ? '' : '_system/'}${f.split('\\').join('/')} is missing from the ZIP.`);
  }
  const shipped = JSON.parse(readFileSync(join(systemDir, 'package.json'), 'utf8'));
  if (shipped.version !== version) fail(`_system/package.json says ${shipped.version}, the repo says ${version}.`);
  if (shipped.scripts) fail('_system/package.json carries npm scripts; the shipped copy must have none.');
  if (!/^ignore-scripts=true$/m.test(readFileSync(join(systemDir, '.npmrc'), 'utf8'))) fail('_system/.npmrc does not set ignore-scripts=true.');
  if (sha256(join(systemDir, 'dist', 'tesseract', 'lang', 'eng.traineddata')) !== TRAINEDDATA_SHA256) {
    fail('_system/dist/tesseract/lang/eng.traineddata does not match its pinned SHA-256.');
  }
  // Extracting a ZIP over an install must never overwrite books.
  if (existsSync(join(systemDir, 'data')) && readdirSync(join(systemDir, 'data')).length) fail('_system/data in the ZIP is not empty.');
  const unix = listFiles(root).filter((f) => /\.(sh|command|bash)$/i.test(f));
  if (unix.length) fail(`The Windows-only ZIP contains ${unix[0].slice(work.length + 1)}.`);
  const nodeVersion = spawnSync(join(systemDir, 'node', 'node.exe'), ['--version'], { encoding: 'utf8' });
  if (nodeVersion.status !== 0) fail('The bundled node.exe does not run.', nodeVersion.stderr || '');
  log(`       bundled Node.js ${nodeVersion.stdout.trim()}`);

  log('  3/6  starting the packaged server with the bundled node.exe…');
  server = await startServer(systemDir);
  log(`       bound at ${server.url}`);

  log('  4/6  exercising the HTTP surface…');
  const endpoints = ['/', '/api/bills', '/api/clients', '/api/products', '/api/profile'];
  for (const ep of endpoints) {
    const res = await fetch(`${server.url}${ep}`).catch((e) => {
      fail(`GET ${ep} threw: ${e.message}`);
    });
    if (!res.ok) fail(`GET ${ep} returned ${res.status} from the packaged server.`);
  }
  // The SPA must actually be served, not just a 200 from a fallback.
  const html = await (await fetch(server.url)).text();
  if (!/<div id="root">|<script/.test(html)) {
    fail('The server responded but did not serve the built app HTML.');
  }

  log('  5/6  running the smoke suite against the packaged server…');
  const smokeEnv = { ...process.env, APP_URL: server.url };
  delete smokeEnv.HCFH_ALLOW_LIVE;
  const smoke = spawnSync(process.execPath, [join(REPO_ROOT, 'tests', 'smoke.mjs')], {
    env: smokeEnv,
    stdio: 'inherit',
  });
  if (smoke.status !== 0) fail('The smoke suite failed against the packaged build.');

  // Nothing may have tried to leave the PC, in the server or in the page.
  log('  6/6  checking the egress-guard and CSP logs…');
  for (const name of ['egress-guard.log', 'csp.log']) {
    const file = join(systemDir, 'logs', name);
    if (existsSync(file) && statSync(file).size > 0) {
      fail(`_system/logs/${name} recorded blocked or reported requests:`,
        readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 20).join('\n'));
    }
  }

  log(`\n  OK — ${zipName} extracts, starts with its own Node.js, passes the suite and stays on this computer.\n`);
} catch (err) {
  if (existsSync(zipPath)) {
    try {
      rmSync(failedPath, { force: true });
      renameSync(zipPath, failedPath);
    } catch { /* leave it; the exit code still fails the build */ }
  }
  if (!err.reported) {
    log(`\n  x RELEASE VERIFICATION FAILED\n    ${err.message}`);
  }
  if (existsSync(failedPath)) log(`\n    The ZIP was renamed to ${failedPath}. Fix the cause and rebuild.\n`);
  process.exitCode = 1;
} finally {
  if (server?.proc && server.proc.exitCode === null) {
    const exited = new Promise((r) => { server.proc.once('exit', r); setTimeout(r, 5000); });
    server.proc.kill();
    await exited;
  }
  try { rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); } catch { /* best effort */ }
}
