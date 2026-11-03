// Copy the OCR files into public/tesseract/ so the bill OCR screen runs
// fully offline: the tesseract.js worker and WASM cores come from
// node_modules, and the English language data from vendor/tessdata, whose
// SHA-256 is pinned below. Runs before every build (prebuild) and every
// dev start, so a fresh checkout or a bumped tesseract version picks up
// the new files automatically.
//
// Nothing is downloaded. A missing or altered language file, or a missing
// tesseract.js install, stops the build with an error: before, a failed
// download still "succeeded" and shipped an app whose OCR could not work.
//
// v1.10.33 history: OCR used to load the worker, the core and the language
// data from public CDNs at runtime, three network hops on every first use
// ("stuck on 0" when the language download was blocked). Bundling removed
// the whole class.
//
// Size cost: ~25 MB added to the built app (worker 110KB + all WASM cores
// ~18MB + eng.traineddata ~5MB). Not precached by the service worker; it
// caches them on first use (see vite.config.js workbox rules).

import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const NODE_MODULES = join(REPO_ROOT, 'node_modules');
const PUBLIC_DIR = join(REPO_ROOT, 'public', 'tesseract');
const CORE_OUT = join(PUBLIC_DIR, 'core');
const LANG_OUT = join(PUBLIC_DIR, 'lang');

// The vendored English model; its source is recorded in vendor/tessdata/SOURCE.txt.
// Replace the file and this hash together, on purpose, or the build stops.
// scripts/build-release-zip.mjs and scripts/verify-release.mjs import both.
export const TRAINEDDATA_SOURCE = join(REPO_ROOT, 'vendor', 'tessdata', 'eng.traineddata');
export const TRAINEDDATA_SHA256 = '5dc5d8d640a212c9d6184921ba103b186f50e0fed9ee716c53e6b312b400d747';

const rel = (p) => relative(REPO_ROOT, p).split('\\').join('/');

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function exists(p) {
  return stat(p).then(() => true, () => false);
}

async function copyIfExists(src, dst) {
  if (!(await exists(src))) return false;
  await ensureDir(dirname(dst));
  await copyFile(src, dst);
  return true;
}

// Copy a package's licence file(s) next to the files copied from it.
async function copyLicences(pkgDir, outDir) {
  let copied = 0;
  for (const name of await readdir(pkgDir).catch(() => [])) {
    if (/^licen[cs]e/i.test(name) && await copyIfExists(join(pkgDir, name), join(outDir, name))) copied++;
  }
  return copied;
}

async function main() {
  // v1.10.69 - do nothing in an installed copy.
  //
  // A release install serves dist/, and dist/tesseract already carries every
  // one of these files, so there is nothing to rebuild there. A source
  // checkout has public/ (it is in git); an installed copy does not. That is
  // the difference, and it needs no new flag to detect. This check stays
  // ahead of the language-file check below: an installed copy has no vendor/.
  const PUBLIC_ROOT = join(REPO_ROOT, 'public');
  const isSourceCheckout = await stat(PUBLIC_ROOT).then((s) => s.isDirectory()).catch(() => false);
  if (!isSourceCheckout) {
    console.log('Installed copy - OCR files already ship in dist/. Nothing to do.');
    return;
  }

  // 1. English language data: vendored and pinned. Verified before anything
  // is copied, so a bad file never reaches public/ or dist/.
  const model = await readFile(TRAINEDDATA_SOURCE).catch(() => null);
  if (!model) {
    throw new Error(`${rel(TRAINEDDATA_SOURCE)} is missing. It is part of the repository; restore it from your copy of the repo.`);
  }
  const sha = createHash('sha256').update(model).digest('hex');
  if (sha !== TRAINEDDATA_SHA256) {
    throw new Error(
      `${rel(TRAINEDDATA_SOURCE)} does not match its pinned SHA-256.\n` +
      `    expected ${TRAINEDDATA_SHA256}\n` +
      `    found    ${sha}\n` +
      '    Restore the original file. If the model is being replaced on purpose, update\n' +
      '    TRAINEDDATA_SHA256 in this script and vendor/tessdata/SOURCE.txt together.'
    );
  }

  // 2. The worker and cores come from the installed tesseract.js packages.
  const workerSrc = join(NODE_MODULES, 'tesseract.js', 'dist', 'worker.min.js');
  if (!(await exists(workerSrc))) {
    throw new Error('tesseract.js is not installed (node_modules/tesseract.js/dist/worker.min.js is missing). Run npm ci first.');
  }

  console.log('Bundling tesseract assets into public/tesseract/');
  await ensureDir(PUBLIC_DIR);
  await ensureDir(CORE_OUT);
  await ensureDir(LANG_OUT);

  // Worker, with its licence notices.
  await copyFile(workerSrc, join(PUBLIC_DIR, 'worker.min.js'));
  await copyIfExists(join(NODE_MODULES, 'tesseract.js', 'dist', 'worker.min.js.LICENSE.txt'), join(PUBLIC_DIR, 'worker.min.js.LICENSE.txt'));
  await copyLicences(join(NODE_MODULES, 'tesseract.js'), PUBLIC_DIR);
  console.log('  ✓ worker.min.js');

  // Core — copy ALL variants. tesseract picks at runtime based on
  // WebAssembly SIMD feature detection; if only one is present the
  // wrong build will 404 on some browsers.
  const CORE_FILES = [
    'tesseract-core.js',
    'tesseract-core-lstm.js', 'tesseract-core-lstm.wasm', 'tesseract-core-lstm.wasm.js',
    'tesseract-core-simd.js', 'tesseract-core-simd.wasm', 'tesseract-core-simd.wasm.js',
    'tesseract-core-simd-lstm.js', 'tesseract-core-simd-lstm.wasm', 'tesseract-core-simd-lstm.wasm.js',
    'tesseract-core-relaxedsimd.js', 'tesseract-core-relaxedsimd.wasm', 'tesseract-core-relaxedsimd.wasm.js',
    'tesseract-core-relaxedsimd-lstm.js', 'tesseract-core-relaxedsimd-lstm.wasm', 'tesseract-core-relaxedsimd-lstm.wasm.js',
  ];
  let coreCount = 0;
  for (const f of CORE_FILES) {
    const src = join(NODE_MODULES, 'tesseract.js-core', f);
    const dst = join(CORE_OUT, f);
    if (await copyIfExists(src, dst)) coreCount++;
  }
  if (coreCount === 0) {
    throw new Error('No core files found in node_modules/tesseract.js-core. Run npm ci first.');
  }
  await copyLicences(join(NODE_MODULES, 'tesseract.js-core'), CORE_OUT);
  console.log(`  ✓ core files copied (${coreCount}/${CORE_FILES.length})`);

  // English language data, with its licence (Apache-2.0).
  await copyFile(TRAINEDDATA_SOURCE, join(LANG_OUT, 'eng.traineddata'));
  await copyIfExists(join(REPO_ROOT, 'vendor', 'tessdata', 'LICENSE'), join(LANG_OUT, 'LICENSE'));
  console.log(`  ✓ eng.traineddata (${(model.length / 1024 / 1024).toFixed(1)}MB, SHA-256 verified)`);

  console.log('Done. Restart dev server / rebuild for changes to take effect.');
}

// Run only when executed directly; the release scripts import the pin above.
const isMain = (() => {
  try {
    return resolve(process.argv[1] || '').toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
  } catch {
    return false;
  }
})();

if (isMain) {
  main().catch((err) => {
    console.error(`bundle-tesseract-assets FAILED: ${err.message || err}`);
    // Fail the build: an app without its OCR files breaks at the counter.
    process.exit(1);
  });
}
