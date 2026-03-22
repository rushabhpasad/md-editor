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
import { useAppStore } from '../store/appStore';

export function Layout() {
  const {
    showEditor,
    showPreview,
    showToolbar,
    showSettings,
    showRecentFiles,
    viewOnlyMode,
  } = useAppStore();
  const previewRef = useRef<HTMLDivElement | null>(null);

  // In view-only mode: always show only the preview, no editor
  const effectiveShowEditor = viewOnlyMode ? false : showEditor;
  const effectiveShowPreview = viewOnlyMode ? true : showPreview;

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
      <DragDropOverlay />
    </div>
  );
}
