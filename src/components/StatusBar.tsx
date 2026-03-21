import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';

export function StatusBar() {
  const { content, filePath, isDirty, cursorLine, cursorCol } = useAppStore();

  const stats = useMemo(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;
    return { words, chars };
  }, [content]);

  const displayPath = filePath
    ? filePath.length > 50
      ? '...' + filePath.slice(-47)
      : filePath
    : 'Untitled';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '2px 12px',
        fontSize: '11px',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-statusbar-bg)',
        color: 'var(--color-statusbar-text)',
        flexShrink: 0,
        gap: '16px',
      }}
    >
      <span title={filePath || 'No file'} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
        {isDirty ? '• ' : ''}{displayPath}
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: '16px', flexShrink: 0 }}>
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span>{stats.words} words</span>
        <span>{stats.chars} chars</span>
        <span>UTF-8</span>
      </span>
    </div>
  );
}
