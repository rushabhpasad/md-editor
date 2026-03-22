import { useAppStore } from '../store/appStore';
import { useFile } from '../hooks/useFile';
import { ask } from '@tauri-apps/plugin-dialog';

export function TabBar() {
  const { tabs, activeTabId, activateTab, closeTab, newTab } = useAppStore();
  const { saveFile } = useFile();

  const handleClose = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const tab = tabs.find((t) => t.id === id);
    if (tab?.isDirty) {
      const save = await ask('This tab has unsaved changes. Save before closing?', {
        title: 'Unsaved Changes',
        kind: 'warning',
        okLabel: 'Save',
        cancelLabel: 'Discard',
      });
      if (save) {
        // Activate the tab first so saveFile operates on it
        activateTab(id);
        await saveFile();
      }
    }
    closeTab(id);
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 12px',
    height: '100%',
    cursor: 'pointer',
    borderRight: '1px solid var(--color-toolbar-border)',
    backgroundColor: isActive ? 'var(--color-app-bg)' : 'var(--color-toolbar-bg)',
    color: isActive ? 'var(--color-app-text)' : 'var(--color-statusbar-text)',
    borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
    fontSize: '12px',
    maxWidth: '180px',
    flexShrink: 0,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  });

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 2px',
    color: 'inherit',
    opacity: 0.5,
    fontSize: '14px',
    lineHeight: 1,
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: '32px',
        backgroundColor: 'var(--color-toolbar-bg)',
        borderBottom: '1px solid var(--color-toolbar-border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const name = tab.filePath ? tab.filePath.split(/[/\\]/).pop()! : 'Untitled';
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            style={tabStyle(isActive)}
            onClick={() => activateTab(tab.id)}
            title={tab.filePath || 'Untitled'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
              {tab.isDirty ? '• ' : ''}{name}
            </span>
            <button
              style={closeBtnStyle}
              onClick={(e) => handleClose(e, tab.id)}
              title="Close tab"
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '0.5')}
            >
              ×
            </button>
          </div>
        );
      })}

      {/* New tab button */}
      <button
        onClick={newTab}
        title="New tab"
        style={{
          background: 'none',
          border: 'none',
          borderRight: '1px solid var(--color-toolbar-border)',
          color: 'var(--color-statusbar-text)',
          cursor: 'pointer',
          padding: '0 10px',
          fontSize: '16px',
          height: '100%',
          flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  );
}
