import { useAppStore } from '../store/appStore';
import { openUrl } from '@tauri-apps/plugin-opener';

export function About() {
  const { setShowAbout } = useAppStore();

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const dialogStyle: React.CSSProperties = {
    background: 'var(--color-panel-bg)',
    color: 'var(--color-app-text)',
    borderRadius: '12px',
    padding: '32px',
    minWidth: '360px',
    maxWidth: '420px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    textAlign: 'center',
  };

  return (
    <div style={overlayStyle} onClick={() => setShowAbout(false)}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📝</div>
        <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700 }}>MD Editor</h2>
        <p style={{ margin: '0 0 16px', opacity: 0.6, fontSize: '13px' }}>A minimal, distraction-free Markdown editor</p>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px', fontSize: '13px', lineHeight: '2' }}>
          <div><strong>Created by</strong> Rushabh Pasad</div>
          <div style={{ opacity: 0.7 }}>Built with the help of Claude (Anthropic)</div>
          <div style={{ opacity: 0.7 }}>Tauri v2 · React 18 · CodeMirror 6</div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => openUrl('https://github.com/sponsors/rushabhpasad').catch(() => {})}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'var(--color-accent)', color: '#fff', fontWeight: 600, fontSize: '14px',
            }}
          >
            ❤️ Donate / Sponsor
          </button>
          <button
            onClick={() => setShowAbout(false)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--color-border)',
              cursor: 'pointer', background: 'transparent', color: 'var(--color-app-text)', fontSize: '13px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
