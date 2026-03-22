import { useAppStore } from '../store/appStore';

// If Agent 1 hasn't added TabViewMode to the store yet, define it locally.
// Once both agents' changes are merged, the store export will take precedence.
type TabViewMode = 'edit' | 'preview' | 'split';

function insert(before: string, after: string = '', placeholder: string = 'text') {
  (window as any).__editorInsert?.(before, after, placeholder);
}

function prefixLines(prefix: string) {
  (window as any).__editorPrefixLines?.(prefix);
}

function wrapBlock(fenceBefore: string, fenceAfter: string, placeholder: string) {
  (window as any).__editorWrapBlock?.(fenceBefore, fenceAfter, placeholder);
}

function insertLine(text: string) {
  (window as any).__editorInsertLine?.(text);
}

export function Toolbar() {
  const { tabs, activeTabId, settings, updateSettings, isDirty } = useAppStore();
  // Use store actions if available (added by Agent 1), else fall back to no-ops
  const store = useAppStore() as any;
  const setTabMode: (mode: TabViewMode) => void = store.setTabMode ?? (() => {});
  const setTabScrollSync: (sync: boolean) => void = store.setTabScrollSync ?? ((sync: boolean) => updateSettings({ scrollSync: sync }));

  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentMode: TabViewMode = (activeTab as any)?.mode ?? 'split';
  const scrollSyncOn: boolean = (activeTab as any)?.scrollSync ?? settings.scrollSync ?? true;

  const cycleMode = () => {
    const next: TabViewMode = currentMode === 'edit' ? 'split' : currentMode === 'split' ? 'preview' : 'edit';
    setTabMode(next);
  };

  const modeLabel = currentMode === 'edit' ? '✎ Edit' : currentMode === 'split' ? '⊟ Split' : '👁 Preview';
  const modeTitle = `Current: ${currentMode} — click to cycle (Edit → Split → Preview)`;

  interface ToolbarButton {
    label: string;
    title: string;
    action: () => void;
    style?: React.CSSProperties;
  }

  const buttons: ToolbarButton[] = [
    { label: 'B', title: 'Bold (Cmd+B)', action: () => insert('**', '**', 'bold text'), style: { fontWeight: 'bold' } },
    { label: 'I', title: 'Italic (Cmd+I)', action: () => insert('*', '*', 'italic text'), style: { fontStyle: 'italic' } },
    { label: 'S̶', title: 'Strikethrough', action: () => insert('~~', '~~', 'strikethrough'), style: { textDecoration: 'line-through' } },
    { label: 'H1', title: 'Heading 1 — prefixes selected lines with #', action: () => prefixLines('# ') },
    { label: 'H2', title: 'Heading 2 — prefixes selected lines with ##', action: () => prefixLines('## ') },
    { label: 'H3', title: 'Heading 3 — prefixes selected lines with ###', action: () => prefixLines('### ') },
    { label: '</>', title: 'Inline Code', action: () => insert('`', '`', 'code') },
    { label: '{ }', title: 'Code Block — wraps selection in fences', action: () => wrapBlock('```', '```', 'code here') },
    { label: '🔗', title: 'Link', action: () => insert('[', '](url)', 'link text') },
    { label: '🖼', title: 'Image', action: () => insert('![', '](url)', 'alt text') },
    { label: 'OL', title: 'Ordered List — prefixes selected lines with 1.', action: () => prefixLines('1. ') },
    { label: 'UL', title: 'Unordered List — prefixes selected lines with -', action: () => prefixLines('- ') },
    { label: '❝', title: 'Blockquote — prefixes selected lines with >', action: () => prefixLines('> ') },
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

  const activeStyle: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
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

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
        {isDirty && (
          <button
            title="Show Changes — diff against last saved version"
            onClick={() => store.setShowDiff?.(true)}
            style={{ ...btnStyle, fontSize: '11px' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toolbar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ⊕ Changes
          </button>
        )}

        <button
          title={modeTitle}
          onClick={cycleMode}
          style={{ ...btnStyle, fontSize: '11px' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toolbar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {modeLabel}
        </button>

        <button
          title={`Scroll Sync: ${scrollSyncOn ? 'On' : 'Off'} — synchronizes editor and preview scroll position`}
          onClick={() => setTabScrollSync(!scrollSyncOn)}
          style={scrollSyncOn ? activeStyle : { ...btnStyle, fontSize: '11px' }}
        >
          ⇅ Sync
        </button>
      </div>
    </div>
  );
}
