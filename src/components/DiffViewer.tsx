import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';

function computeDiff(oldText: string, newText: string): Array<{ type: 'same' | 'added' | 'removed'; text: string }> {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Simple LCS-based line diff
  const result: Array<{ type: 'same' | 'added' | 'removed'; text: string }> = [];

  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: 'same', text: oldLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i + 1][j] <= dp[i][j + 1])) {
      result.push({ type: 'added', text: newLines[j] });
      j++;
    } else {
      result.push({ type: 'removed', text: oldLines[i] });
      i++;
    }
  }

  return result;
}

export function DiffViewer() {
  const { tabs, activeTabId, setShowDiff } = useAppStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentContent = activeTab?.content ?? '';
  const savedContent = (activeTab as any)?.savedContent ?? '';

  const diff = useMemo(() => computeDiff(savedContent, currentContent), [savedContent, currentContent]);

  const hasChanges = diff.some(d => d.type !== 'same');

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const dialogStyle: React.CSSProperties = {
    background: 'var(--color-panel-bg)',
    color: 'var(--color-app-text)',
    borderRadius: '12px',
    padding: '0',
    width: '80vw',
    maxWidth: '900px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  };

  return (
    <div style={overlayStyle} onClick={() => setShowDiff(false)}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>Changes Since Last Save</h3>
          <button
            onClick={() => setShowDiff(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-app-text)', fontSize: '18px', opacity: 0.6 }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0', fontFamily: 'monospace', fontSize: '13px' }}>
          {!hasChanges ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No changes since last save.</div>
          ) : (
            diff.map((line, i) => {
              if (line.type === 'same') return null;
              return (
                <div
                  key={i}
                  style={{
                    padding: '2px 16px',
                    backgroundColor: line.type === 'added' ? 'rgba(0,180,0,0.1)' : 'rgba(220,0,0,0.1)',
                    color: line.type === 'added' ? 'var(--color-diff-add, #2ea043)' : 'var(--color-diff-remove, #cf222e)',
                    borderLeft: `3px solid ${line.type === 'added' ? '#2ea043' : '#cf222e'}`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  <span style={{ userSelect: 'none', marginRight: '8px', opacity: 0.7 }}>
                    {line.type === 'added' ? '+' : '-'}
                  </span>
                  {line.text || ' '}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
