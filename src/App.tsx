import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { ask } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Layout } from './components/Layout';
import { useFile } from './hooks/useFile';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/appStore';
import './index.css';

export default function App() {
  const { newFile, openFile, saveFile, saveFileAs, autoSave, exportToHtml, restoreSession } = useFile();
  const {
    setShowSettings,
    setShowRecentFiles,
    settings,
    updateSettings,
    setShowEditor,
    setShowPreview,
    setShowToolbar,
    setViewOnlyMode,
    newTab,
    closeTab,
    recentFiles,
    clearRecentFiles,
    setShowAbout,
    setShowDiff,
    filePath,
    isDirty,
  } = useAppStore();
  useTheme();

  // Update native window title to show the current file name
  useEffect(() => {
    const fileName = filePath ? filePath.split(/[/\\]/).pop()! : 'Untitled';
    const title = isDirty ? `● ${fileName} — MD Editor` : `${fileName} — MD Editor`;
    getCurrentWindow().setTitle(title).catch(() => {});
  }, [filePath, isDirty]);

  // Open file passed via URL param (used when opening a new window with a file),
  // otherwise restore the previous session.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileParam = params.get('file');
    if (fileParam) {
      openFile(decodeURIComponent(fileParam));
    } else {
      restoreSession();
    }
  }, []);

  // Handle "open-file" event from Tauri (for "Open With" / drag-and-drop from OS)
  useEffect(() => {
    const unlisten = listen<string>('open-file', ({ payload }) => {
      if (payload) openFile(payload);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  // Sync recent files to the native menu
  useEffect(() => {
    invoke('update_recent_files', { files: recentFiles }).catch(() => {});
  }, [recentFiles]);

  // Auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (settings.autoSave) {
      autoSaveTimerRef.current = setInterval(autoSave, settings.autoSaveInterval * 1000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [settings.autoSave, settings.autoSaveInterval]);

  // Handle window close — prompt for unsaved changes across all tabs
  useEffect(() => {
    const win = getCurrentWindow();
    const unlisten = win.onCloseRequested(async (event) => {
      const state = useAppStore.getState();
      const dirtyTabs = state.tabs.filter((t) => t.isDirty);
      if (dirtyTabs.length > 0) {
        event.preventDefault();
        const tabNames = dirtyTabs
          .map((t) => (t.filePath ? t.filePath.split(/[/\\]/).pop() : 'Untitled'))
          .join(', ');
        const save = await ask(
          `You have unsaved changes in: ${tabNames}. Save before closing?`,
          {
            title: 'Unsaved Changes',
            kind: 'warning',
            okLabel: 'Save All',
            cancelLabel: 'Discard All',
          }
        );
        if (save) {
          for (const tab of dirtyTabs) {
            state.activateTab(tab.id);
            await saveFile();
          }
        }
        await win.destroy();
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  // Native menu events
  useEffect(() => {
    const unlisten = listen<string>('menu-event', ({ payload }) => {
      // Recent file by index
      if (payload.startsWith('recent_') && !isNaN(Number(payload.replace('recent_', '')))) {
        const idx = Number(payload.replace('recent_', ''));
        const files = useAppStore.getState().recentFiles;
        if (files[idx]) openFile(files[idx]);
        return;
      }

      switch (payload) {
        case 'new':               newFile(); break;
        case 'new_tab':           newTab(); break;
        case 'open':              openFile(); break;
        case 'save':              saveFile(); break;
        case 'save_as':           saveFileAs(); break;
        case 'preferences':       setShowSettings(true); break;
        case 'recent_files':      setShowRecentFiles(true); break;
        case 'clear_recent':      clearRecentFiles(); break;
        case 'find':              (window as any).__editorFind?.(); break;
        case 'toggle_editor':     setShowEditor(!useAppStore.getState().showEditor); break;
        case 'toggle_preview':    setShowPreview(!useAppStore.getState().showPreview); break;
        case 'toggle_toolbar':    setShowToolbar(!useAppStore.getState().showToolbar); break;
        case 'toggle_scroll_sync': updateSettings({ scrollSync: !useAppStore.getState().settings.scrollSync }); break;
        case 'view_only_mode':    setViewOnlyMode(!useAppStore.getState().viewOnlyMode); break;
        case 'increase_font':     updateSettings({ fontSize: Math.min(useAppStore.getState().settings.fontSize + 1, 32) }); break;
        case 'decrease_font':     updateSettings({ fontSize: Math.max(useAppStore.getState().settings.fontSize - 1, 8) }); break;
        case 'reset_font':        updateSettings({ fontSize: 14 }); break;
        case 'theme_light':           updateSettings({ theme: 'light' }); break;
        case 'theme_dark':            updateSettings({ theme: 'dark' }); break;
        case 'theme_solarized_light': updateSettings({ theme: 'solarized-light' }); break;
        case 'theme_solarized_dark':  updateSettings({ theme: 'solarized-dark' }); break;
        case 'about':             setShowAbout(true); break;
        case 'donate':            setShowAbout(true); break;
        case 'export_html':       exportToHtml(); break;
        case 'toggle_diff':       setShowDiff(!useAppStore.getState().showDiff); break;
        case 'export_pdf':        window.print(); break;
        case 'homepage':          openUrl('https://github.com/rushabhpasad/md-editor').catch(() => {}); break;
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'n' && !e.shiftKey) { e.preventDefault(); newFile(); }
      if (e.key === 'n' && e.shiftKey)  { e.preventDefault(); newTab(); }
      if (e.key === 'o' && !e.shiftKey) { e.preventDefault(); openFile(); }
      if (e.key === 's' && !e.shiftKey) { e.preventDefault(); saveFile(); }
      if (e.key === 'S' && e.shiftKey)  { e.preventDefault(); saveFileAs(); }
      if (e.key === ',')                 { e.preventDefault(); setShowSettings(true); }
      if (e.key === '=' || e.key === '+') { e.preventDefault(); updateSettings({ fontSize: Math.min(useAppStore.getState().settings.fontSize + 1, 32) }); }
      if (e.key === '-')                 { e.preventDefault(); updateSettings({ fontSize: Math.max(useAppStore.getState().settings.fontSize - 1, 8) }); }
      if (e.key === '0')                 { e.preventDefault(); updateSettings({ fontSize: 14 }); }
      if (e.key === 'P' && e.shiftKey)   { e.preventDefault(); setShowPreview(!useAppStore.getState().showPreview); }
      if (e.key === 'E' && e.shiftKey)   { e.preventDefault(); setShowEditor(!useAppStore.getState().showEditor); }
      if (e.key === 'R' && e.shiftKey)   { e.preventDefault(); setViewOnlyMode(!useAppStore.getState().viewOnlyMode); }
      if (e.key === 'T' && e.shiftKey) {
        e.preventDefault();
        const themes = ['light', 'dark', 'solarized-light', 'solarized-dark'] as const;
        const current = useAppStore.getState().settings.theme;
        const idx = themes.indexOf(current as any);
        updateSettings({ theme: themes[(idx + 1) % themes.length] });
      }
      if (e.key === 'w') {
        e.preventDefault();
        const state = useAppStore.getState();
        const tab = state.tabs.find((t) => t.id === state.activeTabId);
        if (tab?.isDirty) {
          const { ask: askDialog } = await import('@tauri-apps/plugin-dialog');
          const saveBefore = await askDialog(
            'This tab has unsaved changes. Save before closing?',
            { title: 'Unsaved Changes', kind: 'warning', okLabel: 'Save', cancelLabel: 'Discard' }
          );
          if (saveBefore) await saveFile();
        }
        closeTab(state.activeTabId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return <Layout />;
}
