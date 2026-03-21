import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'system' | 'light' | 'dark' | 'solarized-light' | 'solarized-dark';

export interface Settings {
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  wordWrap: boolean;
  scrollSync: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  showLineNumbers: boolean;
  spellCheck: boolean;
}

interface AppState {
  content: string;
  filePath: string | null;
  isDirty: boolean;
  recentFiles: string[];

  showEditor: boolean;
  showPreview: boolean;
  showToolbar: boolean;
  showSettings: boolean;
  showRecentFiles: boolean;

  cursorLine: number;
  cursorCol: number;

  settings: Settings;

  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  setDirty: (dirty: boolean) => void;
  addRecentFile: (path: string) => void;
  setShowEditor: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setShowToolbar: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowRecentFiles: (show: boolean) => void;
  setCursor: (line: number, col: number) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: 'system',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
  lineHeight: 1.6,
  wordWrap: true,
  scrollSync: true,
  autoSave: false,
  autoSaveInterval: 30,
  showLineNumbers: true,
  spellCheck: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      content: '',
      filePath: null,
      isDirty: false,
      recentFiles: [],

      showEditor: true,
      showPreview: true,
      showToolbar: true,
      showSettings: false,
      showRecentFiles: false,

      cursorLine: 1,
      cursorCol: 1,

      settings: defaultSettings,

      setContent: (content) => set({ content }),
      setFilePath: (filePath) => set({ filePath }),
      setDirty: (isDirty) => set({ isDirty }),
      addRecentFile: (path) =>
        set((state) => ({
          recentFiles: [path, ...state.recentFiles.filter((f) => f !== path)].slice(0, 10),
        })),
      setShowEditor: (showEditor) => set({ showEditor }),
      setShowPreview: (showPreview) => set({ showPreview }),
      setShowToolbar: (showToolbar) => set({ showToolbar }),
      setShowSettings: (showSettings) => set({ showSettings }),
      setShowRecentFiles: (showRecentFiles) => set({ showRecentFiles }),
      setCursor: (cursorLine, cursorCol) => set({ cursorLine, cursorCol }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'md-editor-storage',
      partialize: (state) => ({
        settings: state.settings,
        recentFiles: state.recentFiles,
      }),
    }
  )
);
