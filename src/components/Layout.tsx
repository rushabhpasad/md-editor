import { useRef } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { Toolbar } from './Toolbar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { Settings } from './Settings';
import { RecentFiles } from './RecentFiles';
import { DragDropOverlay } from './DragDropOverlay';
import { About } from './About';
import { ExportDialog } from './ExportDialog';
import { DiffViewer } from './DiffViewer';
import { useAppStore } from '../store/appStore';

export function Layout() {
  const {
    tabs,
    activeTabId,
    showToolbar,
    showSettings,
    showRecentFiles,
    viewOnlyMode,
  } = useAppStore();
  // Read new modal state; gracefully fall back if Agent 1 hasn't merged yet
  const store = useAppStore() as any;
  const showAbout: boolean = store.showAbout ?? false;
  const showExport: boolean = store.showExport ?? false;
  const showDiff: boolean = store.showDiff ?? false;

  const previewRef = useRef<HTMLDivElement | null>(null);

  // Read per-tab mode from active tab
  const activeTab = tabs.find(t => t.id === activeTabId);
  const tabMode: 'edit' | 'preview' | 'split' = (activeTab as any)?.mode ?? 'split';

  // Determine what to show based on tab mode (viewOnlyMode overrides to preview only)
  // Fall back to legacy showEditor/showPreview flags if tab mode resolves to split (default)
  // so existing behaviour is preserved before Agent 1's store changes are in place.
  const resolvedShowEditor = tabMode === 'edit' || tabMode === 'split';
  const resolvedShowPreview = tabMode === 'preview' || tabMode === 'split';

  const effectiveShowEditor = viewOnlyMode ? false : resolvedShowEditor;
  const effectiveShowPreview = viewOnlyMode ? true : resolvedShowPreview;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-app-bg)',
        color: 'var(--color-app-text)',
      }}
    >
      {showToolbar && !viewOnlyMode && <Toolbar />}
      <TabBar />

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Allotment defaultSizes={[1, 1]} minSize={0}>
          {effectiveShowEditor && (
            <Allotment.Pane minSize={0}>
              <div style={{ height: '100%', overflow: 'hidden' }}>
                <Editor previewRef={previewRef} />
              </div>
            </Allotment.Pane>
          )}
          {effectiveShowPreview && (
            <Allotment.Pane minSize={0}>
              <div style={{ height: '100%', overflow: 'hidden' }}>
                <Preview previewRef={previewRef} />
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      </div>

      <StatusBar />
      {showSettings && <Settings />}
      {showRecentFiles && <RecentFiles />}
      {showAbout && <About />}
      {showExport && <ExportDialog />}
      {showDiff && <DiffViewer />}
      <DragDropOverlay />
    </div>
  );
}
