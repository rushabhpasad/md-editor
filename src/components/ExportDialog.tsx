import { useAppStore } from '../store/appStore';
import { useFile } from '../hooks/useFile';

export function ExportDialog() {
  const { setShowExport } = useAppStore();
  const { exportToHtml } = useFile() as any;

  const handlePrint = () => {
    setShowExport(false);
    setTimeout(() => window.print(), 100);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };

  const dialogStyle: React.CSSProperties = {
    background: 'var(--color-settings-bg)',
    color: 'var(--color-app-text)',
    borderRadius: '12px',
    padding: '24px',
    minWidth: '320px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  const btnStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '12px', marginBottom: '8px',
    borderRadius: '8px', border: '1px solid var(--color-border)',
    cursor: 'pointer', background: 'var(--color-toolbar-bg)',
    color: 'var(--color-app-text)', fontSize: '14px', textAlign: 'left',
  };

  return (
    <div style={overlayStyle} onClick={() => setShowExport(false)}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Export Document</h3>

        <button style={btnStyle} onClick={async () => { setShowExport(false); if (exportToHtml) await exportToHtml(); }}>
          <span style={{ fontSize: '18px', marginRight: '10px' }}>🌐</span>
          <strong>Export as HTML</strong>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Standalone HTML file with styles</div>
        </button>

        <button style={btnStyle} onClick={handlePrint}>
          <span style={{ fontSize: '18px', marginRight: '10px' }}>🖨️</span>
          <strong>Export as PDF</strong>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Print / Save as PDF via system dialog</div>
        </button>

        <button
          onClick={() => setShowExport(false)}
          style={{ ...btnStyle, marginBottom: 0, textAlign: 'center', marginTop: '8px', borderColor: 'transparent', opacity: 0.7 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
