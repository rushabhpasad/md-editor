import { useAppStore } from '../store/appStore';
import { useFile } from '../hooks/useFile';

export function ExportDialog() {
  const { setShowExport } = useAppStore();
  const { exportToHtml } = useFile();

  const printPreview = () => {
    setShowExport(false);
    // Short delay so the dialog overlay is gone before the print dialog opens
    setTimeout(() => window.print(), 150);
  };

  const printRawMarkdown = () => {
    const { content } = useAppStore.getState();
    setShowExport(false);

    setTimeout(() => {
      const div = document.createElement('pre');
      div.id = '__raw-md-print';
      div.textContent = content;
      document.body.appendChild(div);
      document.body.classList.add('print-raw-md');
      window.print();
      // Clean up after print dialog closes
      window.addEventListener('afterprint', () => {
        document.body.classList.remove('print-raw-md');
        div.remove();
      }, { once: true });
    }, 150);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const dialogStyle: React.CSSProperties = {
    background: 'var(--color-panel-bg)',
    color: 'var(--color-app-text)',
    borderRadius: '12px',
    padding: '24px',
    minWidth: '340px',
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
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Export / Print</h3>

        <button style={btnStyle} onClick={async () => { setShowExport(false); await exportToHtml(); }}>
          <strong>🌐 Export as HTML</strong>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Standalone HTML file with embedded styles</div>
        </button>

        <button style={btnStyle} onClick={printPreview}>
          <strong>🖨 Print Preview (PDF)</strong>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Print the rendered preview via system dialog</div>
        </button>

        <button style={btnStyle} onClick={printRawMarkdown}>
          <strong>📄 Print Raw Markdown</strong>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Print the markdown source text as-is</div>
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
