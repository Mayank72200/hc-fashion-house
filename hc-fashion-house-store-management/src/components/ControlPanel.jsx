import { useState, useEffect } from 'react';
import { Download, Package, FolderOpen, HardDrive, StopCircle, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import PageHeader from './PageHeader';
import { toast } from './Toast';
import HelpButton from './HelpButton';

// v1.10.44 — In-app Control Panel.
//
// Companion to the Windows launcher: post-install actions (Backup /
// Restore / Move / Stop / Open folders) live here so the user never has
// to open the install folder or remember any script names. Buttons hit
// /api/control-panel/* endpoints on the server, which run the PowerShell
// scripts that ship in the `_system` folder.
//
// Fallback behaviour: if the app was started WITHOUT those scripts
// (e.g. `npm start` from the source folder), the server reports
// `controlScriptsAvailable: false` and the buttons are visibly disabled
// with an inline explanation. Nothing crashes.
//
// There is no update button: new versions are installed by the
// administrator.

// fetch() rejects with a TypeError when the server cannot be reached.
const OFFLINE = 'Could not reach the app. Is it running?';
// The Desktop / Start Menu shortcut opens the launcher, whose Open App button
// starts the app again.
const REOPEN = 'Open it again from the HC Fashion House shortcut, then click Open App.';

export default function ControlPanel() {
  const [status, setStatus] = useState(null);
  // The script buttons wait until the server has said which actions exist
  // on this PC, so nothing can be clicked before that is known.
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [busy, setBusy] = useState(null); // action name currently in flight
  const [lastResult, setLastResult] = useState(null);
  // A restore started here finishes in a window of its own and stops this
  // app on the way (it cannot swap the books under a running server), so the
  // page shows that instead of a result that would never arrive.
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch('/api/control-panel/status')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((s) => { setStatus(s || {}); setStatusLoaded(true); })
      .catch(() => setStatus({ error: 'Could not reach server' }));
  }, []);

  // A request that failed outright: no server, or an answer that is not JSON.
  const failed = (action, e) => {
    const offline = e instanceof TypeError;
    setLastResult({ action, ok: false, error: offline ? OFFLINE : e.message });
    toast(offline ? OFFLINE : `${prettyAction(action)} failed — ${e.message}`, 'error');
  };

  const runAction = async (action, method = 'POST') => {
    setBusy(action);
    setLastResult(null);
    try {
      const r = await fetch(`/api/control-panel/${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      setLastResult({ action, ...data });
      if (data.ok) toast(`${prettyAction(action)} completed.`, 'success');
      else toast(`${prettyAction(action)} failed — ${data.error || 'see details below'}`, 'error');
    } catch (e) {
      failed(action, e);
    } finally {
      setBusy(null);
    }
  };

  const launchScript = async (action) => {
    setBusy(action);
    setLastResult(null);
    try {
      const r = await fetch('/api/control-panel/launch-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      // The restore script answers "RESTART NEEDED" once it has handed the
      // work to its own window; that window stops this app a few seconds later.
      if (action === 'restore' && data.ok && /RESTART NEEDED/.test(data.stdout || '')) {
        setRestoring(true);
        return;
      }
      setLastResult({ action, ...data });
      if (data.ok && action === 'restore' && /Cancelled/i.test(data.stdout || '')) toast('Restore cancelled. Nothing was changed.', 'info');
      else if (data.ok) toast(`${prettyAction(action)} completed.`, 'success');
      else toast(`${prettyAction(action)} failed — ${data.error || 'see details below'}`, 'error');
    } catch (e) {
      if (action === 'restore' && e instanceof TypeError) {
        // The restore window stopped the app before its answer arrived.
        setRestoring(true);
      } else if (action === 'stop' && e instanceof TypeError) {
        // The stop script ends this server, so its answer never arrives:
        // here a dropped connection means it worked.
        setLastResult({ action, ok: true, stdout: `The app has stopped. ${REOPEN}` });
        toast(`Server stopped. ${REOPEN}`, 'success');
      } else {
        failed(action, e);
      }
    } finally {
      setBusy(null);
    }
  };

  const prettyAction = (a) => ({
    backup: 'Backup', restore: 'Restore', move: 'Move export',
    stop: 'Stop server', 'open-data-folder': 'Open data folder',
    'open-backups-folder': 'Open backups folder',
  })[a] || a;

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const scriptsUnavailable = statusLoaded && !status.controlScriptsAvailable;
  // Per action, as the server reports it. Older servers send no `actions`;
  // fall back to the all-or-nothing flag. Nothing is enabled before the
  // status has answered.
  const can = (a) => statusLoaded && (status.actions ? !!status.actions[a] : !scriptsUnavailable);
  const label = (a, idle, working) => (busy === a ? working : (statusLoaded && !can(a) ? 'Not available here' : idle));
  // The server moved off its usual port (another program had it at start):
  // settings this browser keeps for the usual address do not show here.
  const portMoved = !!(status && !status.error && status.port && status.preferredPort && status.port !== status.preferredPort);

  if (restoring) {
    return (
      <div className="dashboard-container">
        <PageHeader icon={<HardDrive size={22} />} title="Control Panel" subtitle="Restoring a backup" />
        <div className="glass-panel p-6" style={{ maxWidth: 680 }}>
          <h3 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} /> Restoring — the app will close
          </h3>
          <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6 }}>
            The restore runs in its own window. In a few seconds this app closes, so the books can be put back safely.
            Your current data is saved first, as a pre-restore ZIP in the backups folder.
          </p>
          <ol style={{ paddingLeft: '1.2rem', margin: '0 0 0.75rem', lineHeight: 1.7 }}>
            <li>Leave the restore window open until it says <strong>Done</strong>.</li>
            <li>Then open HC Fashion House again: double-click the HC Fashion House shortcut and click <strong>Open App</strong>.</li>
          </ol>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            If the restore window shows a problem, read what it says: your data is kept. Contact your HC Fashion House administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PageHeader
        icon={<HardDrive size={22} />}
        title="Control Panel"
        subtitle="Back up, restore and move your books to another PC, without touching batch files."
        meta={status?.launcherType ? `${status.launcherType.toUpperCase()} launcher` : null}
      >
        <HelpButton title="Control Panel — how to use">
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            <li><strong>Create Backup</strong> saves your data as a ZIP in the backups folder (<strong>Open Backups Folder</strong> shows it).</li>
            <li><strong>Export for Move</strong> and <strong>Choose Backup ZIP</strong> move your books to another PC.</li>
            <li><strong>Stop Server</strong> stops the app; open it again from the HC Fashion House shortcut, then click <strong>Open App</strong>.</li>
          </ul>
        </HelpButton>
      </PageHeader>

      {status?.error && (
        <div className="notice notice-warn" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <div>
            <strong>{OFFLINE}</strong> Reload this page once the app is open again.
          </div>
        </div>
      )}

      {status?.dataFolderSynced && (
        <div className="notice notice-warn" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <div>
            <strong>The books are in a folder that syncs to the cloud</strong> (OneDrive, Dropbox or Google Drive),
            so copies of them leave this PC. Ask your HC Fashion House administrator to move the app to its own
            program folder on this PC.
          </div>
        </div>
      )}

      {portMoved && (
        <div className="notice notice-warn" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <div>
            <strong>The app is running on port {status.port}, not its usual port {status.preferredPort}.</strong> Another
            program had that port when the app started. Settings this browser keeps for the usual address are not
            visible here. Stop the app, close the other program or restart the PC, then open the app again. If it keeps
            happening, contact your HC Fashion House administrator.
          </div>
        </div>
      )}

      {scriptsUnavailable && (
        <div className="notice notice-warn" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <div>
            <strong>Backup scripts not found.</strong> They come with the HC Fashion House ZIP, in the
            <code> _system</code> folder next to the app. If the app was started from source code, or copied
            without those files, reinstall it from the HC Fashion House ZIP. Contact your HC Fashion House
            administrator. Your data can still be saved from
            <em> Settings → Data Management → Export Backup</em>.
          </div>
        </div>
      )}

      {/* Install info card */}
      {status && !status.error && (
        <div className="glass-panel p-6 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCell label="Platform"       value={status.platform} />
          <StatCell label="Node version"   value={status.node} />
          <StatCell label="Server port"    value={status.port} />
          <StatCell label="Data folder size" value={formatSize(status.dataSizeBytes)} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <ActionCard
          icon={<Download size={22} />}
          title="Backup Data"
          body="Zips your data folder into the backups folder with a timestamp."
          buttonLabel={label('backup', 'Create Backup', 'Backing up…')}
          disabled={!!busy || !can('backup')}
          onClick={() => runAction('backup')}
          variant="primary"
        />
        <ActionCard
          icon={<Upload size={22} />}
          title="Restore Backup"
          body="Pick a previous backup ZIP. Current data is snapshotted first as a safety net before restore. The app closes while the restore runs."
          buttonLabel={label('restore', 'Choose Backup ZIP', 'Restoring…')}
          disabled={!!busy || !can('restore')}
          onClick={() => launchScript('restore')}
        />
        <ActionCard
          icon={<Package size={22} />}
          title="Move to Another PC"
          body="Exports data + settings as one ZIP file; the result below shows where it was saved. Copy it to the new PC, install HC Fashion House there, then Restore."
          buttonLabel={label('move', 'Export for Move', 'Exporting…')}
          disabled={!!busy || !can('move')}
          onClick={() => launchScript('move')}
        />
        <ActionCard
          icon={<FolderOpen size={22} />}
          title="Open Data Folder"
          body="Opens the folder where your bills, clients, products, and settings live as JSON files."
          buttonLabel="Open"
          disabled={!!busy}
          onClick={() => runAction('open-data-folder')}
        />
        <ActionCard
          icon={<FolderOpen size={22} />}
          title="Open Backups Folder"
          body="Opens the backups folder, where every automatic and manual backup ZIP is stored."
          buttonLabel="Open"
          disabled={!!busy}
          onClick={() => runAction('open-backups-folder')}
        />
        <ActionCard
          icon={<StopCircle size={22} />}
          title="Stop Server"
          body="Shuts down the local Node server. The app will stop responding until you re-open it from the HC Fashion House shortcut (then Open App)."
          buttonLabel={label('stop', 'Stop Server', 'Stopping…')}
          disabled={!!busy || !can('stop')}
          onClick={() => launchScript('stop')}
          variant="danger"
        />
      </div>

      <div className="notice notice-info" style={{ marginTop: '1rem' }}>
        <Info size={18} />
        <div>To install a new version, ask your HC Fashion House administrator.</div>
      </div>

      {/* Last action result */}
      {lastResult && (
        <div className="glass-panel p-6" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {lastResult.ok
              ? <CheckCircle size={18} color="#22c55e" />
              : <AlertCircle size={18} color="#ef4444" />}
            {prettyAction(lastResult.action)} — {lastResult.ok ? 'OK' : 'Failed'}
          </h3>
          {lastResult.stdout && (
            <details open>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Output</summary>
              <pre style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: 6, overflow: 'auto', maxHeight: 200, marginTop: '0.4rem' }}>
                {lastResult.stdout}
              </pre>
            </details>
          )}
          {lastResult.stderr && (
            <details>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Errors</summary>
              <pre style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: 6, overflow: 'auto', maxHeight: 200, marginTop: '0.4rem', color: '#f87171' }}>
                {lastResult.stderr}
              </pre>
            </details>
          )}
          {lastResult.error && (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#f87171' }}>
              {lastResult.error}
            </p>
          )}
          {lastResult.synced && (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--warn-text)' }}>
              This backups folder syncs to the cloud, so the backup ZIPs in it leave this PC. Copy backups to a USB drive
              instead, and ask your HC Fashion House administrator to move the app to its own program folder.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}

function ActionCard({ icon, title, body, buttonLabel, disabled, onClick, variant }) {
  const bg = variant === 'primary' ? 'var(--primary)' : variant === 'danger' ? '#dc2626' : 'var(--bg-secondary)';
  const color = (variant === 'primary' || variant === 'danger') ? '#fff' : 'var(--text)';
  return (
    <div className="glass-panel p-6" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)' }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', flex: 1 }}>{body}</p>
      <button
        className="btn"
        style={{ background: bg, color, alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        disabled={disabled}
        onClick={onClick}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
