import { useRef } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { Settings } from './Settings';
import { RecentFiles } from './RecentFiles';
import { useAppStore } from '../store/appStore';

export function Layout() {
  const { showEditor, showPreview, showToolbar, showSettings, showRecentFiles } = useAppStore();
  const previewRef = useRef<HTMLDivElement | null>(null);

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
      {showToolbar && <Toolbar />}

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Allotment defaultSizes={[1, 1]} minSize={0}>
          {showEditor && (
            <Allotment.Pane minSize={0}>
              <div style={{ height: '100%', overflow: 'hidden' }}>
                <Editor previewRef={previewRef} />
              </div>
            </Allotment.Pane>
          )}
          {showPreview && (
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
    </div>
  );
}
