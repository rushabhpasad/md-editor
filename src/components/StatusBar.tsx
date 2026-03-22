import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';

export function StatusBar() {
  const { content, filePath, isDirty, cursorLine, cursorCol } = useAppStore();

  const stats = useMemo(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;
    return { words, chars };
  }, [content]);

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
        minWidth: 0,
      }}
    >
      {/* Path: flex-grows to fill available space, CSS handles ellipsis */}
      <span
        title={filePath || 'Untitled'}
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {isDirty ? '● ' : ''}{filePath || 'Untitled'}
      </span>
      {/* Stats: always visible, never shrink */}
      <span style={{ display: 'flex', gap: '16px', flexShrink: 0, marginLeft: '16px' }}>
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span>{stats.words} words</span>
        <span>{stats.chars} chars</span>
        <span>UTF-8</span>
      </span>
    </div>
  );
}
