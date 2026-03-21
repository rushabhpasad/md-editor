import { open, save, ask, message } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useAppStore } from '../store/appStore';

export function useFile() {
  const {
    content,
    filePath,
    isDirty,
    setContent,
    setFilePath,
    setDirty,
    addRecentFile,
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
    if (answer) {
      await saveFile();
    }
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
      const text = await readTextFile(targetPath);
      setContent(text);
      setFilePath(targetPath);
      setDirty(false);
      addRecentFile(targetPath);
    } catch (e) {
      await message(`Failed to open file: ${e}`, { title: 'Error', kind: 'error' });
    }
  };

  const saveFile = async () => {
    if (filePath) {
      try {
        await writeTextFile(filePath, content);
        setDirty(false);
      } catch (e) {
        await message(`Failed to save file: ${e}`, { title: 'Error', kind: 'error' });
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

  // Auto-save
  const autoSave = async () => {
    if (settings.autoSave && filePath && isDirty) {
      try {
        await writeTextFile(filePath, content);
        setDirty(false);
      } catch {
        // silent fail for auto-save
      }
    }
  };

  return { newFile, openFile, saveFile, saveFileAs, autoSave, checkUnsavedChanges };
}
