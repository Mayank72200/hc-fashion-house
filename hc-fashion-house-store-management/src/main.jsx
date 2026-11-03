import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import DOMPurify from 'dompurify'
import App from './App.jsx'
import AppLockGate from './components/AppLock.jsx'
import { restorePrefs, startMirroring } from './utils/prefsMirror'
import './index.css'

// Pictures inside rich text (Terms, Notes, extra sections) may only be
// embedded data (data: or blob:), never a web address: an image pasted from a
// website would otherwise be fetched from that site on every screen and every
// PDF. Every DOMPurify.sanitize() call in the app uses this shared default
// instance; the CSP's img-src is the backstop. Logos and signatures are data:
// images, so they still show and print.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'IMG') {
    const src = (node.getAttribute('src') || '').trim();
    if (!/^(data|blob):/i.test(src)) node.removeAttribute('src');
  }
  if (node.hasAttribute?.('srcset')) node.removeAttribute('srcset');
});

// Anything the security policy blocks is reported to the local server, which
// writes it to logs/csp.log, so a blocked outside call is visible instead of
// silent. None are expected in normal use; at most 20 are sent per page load.
// fetch (keepalive) rather than sendBeacon: a same-origin fetch always carries
// the real Origin header, which the server requires on every POST.
let cspReports = 0;
document.addEventListener('securitypolicyviolation', (e) => {
  if (cspReports >= 20) return;
  cspReports += 1;
  try {
    fetch('/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        'csp-report': {
          'document-uri': e.documentURI,
          'blocked-uri': e.blockedURI,
          'violated-directive': e.violatedDirective,
          'effective-directive': e.effectiveDirective,
          'original-policy': e.originalPolicy,
          'disposition': e.disposition,
          'source-file': e.sourceFile,
          'line-number': e.lineNumber,
          'column-number': e.columnNumber,
          'status-code': e.statusCode,
          'script-sample': e.sample,
        },
      }),
    }).catch(() => { /* reporting is best effort */ });
  } catch { /* reporting is best effort */ }
});

// Service worker. A newer build installed on this PC reaches open tabs through
// the local service worker (/sw.js from the local server; nothing outside this
// PC is contacted). With skipWaiting + clientsClaim (vite.config.js) the new
// worker normally takes control by itself, which fires `controllerchange`; the
// 'prompt' path (onNeedRefresh) only runs if a worker is left waiting.
//
// Either way the page reloads only when that cannot lose work: at once when
// nothing typed is on screen; otherwise a small notice offers "Reload now", and
// the check is repeated every 20 seconds and whenever the window loses focus or
// is hidden. (A reload on `controllerchange` used to happen at once in every
// open tab, throwing away half-typed client, product or settings forms.)
let __updateSW = null;
window.__fgsbSwUpdateReady = false;

// Text the user may have typed (or a file picked) and not saved yet. Tick
// boxes, buttons and other controls that always hold a value do not count (a
// checkbox's value is always "on"), so a read-only screen such as the
// Dashboard can still take the new version.
const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'range', 'color', 'hidden', 'button', 'submit', 'reset', 'image']);
const hasUnsavedInput = () => {
  try {
    const fields = document.querySelectorAll('input, textarea, [contenteditable="true"], [contenteditable=""]');
    for (const el of fields) {
      if (el.disabled || el.readOnly) continue;
      if (el.tagName === 'INPUT' && NON_TEXT_INPUTS.has(String(el.type).toLowerCase())) continue;
      if (el.isContentEditable) {
        if (el.textContent?.trim().length > 0) return true;
      } else if (el.value && String(el.value).trim().length > 0) {
        return true;
      }
    }
    return false;
  } catch { return true; } // cannot tell: leave the page as it is
};

let pendingStep = null;      // what applying the new version means right now
let recheckTimer = null;
let updateNotice = null;
let reloadStarted = false;
let activationAsked = false; // the waiting worker was told to take over

const reloadPage = () => {
  if (reloadStarted) return;
  reloadStarted = true;
  window.location.reload();
};

const runPendingStep = () => {
  const step = pendingStep;
  pendingStep = null;
  if (recheckTimer) { clearInterval(recheckTimer); recheckTimer = null; }
  updateNotice?.remove();
  updateNotice = null;
  step?.();
};

const recheckPending = () => {
  if (pendingStep && !hasUnsavedInput()) runPendingStep();
};

const showUpdateNotice = () => {
  if (updateNotice || !document.body) return;
  updateNotice = document.createElement('div');
  updateNotice.setAttribute('role', 'status');
  updateNotice.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:1.25rem', 'transform:translateX(-50%)', 'z-index:10000',
    'display:flex', 'align-items:center', 'justify-content:center', 'flex-wrap:wrap', 'gap:0.75rem',
    'max-width:calc(100vw - 2rem)', 'padding:0.6rem 0.75rem 0.6rem 1rem', 'border-radius:12px',
    'background:var(--bg-secondary, #f8fafc)', 'color:var(--text-primary, #111827)',
    'border:1px solid var(--border-color, #e2e8f0)', 'box-shadow:0 6px 24px rgba(0,0,0,0.18)',
    'font-size:0.85rem',
  ].join(';');
  const text = document.createElement('span');
  text.textContent = 'A new version of HC Fashion House is ready. Save your work, then reload.';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-primary';
  button.textContent = 'Reload now';
  button.addEventListener('click', runPendingStep);
  updateNotice.append(text, button);
  document.body.appendChild(updateNotice);
};

const applyWhenSafe = (step) => {
  pendingStep = step;
  if (!hasUnsavedInput()) { runPendingStep(); return; }
  showUpdateNotice();
  if (!recheckTimer) recheckTimer = setInterval(recheckPending, 20_000);
};

window.addEventListener('blur', recheckPending);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') recheckPending();
});

__updateSW = registerSW({
  onNeedRefresh() {
    window.__fgsbSwUpdateReady = true;
    window.dispatchEvent(new CustomEvent('fgsb-sw-update-ready'));
    applyWhenSafe(() => window.__fgsbApplyUpdate?.());
  },
  onOfflineReady() {
    // Prior console.log removed — production hygiene (v1.9.15 audit L1).
    window.dispatchEvent(new CustomEvent('fgsb-sw-offline-ready'));
  },
});

// Activates the waiting worker. Called only through applyWhenSafe (nothing
// typed on screen, or "Reload now" was clicked); the controllerchange that
// follows then reloads the page.
window.__fgsbApplyUpdate = () => {
  if (!window.__fgsbSwUpdateReady) return;
  window.__fgsbSwUpdateReady = false;
  activationAsked = true;
  if (__updateSW) __updateSW(true);
};

// v1.10.35 — Defensive path for the "still white screen on refresh" report: a
// worker installed before skipWaiting was on could stall in `waiting` and keep
// serving a stale index.html whose JS chunks no longer exist.
//
// On every load:
//   1. If a `waiting` worker exists, ask it to skip waiting; the page reloads
//      once it takes control (when safe, see above).
//   2. If the loaded bundle hits a `chunk-load` error (imports referencing
//      files the worker's cache doesn't have), reload once.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    // Take the waiting SW live if there is one.
    if (reg.waiting) {
      try {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch { /* ignore */ }
    }
    // A fresh SW took control: reload once so the page's code matches it.
    // Only registered when a worker already existed at load, so the very
    // first install does not reload the page.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (activationAsked) reloadPage();
      else applyWhenSafe(reloadPage);
    });
  }).catch(() => { /* not registered yet — first load */ });

  // Chunk-load safety net. Vite's dynamic imports produce
  // `Failed to fetch dynamically imported module` (Chrome) or
  // `error loading dynamically imported module` (Firefox/Safari) when
  // the requested chunk name changed post-deploy. Reload once to
  // fetch the current index.html + its correct chunk map.
  let chunkReloadFired = false;
  window.addEventListener('error', (e) => {
    const msg = String(e?.message || e?.error?.message || '');
    if (!chunkReloadFired && /dynamically imported module|Loading chunk|Failed to fetch dynamically/i.test(msg)) {
      chunkReloadFired = true;
      // Small delay so we don't reload-loop on a genuine broken state.
      setTimeout(() => window.location.reload(), 200);
    }
  });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e?.reason?.message || e?.reason || '');
    if (!chunkReloadFired && /dynamically imported module|Loading chunk|Failed to fetch dynamically/i.test(msg)) {
      chunkReloadFired = true;
      setTimeout(() => window.location.reload(), 200);
    }
  });
}

// One-time clean-up (flag hcfh_purge_v1) for a browser that ran an older build
// at this address. It deletes the caches of removed features (cached API
// answers, web-font copies, old images and OCR files) and the stored state of
// removed features (the supporters list, promotion and update flags), here
// and in the data-folder copy of the browser settings. The flag is set only
// when every step worked, so a start with the server down tries again next
// time; on a new install every step is a harmless no-op. The browser-storage
// part runs synchronously, before restorePrefs() and the settings mirror.
const PURGE_FLAG = 'hcfh_purge_v1';
const PURGE_CACHES = ['api-cache', 'google-fonts-cache', 'gstatic-fonts-cache', 'images-cache', 'tesseract-cache'];
const PURGE_KEYS = ['freegstbill_supportersCache', 'freegstbill_supportNudge', 'freegstbill_welcomeCard', 'freegstbill_starBanner', 'freegstbill_dismissedUpdate'];
const PURGE_MIRRORED = ['freegstbill_supportNudge', 'freegstbill_welcomeCard', 'freegstbill_starBanner'];

const purgeOnce = () => {
  try {
    if (localStorage.getItem(PURGE_FLAG)) return;
    for (const key of PURGE_KEYS) localStorage.removeItem(key);
  } catch { return; } // storage blocked: nothing was kept to purge
  const steps = [
    fetch('/api/local-prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remove: PURGE_MIRRORED }),
    }).then(async (res) => {
      // Read to the end: an unread no-store answer stays open in Edge / Chrome.
      await res.arrayBuffer();
      if (!res.ok) throw new Error(`local-prefs ${res.status}`);
    }),
  ];
  if ('caches' in window) steps.push(...PURGE_CACHES.map((name) => caches.delete(name)));
  Promise.all(steps)
    .then(() => { try { localStorage.setItem(PURGE_FLAG, '1'); } catch { /* storage blocked */ } })
    .catch(() => { /* not finished: tried again on the next start */ });
};

purgeOnce();

// v1.10.77 (#84) - settings the browser has lost come back from the data
// folder before the first render (the wizard and Region read them on start).
restorePrefs().then((restored) => {
  startMirroring(restored)
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AppLockGate>
        <App />
      </AppLockGate>
    </StrictMode>,
  )
})
