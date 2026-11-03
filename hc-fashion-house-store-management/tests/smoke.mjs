/**
 * Smoke tests — run with `npm test`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every bug in this file is one that shipped to a real user and was
 * reported from the field. None of them threw an error, produced a stack
 * trace or failed a build — they all looked fine to the developer and
 * wrong to the person using the app. That is precisely the class of defect
 * a human notices in five seconds and a linter never will.
 *
 * Two of them (ERR-004, ERR-007) reproduce ONLY in Firefox, so this runs
 * Firefox deliberately. Testing in Chrome alone is what let them ship.
 * SMOKE_BROWSER=msedge runs the installed Microsoft Edge (the shop's
 * browser) through Playwright's Chromium driver instead, for a machine where
 * Playwright's own Firefox cannot be installed. Firefox stays the default.
 *
 * The rule when adding to this file: a test earns its place by having
 * FAILED against the build that shipped the bug. A test that never went
 * red is decoration.
 *
 * Usage:
 *   npm test              # starts a server on a free port with a fresh,
 *                         # temporary data folder (HCFH_HOME), runs, cleans up
 *   APP_URL=... npm test  # run against an already-running instance. Refused
 *                         # unless that instance keeps its data in a temporary
 *                         # folder: the suite edits the books it runs against.
 *                         # HCFH_ALLOW_LIVE=1 overrides; never use it on real books.
 *   SMOKE_BROWSER=msedge npm test   # the same suite in Microsoft Edge
 */
import { chromium, firefox } from 'playwright';
import { spawn } from 'child_process';
import { get as httpGet } from 'http';
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { isAbsolute, join, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { setTimeout as sleep } from 'timers/promises';

// The browser the suite drives: Firefox unless SMOKE_BROWSER says otherwise.
const BROWSERS = {
  firefox: { name: 'Firefox', launch: () => firefox.launch({ headless: true }) },
  msedge: { name: 'Microsoft Edge', launch: () => chromium.launch({ channel: 'msedge', headless: true }) },
};
const SMOKE_BROWSER = String(process.env.SMOKE_BROWSER || 'firefox').trim().toLowerCase();

const results = [];
let serverProc = null;
let serverErr = '';
// The temporary data folder of the server this suite starts (null with APP_URL).
let smokeHome = null;
const APP_ROOT = fileURLToPath(new URL('..', import.meta.url));

const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? `  — ${detail}` : ''}`);
};

/** True when `p` is inside the OS temporary folder (case-insensitive, either spelling of it). */
function isUnderTemp(p) {
  const real = (x) => { try { return realpathSync.native(x); } catch { return x; } };
  const norm = (x) => resolve(x).toLowerCase().replace(/[\\/]+$/, '') + sep;
  const roots = [tmpdir(), real(tmpdir())].map(norm);
  return [p, real(p)].map(norm).some((x) => roots.some((r) => x.startsWith(r)));
}

/**
 * The suite creates and edits records, burns invoice numbers and changes
 * settings in whatever books it runs against. An instance we did not start is
 * therefore used only when the server says its data folder is a temporary
 * one, as verify-release's freshly extracted package is.
 */
async function refuseLiveData(url) {
  if (process.env.HCFH_ALLOW_LIVE === '1') return;
  const st = await fetch(new URL('/api/control-panel/status', url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  const folder = typeof st?.dataFolder === 'string' ? st.dataFolder : '';
  if (st?.dataFolderIsTemp === true || (isAbsolute(folder) && isUnderTemp(folder))) return;
  throw new Error(`APP_URL ${url} keeps its data in ${folder || 'an unknown folder'}, not a temporary one. `
    + 'The suite would edit those books, so it refuses. Point it at a copy, or set HCFH_ALLOW_LIVE=1 (never on real books).');
}

/**
 * Boot the app unless the caller pointed us at a running one. Our own server
 * gets a fresh temporary data folder (HCFH_HOME), so a run never reads or
 * changes the books, PDFs, Trash or port.txt of a real install.
 */
async function startServer() {
  if (process.env.APP_URL) {
    await refuseLiveData(process.env.APP_URL);
    return process.env.APP_URL;
  }
  smokeHome = mkdtempSync(join(tmpdir(), 'hcfh-smoke-'));
  const env = { ...process.env, HCFH_HOME: smokeHome };
  delete env.HCFH_EGRESS; // the egress guard blocks by default; a log-only switch has no place in the gate
  serverProc = spawn(process.execPath, [join(APP_ROOT, 'server.js')], { cwd: APP_ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  // Always drained: a full stderr pipe would stall the server mid-run.
  serverProc.stderr.on('data', (d) => { serverErr = (serverErr + d).slice(-4000); });
  const tail = () => (serverErr.trim() ? `\n${serverErr.trim().split('\n').slice(-8).join('\n')}` : '');
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not report a port within 30s${tail()}`)), 30_000);
    serverProc.stdout.on('data', (d) => {
      const m = String(d).match(/http:\/\/localhost:(\d+)/);
      if (m) { clearTimeout(timer); resolve(m[0]); }
    });
    serverProc.on('error', (e) => { clearTimeout(timer); reject(e); });
    serverProc.on('exit', (code) => { clearTimeout(timer); reject(new Error(`server exited (code ${code}) before reporting a port${tail()}`)); });
  });
  return url;
}

/** Close the browser and stop our server, waiting for it to exit so its files are released. */
async function stopAll(browser) {
  if (browser) await browser.close().catch(() => {});
  if (serverProc && serverProc.exitCode === null && serverProc.signalCode === null) {
    const exited = new Promise((r) => serverProc.once('exit', r));
    serverProc.kill();
    await Promise.race([exited, sleep(5000)]);
  }
}

function removeSmokeHome() {
  if (!smokeHome) return;
  try { rmSync(smokeHome, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); }
  catch (e) { console.log(`  (could not remove the temporary data folder ${smokeHome}: ${e.message})`); }
}

// Every request the app makes must stay on this computer. Google Drive is
// not set up in the suite, so a request to any other host fails the run:
// it is a connection the shop never agreed to.
const outsideRequests = [];
const isLocalHost = (h) => h === 'localhost' || h === '[::1]' || h === '::1' || /^127\.\d+\.\d+\.\d+$/.test(h);
function noteOutside(url, kind) {
  let u;
  try { u = new URL(url); } catch { return; }
  if (!/^(https?|wss?|ftp):$/.test(u.protocol)) return; // data:, blob: and about: never leave the PC
  if (isLocalHost(u.hostname.toLowerCase())) return;
  outsideRequests.push(`${kind} ${u.origin}${u.pathname}`.slice(0, 160));
}
function watchRequests(context) {
  context.on('request', (req) => noteOutside(req.url(), req.resourceType()));
  context.on('page', (p) => p.on('websocket', (ws) => noteOutside(ws.url(), 'websocket')));
}

// The old product and maker names must not appear anywhere on screen.
const OLD_NAME = /dice ?codes|free[ -]?gst[ -]?bill/i;
const oldNameSeen = [];

/** Remove only the records this suite created. */
async function cleanup(page) {
  try {
    await page.evaluate(async () => {
      const del = async (kind) => {
        const list = await (await fetch(`/api/${kind}`)).json();
        await Promise.all((list || [])
          .filter((r) => String(r.id || '').startsWith('smoketest-'))
          .map((r) => fetch(`/api/${kind}/${encodeURIComponent(r.id)}`, { method: 'DELETE' })));
      };
      await del('purchases');
      await del('products');
      await del('clients');
      await del('profiles');
      await del('expenses');
      await del('receipts');
      await del('recurring');
      await del('templates');
      // v1.10.77 - a PIN this suite set must never stay on the user's app.
      await fetch('/api/lock/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: null, currentPin: '13572468' }) });
      // The expense added through the form gets a generated id.
      const expenses = await (await fetch('/api/expenses')).json();
      await Promise.all((expenses || [])
        .filter((e) => String(e.description || '').startsWith('SMOKE-EXP-'))
        .map((e) => fetch(`/api/expenses/${encodeURIComponent(e.id)}`, { method: 'DELETE' })));
      // The PDF step saves a real invoice; remove it by client name so the
      // suite is repeatable and leaves no test data in the user's books.
      const bills = await (await fetch('/api/bills')).json();
      await Promise.all((bills || [])
        .filter((b) => (b.clientName || '') === 'Smoke Test Client'
                     || String(b.id || '').startsWith('smoketest-'))
        .map((b) => fetch(`/api/bills/${encodeURIComponent(b.id)}`, { method: 'DELETE' })));
    });
  } catch { /* best effort */ }
}


/**
 * Clear anything a FRESH install shows before the app is usable.
 *
 * The wizard's button is "Skip Setup" with a capital S; the suite used to
 * match /^Skip setup$/ and silently never matched. In the development tree
 * onboarding is already complete so no wizard appears, and the mismatch was
 * invisible — against a real packaged install it blocked every later click.
 *
 * Called after EVERY navigation that reloads the page, because anything
 * gating first use can reappear, and a test that hangs for 30s tells you
 * far less than one that simply clears the way and carries on.
 *
 * `seen`, when given, collects the text of each screen it clears, so the
 * first run's welcome wording can be checked.
 */
async function dismissFirstRun(page, seen = null) {
  // A fresh install shows TWO screens in sequence, and their buttons are
  // capitalised differently: a region step ("Skip Setup") and then a
  // business-type step ("Skip setup"). Clearing one reveals the other.
  //
  // The visibility test matters as much as the clicking. An earlier version
  // used `offsetParent !== null`, which is ALWAYS null for a
  // `position: fixed` element — and `.modal-overlay` is fixed. So it
  // reported "nothing in the way" while a full-screen wizard sat on top,
  // and every later click timed out against an intercepted element.
  const blockingOverlay = () => page.evaluate(() =>
    [...document.querySelectorAll('.modal-overlay')].some((o) => {
      const cs = getComputedStyle(o);
      const r = o.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    }));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const hasNav = await page.evaluate(() => !!document.querySelector('.nav-btn'));
    if (hasNav && !(await blockingOverlay())) return;
    if (seen) seen.push(await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim()).catch(() => ''));
    let clicked = false;
    for (const pattern of [/^skip setup$/i, /none of these/i, /get started/i, /continue|finish|close/i]) {
      const btn = page.getByRole('button', { name: pattern });
      if (await btn.count()) {
        await btn.first().click({ timeout: 5000 }).catch(() => {});
        await sleep(1200);
        clicked = true;
        break;
      }
    }
    if (!clicked) break;
  }
}

// Started inside a guard: if the server or the browser cannot start, nothing
// may be left running and the temporary data folder is removed.
let APP = null;
let profileAtStart = null;
let browser = null;
let ctx = null;
let page = null;
try {
  if (!BROWSERS[SMOKE_BROWSER]) {
    throw new Error(`SMOKE_BROWSER=${SMOKE_BROWSER} is not supported; use ${Object.keys(BROWSERS).join(' or ')}`);
  }
  APP = await startServer();
  console.log(`\nRunning smoke tests against ${APP} (${BROWSERS[SMOKE_BROWSER].name})${smokeHome ? `, data in ${smokeHome}` : ''}\n`);

  // The suite changes the ACTIVE business profile several times, and the server
  // replaces that file wholesale on every save. Snapshot it before anything runs
  // and put it back in `finally`, so a step that times out half way can never
  // leave a real profile reduced to a bare "Smoke Alpha".
  profileAtStart = await fetch(`${APP}/api/profile`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  browser = await BROWSERS[SMOKE_BROWSER].launch();
  // 1366x768 is the resolution the preview-clipping bug needed (ERR-005).
  // It is also the most common laptop size among this app's users.
  ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  watchRequests(ctx);
  // Playwright gives a page 30 s to load. On a busy machine - another dev
  // server pinning three cores was enough - a reload under the release gate ran
  // past that and aborted the whole suite, twice in a row, with code that had
  // just passed 76/76. A timeout bounds how long we wait, not whether the page
  // is right, so it gets room; every assertion stays exactly as strict.
  ctx.setDefaultNavigationTimeout(120000);
  ctx.setDefaultTimeout(60000);
  page = await ctx.newPage();
} catch (err) {
  console.log(`\n  ✗ the suite could not start: ${err.message}\n`);
  await stopAll(browser);
  removeSmokeHome();
  process.exit(1);
}

const cspViolations = [];
page.on('console', (m) => { if (/Content-Security-Policy/i.test(m.text())) cspViolations.push(m.text()); });

/** Record any old product or maker name on the current screen. */
const noteOldName = async (where, p = page) => {
  const m = (await p.evaluate(() => document.body.innerText || '').catch(() => '')).match(OLD_NAME);
  if (m) oldNameSeen.push(`${where}: "${m[0]}"`);
};

// Dates relative to today, so the fixtures never age out of the current
// financial year (same UTC day as the rest of the suite's dates).
const isoDay = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

try {
  await page.goto(APP, { waitUntil: 'networkidle' });
  await sleep(2000);
  const firstRun = [];
  await dismissFirstRun(page, firstRun);
  check('first-run setup can be dismissed',
    await page.evaluate(() => !!document.querySelector('.nav-btn')));
  // A fresh install greets the shop by its own name. Only checked when a
  // first-run screen appeared (always, for the suite's own fresh server).
  if (smokeHome || firstRun.length) {
    const shown = firstRun.join(' ');
    check('a fresh install says "Welcome to HC Fashion House", with no trace of the old name',
      /Welcome to HC Fashion House/.test(shown) && !OLD_NAME.test(shown),
      (shown.match(OLD_NAME) || [])[0] || shown.slice(0, 90));
  }

  // ---- App loads without breaking its own security policy ----------------
  // ERR-004 / ERR-007: the CSP blocked the print iframe and, separately,
  // the app's own stylesheet inside html2canvas's clone — so PDFs rendered
  // with no CSS. Both were Firefox-only and silent.
  check('app loads with no CSP violations', cspViolations.length === 0,
    cspViolations[0]?.slice(0, 90) || '');

  const styled = await page.evaluate(() => document.styleSheets.length > 0
    && getComputedStyle(document.body).fontFamily.includes('Inter'));
  check('stylesheet actually applied', styled);

  // ---- The shop's own name and mark ---------------------------------------
  const brand = await page.evaluate(() => {
    const logo = document.querySelector('.sidebar-logo img');
    return {
      sidebar: (document.querySelector('.sidebar-brand')?.innerText || '').replace(/\s+/g, ' ').trim(),
      title: document.title,
      logo: logo ? { alt: logo.getAttribute('alt'), loaded: logo.complete && logo.naturalWidth > 0 } : null,
    };
  });
  check('the sidebar says "HC Fashion House" (no subtitle) and so does the window title',
    brand.sidebar === 'HC Fashion House' && /^HC Fashion House( - .+)?$/.test(brand.title),
    JSON.stringify({ sidebar: brand.sidebar, title: brand.title }));
  check('the sidebar shows the HC monogram', brand.logo?.alt === 'HC Fashion House' && brand.logo.loaded === true,
    JSON.stringify(brand.logo));
  await noteOldName('Dashboard');

  // ---- One-time clean-up of removed features (hcfh_purge_v1, main.jsx) ----
  // What an older build left behind (promotion flags in the browser and in
  // the data-folder copy of its settings) is removed once, then the flag is
  // set. Seed it, clear the flag, load the app again.
  const deadPrefs = ['freegstbill_supportNudge', 'freegstbill_welcomeCard', 'freegstbill_starBanner'];
  await page.evaluate(async (keys) => {
    const set = Object.fromEntries(keys.map((k) => [k, '1']));
    await fetch('/api/local-prefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ set }) });
    for (const k of [...keys, 'freegstbill_supportersCache', 'freegstbill_dismissedUpdate']) localStorage.setItem(k, '1');
    localStorage.removeItem('hcfh_purge_v1');
  }, deadPrefs);
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(1500);
  await dismissFirstRun(page);
  let purge = null;
  for (let i = 0; i < 20; i++) {
    purge = await page.evaluate(async (keys) => {
      const prefs = (await (await fetch('/api/local-prefs')).json()).value || {};
      return {
        flag: localStorage.getItem('hcfh_purge_v1'),
        inDataFolder: keys.filter((k) => k in prefs),
        inBrowser: [...keys, 'freegstbill_supportersCache', 'freegstbill_dismissedUpdate'].filter((k) => localStorage.getItem(k) !== null),
      };
    }, deadPrefs);
    if (purge.flag === '1') break;
    await sleep(500);
  }
  check('the one-time clean-up removes the old promotion and update flags, then sets hcfh_purge_v1',
    purge?.flag === '1' && purge.inDataFolder.length === 0 && purge.inBrowser.length === 0, JSON.stringify(purge));

  // ---- Seed fixtures -----------------------------------------------------
  await page.evaluate(async (day) => {
    const post = (u, b) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    await post('/api/products', { id: 'smoketest-m', name: 'Mouse', hsn: 'sdf', purchasePrice: 250, taxPercent: 18, stock: 0 });
    await post('/api/products', { id: 'smoketest-p', name: 'Pen drive', hsn: 's', purchasePrice: 399, taxPercent: 12, stock: 0 });
    await post('/api/purchases', {
      id: 'smoketest-b1', date: day, supplierName: 'Alpha Traders',
      supplierGstin: '07AAAAA0000A1Z1', supplierAddress: 'Delhi', interstate: false,
      invoiceNumber: 'SMOKE/A', paymentStatus: 'Unpaid',
      items: [{ name: 'Mouse', hsn: 'sdf', quantity: 1, rate: 250, taxPercent: 18, cessPercent: 0 }],
    });
    await post('/api/purchases', {
      id: 'smoketest-b2', date: day, supplierName: 'Beta Supplies',
      supplierGstin: '29BBBBB1111B2Z2', supplierAddress: 'Bengaluru', interstate: true,
      invoiceNumber: 'SMOKE/B', paymentStatus: 'Unpaid',
      items: [{ name: 'Pen drive', hsn: 's', quantity: 1, rate: 399, taxPercent: 12, cessPercent: 0 }],
    });
  }, isoDay(0));
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(1600);
  await dismissFirstRun(page);

  // ---- Purchase bill: suggestions ---------------------------------------
  await page.getByText('Purchases', { exact: false }).first().click();
  await sleep(1400);
  await page.getByRole('button', { name: /add purchase/i }).first().click();
  await sleep(1200);
  // The suggestions come from products and past purchases loaded in the
  // background: on a slow machine (Docker) a fixed wait read them too early.
  for (let i = 0; i < 16 && !(await page.locator('#fgsb-item-history option').count()); i++) await sleep(500);

  const opts = await page.evaluate(() =>
    [...document.querySelectorAll('#fgsb-item-history option')].map((o) => ({
      value: o.value,
      // ERR-008: Firefox renders label/text INSTEAD of value. Assert on what
      // the user would actually SEE, not on the data behind the option — the
      // original test checked .value and passed against the broken build.
      displayed: o.getAttribute('label') || (o.textContent || '').trim() || o.value,
    })));

  check('#42 product catalogue appears in item suggestions',
    opts.some((o) => o.value === 'Mouse') && opts.some((o) => o.value === 'Pen drive'),
    opts.map((o) => o.value).join(', '));

  check('#40 suggestions display names, not GSTIN/HSN',
    opts.every((o) => o.displayed === o.value),
    opts.find((o) => o.displayed !== o.value)?.displayed || '');

  // ---- Purchase bill: re-selection refreshes details ---------------------
  const item = page.locator('input[list="fgsb-item-history"]').first();
  const rowVals = () => page.evaluate(() => {
    const el = document.querySelector('input[list="fgsb-item-history"]');
    const wrap = el.closest('div[style*="flex"]')?.parentElement;
    return [...(wrap?.querySelectorAll('input.form-input') || [])].map((i) => i.value);
  });

  await item.fill('Pen drive'); await sleep(600);
  await item.fill('Mouse'); await sleep(600);
  const swapped = await rowVals();
  check('#43 changing the item refreshes HSN and rate',
    swapped[1] === 'sdf' && swapped[3] === '250',
    `hsn=${swapped[1]} rate=${swapped[3]}`);

  // The counterpart property: a hand-typed value must NOT be overwritten.
  // These two pull in opposite directions, which is what made #43 subtle.
  await page.locator('input[placeholder="HSN"]').first().fill('MYOWN');
  await sleep(400);
  await item.fill('Pen drive'); await sleep(600);
  const edited = await rowVals();
  check('#43 a hand-typed value survives re-selection',
    edited[1] === 'MYOWN', `hsn=${edited[1]}`);

  // ---- Purchase bill: supplier re-selection ------------------------------
  const sup = page.locator('input[list="fgsb-supplier-history"]');
  const gstinBox = page.locator('input[placeholder="15-digit GSTIN"]');
  await sup.fill('Alpha Traders'); await sleep(600);
  await sup.fill('Beta Supplies'); await sleep(600);
  check('#43 changing supplier refreshes the GSTIN',
    (await gstinBox.inputValue()) === '29BBBBB1111B2Z2',
    await gstinBox.inputValue());

  await page.keyboard.press('Escape');
  await sleep(600);

  // ---- Invoice preview + PDF --------------------------------------------
  await page.getByText('New Invoice', { exact: false }).first().click();
  await page.waitForSelector('.invoice-preview-container', { timeout: 20000 });
  await sleep(1500);

  // Fill a REAL invoice. Since #47, saving or printing a blank one is
  // refused on purpose, so the PDF check below needs a client and a priced
  // line item — the same minimum a user has to provide.
  await page.locator('input[placeholder="Type client name to search or add new"]')
    .fill('Smoke Test Client');
  await sleep(500);
  await page.keyboard.press('Escape');           // dismiss the client suggestion list
  // The line-item name box carries no placeholder, so target it through its
  // row: `.line-item-row` -> first text input, then the row's numeric fields.
  const row = page.locator('.line-item-row').first();
  await row.locator('input[type="text"]').first().fill('Test item');
  await sleep(400);
  await page.keyboard.press('Escape');           // dismiss product suggestions
  const rowNums = row.locator('input[type="number"]');
  await rowNums.nth(0).fill('2');                // qty
  await rowNums.nth(1).fill('500');              // rate
  await sleep(800);

  // ERR-005: transform: scale() does not shrink the layout box, and a
  // centred overflow puts the left edge in unreachable negative scroll.
  const clipped = await page.evaluate(() => {
    const pane = document.querySelector('.preview-pane');
    const inv = document.querySelector('.invoice-preview-container');
    pane.scrollLeft = 0;
    return Math.round(Math.max(0, pane.getBoundingClientRect().left - inv.getBoundingClientRect().left));
  });
  check('ERR-005 no unreachable clipping at 1366px', clipped === 0, `${clipped}px hidden`);

  await page.getByRole('button', { name: /^Fit$/ }).click();
  await sleep(1000);
  const fits = await page.evaluate(() => {
    const pane = document.querySelector('.preview-pane');
    return pane.scrollWidth <= pane.clientWidth + 1;
  });
  check('Fit actually fits the preview', fits);

  // #58 item 2: the action toolbar must stay reachable from the bottom of a
  // long invoice. Reported as "you have to scroll all page" to reach the
  // preview toggle — but Save, Print and E-Way Bill were equally stranded.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(700);
  const toolbar = await page.evaluate(() => {
    const tb = document.querySelector('.generator-toolbar');
    if (!tb) return null;
    const r = tb.getBoundingClientRect();
    const previewBtn = [...tb.querySelectorAll('button')].find((b) => /Preview/i.test(b.innerText));
    return {
      onScreen: r.top >= -2 && r.top < window.innerHeight,
      hasPreviewButton: !!previewBtn,
    };
  });
  check('#58 the action toolbar stays on screen when scrolled to the bottom',
    !!toolbar?.onScreen);
  check('#58 the preview toggle lives in that toolbar',
    !!toolbar?.hasPreviewButton);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);

  // ERR-004/007 again, end to end: a real PDF must download, and its size
  // is a proxy for whether the stylesheet made it into the render.
  const outsideBeforePdf = outsideRequests.length;
  let pdfBytes = 0;
  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60_000 }),
      page.getByRole('button', { name: /save & download/i }).first().click(),
    ]);
    const { statSync } = await import('fs');
    pdfBytes = statSync(await dl.path()).size;
  } catch { /* leaves pdfBytes 0 → fails below */ }
  check('PDF downloads and is styled', pdfBytes > 300_000, `${pdfBytes} bytes`);

  check('no CSP violations during PDF generation', cspViolations.length === 0,
    cspViolations[0]?.slice(0, 90) || '');

  // Save & Download used to upload every invoice to Google Drive by itself
  // once a Client ID was saved. Now only an explicit "Save to Drive" uploads,
  // and that button exists only when Drive is set up, which it is not here.
  await sleep(1500); // room for anything the download might have set off
  check('Save & Download sends nothing outside the PC (no Google request)',
    outsideRequests.length === outsideBeforePdf, outsideRequests.slice(outsideBeforePdf, outsideBeforePdf + 3).join(' | '));
  let toolbarButtons = [];
  for (let i = 0; i < 20; i++) { // the button reads "Generating..." until the PDF is done
    toolbarButtons = await page.evaluate(() =>
      [...document.querySelectorAll('.generator-toolbar button')].map((b) => b.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean));
    if (toolbarButtons.some((t) => /save & download/i.test(t))) break;
    await sleep(500);
  }
  check('no "Save to Drive" button while Google Drive is not set up',
    toolbarButtons.some((t) => /save & download/i.test(t)) && !toolbarButtons.some((t) => /save to drive/i.test(t)),
    JSON.stringify(toolbarButtons));
  await noteOldName('New Invoice');

  // Generating the PDF saves the invoice, so the editor now holds a real,
  // dirty bill and navigating away raises the leave-guard. Dismiss it, then
  // delete the bill so the suite leaves nothing behind.
  // ---- Settings: unsaved changes are visible -----------------------------
  await page.getByText('Settings', { exact: false }).first().click();
  await sleep(900);
  const discard = page.getByRole('button', { name: /Discard.*leave/i });
  if (await discard.count()) {
    await discard.click();
    await sleep(1200);
    await page.getByText('Settings', { exact: false }).first().click();
  }
  await sleep(2000);
  const barShown = () => page.evaluate(() =>
    !![...document.querySelectorAll('div')]
      .find((d) => /unsaved changes/i.test(d.textContent || '') && d.offsetParent !== null));

  check('#43 no unsaved-changes bar on a clean form', !(await barShown()));
  await noteOldName('Settings');

  // Use a value that cannot already be on disk. A fixed string silently
  // breaks this test the second time it runs: the field already holds it,
  // so "editing" changes nothing and no bar should appear — the test would
  // fail while the app behaved correctly. Original is restored below so the
  // suite leaves the user's business name untouched.
  const nameField = page.locator('#section-company input[name="businessName"]');
  // The form unlocks once the saved profile has loaded (v1.10.75).
  await page.waitForFunction(() => document.querySelector('#section-company fieldset')?.disabled === false, null, { timeout: 30000 });
  const originalName = await nameField.inputValue();
  await nameField.fill(`Smoke Test ${Date.now()}`);
  // Poll rather than a fixed pause: on a loaded machine the re-render can take
  // longer than 700 ms, and that failed the gate with the app working fine.
  const barWithin = async (ms) => { for (const end = Date.now() + ms; Date.now() < end; await sleep(250)) { if (await barShown()) return true; } return barShown(); };
  const dirtyShown = await barWithin(5000);
  const dirtyWhy = dirtyShown ? '' : JSON.stringify(await page.evaluate(() => ({
    title: document.querySelector('.page-title')?.innerText,
    bar: document.querySelector('.settings-savebar')?.innerText.replace(/\s+/g, ' '),
    name: document.querySelector('#section-company input[name="businessName"]')?.value,
    modal: document.querySelector('.modal-overlay')?.innerText.slice(0, 80),
  })));
  if (!dirtyShown && process.env.SMOKE_FAIL_SHOT) await page.screenshot({ path: process.env.SMOKE_FAIL_SHOT.replace(/\.png$/, '-43.png') }).catch(() => {});
  check('#43 editing the profile surfaces an unsaved-changes bar', dirtyShown, dirtyWhy);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(600);
  check('#43 that bar stays reachable after scrolling', await barWithin(3000));

  // #44: the bar must clear once the profile is actually on disk, and must
  // NOT come back when the page is revisited. v1.10.55 recorded the saved
  // baseline in only one of three persistence paths, so the bar could insist
  // on unsaved changes for data that was already stored — and the
  // beforeunload guard then popped a browser dialog on every close.
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.getByRole('button', { name: /Save Profile/i }).first().click();
  await sleep(2500);
  check('#44 bar clears after saving', !(await barShown()));

  await page.getByText('Dashboard', { exact: false }).first().click();
  await sleep(1200);
  await page.getByText('Settings', { exact: false }).first().click();
  await sleep(2500);
  check('#44 bar stays hidden on returning to Settings', !(await barShown()));

  // Put the real business name back and persist it.
  await page.locator('#section-company input[name="businessName"]').fill(originalName);
  await sleep(500);
  const restore = page.getByRole('button', { name: /Save Profile/i }).first();
  if (await restore.count()) { await restore.click(); await sleep(2000); }

  // #47: a blank invoice must not save. Saving reserves an invoice number,
  // so an empty save leaves a permanent gap in a sequence GST expects to be
  // gapless — the record being useless is the lesser problem.
  const billCount = () => page.evaluate(async () => (await (await fetch('/api/bills')).json()).length);
  const before = await billCount();
  await page.getByText('New Invoice', { exact: false }).first().click();
  await page.waitForSelector('.invoice-preview-container', { timeout: 20000 });
  await sleep(1500);
  await page.getByRole('button', { name: /^Save$/ }).first().click();
  await sleep(2500);
  check('#47 blank invoice is refused', (await billCount()) === before,
    `bills ${before} -> ${await billCount()}`);

  // #53: notifications must clear when read, and come back when the facts
  // change. The second half is the part that matters — a "mark read" that
  // silences a genuinely new overdue invoice would be worse than not
  // clearing at all.
  const seedOverdue = (n) => page.evaluate(async ({ n, due }) => {
    await fetch('/api/bills', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `smoketest-ovd-${n}`, invoiceNumber: `SMOKE-OVD/${n}`, clientName: 'Smoke Test Client',
        status: 'unpaid', totalAmount: 5000, payments: [], items: [],
        data: { details: { dueDate: due, invoiceNumber: `SMOKE-OVD/${n}` },
                client: { name: 'Smoke Test Client' }, totals: { total: 5000 } },
      }),
    });
  }, { n, due: isoDay(-30) });
  const badgeCount = () => page.evaluate(() => {
    const bell = [...document.querySelectorAll('button')].find((b) => /notification/i.test(b.title || ''));
    return bell ? Number((bell.innerText.match(/\d+/) || [0])[0]) : -1;
  });
  const openBell = async () => {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /notification/i.test(x.title || ''));
      if (b) b.click();
    });
    await sleep(900);
  };

  await seedOverdue(1);
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(4500);
  await dismissFirstRun(page);
  const withAlert = await badgeCount();
  check('#53 an overdue invoice raises a notification', withAlert > 0, `badge=${withAlert}`);

  await openBell();
  const markRead = page.getByRole('button', { name: /Mark all as read/i });
  if (await markRead.count()) { await markRead.click(); await sleep(800); }
  const cleared = await badgeCount();
  check('#53 marking read clears the badge', cleared === 0, `badge=${cleared}`);
  await page.keyboard.press('Escape');
  await sleep(400);

  await seedOverdue(2);
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(4500);
  await dismissFirstRun(page);
  const returned = await badgeCount();
  check('#53 a NEW overdue invoice re-alerts after being marked read',
    returned > 0, `badge=${returned}`);

  // #55: two businesses must not share one set of books — and, far more
  // importantly, nothing may DISAPPEAR. Older invoices carry no business id,
  // so a naive filter would hide a user's entire history. They are matched by
  // the seller GSTIN stored on every invoice, and anything unattributable is
  // always shown.
  // Give the active business a known GSTIN for the duration. Depending on
  // whatever GSTIN happens to be configured makes this test meaningless on a
  // fresh install, where the profile has none at all — with nothing to
  // compare, every invoice matches and both assertions pass vacuously.
  // The original profile is restored below.
  const originalProfile = await page.evaluate(async () => (await (await fetch('/api/profile')).json()));
  const TEST_GSTIN = '03AAAAA1111A1Z1';
  await page.evaluate(async ({ prof, gstin }) => {
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prof, gstin, businessName: prof?.businessName || 'Active Co' }),
    });
  }, { prof: originalProfile, gstin: TEST_GSTIN });
  const activeProfile = { gstin: TEST_GSTIN };
  await page.evaluate(async (gstin) => {
    const post = (b) => fetch('/api/bills', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b),
    });
    // Belongs to the active business.
    await post({ id: 'smoketest-mine', invoiceNumber: 'SMOKE-MINE/1', clientName: 'Smoke Test Client',
      status: 'unpaid', totalAmount: 1000, payments: [], items: [], invoiceDate: new Date().toISOString().slice(0,10),
      data: { profile: { gstin, businessName: 'Active Co' }, details: {}, totals: { total: 1000 } } });
    // Belongs to a DIFFERENT business.
    await post({ id: 'smoketest-other', invoiceNumber: 'SMOKE-OTHER/1', clientName: 'Smoke Test Client',
      status: 'unpaid', totalAmount: 2000, payments: [], items: [], invoiceDate: new Date().toISOString().slice(0,10),
      data: { profile: { gstin: '29ZZZZZ9999Z9Z9', businessName: 'Other Co' }, details: {}, totals: { total: 2000 } } });
    // Legacy: no seller recorded at all.
    // Dated in the current FY so the dashboard's year filter cannot be what
    // hides it — this test is about company scoping, nothing else.
    const today = new Date().toISOString().slice(0, 10);
    await post({ id: 'smoketest-legacy', invoiceNumber: 'SMOKE-LEGACY/1', clientName: 'Smoke Test Client',
      status: 'unpaid', totalAmount: 3000, payments: [], items: [], invoiceDate: today,
      data: { details: { invoiceNumber: 'SMOKE-LEGACY/1' }, totals: { total: 3000 } } });
  }, activeProfile?.gstin || '');

  await page.reload({ waitUntil: 'networkidle' });
  await sleep(3000);
  await dismissFirstRun(page);
  // Go to the Dashboard explicitly. The app restores the last view from
  // sessionStorage, which by now is Settings — and a "not visible" assertion
  // passes trivially when NOTHING is on screen. Assert against the invoice
  // list itself, not the whole page.
  await page.getByText('Dashboard', { exact: false }).first().click();
  await sleep(2500);
  const visible = await page.evaluate(() => {
    const table = document.querySelector('table');
    return table ? table.innerText : document.body.innerText;
  });
  // Guard the guard: if our own invoice is not listed, the check below proves
  // nothing about scoping.
  check('#55 the active business invoice IS listed (sanity)',
    visible.includes('SMOKE-MINE/1'));

  check('#55 an invoice from the other business is hidden',
    !visible.includes('SMOKE-OTHER/1'));
  check('#55 a legacy invoice with no business recorded is still shown',
    visible.includes('SMOKE-LEGACY/1'));

  // #58 item 1: switching business must refresh the dashboard on the spot.
  // It used to read the business once on mount, so a switch left the previous
  // company's invoices on screen until a manual reload.
  const OTHER_GSTIN = '29BBBBB2222B2Z2';
  await page.evaluate(async ({ a, b }) => {
    const post = (u, body) => fetch(u, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    await post('/api/profiles', { id: 'smoketest-pa', businessName: 'Smoke Alpha', gstin: a });
    await post('/api/profiles', { id: 'smoketest-pb', businessName: 'Smoke Beta', gstin: b });
    await post('/api/bills', {
      id: 'smoketest-beta-bill', invoiceNumber: 'SMOKE-BETA/1', clientName: 'Smoke Test Client',
      status: 'unpaid', totalAmount: 4000, invoiceDate: new Date().toISOString().slice(0, 10),
      payments: [], items: [],
      data: { profile: { gstin: b, businessName: 'Smoke Beta' }, details: {}, totals: { total: 4000 } },
    });
    await post('/api/profile', { businessName: 'Smoke Alpha', gstin: a });
  }, { a: TEST_GSTIN, b: OTHER_GSTIN });

  await page.reload({ waitUntil: 'networkidle' });
  await sleep(3000);
  await dismissFirstRun(page);
  await page.getByText('Dashboard', { exact: false }).first().click();
  await sleep(2000);
  const tableText = () => page.evaluate(() => {
    const t = document.querySelector('table');
    return t ? t.innerText : '';
  });
  check('#58 before switching, only the active business is listed',
    (await tableText()).includes('SMOKE-MINE/1') && !(await tableText()).includes('SMOKE-BETA/1'));

  // Switch business from the header, WITHOUT reloading the page.
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Smoke Alpha/.test(x.innerText));
    if (b) b.click();
  });
  await sleep(800);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Smoke Beta/.test(x.innerText));
    if (b) b.click();
  });
  await sleep(2500);
  const afterSwitch = await tableText();
  check('#58 the dashboard re-filters on a company switch, with no reload',
    afterSwitch.includes('SMOKE-BETA/1') && !afterSwitch.includes('SMOKE-MINE/1'));

  // ======================================================================
  // v1.10.66 — #64, #61, #62, #59
  // ======================================================================
  // Every "ignores another company" check below is paired with a sanity check
  // that the same number DOES move for this company. Without the pair, a card
  // that never updates at all would pass the first check.
  const today = new Date().toISOString().slice(0, 10);
  const THIRD_GSTIN = '27CCCCC3333C3Z3';
  const api = (url, body) => page.evaluate(async ({ url, body }) => (await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })).ok, { url, body });
  const openView = async (label) => {
    await page.evaluate((label) => {
      const b = [...document.querySelectorAll('.sidebar .nav-btn')].find((x) => x.innerText.trim() === label);
      if (b) b.click();
    }, label);
    await sleep(2000);
  };
  // Screens load their data when they mount, so leave and come back.
  const reopenView = async (label) => { await openView('Clients'); await openView(label); };
  const money = (text) => Number(String(text).replace(/[^0-9.-]/g, ''));
  const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.01;
  // textContent, not innerText: .stat-label is uppercased by CSS, and innerText
  // returns the transformed "TOTAL INVOICED", so an exact match never hits.
  const cardValues = (label) => page.evaluate((label) => {
    const l = [...document.querySelectorAll('.stat-label')].find((x) => x.textContent.trim() === label);
    return l ? [...l.parentElement.querySelectorAll('.stat-value')].map((v) => v.textContent.trim()) : null;
  }, label);
  const rupees = (vals) => {
    if (!vals) return NaN;
    const inr = vals.find((v) => v.includes('₹'));
    return inr ? money(inr) : (vals[0] === '—' ? 0 : NaN);
  };
  const screenText = () => page.evaluate(() => document.querySelector('.main-content')?.innerText || '');
  const switchBusiness = async (from, to) => {
    await page.evaluate((from) => {
      const b = [...document.querySelectorAll('.profile-switcher-btn')].find((x) => x.innerText.includes(from));
      if (b) b.click();
    }, from);
    await sleep(700);
    await page.evaluate((to) => {
      const b = [...document.querySelectorAll('.profile-switcher-item')].find((x) => x.innerText.trim() === to);
      if (b) b.click();
    }, to);
    await sleep(2500);
  };

  // ---- #64 item 3: dashboard cards counted every company ------------------
  const dashboard = async () => {
    await reopenView('Dashboard');
    return { total: rupees(await cardValues('Total Invoiced')), count: money((await cardValues('Invoices'))?.[0]) };
  };
  const dash0 = await dashboard();
  await api('/api/bills', { id: 'smoketest-third', invoiceNumber: 'SMOKE-THIRD/1', clientName: 'Smoke Test Client',
    status: 'unpaid', totalAmount: 777777, invoiceDate: today, payments: [], items: [],
    data: { profile: { gstin: THIRD_GSTIN, businessName: 'Smoke Third' }, details: {}, totals: { total: 777777 } } });
  const dash1 = await dashboard();
  await api('/api/bills', { id: 'smoketest-beta-bill2', invoiceNumber: 'SMOKE-BETA/2', clientName: 'Smoke Test Client',
    status: 'unpaid', totalAmount: 1111, invoiceDate: today, payments: [], items: [],
    data: { profile: { gstin: OTHER_GSTIN, businessName: 'Smoke Beta' }, details: {}, totals: { total: 1111 } } });
  const dash2 = await dashboard();
  check('#64 dashboard totals ignore another company\'s invoice',
    close(dash1.total, dash0.total) && dash1.count === dash0.count,
    `total ${dash0.total} -> ${dash1.total}, count ${dash0.count} -> ${dash1.count}`);
  check('#64 dashboard totals include this company\'s new invoice (sanity)',
    close(dash2.total, dash0.total + 1111) && dash2.count === dash0.count + 1,
    `total ${dash0.total} -> ${dash2.total}, count ${dash0.count} -> ${dash2.count}`);

  // ---- #64 item 2: Reports counted every company's expenses ----------------
  const expenseCard = async () => { await reopenView('Reports'); return rupees(await cardValues('Expenses (ex. GST)')); };
  const expense = (id, description, amount, gstin, name) => ({ id, date: today, description, category: 'Other',
    amount, gstAmount: 0, gstPercent: 0, paymentMode: 'Cash', ownerGstin: gstin, ownerName: name });
  const rep0 = await expenseCard();
  await api('/api/expenses', expense('smoketest-exp-a', 'SMOKE-EXP-ALPHA', 55555, TEST_GSTIN, 'Smoke Alpha'));
  const rep1 = await expenseCard();
  await api('/api/expenses', expense('smoketest-exp-b', 'SMOKE-EXP-BETA', 2222, OTHER_GSTIN, 'Smoke Beta'));
  const rep2 = await expenseCard();
  check('#64 reports ignore another company\'s expenses', close(rep1, rep0), `${rep0} -> ${rep1}`);
  check('#64 reports include this company\'s expenses (sanity)', close(rep2, rep0 + 2222), `${rep0} -> ${rep2}`);

  // ---- v1.10.75: Party Outstanding - unpaid part, invoice month, this company only
  const partyBill = (id, gstin, name, total, paid) => ({ id, invoiceNumber: id.toUpperCase(), clientName: 'Smoke Party Client',
    status: paid ? 'partial' : 'unpaid', totalAmount: total, paidAmount: paid, invoiceDate: today, payments: [], items: [],
    data: { profile: { gstin, businessName: name }, details: {}, totals: { total } } });
  await api('/api/bills', partyBill('smoketest-party-a', OTHER_GSTIN, 'Smoke Beta', 2345.5, 345.5));
  await api('/api/bills', partyBill('smoketest-party-b', THIRD_GSTIN, 'Smoke Third', 999999, 0));
  await reopenView('Reports');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Party Outstanding')?.click());
  await sleep(1000);
  const partyRow = await page.evaluate(() => [...document.querySelectorAll('tr')]
    .find((r) => r.innerText.trim().startsWith('Smoke Party Client'))?.innerText.replace(/\s+/g, ' ') || '');
  check('v75 Party Outstanding shows the unpaid part in its month, and not another company\'s bill',
    (partyRow.match(/2,000\.00/g) || []).length === 2 && !partyRow.includes('9,99,999'), partyRow.slice(0, 200));

  // ---- #64: GSTR-3B input tax credit counted every company's purchases -----
  const netItc = async () => {
    await reopenView('GST Returns');
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'GSTR-3B');
      if (b) b.click();
    });
    await sleep(1200);
    return page.evaluate(() => {
      const row = [...document.querySelectorAll('tr')].find((r) => r.innerText.trim().startsWith('Net ITC Available'));
      return row ? [...row.querySelectorAll('td')].slice(1)
        .reduce((s, td) => s + (Number(td.innerText.replace(/[^0-9.-]/g, '')) || 0), 0) : NaN;
    });
  };
  const purchase = (id, rate, gstin, name) => ({ id, date: today, supplierName: 'Smoke ITC Supplier',
    supplierGstin: '07AAAAA0000A1Z1', invoiceNumber: id.toUpperCase(), paymentStatus: 'Unpaid', interstate: false,
    ownerGstin: gstin, ownerName: name,
    items: [{ name: 'Smoke ITC item', hsn: '9999', quantity: 1, rate, taxPercent: 18, cessPercent: 0 }] });
  const itc0 = await netItc();
  await api('/api/purchases', purchase('smoketest-itc-a', 10000, TEST_GSTIN, 'Smoke Alpha'));
  const itc1 = await netItc();
  await api('/api/purchases', purchase('smoketest-itc-b', 1000, OTHER_GSTIN, 'Smoke Beta'));
  const itc2 = await netItc();
  check('#64 GSTR-3B ITC ignores another company\'s purchases', close(itc1, itc0), `${itc0} -> ${itc1}`);
  check('#64 GSTR-3B ITC includes this company\'s purchases (sanity)', close(itc2, itc0 + 180), `${itc0} -> ${itc2}`);

  // ---- #61: an export is zero-rated (3.1(b)), not a home-state B2C sale ----
  const zeroRated = async () => {
    await reopenView('GST Returns');
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'GSTR-3B');
      if (b) b.click();
    });
    await sleep(1200);
    return page.evaluate(() => {
      const row = [...document.querySelectorAll('tr')].find((r) => r.innerText.trim().startsWith('(b) Zero-rated supplies'));
      return {
        cells: row ? [...row.querySelectorAll('td')].slice(1, 3).map((td) => Number(td.innerText.replace(/[^0-9.-]/g, '')) || 0) : null,
        notice: (document.querySelector('.main-content')?.innerText || '').includes('SMOKE-EXPORT/1'),
      };
    });
  };
  const zr0 = await zeroRated();
  await api('/api/bills', { id: 'smoketest-export', invoiceNumber: 'SMOKE-EXPORT/1', invoiceType: 'tax-invoice',
    clientName: 'Smoke Test Client', status: 'unpaid', totalAmount: 5900, invoiceDate: today, payments: [], items: [],
    data: { profile: { gstin: OTHER_GSTIN, businessName: 'Smoke Beta', country: 'India', state: 'Karnataka' },
      client: { name: 'Smoke Test Client', country: 'United States', state: 'California' }, details: {},
      items: [{ name: 'Export item', hsn: '9983', quantity: 1, rate: 5000, taxPercent: 18 }],
      totals: { subtotal: 5000, taxableAmount: 5000, igst: 900, cgst: 0, sgst: 0, cess: 0, total: 5900, isInterstate: true } } });
  const zr1 = await zeroRated();
  check('#61 an export is reported in GSTR-3B 3.1(b) zero-rated supplies',
    !!zr0.cells && !!zr1.cells && close(zr1.cells[0], zr0.cells[0] + 5000) && close(zr1.cells[1], zr0.cells[1] + 900),
    `3.1(b) ${JSON.stringify(zr0.cells)} -> ${JSON.stringify(zr1.cells)}`);
  check('#61 GST Returns flags the export for GSTR-1 Table 6A', zr1.notice);

  // ---- #64 item 1: an open screen must follow a company switch -------------
  await reopenView('Expenses');
  const exp0 = await screenText();
  check('#64 Expenses shows only the selected company (sanity)',
    exp0.includes('SMOKE-EXP-BETA') && !exp0.includes('SMOKE-EXP-ALPHA'));
  const switchStarted = Date.now();
  await switchBusiness('Smoke Beta', 'Smoke Alpha');
  // Poll rather than read once after a fixed pause: the release gate runs on a
  // fresh install where the switch can take longer than on a warm dev tree, and
  // a single read turned that into a coin toss. The condition is unchanged; the
  // detail reports how long the screen actually took to follow the switch.
  let exp1 = await screenText();
  while (!(exp1.includes('SMOKE-EXP-ALPHA') && !exp1.includes('SMOKE-EXP-BETA')) && Date.now() - switchStarted < 10_000) {
    await sleep(250);
    exp1 = await screenText();
  }
  check('#64 switching company refreshes an Expenses screen that is already open',
    exp1.includes('SMOKE-EXP-ALPHA') && !exp1.includes('SMOKE-EXP-BETA'),
    `screen followed the switch after ${Date.now() - switchStarted} ms`);
  await page.getByRole('button', { name: /Add Expense/ }).first().click();
  await sleep(800);
  await page.locator('input[placeholder="e.g. AWS Hosting - March"]').fill('SMOKE-EXP-UI');
  await page.locator('input[placeholder="0.00"]').first().fill('10');
  await page.getByRole('button', { name: /^Save$/ }).first().click();
  await sleep(1800);
  const uiOwner = await page.evaluate(async () =>
    (await (await fetch('/api/expenses')).json()).find((e) => e.description === 'SMOKE-EXP-UI')?.ownerGstin ?? null);
  check('#64 an expense added right after switching is saved under the new company',
    uiOwner === TEST_GSTIN, `ownerGstin=${uiOwner}`);

  // ---- #64 item 2: receipts are per company --------------------------------
  const receipt = (id, receiptNo, owner) => ({ id, receiptNo, date: today, clientName: 'Smoke Test Client',
    amount: 10, paymentMode: 'Cash', ...owner });
  await api('/api/receipts', receipt('smoketest-rcp-a', 'SMOKE-RCP-A', { ownerGstin: TEST_GSTIN, ownerName: 'Smoke Alpha' }));
  await api('/api/receipts', receipt('smoketest-rcp-b', 'SMOKE-RCP-B', { ownerGstin: OTHER_GSTIN, ownerName: 'Smoke Beta' }));
  await api('/api/receipts', receipt('smoketest-rcp-legacy', 'SMOKE-RCP-LEGACY', {}));
  await reopenView('Receipts');
  const rcp = await screenText();
  check('#64 Receipts lists this company\'s receipts (sanity)', rcp.includes('SMOKE-RCP-A'));
  check('#64 Receipts hides another company\'s receipts', !rcp.includes('SMOKE-RCP-B'));
  check('#64 a receipt saved before companies were separated is still listed', rcp.includes('SMOKE-RCP-LEGACY'));

  // ---- D-071: editing a receipt never pays its invoice twice --------------
  // Rs 700 recorded on the Dashboard against a Rs 1,000 invoice: the payment
  // and its receipt share an id. The payment carries no receipt number, as
  // the Dashboard wrote them before the fix (and as older books still hold
  // them). Editing only the receipt's note on the Receipts page looked the
  // payment up by number, missed it, and added a second Rs 700 payment
  // (Rs 1,400, "paid"); it is now found by the receipt's id.
  {
    const prof71 = await page.evaluate(async () => (await fetch('/api/profile')).json());
    const pay71 = { id: 'smoketest-pay071', amount: 700, date: today, mode: 'bank-transfer', note: 'smoke first note',
      recordedAt: new Date().toISOString() };
    await api('/api/bills', { id: 'smoketest-d071', invoiceNumber: 'SMOKE-D071/1', invoiceType: 'tax-invoice', clientName: 'Smoke Test Client',
      status: 'partial', totalAmount: 1000, paidAmount: 700, invoiceDate: today, payments: [pay71], items: [],
      data: { profile: prof71, client: { name: 'Smoke Test Client' }, details: { invoiceNumber: 'SMOKE-D071/1', invoiceDate: today }, totals: { total: 1000 } } });
    await api('/api/receipts', { id: pay71.id, date: today, receiptNo: 'SMOKE-RCPT-071', clientName: 'Smoke Test Client', clientAddress: '',
      amount: 700, paymentMode: 'bank-transfer', referenceNo: pay71.note, againstInvoice: 'SMOKE-D071/1', note: pay71.note,
      currency: 'INR', source: 'auto-from-payment', billId: 'smoketest-d071', ownerGstin: prof71.gstin || '', ownerName: prof71.businessName || '' });
    await reopenView('Receipts');
    await page.locator('tr', { hasText: 'SMOKE-RCPT-071' }).first().locator('button[title="Edit"]').click({ timeout: 10_000 }).catch(() => {});
    await sleep(800);
    const noteBox = page.locator('.form-group', { has: page.locator('label.form-label', { hasText: /^Note \(optional\)$/ }) }).locator('input').first();
    const editOpened = (await noteBox.count()) > 0;
    if (editOpened) {
      await noteBox.fill('smoke edited note');
      await page.getByRole('button', { name: /^Save Receipt$/ }).click();
      await sleep(2500);
    }
    const bill71 = await page.evaluate(async () => (await (await fetch('/api/bills')).json()).find((b) => b.id === 'smoketest-d071') || null);
    check('D-071 editing only the note of a Dashboard receipt keeps one Rs 700 payment and the invoice partly paid',
      editOpened && bill71?.payments?.length === 1 && Number(bill71.paidAmount) === 700 && bill71.status === 'partial',
      JSON.stringify({ editOpened, payments: bill71?.payments?.length, paid: bill71?.paidAmount, status: bill71?.status }));
  }

  // ---- #61 / #62 / #64 item 5: what the invoice itself prints --------------
  await api('/api/profile', { businessName: 'Smoke Alpha', gstin: TEST_GSTIN, state: 'Punjab', country: 'India' });
  const openDraft = async (draft) => {
    await page.evaluate((draft) => {
      sessionStorage.setItem('gst_invoiceDraft', JSON.stringify(draft));
      sessionStorage.setItem('gst_currentView', 'new');
      sessionStorage.removeItem('gst_editingBill');
    }, draft);
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(2500);
    await dismissFirstRun(page);
    await page.waitForSelector('#invoice-preview', { timeout: 20000 });
    await sleep(1500);
  };
  const preview = () => page.evaluate(() => {
    const p = document.querySelector('#invoice-preview');
    return {
      rows: [...(p?.querySelectorAll('.inv-total-row') || [])].map((r) => r.innerText.replace(/\s+/g, ' ').trim()),
      text: (p?.innerText || '').replace(/\s+/g, ' '),
      pos: p?.querySelector('.inv-party-right .inv-party-name')?.innerText.trim() || '',
    };
  });
  const draftItems = [{ id: 'smk-line-1', name: 'Smoke item', hsn: '9983', quantity: 1, rate: 1000, taxPercent: 18, discount: 0, unit: 'Nos' }];
  await openDraft({
    invoiceType: 'tax-invoice',
    client: { name: 'Smoke Test Client', address: '', city: '', pin: '', state: 'Delhi', gstin: '', country: '', email: '', phone: '', isSEZ: false },
    details: { invoiceNumber: 'SMOKE-DRAFT/1', invoiceDate: today, placeOfSupply: 'Punjab' },
    items: draftItems,
    taxInclusive: false,
  });
  const pv = await preview();
  check('#61 test invoice: Delhi client, place of supply Punjab (sanity)', pv.pos === 'Punjab', `place of supply "${pv.pos}"`);
  check('#61 the invoice prints the CGST + SGST it charged, not "IGST ₹0.00"',
    pv.rows.some((r) => r.startsWith('CGST')) && !pv.rows.some((r) => r.startsWith('IGST')), pv.rows.join(' | '));
  check('#62 a tax invoice states "Reverse Charge: No"', /Reverse Charge:? No\b/i.test(pv.text));

  // The switch lives in the Customize panel.
  const clickReverseCharge = () => page.evaluate(() => {
    const label = [...document.querySelectorAll('label.option-toggle')].find((l) => /Reverse Charge applies/.test(l.innerText));
    const input = label?.querySelector('input');
    if (input) input.click();
    return !!input;
  });
  if (!(await page.evaluate(() => !!document.querySelector('label.option-toggle')))) {
    await page.getByRole('button', { name: /Customize/ }).first().click();
    await sleep(800);
  }
  const toggled = await clickReverseCharge();
  await sleep(1000);
  check('#62 turning Reverse Charge on prints "Reverse Charge: Yes"',
    toggled && /Reverse Charge:? Yes\b/i.test((await preview()).text));
  // Put the option back: it is remembered as a default for future invoices.
  if (toggled) { await clickReverseCharge(); await sleep(1500); }

  await openDraft({
    invoiceType: 'proforma',
    client: { name: 'Smoke Test Client', address: '', city: '', pin: '', state: 'Punjab', gstin: '', country: '', email: '', phone: '', isSEZ: false },
    details: { invoiceNumber: 'SMOKE-DRAFT/2', invoiceDate: today },
    items: draftItems,
    taxInclusive: false,
  });
  const faint = await page.evaluate(() => {
    const rgb = (c) => (c.match(/[0-9.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => {
      const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const background = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage !== 'none') return null;   // gradient: cannot judge, skip
        const c = rgb(cs.backgroundColor);
        if (c.length === 3 || c[3] > 0.5) return c.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const root = document.querySelector('#invoice-preview');
    const offenders = [];
    for (const el of root ? root.querySelectorAll('*') : []) {
      const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!ownText || el.getBoundingClientRect().width === 0) continue;
      const bg = background(el);
      if (!bg) continue;
      const ratio = contrast(rgb(getComputedStyle(el).color).slice(0, 3), bg);
      if (ratio < 4.5) offenders.push(`"${ownText.slice(0, 32)}" ${getComputedStyle(el).color} ${ratio.toFixed(2)}:1`);
    }
    return { offenders, hasDisclaimer: !!root && /This is not a tax invoice/.test(root.innerText) };
  });
  check('#64 proforma disclaimer is on the page (sanity)', faint.hasDisclaimer);
  check('#64 no invoice text is too faint for black-and-white print (4.5:1)',
    faint.offenders.length === 0, faint.offenders.slice(0, 3).join(' | '));

  // ---- #59: a hide/show menu on phones, nothing new on desktop -------------
  const desk = await page.evaluate(() => {
    const bar = document.querySelector('.mobile-topbar');
    const side = document.querySelector('.sidebar').getBoundingClientRect();
    return { bar: bar ? getComputedStyle(bar).display : 'missing', left: Math.round(side.left), width: Math.round(side.width) };
  });
  check('#59 desktop keeps the fixed sidebar and shows no phone menu bar',
    desk.bar === 'none' && desk.left === 0 && desk.width > 200, JSON.stringify(desk));

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  watchRequests(phone);
  const mob = await phone.newPage();
  try {
    await mob.goto(APP, { waitUntil: 'networkidle' });
    await sleep(2000);
    await dismissFirstRun(mob);
    const menuBox = () => mob.evaluate(() => {
      const r = document.querySelector('.sidebar').getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right) };
    });
    const barShownOnPhone = await mob.evaluate(() => {
      const bar = document.querySelector('.mobile-topbar');
      return !!bar && getComputedStyle(bar).display !== 'none';
    });
    const startBox = await menuBox();
    check('#59 on a phone the menu starts hidden behind a menu button',
      barShownOnPhone && startBox.right <= 1, `bar=${barShownOnPhone} menu=${JSON.stringify(startBox)}`);
    // Short name where space is tight.
    const phoneTitle = await mob.evaluate(() => document.querySelector('.mobile-topbar-title')?.innerText.trim() || '');
    check('on a phone the top bar names the shop "HC Fashion"', phoneTitle === 'HC Fashion', phoneTitle);
    await noteOldName('phone', mob);
    if (barShownOnPhone) {
      await mob.getByRole('button', { name: 'Open menu' }).click();
      await sleep(700);
      const openBox = await menuBox();
      check('#59 the menu button slides the menu in', openBox.left >= 0 && openBox.right > 200, JSON.stringify(openBox));
      await mob.evaluate(() => {
        const b = [...document.querySelectorAll('.sidebar .nav-btn')].find((x) => x.innerText.trim() === 'Expenses');
        if (b) b.click();
      });
      await sleep(1800);
      const pickedBox = await menuBox();
      const title = await mob.evaluate(() => document.querySelector('.page-title')?.innerText || '');
      check('#59 picking a page opens it and closes the menu',
        pickedBox.right <= 1 && /Expenses/.test(title), `menu=${JSON.stringify(pickedBox)} page="${title}"`);
      const width = await mob.evaluate(() => Math.round(document.querySelector('.main-content').getBoundingClientRect().width));
      check('#59 pages get the full phone width', width >= 380, `${width}px`);
    }
  } finally {
    await phone.close();
  }

  // ======================================================================
  // v1.10.67 — #66
  // ======================================================================
  const salesCards = async () => {
    await reopenView('Dashboard');
    // The cards show "—" until the invoices have loaded; reading them then
    // gave 0 on a busy PC (v1.10.79 gate). Wait for real values, up to 8 s.
    for (let i = 0; i < 16; i++) {
      const v = await cardValues('Invoices');
      if (v && v[0] && v[0] !== '—') break;
      await sleep(500);
    }
    return { total: rupees(await cardValues('Total Invoiced')), count: money((await cardValues('Invoices'))?.[0]) };
  };
  const seedBill = (id, number, type, amount, extra = {}) => api('/api/bills', {
    id, invoiceNumber: number, invoiceType: type, clientName: 'Smoke Test Client',
    status: 'unpaid', totalAmount: amount, totalTaxAmount: 0, invoiceDate: today, payments: [], items: [],
    data: {
      profile: { gstin: TEST_GSTIN, businessName: 'Smoke Alpha', country: 'India', state: 'Punjab' },
      client: { name: 'Smoke Test Client', state: 'Punjab', country: '' },
      details: { invoiceNumber: number, invoiceDate: today },
      items: [{ id: 'l1', name: 'Smoke line', hsn: '9983', quantity: 1, rate: amount, taxPercent: 0, discount: 0, unit: 'Pcs' }],
      totals: { subtotal: amount, taxableAmount: amount, cgst: 0, sgst: 0, igst: 0, total: amount, isInterstate: false },
      invoiceOptions: { showGST: false },
    },
    ...extra,
  });

  // ---- #66 item 7: only real sales count on the dashboard ----------------
  const sales0 = await salesCards();
  await seedBill('smoketest-quote', 'SMOKE-EST/9', 'proforma', 9999);
  await seedBill('smoketest-challan', 'SMOKE-DC/9', 'delivery-challan', 8888);
  const sales1 = await salesCards();
  check('#66 a proforma and a delivery challan are not counted as sales',
    close(sales1.total, sales0.total) && sales1.count === sales0.count,
    `total ${sales0.total} -> ${sales1.total}, count ${sales0.count} -> ${sales1.count}`);
  await seedBill('smoketest-sale', 'SMOKE-SALE/9', 'tax-invoice', 1000);
  await seedBill('smoketest-cn', 'SMOKE-CN/9', 'credit-note', 400);
  const sales2 = await salesCards();
  check('#66 a sale adds and a credit note subtracts (sanity)',
    close(sales2.total, sales0.total + 600) && sales2.count === sales0.count + 2,
    `total ${sales0.total} -> ${sales2.total}, count ${sales0.count} -> ${sales2.count}`);

  // ---- #66 item 10: the short columns are centred -------------------------
  const aligned = await page.evaluate(() => {
    const head = [...document.querySelectorAll('th')];
    const pick = (label) => head.find((h) => h.textContent.trim() === label);
    const align = (el) => (el ? getComputedStyle(el).textAlign : null);
    return { type: align(pick('Type')), paid: align(pick('Paid')), status: align(pick('Status')), client: align(pick('Client')) };
  });
  check('#66 Type, Paid and Status are centred; Client stays left',
    aligned.type === 'center' && aligned.paid === 'center' && aligned.status === 'center' && aligned.client !== 'center',
    JSON.stringify(aligned));

  // ---- #66 item 11: the type is locked once the invoice is saved ---------
  await seedBill('smoketest-cancel', 'SMOKE-CANCEL/9', 'tax-invoice', 5000);
  await reopenView('Dashboard');
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('tr')].find((r) => r.innerText.includes('SMOKE-CANCEL/9'));
    const btn = row && [...row.querySelectorAll('button')].find((b) => (b.title || '') === 'Edit');
    if (btn) btn.click();
  });
  await page.waitForSelector('#invoice-preview', { timeout: 20000 });
  await sleep(1500);
  const chips = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.type-selector .type-chip')];
    return {
      total: all.length,
      disabled: all.filter((c) => c.disabled).length,
      active: all.filter((c) => c.className.includes('type-chip-active')).length,
    };
  });
  check('#66 the invoice type cannot be changed on a saved invoice',
    chips.total > 1 && chips.disabled === chips.total - 1 && chips.active === 1, JSON.stringify(chips));
  check('#66 the "Billing From" card is gone from the invoice screen',
    !(await screenText()).includes('Billing From'));

  await openView('Dashboard');
  const leave = page.getByRole('button', { name: /Discard.*leave/i });
  if (await leave.count()) { await leave.click(); await sleep(1500); }

  // ---- #66 item 12: cancelling keeps the invoice, out of the totals ------
  const beforeCancel = await salesCards();
  // v1.10.80 (#100) - Cancel is in the row's ⋯ menu.
  await page.locator('tr', { hasText: 'SMOKE-CANCEL/9' }).locator('button[aria-label^="More actions"]').click();
  await page.locator('[role=menu] [role=menuitem]', { hasText: 'Cancel invoice' }).click();
  await sleep(900);
  const confirmCancel = page.getByRole('button', { name: /^Cancel invoice$/ });
  if (await confirmCancel.count()) await confirmCancel.first().click();
  await sleep(2500);
  const afterCancel = await salesCards();
  const cancelledRow = await page.evaluate(() => {
    const row = [...document.querySelectorAll('tr')].find((r) => r.innerText.includes('SMOKE-CANCEL/9'));
    if (!row) return null;
    // v1.10.77 (#86) - a cancelled row is read-only: a Cancelled badge with
    // Undo instead of the status menu.
    const status = row.querySelector('select.status-select');
    return { listed: true, status: status ? status.value : (/Cancelled/i.test(row.innerText) ? 'cancelled' : null), menu: !!status };
  });
  check('#66 a cancelled invoice drops out of the sales totals',
    close(afterCancel.total, beforeCancel.total - 5000) && afterCancel.count === beforeCancel.count - 1,
    `total ${beforeCancel.total} -> ${afterCancel.total}`);
  check('#66 the cancelled invoice is still listed, marked Cancelled, its status menu locked (#86)',
    cancelledRow?.listed === true && cancelledRow.status === 'cancelled' && !cancelledRow.menu, JSON.stringify(cancelledRow));
  const cancelledStatus = await page.evaluate(async () =>
    (await (await fetch('/api/bills')).json()).find((b) => b.id === 'smoketest-cancel')?.status ?? null);
  check('#66 the invoice itself is kept, not deleted', cancelledStatus === 'cancelled', `status=${cancelledStatus}`);

  // ---- #66 item 2: a new product starts in Pcs ---------------------------
  await reopenView('Products');
  await page.getByRole('button', { name: /Add Product/i }).first().click();
  await sleep(900);
  const unitValue = await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === 'Pcs'));
    return sel ? sel.value : null;
  });
  check('#66 a new product defaults to Pcs', unitValue === 'Pcs', `unit=${unitValue}`);
  await page.getByRole('button', { name: /^Cancel$/ }).first().click();
  await sleep(800);

  // ---- #66 item 8: the sidebar follows the theme -------------------------
  const sidebarTone = async () => page.evaluate(() => {
    const rgb = (getComputedStyle(document.querySelector('.sidebar')).backgroundColor.match(/[0-9.]+/g) || []).map(Number);
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  });
  const toggleTheme = async (label) => {
    await page.evaluate((label) => {
      const b = [...document.querySelectorAll('.sidebar .nav-btn')].find((x) => x.innerText.trim() === label);
      if (b) b.click();
    }, label);
    await sleep(900);
  };
  const themeNow = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (themeNow === 'dark') await toggleTheme('Light Mode');
  const lightTone = await sidebarTone();
  await toggleTheme('Dark Mode');
  const darkTone = await sidebarTone();
  check('#66 the sidebar is light in Light Mode and dark in Dark Mode',
    lightTone > 0.7 && darkTone < 0.3, `light=${lightTone.toFixed(2)} dark=${darkTone.toFixed(2)}`);
  await toggleTheme('Light Mode');

  // ---- #66 item 13: the stamp prints beside the signature ----------------
  const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  await page.evaluate(async ({ png }) => {
    const prof = await (await fetch('/api/profile')).json();
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prof, stamp: png, stampHeight: 70, signature: png, signatureHeight: 55 }),
    });
  }, { png: onePixelPng });
  await openDraft({
    invoiceType: 'tax-invoice',
    client: { name: 'Smoke Test Client', address: '', city: '', pin: '', state: 'Punjab', gstin: '', country: '', email: '', phone: '', isSEZ: false },
    details: { invoiceNumber: 'SMOKE-STAMP/1', invoiceDate: today, placeOfSupply: 'Punjab' },
    items: draftItems,
    taxInclusive: false,
  });
  const stampShown = await page.evaluate(() => {
    const box = document.querySelector('#invoice-preview .inv-signature');
    if (!box) return null;
    const stamp = box.querySelector('img[alt="Stamp"]');
    const sig = box.querySelector('img[alt="Signature"]');
    return { stamp: !!stamp, sig: !!sig, stampHeight: stamp ? Math.round(stamp.getBoundingClientRect().height) : 0 };
  });
  check('#66 the stamp prints next to the signature', !!stampShown?.stamp && !!stampShown?.sig, JSON.stringify(stampShown));

  // ---- #66 item 9 / v1.10.75: one Save for all of Settings, pinned at the bottom
  await openView('Settings');
  await sleep(2000);
  const saveBar = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Save all changes/i.test(b.innerText));
    if (!btn) return null;
    const bar = btn.closest('.settings-savebar');
    return { docked: !!bar && getComputedStyle(bar).position === 'fixed', bottomGap: bar ? Math.round(innerHeight - bar.getBoundingClientRect().bottom) : null };
  });
  check('#66 Settings keeps one Save button docked along the bottom edge',
    !!saveBar?.docked && saveBar.bottomGap === 0, JSON.stringify(saveBar));
  const jumpScrolls = await page.evaluate(() => {
    const n = document.querySelector('.settings-jumpnav');
    return n ? n.scrollWidth > n.clientWidth + 1 : null;
  });
  check('v75 the Settings section buttons never scroll sideways', jumpScrolls === false, String(jumpScrolls));

  // One click saves two different sections.
  const getMeta = (key) => page.evaluate(async (k) => ((await (await fetch('/api/meta/' + k)).json()).value || {}), key);
  const nameBefore = await page.locator('#section-company input[name="businessName"]').inputValue();
  const numBefore = await getMeta('invoiceNumberSettings');
  await page.locator('#section-company input[name="businessName"]').fill(`Smoke SaveAll ${Date.now() % 100000}`);
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  // v1.10.79 - a prefix that keeps credit notes within GST's 16 characters
  // (SM-CN/26-27/0001): longer ones are now refused, rightly.
  await page.locator('input[placeholder^="e.g. ACME"]').fill('SM');
  await page.getByRole('button', { name: /^Short \(/ }).first().click();
  await sleep(500);
  await page.getByRole('button', { name: /Save all changes/i }).click();
  // v1.10.80 (#99) - shared numbering used by several businesses asks first.
  await page.getByRole('button', { name: /^Change for all$/ }).click({ timeout: 3000 }).catch(() => {});
  await sleep(2500);
  const savedName = await page.evaluate(async () => (await (await fetch('/api/profile')).json()).businessName);
  const savedPrefix = (await getMeta('invoiceNumberSettings')).brandPrefix;
  check('v75 "Save all changes" saves Company Details and Invoice Number Format together',
    /^Smoke SaveAll/.test(savedName || '') && savedPrefix === 'SM', `name=${savedName} prefix=${savedPrefix}`);
  // Put both back.
  await page.locator('#section-company input[name="businessName"]').fill(nameBefore);
  await page.locator('input[placeholder^="e.g. ACME"]').fill(numBefore.brandPrefix || '');
  await sleep(500);
  await page.getByRole('button', { name: /Save all changes/i }).click();
  // v1.10.80 (#99) - shared numbering used by several businesses asks first.
  await page.getByRole('button', { name: /^Change for all$/ }).click({ timeout: 3000 }).catch(() => {});
  await sleep(2500);
  check('v75 after saving, the bar says everything is saved',
    await page.evaluate(() => /All changes saved/.test(document.querySelector('.settings-savebar')?.innerText || '')));

  // ---- v1.10.75: the app-wide round-off switch saves the invoice default --
  const roundOffBox = page.locator('label', { hasText: 'Round off invoice totals' }).locator('input[type="checkbox"]');
  const roundOffBefore = await roundOffBox.isChecked();
  await roundOffBox.click();
  await sleep(1500);
  const roundOffSaved = await page.evaluate(async () =>
    ((await (await fetch('/api/meta/invoiceDisplayOptions')).json()).value || {}).showRoundOff);
  await roundOffBox.click(); // put it back
  await sleep(1500);
  check('v75 Settings round-off switch saves the invoice default',
    roundOffSaved === !roundOffBefore, `was ${roundOffBefore}, saved ${roundOffSaved}`);

  // ---- D-020: saved print templates neither nest nor wipe each other ------
  // Save A, change a custom prefix, save B, load A: both stay listed and the
  // prefix keeps its newer value (a template carries the design only). The
  // prefix is changed in the browser's stored print settings and the screen
  // reloaded; the stored settings are put back afterwards.
  {
    const psBefore = await page.evaluate(() => localStorage.getItem('gst_printSettings'));
    const setQuotePrefix = async (prefix) => {
      await page.evaluate((prefix) => {
        const s = JSON.parse(localStorage.getItem('gst_printSettings') || '{}');
        s.customPrefixes = { ...(s.customPrefixes || {}), quotation: prefix };
        localStorage.setItem('gst_printSettings', JSON.stringify(s));
        sessionStorage.setItem('gst_currentView', 'settings');
      }, prefix);
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(2500);
      await dismissFirstRun(page);
    };
    const saveTemplate = async (name) => {
      await page.locator('input[placeholder="Template name (e.g. Retail v1)"]').fill(name, { timeout: 10_000 });
      await page.getByRole('button', { name: /Save current as template/ }).click({ timeout: 10_000 });
      await sleep(800);
    };
    let loaded = false;
    try {
      await setQuotePrefix('SMQA');
      await saveTemplate('SMOKE-TPL-A');
      await setQuotePrefix('SMQB');
      await saveTemplate('SMOKE-TPL-B');
      await page.locator('span', { hasText: /^SMOKE-TPL-A$/ }).locator('xpath=..').getByRole('button', { name: 'Load', exact: true }).click({ timeout: 10_000 });
      await page.getByRole('button', { name: /^Load template$/ }).click({ timeout: 10_000 });
      await sleep(1200);
      loaded = true;
    } catch { /* judged below */ }
    const ps20 = await page.evaluate(() => JSON.parse(localStorage.getItem('gst_printSettings') || '{}'));
    const names20 = (ps20.savedTemplates || []).map((t) => t.name);
    const nested20 = (ps20.savedTemplates || []).some((t) => t?.settings && ('savedTemplates' in t.settings || 'customPrefixes' in t.settings));
    await page.evaluate((v) => { if (v === null) localStorage.removeItem('gst_printSettings'); else localStorage.setItem('gst_printSettings', v); }, psBefore);
    check('D-020 saving template B keeps A; loading A keeps both and the newer custom prefix',
      loaded && names20.includes('SMOKE-TPL-A') && names20.includes('SMOKE-TPL-B') && ps20.customPrefixes?.quotation === 'SMQB' && !nested20,
      JSON.stringify({ loaded, names: names20, prefix: ps20.customPrefixes?.quotation, nested: nested20 }));
  }

  // ---- #68: a GSTIN fills in the state, offline -------------------------
  await openDraft({
    invoiceType: 'tax-invoice',
    client: { name: 'Smoke GSTIN Client', address: '', city: '', pin: '', state: '', gstin: '', country: 'India', email: '', phone: '', isSEZ: false },
    details: { invoiceNumber: 'SMOKE-GSTIN/1', invoiceDate: today },
    items: draftItems,
    taxInclusive: false,
  });
  const billedTo = page.locator('.glass-panel').filter({ has: page.locator('h3.section-title', { hasText: 'Billed To' }) });
  const fieldGroup = (label) => billedTo.locator('.form-group').filter({ has: page.locator(`label.form-label:text-is("${label}")`) });
  const gstinInput = fieldGroup('GSTIN').locator('input');
  await gstinInput.fill('27AAPFU0939F1ZV');
  await page.keyboard.press('Tab');
  await sleep(600);
  const filledState = await fieldGroup('State').locator('select, input').inputValue();
  check('#68 a valid GSTIN fills the client state from its first two digits',
    filledState === 'Maharashtra', `state=${filledState}`);

  await gstinInput.fill('27AAPFU0939F1ZW');
  await page.keyboard.press('Tab');
  await sleep(600);
  const typoWarning = (await fieldGroup('GSTIN').locator('small').allInnerTexts()).join(' ');
  check('#68 a mistyped GSTIN is caught by its own checksum',
    /checksum/i.test(typoWarning), typoWarning || 'no warning shown');

  // ---- v1.10.69: the getting-started checklist -------------------------
  // It has to read the real saved data, not "have you seen this screen",
  // and it has to retire itself once there is nothing left to do.
  await page.evaluate(() => { try { localStorage.removeItem('freegstbill_startedDismissed'); } catch { /* private mode */ } });
  const setBank = async (withBank) => {
    await page.evaluate(async ({ withBank, prof }) => {
      const body = { ...prof };
      if (withBank) { body.paymentAccounts = [{ id: 'smk', label: 'Test', bankName: 'Test Bank', accountNumber: '1', ifsc: 'X', isDefault: true, isActive: true }]; body.upiId = 'x@y'; }
      else { body.paymentAccounts = []; body.upiId = ''; body.accountNumber = ''; }
      await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }, { withBank, prof: originalProfile });
    // The app holds the business profile in React state and only fetches it
    // on load, so a POST made behind its back is invisible until a reload.
    // (In real use, saving in Settings updates that state directly.)
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(2500);
    await openView('Dashboard');
  };
  const checklist = () => page.evaluate(() => {
    const head = [...document.querySelectorAll('.section-title')].find((h) => h.innerText.trim() === 'Getting started');
    if (!head) return null;
    const card = head.closest('.glass-panel');
    return { shown: true, text: card.innerText.replace(/\s+/g, ' ') };
  });

  await setBank(false);
  const noBank = await checklist();
  check('v1.10.69 the getting-started card is shown while something is still to do',
    !!noBank && /Add bank details or UPI/.test(noBank.text),
    noBank ? noBank.text.slice(0, 140) : 'card not shown');

  await setBank(true);
  const withBank = await checklist();
  const doneOf = (c) => (c ? Number((c.text.match(/(\d) of 4 done/) || [0, -1])[1]) : 4);
  check('v1.10.69 it ticks itself off from the saved data, not from having been seen',
    doneOf(withBank) === doneOf(noBank) + 1,
    `without bank ${doneOf(noBank)}/4, with bank ${doneOf(withBank)}/4`);

  // ---- #71 --------------------------------------------------------------
  // 1. Customize belongs in the sticky toolbar, right before Show Preview.
  await openDraft({
    invoiceType: 'tax-invoice',
    client: { name: 'Smoke 71 Client', address: '', city: '', pin: '', state: 'Punjab', gstin: '', country: 'India', email: '', phone: '', isSEZ: false },
    details: { invoiceNumber: 'SMOKE-71/1', invoiceDate: today },
    items: draftItems,
    taxInclusive: false,
  });
  const bar71 = await page.evaluate(() => {
    const el = document.querySelector('.generator-toolbar');
    return el ? [...el.querySelectorAll('button')].map((b) => b.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean) : null;
  });
  const cIdx = bar71 ? bar71.findIndex((t) => /Customize|Hide Options/.test(t)) : -1;
  const pIdx = bar71 ? bar71.findIndex((t) => /Show Preview|Hide Preview/.test(t)) : -1;
  check('#71.1 Customize sits in the toolbar, immediately before the preview button',
    cIdx !== -1 && pIdx === cIdx + 1, JSON.stringify(bar71));
  const cCount = await page.evaluate(() =>
    [...document.querySelectorAll('button')].filter((b) => /^(Customize|Hide Options)$/.test(b.innerText.trim())).length);
  check('#71.1 and there is only one of it', cCount === 1, `found ${cCount}`);

  // 2. Qty / Rate / Cess replace their contents when you click and type.
  await openView('Purchases');
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Add Purchase/i.test(x.innerText));
    if (b) b.click();
  });
  await sleep(2500);
  for (const label of ['Qty', 'Rate', 'Cess %']) {
    const field = page.locator(`.form-group:has(.form-label:text-is("${label}")) input[type=number]`).first();
    const was = await field.inputValue();
    await field.click();
    await page.keyboard.type('7');
    const now = await field.inputValue();
    // selectionStart is null on <input type=number>, so ask what a user sees.
    check(`#71.2 typing in ${label} replaces what was there`, now === '7', `was "${was}", got "${now}"`);
  }

  // 3. The Status column is a dropdown that saves, like the Dashboard.
  await openView('Purchases');
  const st71 = await page.evaluate(() => {
    const heads = [...document.querySelectorAll('th')].map((th) => th.textContent.trim().toLowerCase());
    const idx = heads.indexOf('status');
    const row = document.querySelector('tbody tr');
    if (idx === -1 || !row) return { idx, rows: 0 };
    const sel = row.children[idx]?.querySelector('select');
    // Which purchase is this row? The list is filtered and sorted, so the
    // first row is not necessarily the one this suite created.
    const invIdx = heads.indexOf('invoice no');
    const invoiceNumber = invIdx === -1 ? null : row.children[invIdx].innerText.trim();
    return { idx, invoiceNumber, isSelect: !!sel, value: sel?.value, options: sel ? [...sel.options].map((o) => o.value) : null };
  });
  check('#71.3 the Status column is a dropdown offering Unpaid / Paid / Partial',
    st71.isSelect === true && JSON.stringify(st71.options) === JSON.stringify(['Unpaid', 'Paid', 'Partial']),
    JSON.stringify(st71));
  if (st71.isSelect) {
    await page.evaluate((idx) => {
      const sel = document.querySelector('tbody tr').children[idx].querySelector('select');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'Paid');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, st71.idx);
    await sleep(2500);
    const saved71 = await page.evaluate(async (invoiceNumber) => {
      const rows = await (await fetch('/api/purchases')).json();
      const r = rows.find((x) => String(x.invoiceNumber).trim() === invoiceNumber);
      return r ? r.paymentStatus : null;
    }, st71.invoiceNumber);
    check('#71.3 changing it saves against the purchase', saved71 === 'Paid',
      `invoice ${st71.invoiceNumber} saved as "${saved71}"`);
  }

  // ---- ERR-024: a page break must never cut through the signature --------
  // Reported with a photo: the stamp printed half at the foot of page 1 and
  // half at the top of page 2. The footer is two columns - bank details and
  // terms on the left, signature and stamp on the right - and the paginator
  // broke at the gap between bank details and terms, which runs straight
  // through the stamp. This builds that exact invoice: it adds item rows until
  // the page-1 seam falls between the bottom of the bank-details block and the
  // bottom of the signature block (the only window in which the old code cut
  // the stamp), makes a real PDF, and checks where the page actually ended.
  const tallStamp = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 100; c.height = 300;
    const g = c.getContext('2d');
    g.strokeStyle = '#1d4ed8'; g.lineWidth = 8;
    g.strokeRect(8, 8, 84, 284);
    return c.toDataURL('image/png');
  });
  await page.evaluate(async ({ png, prof }) => {
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prof, stamp: png, stampHeight: 160, signature: png, signatureHeight: 90,
        bankName: prof.bankName || 'Smoke Bank', accountNumber: prof.accountNumber || '000111222333',
        ifsc: prof.ifsc || 'SMOK0000001' }) });
  }, { png: tallStamp, prof: originalProfile });
  const seamDraft = (n) => ({
    invoiceType: 'tax-invoice',
    client: { name: 'Smoke Test Client', address: '', city: '', pin: '', state: 'Punjab', gstin: '', country: 'India', email: '', phone: '', isSEZ: false },
    details: { invoiceNumber: `SMOKE-SEAM/${n}`, invoiceDate: today, placeOfSupply: 'Punjab' },
    items: Array.from({ length: n }, (_, i) => ({ ...draftItems[0], id: `smk-seam-${i}`, name: `Seam item ${i + 1}` })),
    taxInclusive: false,
    customTerms: '<p>1. Goods once sold will not be taken back.</p><p>2. Subject to local jurisdiction.</p><p>3. Payment is due within 15 days.</p>',
  });
  const pdfLayout = async (n) => {
    await openDraft(seamDraft(n));
    await page.evaluate(() => { window.__lastPdfLayout = null; });
    try {
      await Promise.all([
        page.waitForEvent('download', { timeout: 90_000 }),
        page.getByRole('button', { name: /save & download/i }).first().click(),
      ]);
    } catch { /* judged below */ }
    await sleep(800);
    return page.evaluate(() => window.__lastPdfLayout);
  };
  // The danger window: a real multi-page PDF (the invoice is taller than one
  // page), with the page-1 seam below the bank-details block but above the
  // bottom of the signature block beside it.
  // v1.10.77 (#88): an invoice up to 6% over one page is scaled onto ONE page
  // (onePage), so in some layouts every invoice of this shape fits one page and
  // the break can no longer happen. A real multi-page case is preferred; the
  // one-page outcome is accepted (nothing can be cut) and said so. Multi-page
  // breaks are also checked by the 45-item Tally test below.
  const atSeam = (L) => !!(L && L.signature && L.blocks?.length
    && L.blocks[0][1] < L.pageHeight && L.pageHeight < L.signature[1]);
  const inWindow = (L) => atSeam(L) && !L.onePage && L.total > L.fullHeight + 2;

  const probe = await pdfLayout(1);
  let seam = null;
  if (probe?.signature && probe.blocks?.length && probe.rowHeight > 0) {
    // Aim the seam just under the bank-details block: that leaves the most of
    // the invoice below it, which is what makes the PDF spill onto page 2.
    const k0 = Math.max(0, Math.floor((probe.pageHeight - 12 - probe.blocks[0][1]) / probe.rowHeight));
    // Wider than before: up to 6% over one page is now scaled onto one page,
    // so the multi-page case needs a few more rows.
    let squeezed = null;
    for (const k of [k0, k0 + 1, k0 + 2, k0 + 3, k0 - 1, k0 - 2]) {
      if (k < 0) continue;
      const L = await pdfLayout(1 + k);
      if (inWindow(L)) { seam = { ...L, items: 1 + k }; break; }
      if (!squeezed && atSeam(L) && L.onePage) squeezed = { ...L, items: 1 + k };
    }
    if (!seam && squeezed) seam = squeezed;
  }
  check('ERR-024 test setup: the page seam lands inside the signature block (the case that broke)',
    !!seam, seam ? `${seam.items} items, seam at ${Math.round(seam.pageHeight)}px, signature ${seam.signature.map(Math.round).join('-')}px${seam.onePage ? ' (fits one page since v1.10.77)' : ''}`
      : `could not place it - probe ${JSON.stringify(probe && { H: probe.pageHeight, full: probe.fullHeight, total: probe.total, row: probe.rowHeight, sig: probe.signature, first: probe.blocks?.[0] })}`);
  if (seam) {
    const cutInto = seam.ends.filter((e) => seam.atoms.some(([a, b]) => e > a + 1 && e < b - 1));
    check('ERR-024 no PDF page ends inside the signature, stamp or any image',
      (seam.onePage ? seam.ends.length === 0 : seam.ends.length > 0) && cutInto.length === 0,
      seam.onePage ? 'one page, no page break at all'
        : `page ends at ${seam.ends.map(Math.round).join(', ')}px${cutInto.length ? ` - CUTS THROUGH at ${cutInto.map(Math.round).join(', ')}` : ''}`);
  }

  // ---- v1.10.73: Boxed grid and Tally style designs ----------------------
  // Chosen through Customize, the way a person does it. The choice is saved
  // as the default for new invoices, so it is put back to Classic at the end.
  const pickStyle = async (label) => {
    const custom = page.getByRole('button', { name: /^customize$/i }).first();
    if (await custom.count()) { await custom.click(); await sleep(700); }
    await page.locator('button.type-chip', { hasText: label }).first().click();
    await sleep(1500); // display options save after 800 ms
    const hide = page.getByRole('button', { name: /hide options/i }).first();
    if (await hide.count()) { await hide.click(); await sleep(400); }
  };
  await openDraft(seamDraft(1));
  await pickStyle('Tally style');
  const TL = await pdfLayout(45);
  const tallyText = await page.locator('#invoice-preview').innerText().catch(() => '');
  check('v73 Tally style prints the HSN/SAC tax summary, the declaration and the seal box',
    /Total Tax Amount/i.test(tallyText) && /Declaration/i.test(tallyText) && /Customer.s Seal and Signature/i.test(tallyText)
      && /Amount Chargeable \(in words\)/i.test(tallyText),
    tallyText ? '' : 'preview had no text');
  {
    const ok = !!(TL && TL.total > TL.fullHeight + 2 && TL.ends.length > 0);
    const cutInto = ok ? TL.ends.filter((e) => TL.atoms.some(([a, b]) => e > a + 1 && e < b - 1)) : [];
    check('v73 Tally style: a 45-item invoice runs onto more pages and no page ends inside a row, block or the signature',
      ok && cutInto.length === 0,
      ok ? `page ends at ${TL.ends.map(Math.round).join(', ')}px${cutInto.length ? ` - CUTS THROUGH at ${cutInto.map(Math.round).join(', ')}` : ''}`
        : `no multi-page PDF: ${JSON.stringify(TL && { total: TL.total, full: TL.fullHeight })}`);
  }
  await pickStyle('Boxed grid');
  await openDraft(seamDraft(1));
  const boxedRows = await page.locator('#invoice-preview table.grid-items tbody tr').count();
  const boxedText = await page.locator('#invoice-preview').innerText().catch(() => '');
  check('v73 Boxed grid fills the item table to a fixed height and prints Grand Total',
    boxedRows >= 8 && /Grand Total/.test(boxedText), `${boxedRows} rows`);
  await pickStyle('Classic');

  // ---- #72: "system-generated, no signature required" note ----------------
  // Driven through Customize, the way a person turns it on. (Options passed in
  // a draft are replaced by the server-saved display options on load.)
  await openDraft({ ...seamDraft(1), details: { invoiceNumber: 'SMOKE-72/1', invoiceDate: today, placeOfSupply: 'Punjab' } });
  const notePos = () => page.evaluate(() => {
    const t = document.querySelector('#invoice-preview')?.innerText || '';
    return { note: t.search(/system-generated invoice/i), terms: t.search(/terms/i) };
  });
  const off72 = await notePos();
  check('#72 the system-generated note is off unless chosen', off72.note === -1, JSON.stringify(off72));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.generator-toolbar button')].find((x) => /^Customize$/.test(x.innerText.trim()));
    if (b) b.click();
  });
  await sleep(1000);
  const box72 = page.locator('label.option-toggle', { hasText: /system-generated invoice/i }).locator('input[type=checkbox]');
  const shownTicked = (await box72.count()) ? await box72.isChecked() : null;
  check('#72 its Customize box shows unticked while the note is off', shownTicked === false, `ticked=${shownTicked}`);
  if (await box72.count()) { await box72.click(); await sleep(1000); }
  const on72 = await notePos();
  check('#72 ticking it prints the note below the Terms & Conditions',
    on72.note !== -1 && on72.terms !== -1 && on72.note > on72.terms, JSON.stringify(on72));
  // Untick it again: display options are saved, and this must not leak.
  if (await box72.count() && await box72.isChecked()) { await box72.click(); await sleep(2500); }

  // ---- D-090: an 80 mm receipt prints the invoice's Terms -----------------
  // Chosen through Customize, as staff do. The paper size is saved as the
  // default for new invoices, so it is put back at the end. The Terms also hold
  // a picture with a web address: it must lose that address (the sanitize hook
  // in main.jsx) and never be fetched (the outside-request watch, and the CSP
  // log, would both catch it).
  await openDraft({ ...seamDraft(1), details: { invoiceNumber: 'SMOKE-090/1', invoiceDate: today, placeOfSupply: 'Punjab' },
    customTerms: '<p>SMOKE-THERMAL-TERMS: exchange within 7 days.</p><p><img src="https://smoke-remote.example/terms.png" alt="remote"></p>' });
  if (!(await page.evaluate(() => !!document.querySelector('label.option-toggle')))) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('.generator-toolbar button')].find((x) => /^Customize$/.test(x.innerText.trim()));
      if (b) b.click();
    });
    await sleep(1000);
  }
  const paperSelect = page.locator('select', { has: page.locator('option[value="thermal80"]') }).first();
  const paperBefore = (await paperSelect.count()) ? await paperSelect.inputValue() : null;
  const receiptTerms = () => page.evaluate(() => {
    const p = document.querySelector('#invoice-preview');
    const text = (p?.innerText || '').replace(/\s+/g, ' ');
    return {
      terms: /SMOKE-THERMAL-TERMS/i.test(text),
      heading: /terms\s*(&|and)\s*conditions/i.test(text),
      remoteSrc: [...(p?.querySelectorAll('img') || [])].some((i) => /^(https?:)?\/\//i.test(i.getAttribute('src') || '')),
      thermal: !!p?.querySelector('.paper-thermal80, [class*="thermal"]'),
    };
  });
  let th1 = null;
  let th2 = null;
  const termsToggle = page.locator('label.option-toggle').filter({ hasText: /^\s*Terms & Conditions\s*$/ }).locator('input[type=checkbox]').first();
  const toggleFound = await termsToggle.count();
  if (paperBefore !== null) {
    await paperSelect.selectOption('thermal80');
    await sleep(1500);
    th1 = await receiptTerms();
    if (toggleFound && await termsToggle.isChecked()) { await termsToggle.click(); await sleep(1200); }
    th2 = await receiptTerms();
    // Put both back: Terms on, the paper size it had.
    if (toggleFound && !(await termsToggle.isChecked())) { await termsToggle.click(); await sleep(800); }
    await paperSelect.selectOption(paperBefore);
    await sleep(2500);
  }
  check('D-090 an 80 mm receipt prints the invoice\'s Terms under their heading',
    !!th1?.terms && !!th1.heading, JSON.stringify({ paperBefore, th1 }));
  check('D-090 unticking Customize > Terms & Conditions takes them off the receipt',
    toggleFound > 0 && !!th1?.terms && th2?.terms === false, JSON.stringify({ toggleFound, th2 }));
  check('a picture with a web address in the Terms is shown without that address (never fetched)',
    !!th1 && th1.remoteSrc === false, JSON.stringify(th1));

  // ---- Plain-text Terms keep "<city>" as typed ---------------------------
  // Terms templates written in Settings are plain text. "<city>" in the HC
  // Fashion House Store Terms used to vanish as an unknown HTML tag, printing
  // "Subject to  jurisdiction."
  await api('/api/templates', { id: 'smoketest-hcterms', name: 'Smoke HC Terms',
    content: '1. Exchange within 7 days of purchase with this invoice.\n2. Prices include GST.\n3. Subject to <city> jurisdiction.\nE. & O.E.' });
  await page.evaluate(() => { sessionStorage.removeItem('gst_editingBill'); sessionStorage.removeItem('gst_invoiceDraft'); sessionStorage.setItem('gst_currentView', 'new'); });
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(3000);
  await dismissFirstRun(page);
  await page.waitForSelector('#invoice-preview', { timeout: 20000 }).catch(() => {});
  await page.locator('select', { has: page.locator('option', { hasText: 'Smoke HC Terms' }) }).first()
    .selectOption({ label: 'Smoke HC Terms' }, { timeout: 10_000 }).catch(() => {});
  await sleep(1200);
  const cityText = (await page.locator('#invoice-preview').innerText().catch(() => '')).replace(/\s+/g, ' ');
  check('a plain-text Terms template keeps "<city>" and "&" as typed on the invoice',
    /Subject to <city> jurisdiction\./i.test(cityText) && /E\. & O\.E\./i.test(cityText),
    (cityText.match(/Subject to.{0,30}/i) || ['no terms line'])[0]);

  // ---- v1.10.72 (#73): the Control Panel finds its scripts ---------------------
  // The release ZIP puts them next to server.js in _system/; the server looked
  // only in _system-scripts folders, so every ZIP install reported "Launcher
  // scripts not detected" and Backup failed. The folder is now found by its
  // backup script, and there is no update action at all: new versions are
  // installed by hand. Status only: the suite must never run a backup.
  const cp = await page.evaluate(async () => (await fetch('/api/control-panel/status')).json());
  const cpActions = cp.actions || {};
  check('#73 the Control Panel offers no update action',
    !('update' in cpActions), JSON.stringify({ available: cp.controlScriptsAvailable, actions: cpActions }));
  // HC Fashion House ships its Control Panel scripts for Windows only.
  if (cp.platform === 'win32') {
    check('#73 on Windows the Control Panel finds its backup, restore, move and stop scripts',
      cp.controlScriptsAvailable === true && ['backup', 'restore', 'move', 'stop'].every((k) => cpActions[k] === true),
      JSON.stringify({ available: cp.controlScriptsAvailable, actions: cpActions }));
  }
  // Made from the page, so they carry an Origin as the app's own requests do.
  // Sent only once the server has shown it knows no update action, and the
  // "update" launch only after the update check is confirmed gone: an older
  // server would act on it (download and install upstream code).
  if (!('update' in cpActions)) {
    const gone = await page.evaluate(async () => {
      const updateCheck = (await fetch('/api/check-update')).status;
      const changelog = (await fetch('/api/changelog')).status;
      const launch = updateCheck !== 404 ? null : (await fetch('/api/control-panel/launch-script', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update' }) })).status;
      return { launch, updateCheck, changelog };
    });
    check('#73 the server refuses an "update" action (nothing is started)', gone.launch === 400, JSON.stringify(gone));
    check('#73 there is no update-check or changelog endpoint any more',
      gone.updateCheck === 404 && gone.changelog === 404, JSON.stringify(gone));
  }

  // A web page that points its own site name at this PC (DNS rebinding) still
  // sends that name as Host: the server answers only its own names on its own
  // port (421 otherwise). Sent from Node, which can set any Host.
  const hostStatus = (host) => new Promise((done) => {
    const req = httpGet({ host: '127.0.0.1', port: new URL(APP).port, path: '/api/version', headers: { Host: host } },
      (r) => { r.resume(); done(r.statusCode); });
    req.on('error', () => done(0));
    req.setTimeout(10_000, () => { req.destroy(); done(0); });
  });
  const hostCheck = {
    own: await hostStatus(`127.0.0.1:${new URL(APP).port}`),
    foreign: await hostStatus(`smoke-rebind.example:${new URL(APP).port}`),
  };
  check('the server answers its own address and refuses any other host name (421)',
    hostCheck.own === 200 && hostCheck.foreign === 421, JSON.stringify(hostCheck));

  // ---- v1.10.71: Generate Now uses the server's full invoice maths ---------
  // It used to do its own simplified maths in the browser (no CGST/SGST/IGST
  // split, interval and end conditions ignored). A delivery challan is used so
  // the suite never takes a tax-invoice number from the real series.
  const gen = await page.evaluate(async () => {
    const prof = await (await fetch('/api/profile')).json();
    await fetch('/api/recurring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      id: 'smoketest-rec', clientName: 'Smoke Test Client', clientState: prof.state || 'Karnataka',
      frequency: 'monthly', interval: 2, nextDate: '2099-01-01', invoiceType: 'delivery-challan', active: false,
      items: [{ name: 'Smoke recurring item', quantity: 2, rate: 100, taxPercent: 18 }],
      invoiceOptions: { showGST: true },
    }) });
    const r = await fetch('/api/recurring/smoketest-rec/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const out = await r.json();
    const bill = out.invoiceNumber ? (await (await fetch('/api/bills')).json()).find((b) => b.id === out.invoiceNumber) : null;
    const tpl = (await (await fetch('/api/recurring')).json()).find((t) => t.id === 'smoketest-rec');
    return { ok: r.ok, invoiceNumber: out.invoiceNumber, totals: bill?.data?.totals || null, nextDate: tpl?.nextDate, count: tpl?.occurrencesCreated };
  });
  check('v71 Generate Now makes the invoice even for a paused template', gen.ok && !!gen.invoiceNumber, JSON.stringify(gen));
  check('v71 Generate Now works the tax out properly (split into CGST+SGST or IGST)',
    !!gen.totals && Math.abs((gen.totals.cgst || 0) + (gen.totals.sgst || 0) + (gen.totals.igst || 0) - 36) < 0.01, JSON.stringify(gen.totals));
  check('v71 Generate Now honours "every 2 months" and counts the invoice',
    gen.nextDate === '2099-03-01' && gen.count === 1, `${gen.nextDate} / ${gen.count}`);

  // ---- v1.10.71: Bulk PDF on the Dashboard ----------------------------------
  // The button passed its click event where the ticked invoices belonged, so
  // it always said "Could not generate any PDFs".
  if (gen.invoiceNumber) {
    await openView('Dashboard');
    await page.fill('input[placeholder="Search client or invoice..."]', gen.invoiceNumber);
    await sleep(800);
    const row = page.locator('tr', { hasText: gen.invoiceNumber }).first();
    await row.locator('input[type="checkbox"]').check();
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }).catch(() => null),
      page.locator('button', { hasText: 'Bulk PDF' }).first().click(),
    ]);
    check('v71 Bulk PDF downloads a PDF of the ticked invoices', !!dl && /\.pdf$/i.test(dl.suggestedFilename()), dl ? dl.suggestedFilename() : 'no download');
    await page.fill('input[placeholder="Search client or invoice..."]', '');
  }

  // ---- v1.10.76: stock follows edits (#80), quotations (#83), refresh while editing
  {
    const get76 = (url) => page.evaluate(async (url) => (await fetch(url)).json(), url);
    const post76 = (url, body) => page.evaluate(async ({ url, body }) => (await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).ok, { url, body });
    const stock76 = async () => (await get76('/api/products')).find((x) => x.id === 'smoketest-pen')?.stock;
    const prof76 = await get76('/api/profile');
    const bill76 = (id, type, q, applied) => ({
      id, invoiceNumber: id, clientName: 'Smoke Test Client', invoiceDate: today, invoiceType: type, status: 'unpaid',
      totalAmount: q * 11.8, paidAmount: 0, payments: [],
      data: { profile: prof76, client: { name: 'Smoke Test Client', state: prof76.state, country: 'India' },
        details: { invoiceNumber: id, invoiceDate: today }, invoiceType: type, invoiceOptions: {}, totals: { total: q * 11.8 },
        items: [{ id: 'l1', productId: 'smoketest-pen', name: 'Smoke Pen', hsn: '9608', quantity: q, rate: 10, taxPercent: 18, discount: 0, unit: 'Pcs' }],
        ...(applied ? { stockApplied: applied } : {}) },
    });
    // Opening it through the saved session is a page refresh while editing,
    // which blanked the whole app before v1.10.76.
    const openForEdit76 = async (bill) => {
      await page.evaluate((bill) => { sessionStorage.setItem('gst_editingBill', JSON.stringify(bill)); sessionStorage.setItem('gst_currentView', 'new'); sessionStorage.removeItem('gst_invoiceDraft'); }, bill);
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(2500);
      await dismissFirstRun(page);
      return page.waitForSelector('#invoice-preview', { timeout: 30000 }).then(() => true).catch(() => false);
    };
    const save76 = async () => { await page.getByRole('button', { name: /^Save$/ }).first().click(); await sleep(3500); };
    const toDashboard76 = async () => {
      await page.evaluate(() => { sessionStorage.removeItem('gst_editingBill'); sessionStorage.setItem('gst_currentView', 'dashboard'); });
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(3000);
      await dismissFirstRun(page);
    };

    await post76('/api/products', { id: 'smoketest-pen', name: 'Smoke Pen', hsn: '9608', rate: 10, taxPercent: 18, unit: 'Pcs', stock: 40 });
    const inv76 = bill76('smoketest-inv76', 'tax-invoice', 10, { 'smoketest-pen': -10 });
    await post76('/api/bills', inv76);
    check('v76 refreshing the page while editing an invoice keeps the app on screen', await openForEdit76(inv76));
    await page.locator('.line-item-field', { has: page.locator('label', { hasText: /^Qty$/ }) }).locator('input').first().fill('15');
    await sleep(500);
    await save76();
    check('v76 #80 editing a quantity 10 -> 15 takes exactly 5 more from stock', (await stock76()) === 35, `stock=${await stock76()}`);
    await save76();
    check('v76 #80 saving again unchanged moves no stock', (await stock76()) === 35, `stock=${await stock76()}`);

    await post76('/api/bills', bill76('smoketest-quo76', 'quotation', 5, {}));
    await toDashboard76();
    const quoRow = () => page.locator('tr', { hasText: 'smoketest-quo76' }).first();
    check('v76 #83 a quotation has no Paid/Unpaid menu', (await quoRow().locator('select.status-select').count()) === 0);
    check('v76 #80 a quotation takes no stock', (await stock76()) === 35, `stock=${await stock76()}`);
    await quoRow().locator('button[title="Convert to Tax Invoice"]').click();
    await sleep(3000);
    await page.waitForSelector('#invoice-preview', { timeout: 30000 });
    await save76();
    const quo76 = (await get76('/api/bills')).find((x) => x.id === 'smoketest-quo76');
    check('v76 #83 a converted quotation is marked and the invoice takes the stock once',
      !!quo76?.convertedTo && (await stock76()) === 30, `convertedTo=${quo76?.convertedTo} stock=${await stock76()}`);
    await toDashboard76();
    check('v76 #83 its Convert button is gone', (await quoRow().locator('button[title="Convert to Tax Invoice"]').count()) === 0);
  }

  // ---- v1.10.77: issues #84-#89 --------------------------------------------
  {
    const get77 = (url) => page.evaluate(async (url) => { const r = await fetch(url); return { status: r.status, json: await r.json().catch(() => null) }; }, url);
    const post77 = (url, body) => page.evaluate(async ({ url, body }) => { const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, json: await r.json().catch(() => null) }; }, { url, body });
    const toView77 = async (view) => {
      await page.evaluate((v) => { sessionStorage.removeItem('gst_editingBill'); sessionStorage.removeItem('gst_invoiceDraft'); sessionStorage.setItem('gst_currentView', v); }, view);
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(2500);
      await dismissFirstRun(page);
    };

    // #84 optional PIN lock
    await post77('/api/lock/set', { pin: '13572468' });
    await page.evaluate(() => sessionStorage.removeItem('gst_unlocked'));
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(2000);
    const locked = await page.getByText('Enter your PIN').isVisible().catch(() => false);
    const metaRefused = (await get77('/api/meta/appLock')).status === 403;
    await page.getByLabel('8 digit PIN').fill('13572468').catch(() => {});
    await sleep(2500);
    const unlocked = !(await page.getByText('Enter your PIN').count()) && (await page.locator('.sidebar').count()) > 0;
    const off = (await post77('/api/lock/set', { pin: null, currentPin: '13572468' })).status === 200;
    check('v77 #84 PIN lock: asked on open, opens with the right PIN, hash not readable, turns off', locked && unlocked && metaRefused && off,
      JSON.stringify({ locked, unlocked, metaRefused, off }));
    await dismissFirstRun(page);

    // #84 settings are kept in the data folder too, so a browser that loses
    // its storage gets them back (no welcome wizard, same Region and Print).
    const prefs = (await get77('/api/local-prefs')).json?.value || {};
    check('v77 #84 settings are mirrored to the data folder', typeof prefs === 'object' && 'gst_printSettings' in prefs, Object.keys(prefs).join(','));

    // Critical: opening a saved invoice must keep its own terms, even when a
    // terms template exists (it used to be replaced by the first template).
    await post77('/api/templates', { id: 'smoketest-tpl77', name: 'Smoke template', content: '<p>SMOKE-TEMPLATE-TERMS</p>' });
    const prof77 = (await get77('/api/profile')).json;
    const today77 = new Date().toISOString().slice(0, 10);
    const bill77 = {
      id: 'smoketest-terms77', invoiceNumber: 'smoketest-terms77', clientName: 'Smoke Test Client', invoiceDate: today77, invoiceType: 'tax-invoice',
      status: 'unpaid', totalAmount: 1180, paidAmount: 0, payments: [],
      data: { profile: prof77, client: { name: 'Smoke Test Client', state: prof77.state, country: 'India' }, details: { invoiceNumber: 'smoketest-terms77', invoiceDate: today77 },
        invoiceType: 'tax-invoice', invoiceOptions: {}, totals: { total: 1180 }, customTerms: '<p>SMOKE-SAVED-TERMS</p>', stockApplied: {},
        items: [{ id: 'l1', name: 'Smoke item', hsn: '9983', quantity: 1, rate: 1000, taxPercent: 18, discount: 0, unit: 'Nos' }] },
    };
    await post77('/api/bills', bill77);
    await page.evaluate((b) => { sessionStorage.setItem('gst_editingBill', JSON.stringify(b)); sessionStorage.setItem('gst_currentView', 'new'); sessionStorage.removeItem('gst_invoiceDraft'); }, bill77);
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(3500);
    await dismissFirstRun(page);
    const termsText = await page.locator('#invoice-preview').innerText().catch(() => '');
    check('v77 opening a saved invoice keeps its own terms (not the first template)',
      termsText.includes('SMOKE-SAVED-TERMS') && !termsText.includes('SMOKE-TEMPLATE-TERMS'));

    // #87 delivery charges
    await toView77('new');
    await page.getByRole('button', { name: /Delivery charges/ }).first().click();
    await sleep(800);
    check('v77 #87 Delivery charges adds a line with SAC 996812',
      (await page.locator('input[value="Delivery charges"]').count()) > 0 && (await page.locator('input[value="996812"]').count()) > 0);

    // #88 a short invoice is one page in every design
    await openDraft(seamDraft(1));
    await pickStyle('Tally style');
    const T77 = await pdfLayout(1);
    await pickStyle('Boxed grid');
    const B77 = await pdfLayout(1);
    await pickStyle('Classic');
    check('v77 #88 a one-item invoice is one PDF page in Tally style and Boxed grid',
      !!T77?.onePage && !!B77?.onePage, JSON.stringify({ tally: T77?.onePage, boxed: B77?.onePage }));

    // #85 stock report with Excel export
    await toView77('reports');
    await page.getByRole('button', { name: 'Stock', exact: true }).click();
    await sleep(2000);
    let xlsxOk = false;
    try {
      const [d] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name: 'Excel' }).first().click()]);
      xlsxOk = /\.xlsx$/.test(d.suggestedFilename());
    } catch { /* judged below */ }
    check('v77 #85 Reports > Stock shows the closing stock value and downloads Excel',
      (await page.getByText('Total stock value').count()) > 0 && xlsxOk);

    // #85 bulk product edit
    await post77('/api/products', { id: 'smoketest-bulk77', name: 'Smoke Bulk Item', hsn: '9608', sellingPrice: 10, rate: 10, taxPercent: 18, unit: 'Nos', stock: 7 });
    await toView77('inventory');
    await page.getByRole('button', { name: 'Bulk edit' }).click();
    await sleep(800);
    await page.getByLabel('Selling price of Smoke Bulk Item').fill('12.5');
    await page.getByRole('button', { name: /Save changes \(1\)/ }).click();
    await sleep(2500);
    const bulk77 = (await get77('/api/products')).json.find((x) => x.id === 'smoketest-bulk77');
    check('v77 #85 Bulk edit saves the changed price (and rate) and leaves stock alone',
      bulk77?.sellingPrice === 12.5 && bulk77?.rate === 12.5 && bulk77?.stock === 7, JSON.stringify(bulk77 && { s: bulk77.sellingPrice, r: bulk77.rate, st: bulk77.stock }));
  }

  // ---- v1.10.78: issues #92, #93 -------------------------------------------
  {
    const get78 = (url) => page.evaluate(async (url) => (await fetch(url)).json(), url);
    const post78 = (url, body) => page.evaluate(async ({ url, body }) => (await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json().catch(() => null), { url, body });
    const toView78 = async (view) => {
      await page.evaluate((v) => { sessionStorage.removeItem('gst_editingBill'); sessionStorage.removeItem('gst_invoiceDraft'); sessionStorage.setItem('gst_currentView', v); }, view);
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(2500);
      await dismissFirstRun(page);
    };

    // #93 "Start numbering from": a tax invoice saved through the editor gets
    // it (it used to show it and save 0001); a quotation keeps its own count.
    const numSettings = (await get78('/api/meta/invoiceNumberSettings')).value;
    const counterBefore = (await get78('/api/meta/counter_INV')).value;
    await post78('/api/meta/invoiceNumberSettings', { value: { ...(numSettings || {}), format: 'branded', startNumber: 900001 } });
    const draft78 = (type) => ({
      invoiceType: type,
      client: { name: 'Smoke Test Client', address: '', city: '', pin: '', state: 'Punjab', gstin: '', country: 'India', email: '', phone: '', isSEZ: false },
      details: { invoiceDate: new Date().toISOString().slice(0, 10), placeOfSupply: 'Punjab' },
      items: draftItems, taxInclusive: false,
    });
    await openDraft(draft78('quotation'));
    const quoShown = await page.locator('#invoice-preview').innerText().catch(() => '');
    await toView78('new'); // a blank new tax invoice shows the next number
    await page.waitForSelector('#invoice-preview', { timeout: 20000 });
    await sleep(1500);
    const invShown = await page.locator('#invoice-preview').innerText().catch(() => '');
    await openDraft(draft78('tax-invoice'));
    await page.getByRole('button', { name: /^Save$/ }).first().click();
    await sleep(3500);
    const saved78 = (await get78('/api/bills')).filter((x) => x.clientName === 'Smoke Test Client' && /\/900001$/.test(x.id));
    check('v78 #93 Start numbering from: a tax invoice is shown and saved as 900001; a quotation is not',
      /\/900001\b/.test(invShown) && saved78.length === 1 && !/900001/.test(quoShown),
      JSON.stringify({ shown: /\/900001\b/.test(invShown), saved: saved78.map((x) => x.id), quotationUsesIt: /900001/.test(quoShown) }));
    await post78('/api/meta/counter_INV', { value: counterBefore });
    await post78('/api/meta/invoiceNumberSettings', { value: numSettings });

    // #92 Undo is a button in the Actions column and asks first
    const prof78 = await get78('/api/profile');
    const today78 = new Date().toISOString().slice(0, 10);
    await post78('/api/bills', {
      id: 'smoketest-undo78', invoiceNumber: 'smoketest-undo78', clientName: 'Smoke Test Client', invoiceDate: today78, invoiceType: 'tax-invoice',
      status: 'cancelled', cancelledAt: new Date().toISOString(), totalAmount: 1180, paidAmount: 0, payments: [],
      data: { profile: prof78, client: { name: 'Smoke Test Client', state: prof78.state, country: 'India' }, details: { invoiceNumber: 'smoketest-undo78', invoiceDate: today78 },
        invoiceType: 'tax-invoice', invoiceOptions: {}, totals: { total: 1180 }, stockApplied: {},
        items: [{ id: 'l1', name: 'Smoke item', hsn: '9983', quantity: 1, rate: 1000, taxPercent: 18, discount: 0, unit: 'Nos' }] },
    });
    await toView78('dashboard');
    const undoRow = page.locator('tr', { hasText: 'smoketest-undo78' }).first();
    await undoRow.locator('button[title="Undo cancel"]').click();
    await sleep(700);
    const asked = await page.getByRole('button', { name: 'Yes, undo' }).count();
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await sleep(1000);
    const afterNo = (await get78('/api/bills')).find((x) => x.id === 'smoketest-undo78')?.status;
    await undoRow.locator('button[title="Undo cancel"]').click();
    await sleep(700);
    await page.getByRole('button', { name: 'Yes, undo' }).click();
    await sleep(2500);
    const afterYes = (await get78('/api/bills')).find((x) => x.id === 'smoketest-undo78')?.status;
    check('v78 #92 Undo cancel is in the Actions column, asks Yes/No, and only Yes brings it back',
      asked === 1 && afterNo === 'cancelled' && afterYes === 'unpaid', JSON.stringify({ asked, afterNo, afterYes }));
  }

  // ---- v1.10.79: issues #94, #95, #96 --------------------------------------
  {
    const get79 = (url) => page.evaluate(async (url) => (await fetch(url)).json(), url);
    const post79 = (url, body) => page.evaluate(async ({ url, body }) => (await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json().catch(() => null), { url, body });
    const toNew79 = async () => {
      await page.evaluate(() => { sessionStorage.removeItem('gst_editingBill'); sessionStorage.removeItem('gst_invoiceDraft'); sessionStorage.setItem('gst_currentView', 'new'); });
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(3000);
      await dismissFirstRun(page);
      return page.locator('#invoice-preview').innerText().catch(() => '');
    };
    const profile79 = await get79('/api/profile');
    const shared79 = (await get79('/api/meta/invoiceNumberSettings')).value;
    const series79 = (await get79('/api/meta/invoiceNumberSeries')).value;

    // #95 a second business with its own numbering: the screen shows its own
    // next number (it used to show the shared series'), saving takes it.
    const other79 = { businessName: 'Smoke Second Firm', state: 'Maharashtra', country: 'India', gstin: '27AAPFS9999Q1Z1' };
    await post79('/api/meta/invoiceNumberSeries', { value: { ...(series79 || {}), '27AAPFS9999Q1Z1': { brandPrefix: 'SMKB', startNumber: 502 } } });
    await post79('/api/profile', other79);
    const own79 = await toNew79();
    await post79('/api/profile', profile79);
    const shared79Shown = await toNew79();
    check('v79 #95 a business with its own numbering shows and numbers in its own series',
      /SMKB\/[\d-]*\/?0502\b|SMKB\/0502\b/.test(own79) && !/SMKB/.test(shared79Shown),
      JSON.stringify({ own: (own79.match(/SMKB[^\s]*/) || ['-'])[0], shared: (shared79Shown.match(/[A-Z-]+\/[\d-]+\/\d+/) || ['-'])[0] }));
    await post79('/api/meta/invoiceNumberSeries', { value: series79 || {} });
    await post79('/api/meta/' + encodeURIComponent('counter_INV@27AAPFS9999Q1Z1'), { value: null });

    // Brand prefix: other types are brand-TYPE, so they never collide with invoices
    await post79('/api/meta/invoiceNumberSettings', { value: { ...(shared79 || {}), brandPrefix: 'SMKA' } });
    await page.evaluate(() => {
      sessionStorage.setItem('gst_invoiceDraft', JSON.stringify({ invoiceType: 'quotation', client: { name: 'Smoke Test Client', state: 'Punjab', country: 'India' },
        details: { invoiceDate: new Date().toISOString().slice(0, 10), placeOfSupply: 'Punjab' },
        items: [{ id: 'l1', name: 'Smoke item', hsn: '9983', quantity: 1, rate: 1000, taxPercent: 18, discount: 0, unit: 'Nos' }] }));
      sessionStorage.setItem('gst_currentView', 'new'); sessionStorage.removeItem('gst_editingBill');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(3000);
    await dismissFirstRun(page);
    await page.getByRole('button', { name: /^Save$/ }).first().click();
    await sleep(3500);
    const quo79 = (await get79('/api/bills')).filter((x) => x.clientName === 'Smoke Test Client' && x.invoiceType === 'quotation').map((x) => x.id);
    check('v79 brand prefix: a quotation is numbered SMKA-QUO/..., apart from SMKA/... invoices', quo79.some((id) => /^SMKA-QUO\//.test(id)), quo79.join(','));
    await post79('/api/meta/invoiceNumberSettings', { value: shared79 });

    // #94 the saved PDF of a cancelled invoice is stamped, and Undo restores it
    const pdf = await PDFDocument.create();
    pdf.addPage([595, 842]);
    const bytes = await pdf.save();
    const name79 = 'INV_smoketest-pdf79.pdf';
    const savedPdf = await page.evaluate(async ({ b, name }) => (await fetch(`/api/save-pdf?name=${encodeURIComponent(name)}&client=Smoke%20Test%20Client&month=Smoke`, {
      method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: new Uint8Array(b) })).json(), { b: [...bytes], name: name79 });
    const stamp79 = await post79('/api/saved-pdf/cancel-mark', { fileName: name79, clientName: 'Smoke Test Client', cancelled: true });
    const again79 = await post79('/api/saved-pdf/cancel-mark', { fileName: name79, clientName: 'Smoke Test Client', cancelled: true });
    const undo79 = await post79('/api/saved-pdf/cancel-mark', { fileName: name79, clientName: 'Smoke Test Client', cancelled: false });
    const undoAgain79 = await post79('/api/saved-pdf/cancel-mark', { fileName: name79, clientName: 'Smoke Test Client', cancelled: false });
    check('v79 #94 a saved PDF is stamped CANCELLED (once, however often) and Undo restores it',
      savedPdf?.saved && stamp79?.updated === 1 && again79?.updated === 1 && undo79?.updated === 1 && undoAgain79?.updated === 0,
      JSON.stringify({ stamp: stamp79, undo: undo79, undoAgain: undoAgain79 }));
    await post79('/api/trash-pdf', { fileName: name79, clientName: 'Smoke Test Client' });

    // A renamed business keeps its own numbering
    await post79('/api/meta/invoiceNumberSeries', { value: { ...(series79 || {}), 'NAME:smoke old name': { brandPrefix: 'SMKR' } } });
    await post79('/api/meta/' + encodeURIComponent('counter_INV@NAME:smoke old name'), { value: 41 });
    const moved79 = await post79('/api/number-series/rename', { from: 'NAME:smoke old name', to: '27AAPFR9999Q1Z1' });
    const map79 = (await get79('/api/meta/invoiceNumberSeries')).value || {};
    const ctr79 = (await get79('/api/meta/' + encodeURIComponent('counter_INV@27AAPFR9999Q1Z1'))).value;
    check('v79 #95 a business saved under a new GSTIN keeps its own numbering and count',
      moved79?.moved && map79['27AAPFR9999Q1Z1']?.brandPrefix === 'SMKR' && !map79['NAME:smoke old name'] && ctr79 === 41,
      JSON.stringify({ moved79, ctr79 }));
    await post79('/api/meta/invoiceNumberSeries', { value: series79 || {} });
    await post79('/api/meta/' + encodeURIComponent('counter_INV@27AAPFR9999Q1Z1'), { value: null });

    // Converting two quotations in a row makes two invoices (the second used
    // to overwrite the first: a conversion saved under a number it only peeked).
    const quoteOf79 = (id) => ({
      id, invoiceNumber: id, clientName: 'Smoke Test Client', invoiceDate: new Date().toISOString().slice(0, 10), invoiceType: 'quotation',
      status: 'unpaid', totalAmount: 1180, paidAmount: 0, payments: [],
      data: { profile: profile79, client: { name: 'Smoke Test Client', state: profile79.state, country: 'India' }, details: { invoiceNumber: id, invoiceDate: new Date().toISOString().slice(0, 10) },
        invoiceType: 'quotation', invoiceOptions: {}, totals: { total: 1180 }, stockApplied: {},
        items: [{ id: 'l1', name: 'Smoke item', hsn: '9983', quantity: 1, rate: 1000, taxPercent: 18, discount: 0, unit: 'Nos' }] },
    });
    const before79 = (await get79('/api/bills')).filter((x) => x.clientName === 'Smoke Test Client' && x.invoiceType === 'tax-invoice').map((x) => x.id);
    for (const qid of ['smoketest-conv79a', 'smoketest-conv79b']) {
      const q = quoteOf79(qid);
      await post79('/api/bills', q);
      await page.evaluate((bill) => {
        sessionStorage.setItem('gst_editingBill', JSON.stringify({ ...bill, _isDuplicate: true, _convertToType: 'tax-invoice' }));
        sessionStorage.setItem('gst_currentView', 'new'); sessionStorage.removeItem('gst_invoiceDraft');
      }, q);
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(3000);
      await dismissFirstRun(page);
      await page.getByRole('button', { name: /^Save$/ }).first().click();
      await sleep(3500);
    }
    const after79 = (await get79('/api/bills')).filter((x) => x.clientName === 'Smoke Test Client' && x.invoiceType === 'tax-invoice').map((x) => x.id);
    const made79 = after79.filter((id) => !before79.includes(id));
    check('v79 converting two quotations in a row makes two invoices, neither overwritten', made79.length === 2, made79.join(', '));
    for (const id of made79) await page.evaluate(async (id) => fetch('/api/bills/' + encodeURIComponent(id), { method: 'DELETE' }), id);
  }

  // ---- A tab that remembers a removed screen opens the Dashboard ----------
  // The Support page and What's new are gone. A tab that last showed one of
  // them (the screen is kept in sessionStorage across reloads), or an old
  // ?view=support link, must land on the Dashboard, not an empty main area.
  {
    const landedOn = async (view, url = null) => {
      await page.evaluate((v) => { sessionStorage.removeItem('gst_editingBill'); sessionStorage.removeItem('gst_invoiceDraft'); sessionStorage.setItem('gst_currentView', v); }, view);
      if (url) await page.goto(url, { waitUntil: 'networkidle' });
      else await page.reload({ waitUntil: 'networkidle' });
      await sleep(2500);
      await dismissFirstRun(page);
      return page.evaluate(() => ({
        title: document.querySelector('.main-content .page-title')?.innerText.trim() || '',
        filled: (document.querySelector('.main-content')?.innerText || '').trim().length > 0,
      }));
    };
    const fromSupport = await landedOn('support');
    check('a tab still showing the removed Support page reopens on the Dashboard, not a blank page',
      fromSupport.title === 'Dashboard' && fromSupport.filled, JSON.stringify(fromSupport));
    const fromOldLink = await landedOn('whatsnew', new URL('/?view=support', APP).href);
    check('an old What\'s new screen or ?view=support link opens the Dashboard too',
      fromOldLink.title === 'Dashboard' && fromOldLink.filled, JSON.stringify(fromOldLink));
    await page.goto(APP, { waitUntil: 'networkidle' }); // drop ?view= from the address again
    await sleep(2000);
    await dismissFirstRun(page);
  }

  // ---- About, the footer and the menu: the shop's name, no outside links --
  {
    const version = await page.evaluate(async () => (await (await fetch('/api/version')).json()).current || '');
    await openView('Dashboard');
    const footer = await page.evaluate(() => {
      const f = document.querySelector('.main-content footer');
      return f ? { text: f.innerText.replace(/\s+/g, ' ').trim(), links: [...f.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')) } : null;
    });
    check('the Dashboard footer reads "HC Fashion House v<version>" and links nowhere',
      !!version && !!footer && footer.text.includes(`HC Fashion House v${version}`) && footer.links.length === 0, JSON.stringify(footer));

    await openView('About');
    let about = { text: '', outside: [] };
    for (let i = 0; i < 10; i++) { // the version comes from the server a moment after the page
      about = await page.evaluate(() => {
        const main = document.querySelector('.main-content');
        return {
          text: (main?.innerText || '').replace(/\s+/g, ' ').trim(),
          outside: [...(main?.querySelectorAll('a[href]') || [])].map((a) => a.getAttribute('href') || '').filter((h) => /^(https?:)?\/\//i.test(h)),
        };
      });
      if (version && about.text.includes(`Version ${version}`)) break;
      await sleep(500);
    }
    check('About shows "HC Fashion House", the version and the contact line, and links nowhere outside',
      !!version && about.text.includes('HC Fashion House') && about.text.includes(`Version ${version}`)
        && about.text.includes('Contact your HC Fashion House administrator') && about.outside.length === 0,
      about.outside.length ? about.outside.join(' ') : about.text.slice(0, 160));
    await noteOldName('About');

    await openView('Control Panel');
    await noteOldName('Control Panel');
    const navLabels = await page.evaluate(() => [...document.querySelectorAll('.sidebar .nav-btn')].map((b) => b.innerText.trim()));
    check('the menu has About, and no Support page or online User Guide',
      navLabels.includes('About') && !navLabels.some((t) => /support|user guide/i.test(t)), JSON.stringify(navLabels));
  }

  // ---- Backup files: export, and restore with "Replace existing data" ----
  // Unticked (the default), a restore only adds what this PC does not have.
  // Ticked, the backup's records replace the ones here, after a snapshot.
  // Either way it never brings a Google Client ID, another PC's install id or
  // backup folder, and never lowers an invoice counter. Backups from the old
  // version (no format version, partial ones included) still restore.
  {
    const get = (url) => page.evaluate(async (u) => (await fetch(u)).json(), url);
    const post = (url, body) => page.evaluate(async ({ u, b }) => {
      const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
      return { status: r.status, json: await r.json().catch(() => null) };
    }, { u: url, b: body });
    const productName = async (id) => (await get('/api/products')).find((p) => p.id === id)?.name ?? null;
    const item = (id, name) => ({ id, name, hsn: '9608', rate: 10, sellingPrice: 10, taxPercent: 18, unit: 'Pcs', stock: 5 });
    const jsonFile = (name, data) => ({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
    await post('/api/products', item('smoketest-imp', 'Smoke Import Original'));
    // A partial backup as the old version wrote them: products only, no
    // profile, no invoices, no format version; only its marker says what it is.
    const backupFile = jsonFile('hc-fashion-house-backup-smoke.json', { exportedAt: new Date().toISOString(), __freegstbill_backup: true,
      products: [item('smoketest-imp', 'Smoke Import Replaced'), item('smoketest-imp-new', 'Smoke Import New')] });
    // Through the Settings screen, the way staff do it.
    const restoreFile = async (replace, file = backupFile) => {
      await page.locator('input[type="file"][accept=".json"]').setInputFiles(file);
      const box = page.getByRole('checkbox', { name: /Replace existing data/i });
      await box.first().waitFor({ timeout: 10_000 }).catch(() => {});
      const shown = await box.count();
      const tickedAtFirst = shown ? await box.first().isChecked() : null;
      if (shown && replace) await box.first().check();
      await page.getByRole('button', { name: /Restore selected/i }).first().click({ timeout: 10_000 }).catch(() => {});
      await sleep(2500);
      return { shown, tickedAtFirst };
    };
    const snapshots = () => {
      try { return readdirSync(join(smokeHome, 'data', 'backups')).filter((n) => /^pre-import-/.test(n)).length; } catch { return 0; }
    };

    await openView('Settings');

    // An export names the shop, carries a format version and never the
    // Google Drive Client ID (a restore elsewhere must not switch Drive on).
    const profileForExport = await get('/api/profile');
    await post('/api/profile', { ...profileForExport, googleClientId: 'smoke-test-client-id' });
    let exportName = '';
    let exported = null;
    try {
      await page.getByRole('button', { name: /Export Backup/i }).first().click();
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        page.getByRole('button', { name: /Download Backup/i }).first().click(),
      ]);
      exportName = dl.suggestedFilename();
      exported = JSON.parse(readFileSync(await dl.path(), 'utf8'));
    } catch { /* judged below */ }
    const exportModal = page.locator('.modal-content', { hasText: 'Export Backup' });
    if (await exportModal.count()) await exportModal.getByRole('button', { name: /^Cancel$/ }).click().catch(() => {});
    await post('/api/profile', { ...profileForExport, googleClientId: '' });
    check('an export is an HC Fashion House backup file with a format version and no Drive Client ID',
      /^hc-fashion-house-backup-\d{4}-\d{2}-\d{2}\.json$/.test(exportName) && exported?.formatVersion === 1
        && exported.__freegstbill_backup === true && !!exported.profile && !exported.profile.googleClientId
        && !(exported.profiles || []).some((p) => p?.googleClientId),
      JSON.stringify({ file: exportName, formatVersion: exported?.formatVersion, clientId: exported?.profile?.googleClientId ?? null }));

    const merge = await restoreFile(false);
    const afterMerge = { existing: await productName('smoketest-imp'), added: await productName('smoketest-imp-new') };
    check('Restore offers "Replace existing data", unticked to begin with',
      merge.shown > 0 && merge.tickedAtFirst === false, JSON.stringify(merge));
    check('a restore without "Replace existing data" adds what is missing and keeps what is here',
      afterMerge.existing === 'Smoke Import Original' && afterMerge.added === 'Smoke Import New', JSON.stringify(afterMerge));

    const snapsBefore = smokeHome ? snapshots() : 0;
    const replace = await restoreFile(true);
    const replaced = await productName('smoketest-imp');
    const snapsAfter = smokeHome ? snapshots() : 0;
    check('with "Replace existing data" ticked the backup\'s record wins, after a snapshot of the data',
      replace.shown > 0 && replaced === 'Smoke Import Replaced' && (!smokeHome || snapsAfter > snapsBefore),
      JSON.stringify({ replaced, snapshots: smokeHome ? `${snapsBefore} -> ${snapsAfter}` : 'not checked (APP_URL)' }));

    // A full backup made by the old version (no format version, the old
    // marker). Restored without "Replace existing data": its records arrive,
    // this PC keeps its own business profile, the per-GSTIN "Filed" marks come
    // back, and a browser key that is not a setting is never written.
    const businessBefore = (await get('/api/profile')).businessName;
    const marks = JSON.stringify({ 'smoke-period': { gstr1: true } });
    const oldDay = isoDay(0);
    await restoreFile(false, jsonFile('old-version-backup-smoke.json', {
      exportedAt: `${oldDay}T09:00:00.000Z`, version: '1.10.82', __freegstbill_backup: true,
      profile: { businessName: 'Smoke Old Firm', state: 'Punjab', country: 'India', googleClientId: 'smoke-test-client-id' },
      bills: [{ id: 'smoketest-old-bill', invoiceNumber: 'smoketest-old-bill', clientName: 'Smoke Old Client', invoiceDate: oldDay,
        invoiceType: 'tax-invoice', status: 'unpaid', totalAmount: 118, paidAmount: 0, payments: [],
        data: { details: { invoiceNumber: 'smoketest-old-bill', invoiceDate: oldDay }, client: { name: 'Smoke Old Client' }, items: [], totals: { total: 118 } } }],
      clients: [{ id: 'smoketest-old-client', name: 'Smoke Old Client', state: 'Punjab', country: 'India' }],
      meta: { counter_INV: 1, installId: 'smoke-old-install' },
      localStorage: { gst_filing_status_03AAAAA1111A1Z1: marks, smoke_foreign_key: 'x' },
    }));
    const oldRestore = {
      bill: (await get('/api/bills')).some((b) => b.id === 'smoketest-old-bill'),
      client: (await get('/api/clients')).some((c) => c.id === 'smoketest-old-client'),
      profileKept: (await get('/api/profile')).businessName === businessBefore,
      filedMarks: await page.evaluate(() => localStorage.getItem('gst_filing_status_03AAAAA1111A1Z1')) === marks,
      foreignKey: await page.evaluate(() => localStorage.getItem('smoke_foreign_key')),
      installId: (await get('/api/meta/installId')).value ?? null,
    };
    check('a full backup from the old version still restores: records and Filed marks come back, this PC keeps its profile',
      oldRestore.bill && oldRestore.client && oldRestore.profileKept && oldRestore.filedMarks
        && oldRestore.foreignKey === null && oldRestore.installId !== 'smoke-old-install',
      JSON.stringify(oldRestore));

    // The same restore sent to the server directly, carrying values that
    // must never come across from a backup file.
    const counterBefore = (await get('/api/meta/counter_INV')).value ?? null;
    await post('/api/meta/counter_INV', { value: 500 });
    const metaNow = (await get('/api/export')).meta || {};
    const profileNow = await get('/api/profile');
    const foreignFolder = join(tmpdir(), 'hcfh-smoke-foreign-backups'); // where backups would go if it came across
    const res = await post('/api/import?overwrite=1', {
      profile: { ...profileNow, googleClientId: 'smoke-test-client-id' },
      profiles: [{ id: 'smoketest-imp-prof', businessName: 'Smoke Import Firm', googleClientId: 'smoke-test-client-id' }],
      meta: { ...metaNow, counter_INV: 3, installId: 'smoke-foreign-install', backupFolder: foreignFolder },
    });
    const savedProfile = (await get('/api/profiles')).find((p) => p.id === 'smoketest-imp-prof');
    const after = {
      status: res.status,
      clientId: (await get('/api/profile')).googleClientId || '',
      savedProfile: savedProfile ? savedProfile.googleClientId || '' : 'not written',
      counter: Number((await get('/api/meta/counter_INV')).value) || 0,
      installId: (await get('/api/meta/installId')).value ?? null,
      backupFolder: (await get('/api/meta/backupFolder')).value ?? null,
    };
    await post('/api/meta/counter_INV', { value: counterBefore });
    check('a restored backup never brings a Google Client ID, another PC\'s install id or backup folder, and never lowers a counter',
      after.status === 200 && !after.clientId && after.savedProfile === '' && after.counter >= 500
        && after.installId !== 'smoke-foreign-install' && after.backupFolder !== foreignFolder,
      JSON.stringify(after));
    const told = res.json || {};
    check('the restore reports what it wrote, what it skipped and whether the profile was written',
      told.written !== undefined && told.skipped !== undefined && typeof told.profileWritten === 'boolean',
      JSON.stringify(told).slice(0, 160));
  }

  // Put the real business details back.
  await page.evaluate(async (prof) => {
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prof),
    });
  }, originalProfile);

  await cleanup(page);
} catch (err) {
  // Report enough to act on. A bare "Timeout 30000ms exceeded" says nothing
  // about WHICH element was being waited for, turning a two-minute fix into
  // a guessing game.
  const detail = err.message.split('\n').filter((l) => l.trim()).slice(0, 4).join(' | ');
  check('suite ran to completion', false, detail);
  // A screenshot of the moment it stopped, when asked for: a timeout says
  // what was awaited, not what was on screen instead (a dialog in the way?).
  if (process.env.SMOKE_FAIL_SHOT) {
    try { await page.screenshot({ path: process.env.SMOKE_FAIL_SHOT, fullPage: true }); } catch { /* best effort */ }
  }
  try { await cleanup(page); } catch { /* ignore */ }
} finally {
  if (profileAtStart) {
    // Sent from Node, so it states the app's own origin as the page would:
    // the server refuses a change that names none.
    await fetch(`${APP}/api/profile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: new URL(APP).origin }, body: JSON.stringify(profileAtStart),
    }).catch(() => {});
  }
  await stopAll(browser);
}

// ---- Nothing left the PC -------------------------------------------------
check('the app made no request to any outside host', outsideRequests.length === 0,
  [...new Set(outsideRequests)].slice(0, 3).join(' | '));
check('no screen shows the old product or maker name', oldNameSeen.length === 0, oldNameSeen.slice(0, 3).join(' | '));
// The server's guards log beside its data folder: an outside connection it
// blocked (egress guard) and any CSP report sent by the browser. Read once the
// server has stopped, before the temporary folder is removed.
if (smokeHome) {
  const logOf = (name) => { try { return readFileSync(join(smokeHome, 'logs', name), 'utf8').trim(); } catch { return ''; } };
  const egressLog = logOf('egress-guard.log');
  const cspLog = logOf('csp.log');
  check('the server tried no outside connection (egress-guard log empty)', !egressLog, egressLog.split('\n')[0].slice(0, 160));
  check('the browser reported no CSP violation to the server (csp log empty)', !cspLog, cspLog.split('\n')[0].slice(0, 160));
}
removeSmokeHome();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed\n`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  ✗ ${f.name}${f.detail ? `  — ${f.detail}` : ''}`));
  console.log('');
  process.exit(1);
}
