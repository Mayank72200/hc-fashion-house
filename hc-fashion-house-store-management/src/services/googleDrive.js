// Google Drive integration via Google Identity Services + REST API
// No backend needed — runs entirely in the browser.
//
// Nothing here runs on its own. Every call starts from a click (Connect in
// Settings, Save to Drive on an invoice, or the Drive copy of an exported
// backup), and the callers offer those only while the Google Drive module is
// on and a Client ID is set.

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// GIS reports a blocked or closed sign-in pop-up through error_callback.
// These limits are the backstop for anything it never reports, so a caller
// waiting on a sign-in ("Connecting...", "Uploading...") cannot hang.
const SIGN_IN_TIMEOUT_MS = 3 * 60 * 1000;
const SCRIPT_TIMEOUT_MS = 30 * 1000;

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;
let gisLoading = null;

// Dynamically load Google Identity Services script. Loaded once; a failed
// load is forgotten so the next click can try again.
function loadGIS() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      let timer = null;
      const finish = (loaded) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (loaded && window.google?.accounts?.oauth2) { resolve(); return; }
        script.remove();
        gisLoading = null;
        reject(new Error('Could not load Google sign-in. Check the internet connection and try again.'));
      };
      timer = setTimeout(() => finish(false), SCRIPT_TIMEOUT_MS);
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      document.head.appendChild(script);
    });
  }
  return gisLoading;
}

// Text for the GIS error_callback types (pop-up problems, not OAuth errors).
const POPUP_ERRORS = {
  popup_failed_to_open: 'The Google sign-in window could not open. Allow pop-ups for this app and try again.',
  popup_closed: 'The Google sign-in window was closed before sign-in finished.',
};

// Ask Google for an access token. Settles exactly once: with the token, with
// an OAuth error, through error_callback (pop-up blocked or closed), or after
// SIGN_IN_TIMEOUT_MS. A token that arrives after the timeout is still kept.
function requestToken(clientId, prompt) {
  return new Promise((resolve) => {
    let settled = false;
    let timer = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    timer = setTimeout(() => finish({ ok: false, error: 'Google sign-in did not finish in time. Try again.' }), SIGN_IN_TIMEOUT_MS);
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (!response || response.error) {
            finish({ ok: false, error: response?.error_description || response?.error || 'Google sign-in failed.' });
            return;
          }
          accessToken = response.access_token;
          tokenExpiry = Date.now() + (response.expires_in * 1000);
          finish({ ok: true });
        },
        error_callback: (err) => finish({ ok: false, error: POPUP_ERRORS[err?.type] || 'Google sign-in failed.' }),
      });
      tokenClient.requestAccessToken({ prompt });
    } catch (err) {
      finish({ ok: false, error: err?.message || 'Google sign-in failed.' });
    }
  });
}

// Initialize the token client with user's Client ID and ask for consent.
// Resolves { success: true } or { success: false, error }; rejects only when
// the Google script cannot be loaded.
export async function initGoogleDrive(clientId) {
  await loadGIS();
  const result = await requestToken(clientId, 'consent');
  return result.ok ? { success: true } : { success: false, error: result.error };
}

// Check if connected and token is valid
export function isConnected() {
  return !!accessToken && Date.now() < tokenExpiry;
}

// Silently refresh token (or prompt if needed). Resolves true or false.
export async function ensureToken(clientId) {
  if (isConnected()) return true;
  if (!clientId) return false;
  await loadGIS();
  // Try silent, fallback to prompt
  const result = await requestToken(clientId, '');
  return result.ok;
}

// Disconnect
export function disconnect() {
  if (accessToken) {
    window.google?.accounts?.oauth2?.revoke?.(accessToken);
  }
  accessToken = null;
  tokenExpiry = 0;
  tokenClient = null;
}

// Drive search strings are single-quoted: escape \ and ' so a folder name
// such as "Shop's Invoices" finds its folder instead of making a new one on
// every upload.
const driveQuote = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// A failed Drive call as an Error carrying Google's own message. A 401 means
// the token is no longer valid, so it is dropped and the next call asks again.
async function driveError(res, fallback) {
  if (res.status === 401) { accessToken = null; tokenExpiry = 0; }
  const body = await res.json().catch(() => ({}));
  return new Error(body?.error?.message || `${fallback} (HTTP ${res.status})`);
}

// A multipart boundary that names nothing and will not occur in the body.
const newBoundary = () => `----${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

// Find or create a folder in Google Drive. Throws when Drive refuses either
// step, so a file never lands in the Drive root by accident.
export async function findOrCreateFolder(folderName) {
  if (!accessToken) throw new Error('Not connected to Google Drive');

  // Search for existing folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${driveQuote(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!searchRes.ok) throw await driveError(searchRes, 'Could not look up the Google Drive folder');

  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  if (!createRes.ok) throw await driveError(createRes, 'Could not create the Google Drive folder');

  const folder = await createRes.json();
  if (!folder?.id) throw new Error('Google Drive did not return the new folder');
  return folder.id;
}

// Upload a PDF file to a specific folder
export async function uploadPDF(fileName, pdfBlob, folderId) {
  if (!accessToken) throw new Error('Not connected to Google Drive');

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    parents: folderId ? [folderId] : [],
  };

  // Use multipart upload
  const boundary = newBoundary();
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/pdf\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    await blobToBase64(pdfBlob) + '\r\n' +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) throw await driveError(res, 'Upload failed');

  return await res.json();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
    reader.readAsDataURL(blob);
  });
}

// Upload a JSON file (e.g. an app backup) to a folder. Same multipart pattern as
// uploadPDF but with application/json. Used by Export Backup's "Also save a copy
// to my Google Drive" tick box.
export async function uploadJSON(fileName, jsonString, folderId) {
  if (!accessToken) throw new Error('Not connected to Google Drive');

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: folderId ? [folderId] : [],
  };

  const boundary = newBoundary();
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    jsonString + '\r\n' +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) throw await driveError(res, 'JSON upload failed');
  return await res.json();
}

// v1.10.6 — audit L6: `listBackupsInFolder()` and `downloadFileText()`
// had no importers. The "Restore from Drive" UI they were built for
// never landed; the current Drive integration is upload-only. Reintroduce
// when the restore-from-Drive feature does.
