import { useAppStore } from '../store/appStore';
import { useFile } from '../hooks/useFile';

export function RecentFiles() {
  const { recentFiles, setShowRecentFiles } = useAppStore();
  const { openFile } = useFile();

  const handleOpen = (path: string) => {
    setShowRecentFiles(false);
    openFile(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && setShowRecentFiles(false)}
    >
      <div className="settings-panel bg-panel text-panel-text rounded-lg shadow-xl w-[560px] max-h-[60vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-toolbar-border">
          <h2 className="text-base font-semibold">Recent Files</h2>
          <button
            onClick={() => setShowRecentFiles(false)}
            className="text-xl leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {recentFiles.length === 0 ? (
            <p className="px-5 py-6 text-sm opacity-50">No recent files.</p>
          ) : (
            <ul>
              {recentFiles.map((path) => {
                const name = path.replace(/.*[/\\]/, '');
                const dir = path.replace(/[/\\][^/\\]+$/, '');
                return (
                  <li key={path}>
                    <button
                      onClick={() => handleOpen(path)}
                      className="w-full text-left px-5 py-3 hover:bg-toolbar-hover transition-colors flex flex-col gap-0.5"
                    >
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-xs opacity-50 truncate">{dir}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
