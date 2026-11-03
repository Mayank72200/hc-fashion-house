// About page: the app's name, its version and who to ask for help. The
// version comes from the local server, so the page works offline, and it
// links to nothing outside the app.
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import PageHeader from './PageHeader';

export default function AboutView() {
  const [version, setVersion] = useState('');
  const [showBadge, setShowBadge] = useState(true);

  useEffect(() => {
    let live = true;
    fetch('/api/version')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live) setVersion(d?.current || 'unknown'); })
      .catch(() => { if (live) setVersion('unknown'); });
    return () => { live = false; };
  }, []);

  return (
    <div className="dashboard-container">
      <PageHeader icon={<Info size={22} />} title="About" subtitle="This app and who to contact" />

      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {showBadge && (
          <img src="/brand/hc-badge-256.png" srcSet="/brand/hc-badge-256.png 1x, /brand/hc-badge-512.png 2x" width="160" height="160" alt=""
            onError={() => setShowBadge(false)} style={{ flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.35rem' }}>HC Fashion House</h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>
            Version {version || '…'}
          </p>
          <p style={{ margin: '1rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Need help?</strong> Contact your HC Fashion House administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
