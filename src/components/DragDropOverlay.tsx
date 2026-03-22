import { useEffect, useRef, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useAppStore } from '../store/appStore';
import { useFile } from '../hooks/useFile';

export function DragDropOverlay() {
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<string | null>(null);
  const { content, filePath } = useAppStore();
  const { openFile, openFileInNewTab, openFileInNewWindow } = useFile();

  // Use a ref so the single event handler always reads the latest value
  // without needing to re-register (which caused the stale-closure race).
  const hasContentRef = useRef(false);
  hasContentRef.current = content.trim().length > 0 || filePath !== null;

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let cancelled = false;

    getCurrentWebviewWindow().onDragDropEvent((event) => {
      const payload = event.payload as any;

      if (payload.type === 'enter' || payload.type === 'over') {
        const paths: string[] = payload.paths ?? [];
        const mdFile = paths.find((p: string) => /\.(md|markdown|txt)$/i.test(p));
        if (mdFile) setIsDragging(true);
      } else if (payload.type === 'drop') {
        const paths: string[] = payload.paths ?? [];
        const mdFile = paths.find((p: string) => /\.(md|markdown|txt)$/i.test(p));
        if (mdFile) {
          setIsDragging(false);
          // Always show the dialog so the user chooses where to open
          setDroppedFile(mdFile);
        } else {
          setIsDragging(false);
        }
      } else {
        setIsDragging(false);
      }
    }).then((fn) => {
      if (cancelled) { fn(); } else { unlistenFn = fn; }
    });

    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, []); // register once; hasContentRef always has the latest value

  const dismiss = () => setDroppedFile(null);

  const fileName = droppedFile ? droppedFile.split(/[/\\]/).pop() : '';

  return (
    <>
      {/* Drag hover overlay */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              border: '2px dashed var(--color-accent)',
              borderRadius: '12px',
              padding: '32px 48px',
              color: 'var(--color-accent)',
              fontSize: '18px',
              fontWeight: 600,
              backgroundColor: 'var(--color-app-bg)',
            }}
          >
            Drop to open file
          </div>
        </div>
      )}

      {/* Drop options dialog */}
      {droppedFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.target === e.currentTarget && dismiss()}
        >
          <div
            style={{
              backgroundColor: 'var(--color-panel-bg)',
              color: 'var(--color-panel-text)',
              borderRadius: '10px',
              padding: '24px',
              width: '360px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600 }}>
              Open file
            </h3>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: '12px',
                opacity: 0.6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={droppedFile}
            >
              {fileName}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { openFileInNewTab(droppedFile!); dismiss(); }}
                style={btnStyle('primary')}
              >
                Open in New Tab
              </button>
              <button
                onClick={() => { openFileInNewWindow(droppedFile!); dismiss(); }}
                style={btnStyle('secondary')}
              >
                Open in New Window
              </button>
              <button
                onClick={() => { openFile(droppedFile!); dismiss(); }}
                style={btnStyle('danger')}
              >
                Replace Current Document
              </button>
              <button onClick={dismiss} style={btnStyle('ghost')}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function btnStyle(variant: 'primary' | 'secondary' | 'danger' | 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '9px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left',
    transition: 'opacity 0.15s',
  };
  switch (variant) {
    case 'primary':
      return { ...base, backgroundColor: 'var(--color-accent)', color: '#fff' };
    case 'secondary':
      return { ...base, backgroundColor: 'var(--color-toolbar-hover)', color: 'var(--color-app-text)' };
    case 'danger':
      return { ...base, backgroundColor: 'rgba(220,53,69,0.15)', color: '#dc3545' };
    case 'ghost':
      return { ...base, backgroundColor: 'transparent', color: 'var(--color-statusbar-text)' };
  }
}
