import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// __dirname equivalent for ES modules. Used to resolve absolute paths
// for Vite's root / publicDir / outDir so the build is stable regardless
// of where npm is invoked from.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// v1.10.6 — audit L20: point the dev proxy at the port Express actually
// bound. The server records it in `data/port.run` (it can drift off the
// preferred port in `data/port.txt` when EADDRINUSE bumps it to 47372,
// 47373, …); fall back to port.txt, then to the 47371 default. The data
// folder is found the way the server finds it: HCFH_HOME when set, else
// this folder.
const readActivePort = () => {
  const appHome = process.env.HCFH_HOME || __dirname;
  for (const name of ['port.run', 'port.txt']) {
    try {
      const p = path.join(appHome, 'data', name);
      if (!fs.existsSync(p)) continue;
      const n = parseInt(fs.readFileSync(p, 'utf-8').trim(), 10);
      if (isFinite(n) && n >= 1024 && n <= 65535) return n;
    } catch { /* unreadable: try the next file */ }
  }
  return 47371;
};
const activeExpressPort = readActivePort();

// The OCR runtime cache is named after the tesseract.js version and the
// pinned language file, so a new worker, core or model is never answered
// from an old cache entry. (The old unversioned `tesseract-cache` is
// deleted by the one-time purge in src/main.jsx.)
const tesseractCacheName = (() => {
  let version = 'unknown';
  let model = 'none';
  try {
    version = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules', 'tesseract.js', 'package.json'), 'utf-8')).version;
  } catch { /* not installed: scripts/bundle-tesseract-assets.mjs stops the build */ }
  try {
    model = createHash('sha256')
      .update(fs.readFileSync(path.join(__dirname, 'vendor', 'tessdata', 'eng.traineddata')))
      .digest('hex').slice(0, 12);
  } catch { /* missing: scripts/bundle-tesseract-assets.mjs stops the build */ }
  return `tesseract-${version}-${model}`;
})();

export default defineConfig({
  // Vite's source root is src/ (src/index.html is the app page), not the
  // project root. publicDir + outDir are resolved relative to the project
  // root so public/ assets and dist/ output paths keep working.
  root: path.resolve(__dirname, 'src'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [
    react(),
    VitePWA({
      // v1.10.2 — Prior 'autoUpdate' triggered an immediate location.reload()
      // via main.jsx's onNeedRefresh handler → cashier mid-invoice would
      // lose form state on deploy. Switched to 'prompt' so the app can
      // defer the reload until the user is idle. The main.jsx handler
      // now stores an "update ready" flag and reloads on next window
      // blur / navigation, never mid-form.
      // v1.10.33 — Kept 'prompt' but bumped skipWaiting → true below.
      // Reported: "it work in incognito only" — user's tab had a stale
      // SW serving a broken hash-mismatched bundle after a redeploy,
      // so main.jsx never loaded and the tab stayed blank. skipWaiting
      // makes new SWs activate immediately on install (no more 24-hour
      // wait for the old SW to release), and the runtime cache below
      // gets `cleanupOutdatedCaches: true` so orphaned assets from a
      // previous version don't shadow the new ones.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon-32.png'],
      manifest: {
        // Same identity the browser already derives from start_url, so an
        // installed app window keeps its identity. Never change id,
        // start_url, scope or the port.
        id: '/',
        name: 'HC Fashion House',
        short_name: 'HC Fashion',
        description: 'Billing, stock and GST for HC Fashion House. Runs on this computer.',
        theme_color: '#111111',
        background_color: '#FFFFFF',
        display: 'standalone',
        // display_override gives Edge / Chrome the option to render in a
        // tighter "Window Controls Overlay" mode (the title bar disappears,
        // we draw the chrome ourselves) — falls back to standalone if not
        // supported. Removes the "this is just a browser" feel.
        display_override: ['window-controls-overlay', 'standalone'],
        start_url: '/',
        scope: '/',
        // v1.10.2 — Was 'portrait-primary'. Locked landscape tablets to
        // portrait even though shop counters and Android POS terminals
        // often run horizontally. 'any' lets the device decide.
        orientation: 'any',
        lang: 'en-IN',
        categories: ['business', 'productivity', 'finance'],
        // Manifest shortcuts — right-click the pinned PWA icon (Windows
        // taskbar / Start Menu / Edge app launcher) to jump directly to
        // the most-used flows without a full Dashboard hop. The jump list
        // scales the PNG icon to whatever size it draws.
        shortcuts: [
          {
            name: 'New Invoice',
            short_name: 'New Invoice',
            description: 'Create a new tax invoice',
            url: '/?view=new',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'See invoices and stats',
            url: '/?view=dashboard',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'GST Returns',
            short_name: 'GST Returns',
            description: 'GSTR-1 / 3B / 2B reconciliation',
            url: '/?view=filing',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Settings',
            short_name: 'Settings',
            description: 'Business profile, accounts, modules',
            url: '/?view=settings',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        // Small sizes show the HC monogram, which stays readable on a
        // taskbar; 192 and 512 show the full badge (Chrome / Android need
        // distinct 192 and 512 PNGs for the app drawer and splash). The
        // maskable copies are full-bleed for adaptive-icon masks.
        icons: [
          { src: '/favicon-32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
          { src: '/brand/hc-monogram-64.png', sizes: '64x64', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // v1.10.2 — Precache excludes the heaviest chunks (pdf 588 KB,
        // qr 25 KB, html2canvas' ESM chunk) since most sessions never
        // print. They still get cached on demand by the runtime rule
        // below (StaleWhileRevalidate for /assets/), so the FIRST print
        // works offline as long as the user has visited that route at
        // least once. Trims initial precache from 1.63 MiB → ~0.85 MiB.
        // The self-hosted Inter fonts (woff2) are precached, so text
        // renders the same with no network.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: [
          '**/assets/pdf-*.js',
          '**/assets/qr-*.js',
          '**/assets/index.es-*.js',
          // v1.10.33 — Tesseract worker + core + traineddata (~22MB total).
          // Excluded from precache — cached on demand by the runtime rule
          // below so the initial SW install stays ~1MB, and the OCR
          // files are loaded once from this computer when the user
          // actually opens the OCR modal.
          '**/tesseract/**',
        ],
        // Largest single file the precache accepts. The big OCR files are
        // excluded above and go through the runtime cache instead.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // v1.10.33 — Was `false` on both. Kept the prompt-mode reload
        // deferral in main.jsx but flipped these to true because:
        //   1. skipWaiting=true lets the new SW take over on install
        //      without waiting for every open tab to close first. Prior
        //      value stalled the SW in `waiting` until the user closed
        //      every browser tab and reopened the app — meanwhile the
        //      OLD SW served the OLD bundle whose file hashes no longer
        //      matched what index.html referenced → white screen.
        //   2. clientsClaim=true means any currently-open tab starts
        //      talking to the new SW immediately after activation.
        //      Combined with cleanupOutdatedCaches below, orphaned
        //      chunks from the previous deploy get evicted.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // /api/* has no runtime route on purpose: the server runs on this
        // computer, so every API call goes straight to it. A cached copy
        // could hand stale invoice lists to a save, and kept the books in
        // the browser's cache storage.
        runtimeCaching: [
          // v1.10.2 — Lazy-loaded JS chunks (pdf, qr, html2canvas ESM)
          // are NOT precached but are cached on first use so the second
          // print offline works.
          {
            urlPattern: /\/assets\/(pdf|qr|index\.es)-[A-Za-z0-9]+\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lazy-chunks-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // v1.10.33 — OCR assets. CacheFirst so second-time OCR is
          // instant once the user has opened the modal. Only real 200
          // answers are stored, under a cache name that changes with the
          // tesseract.js version and the language file (see above).
          {
            urlPattern: /\/tesseract\/.*\.(?:js|wasm|traineddata)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: tesseractCacheName,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // outDir + publicDir point at project-root paths because Vite's
    // `root` is src/ — without absolute resolution the output would
    // land inside src/dist/ instead of the repo's dist/.
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    // v1.10.2 — main+pdf chunks tripped the default 500 KB warning line
    // on every build (main 812 KB, pdf 588 KB). Bumped to 900 KB — high
    // enough to silence noise, low enough to catch a genuine regression.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // v1.10.2 — React was in the main bundle; every app-code
          // change invalidated the React runtime for cached clients.
          // Now: cache hit on React across releases as long as versions
          // don't move.
          'react-vendor': ['react', 'react-dom'],
          'pdf': ['jspdf', 'html2canvas'],
          'icons': ['lucide-react'],
          'qr': ['qrcode'],
        },
      },
    },
  },
  server: {
    proxy: {
      // v1.10.6 — audit L20: was hardcoded 47371. Now reads
      // `data/port.run`, else `data/port.txt`, at Vite start (see
      // `activeExpressPort` at top of file). Restart Vite if the server
      // rebooted onto a new port.
      // The server accepts an Origin only for its own address and port,
      // so the proxy presents the app's own origin.
      '/api': {
        target: `http://localhost:${activeExpressPort}`,
        changeOrigin: true,
        headers: { origin: `http://localhost:${activeExpressPort}` },
      }
    }
  }
})
