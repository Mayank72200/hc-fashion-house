// A small line at the end of the Dashboard only (on other screens it took
// working space; floating, it covered the table): the app's name and
// version, and the About page. Only the user sees it; it is never printed on
// an invoice. The version comes from the local server, so it works offline.
import { useEffect, useState } from 'react';

export default function AppFooter({ onOpenAbout }) {
  const [version, setVersion] = useState('');
  useEffect(() => {
    let live = true;
    fetch('/api/version').then((r) => (r.ok ? r.json() : null)).then((d) => { if (live && d?.current) setVersion(d.current); }).catch(() => {});
    return () => { live = false; };
  }, []);
  return (
    <footer style={{
      // Below the invoice table, not floating over it.
      marginTop: 'auto', paddingTop: '1.5rem',
      textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center',
        padding: '0.3rem 0.85rem', borderRadius: 999, background: 'var(--card-bg)', border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <span>HC Fashion House{version ? ` v${version}` : ''}</span>
        {onOpenAbout && (
          <>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={onOpenAbout}
              style={{ color: 'inherit', background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
              About
            </button>
          </>
        )}
      </span>
    </footer>
  );
}
