import { useAppStore } from '../store/appStore';

interface ToolbarButton {
  label: string;
  title: string;
  action: () => void;
  style?: React.CSSProperties;
}

function insert(before: string, after: string = '', placeholder: string = 'text') {
  (window as any).__editorInsert?.(before, after, placeholder);
}

function insertLine(text: string) {
  (window as any).__editorInsertLine?.(text);
}

export function Toolbar() {
  const { settings, updateSettings } = useAppStore();

  const buttons: ToolbarButton[] = [
    { label: 'B', title: 'Bold (Cmd+B)', action: () => insert('**', '**', 'bold text'), style: { fontWeight: 'bold' } },
    { label: 'I', title: 'Italic (Cmd+I)', action: () => insert('*', '*', 'italic text'), style: { fontStyle: 'italic' } },
    { label: 'S̶', title: 'Strikethrough', action: () => insert('~~', '~~', 'strikethrough'), style: { textDecoration: 'line-through' } },
    { label: 'H1', title: 'Heading 1', action: () => insertLine('# Heading') },
    { label: 'H2', title: 'Heading 2', action: () => insertLine('## Heading') },
    { label: 'H3', title: 'Heading 3', action: () => insertLine('### Heading') },
    { label: '</>', title: 'Inline Code', action: () => insert('`', '`', 'code') },
    { label: '{ }', title: 'Code Block', action: () => insertLine('```language\n\n```') },
    { label: '🔗', title: 'Link', action: () => insert('[', '](url)', 'link text') },
    { label: '🖼', title: 'Image', action: () => insert('![', '](url)', 'alt text') },
    { label: 'OL', title: 'Ordered List', action: () => insertLine('1. Item') },
    { label: 'UL', title: 'Unordered List', action: () => insertLine('- Item') },
    { label: '❝', title: 'Blockquote', action: () => insert('> ', '', 'quote') },
    { label: '—', title: 'Horizontal Rule', action: () => insertLine('\n---\n') },
    { label: '⊞', title: 'Table', action: () => insertLine('| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| Cell  | Cell  | Cell  |') },
  ];

  const btnStyle: React.CSSProperties = {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-toolbar-text)',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '2px',
        padding: '4px 8px',
        borderBottom: '1px solid var(--color-toolbar-border)',
        backgroundColor: 'var(--color-toolbar-bg)',
        color: 'var(--color-toolbar-text)',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {buttons.map((btn, i) => (
        <button
          key={i}
          title={btn.title}
          onClick={btn.action}
          style={{ ...btnStyle, ...btn.style }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toolbar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {btn.label}
        </button>
      ))}

      <div style={{ marginLeft: 'auto' }}>
        <button
          title="Toggle Scroll Sync"
          onClick={() => updateSettings({ scrollSync: !settings.scrollSync })}
          style={{
            ...btnStyle,
            backgroundColor: settings.scrollSync ? 'var(--color-accent)' : 'transparent',
            color: settings.scrollSync ? '#fff' : 'var(--color-toolbar-text)',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Sync
        </button>
      </div>
    </div>
  );
}
