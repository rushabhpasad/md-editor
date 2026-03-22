import { open, save, ask, message } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useAppStore } from '../store/appStore';

function isPermissionError(e: unknown): boolean {
  const msg = String(e).toLowerCase();
  return msg.includes('permission denied') || msg.includes('access denied') || msg.includes('os error 13');
}

// When a programmatic read is blocked by the OS, ask the user to pick the
// file through the native dialog — on macOS this triggers TCC consent.
async function readWithFallback(path: string): Promise<string> {
  try {
    return await readTextFile(path);
  } catch (e) {
    if (!isPermissionError(e)) throw e;
    const dir = path.replace(/[^/\\]+$/, '') || undefined;
    await message(
      'Access to this file was denied by the OS. Please select it again using the file picker to grant permission.',
      { title: 'Permission Required', kind: 'warning' }
    );
    const selected = await open({
      multiple: false,
      defaultPath: dir,
      filters: [{ name: 'Markdown', extensions: ['md', 'txt', 'markdown'] }],
    });
    if (!selected) throw new Error('No file selected');
    return await readTextFile(selected as string);
  }
}

export function useFile() {
  const {
    content,
    filePath,
    isDirty,
    setContent,
    setFilePath,
    setDirty,
    addRecentFile,
    newTab,
    settings,
  } = useAppStore();

  const checkUnsavedChanges = async (): Promise<boolean> => {
    if (!isDirty) return true;

    // First ask: Save or continue without saving?
    const save_ = await ask('You have unsaved changes. Save before continuing?', {
      title: 'Unsaved Changes',
      kind: 'warning',
      okLabel: 'Save',
      cancelLabel: "Don't Save",
    });

    if (save_) {
      await saveFile();
      return true;
    }

    // Ask for confirmation before discarding
    const discard = await ask('Discard unsaved changes and continue?', {
      title: 'Confirm Discard',
      kind: 'warning',
      okLabel: 'Discard',
      cancelLabel: 'Cancel',
    });

    return discard; // false = user cancelled
  };

  const newFile = async () => {
    const state = useAppStore.getState();
    const currentTab = state.tabs.find((t) => t.id === state.activeTabId);

    // If current tab is empty untitled, just reset it
    if (!currentTab?.filePath && !currentTab?.content && !currentTab?.isDirty) {
      setContent('');
      setFilePath(null);
      setDirty(false);
      useAppStore.getState().setTabMode('edit');
      return;
    }

    const proceed = await checkUnsavedChanges();
    if (!proceed) return;
    newTab();
    useAppStore.getState().setTabMode('edit');
  };

  const openFile = async (path?: string) => {
    const proceed = await checkUnsavedChanges();
    if (!proceed) return;
    let targetPath = path;
    if (!targetPath) {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Markdown', extensions: ['md', 'txt', 'markdown'] }],
      });
      if (!selected) return;
      targetPath = selected as string;
    }
    try {
      const text = await readWithFallback(targetPath);
      setContent(text);
      setFilePath(targetPath);
      setDirty(false);
      addRecentFile(targetPath);
      useAppStore.getState().setTabMode('preview'); // open files in preview mode
      useAppStore.getState().setSavedContent(text);  // track saved state
    } catch (e) {
      if (String(e) !== 'Error: No file selected') {
        await message(`Failed to open file: ${e}`, { title: 'Error', kind: 'error' });
      }
    }
  };

  // Open a file into a new tab without touching the current tab
  const openFileInNewTab = async (path: string) => {
    try {
      const text = await readWithFallback(path);
      newTab();
      // After newTab() the store switches to empty new tab — now populate it
      setContent(text);
      setFilePath(path);
      setDirty(false);
      addRecentFile(path);
      useAppStore.getState().setTabMode('preview');
      useAppStore.getState().setSavedContent(text);
    } catch (e) {
      if (String(e) !== 'Error: No file selected') {
        await message(`Failed to open file: ${e}`, { title: 'Error', kind: 'error' });
      }
    }
  };

  // Open a file in a brand-new window
  const openFileInNewWindow = (path: string) => {
    const label = `editor-${Date.now()}`;
    new WebviewWindow(label, {
      url: `/?file=${encodeURIComponent(path)}`,
      title: `MD Editor — ${path.split(/[/\\]/).pop()}`,
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 500,
    });
  };

  const saveFile = async () => {
    if (filePath) {
      try {
        await writeTextFile(filePath, content);
        setDirty(false);
        useAppStore.getState().setSavedContent(content); // track saved state
      } catch (e) {
        const detail = isPermissionError(e)
          ? 'Permission denied by the OS. The file may be read-only or owned by another user.\n\nUse Save As to write to a different location.'
          : `Failed to save file: ${e}`;
        await message(detail, { title: 'Error', kind: 'error' });
      }
    } else {
      await saveFileAs();
    }
  };

  const saveFileAs = async () => {
    const savePath = await save({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: filePath || 'untitled.md',
    });
    if (!savePath) return;
    try {
      await writeTextFile(savePath, content);
      setFilePath(savePath);
      setDirty(false);
      addRecentFile(savePath);
      useAppStore.getState().setSavedContent(content);
    } catch (e) {
      await message(`Failed to save file: ${e}`, { title: 'Error', kind: 'error' });
    }
  };

  const autoSave = async () => {
    if (settings.autoSave && filePath && isDirty) {
      try {
        await writeTextFile(filePath, content);
        setDirty(false);
        useAppStore.getState().setSavedContent(content);
      } catch {
        // silent
      }
    }
  };

  const exportToHtml = async () => {
    const { marked } = await import('marked');
    const html = await marked.parse(content);
    const title = filePath
      ? filePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') ?? 'Untitled'
      : 'Untitled';
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
code { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.9em; }
blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0 16px; color: #666; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px 12px; }
th { background: #f6f8fa; }
</style>
</head>
<body>
${html}
</body>
</html>`;
    const savePath = await save({
      filters: [{ name: 'HTML', extensions: ['html'] }],
      defaultPath: (filePath?.replace(/\.[^.]+$/, '') || 'untitled') + '.html',
    });
    if (!savePath) return;
    await writeTextFile(savePath, fullHtml);
    await message('Exported successfully!', { title: 'Export', kind: 'info' });
  };

  const restoreSession = async () => {
    const store = useAppStore.getState();
    const sessionTabs = store.sessionTabs;
    if (!sessionTabs || sessionTabs.length === 0) return;

    let isFirst = true;
    for (const sessionTab of sessionTabs) {
      if (!isFirst) {
        newTab();
      }
      isFirst = false;

      if (sessionTab.filePath) {
        try {
          const text = await readWithFallback(sessionTab.filePath);
          setContent(text);
          setFilePath(sessionTab.filePath);
          setDirty(false);
          useAppStore.getState().setSavedContent(text);
          useAppStore.getState().setTabMode(sessionTab.mode || 'preview');
        } catch {
          // File no longer exists, skip
        }
      } else if (sessionTab.content) {
        setContent(sessionTab.content);
        setFilePath(null);
        setDirty(sessionTab.isDirty || false);
        useAppStore.getState().setSavedContent(sessionTab.savedContent || '');
        useAppStore.getState().setTabMode(sessionTab.mode || 'edit');
      }
    }
  };

  return {
    newFile,
    openFile,
    openFileInNewTab,
    openFileInNewWindow,
    saveFile,
    saveFileAs,
    autoSave,
    checkUnsavedChanges,
    exportToHtml,
    restoreSession,
  };
}
