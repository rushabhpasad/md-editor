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
    const answer = await ask('You have unsaved changes. Do you want to save before continuing?', {
      title: 'Unsaved Changes',
      kind: 'warning',
      okLabel: 'Save',
      cancelLabel: 'Discard',
    });
    if (answer) await saveFile();
    return true;
  };

  const newFile = async () => {
    await checkUnsavedChanges();
    setContent('');
    setFilePath(null);
    setDirty(false);
  };

  const openFile = async (path?: string) => {
    await checkUnsavedChanges();
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
    } catch (e) {
      await message(`Failed to save file: ${e}`, { title: 'Error', kind: 'error' });
    }
  };

  const autoSave = async () => {
    if (settings.autoSave && filePath && isDirty) {
      try {
        await writeTextFile(filePath, content);
        setDirty(false);
      } catch {
        // silent
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
  };
}
