import { useAppStore } from '../store/appStore';
import { useFile } from '../hooks/useFile';

export function Dashboard() {
  const { newTab, recentFiles } = useAppStore();
  const { openFileInNewTab } = useFile();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '32px',
    backgroundColor: 'var(--color-app-bg)',
    color: 'var(--color-app-text)',
    userSelect: 'none',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    opacity: 0.9,
    margin: 0,
  };

  const subheadingStyle: React.CSSProperties = {
    fontSize: '14px',
    opacity: 0.45,
    marginTop: '-24px',
  };

  const actionGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const btnStyle: React.CSSProperties = {
    padding: '10px 22px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    background: 'var(--color-toolbar-bg)',
    color: 'var(--color-app-text)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background 0.1s',
  };

  const primaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
    color: '#fff',
  };

  const recentStyle: React.CSSProperties = {
    width: '360px',
    maxWidth: '90vw',
  };

  const recentTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
  };

  const recentItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const recentNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
  };

  const recentPathStyle: React.CSSProperties = {
    fontSize: '11px',
    opacity: 0.45,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={headingStyle}>MD Editor</h1>
        <p style={subheadingStyle}>A lightweight Markdown editor</p>
      </div>

      <div style={actionGroupStyle}>
        <button
          style={primaryBtnStyle}
          onClick={() => newTab()}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          New Document
        </button>
        <button
          style={btnStyle}
          onClick={() => openFileInNewTab()}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toolbar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toolbar-bg)')}
        >
          Open File…
        </button>
      </div>

      {recentFiles.length > 0 && (
        <div style={recentStyle}>
          <div style={recentTitleStyle}>Recent Files</div>
          {recentFiles.slice(0, 7).map((f) => {
            const name = f.split(/[/\\]/).pop() ?? f;
            const dir = f.slice(0, f.length - name.length - 1);
            return (
              <div
                key={f}
                style={recentItemStyle}
                onClick={() => openFileInNewTab(f)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toolbar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={recentNameStyle}>{name}</span>
                <span style={recentPathStyle}>{dir}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: '12px', opacity: 0.3 }}>
        Cmd+N · New Document &nbsp;|&nbsp; Cmd+O · Open File
      </div>
    </div>
  );
}
