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

export interface Tab {
  id: string;
  content: string;
  filePath: string | null;
  isDirty: boolean;
}

const INITIAL_TAB_ID = 'tab-initial';

interface AppState {
  // Active document state (always mirrors the active tab)
  content: string;
  filePath: string | null;
  isDirty: boolean;
  recentFiles: string[];

  // Tab system
  tabs: Tab[];
  activeTabId: string;

  // UI state
  showEditor: boolean;
  showPreview: boolean;
  showToolbar: boolean;
  showSettings: boolean;
  showRecentFiles: boolean;
  viewOnlyMode: boolean;

  cursorLine: number;
  cursorCol: number;

  settings: Settings;

  // Document actions (sync active tab automatically)
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  setDirty: (dirty: boolean) => void;
  addRecentFile: (path: string) => void;
  clearRecentFiles: () => void;

  // Tab actions
  newTab: () => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;

  // UI actions
  setShowEditor: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setShowToolbar: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowRecentFiles: (show: boolean) => void;
  setViewOnlyMode: (mode: boolean) => void;
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

      tabs: [{ id: INITIAL_TAB_ID, content: '', filePath: null, isDirty: false }],
      activeTabId: INITIAL_TAB_ID,

      showEditor: true,
      showPreview: true,
      showToolbar: true,
      showSettings: false,
      showRecentFiles: false,
      viewOnlyMode: false,

      cursorLine: 1,
      cursorCol: 1,

      settings: defaultSettings,

      // Keep active tab in sync on every content/path/dirty change
      setContent: (content) =>
        set((state) => ({
          content,
          tabs: state.tabs.map((t) =>
            t.id === state.activeTabId ? { ...t, content } : t
          ),
        })),

      setFilePath: (filePath) =>
        set((state) => ({
          filePath,
          tabs: state.tabs.map((t) =>
            t.id === state.activeTabId ? { ...t, filePath } : t
          ),
        })),

      setDirty: (isDirty) =>
        set((state) => ({
          isDirty,
          tabs: state.tabs.map((t) =>
            t.id === state.activeTabId ? { ...t, isDirty } : t
          ),
        })),

      addRecentFile: (path) =>
        set((state) => ({
          recentFiles: [path, ...state.recentFiles.filter((f) => f !== path)].slice(0, 10),
        })),

      clearRecentFiles: () => set({ recentFiles: [] }),

      // Create a new empty tab and activate it
      newTab: () =>
        set((state) => {
          const id = `tab-${Date.now()}`;
          const newTabEntry: Tab = { id, content: '', filePath: null, isDirty: false };
          return {
            tabs: [...state.tabs, newTabEntry],
            activeTabId: id,
            content: '',
            filePath: null,
            isDirty: false,
            cursorLine: 1,
            cursorCol: 1,
          };
        }),

      closeTab: (id) =>
        set((state) => {
          if (state.tabs.length <= 1) {
            // Reset to empty instead of closing the last tab
            return {
              content: '',
              filePath: null,
              isDirty: false,
              tabs: [{ id: state.activeTabId, content: '', filePath: null, isDirty: false }],
            };
          }
          const idx = state.tabs.findIndex((t) => t.id === id);
          const newTabs = state.tabs.filter((t) => t.id !== id);
          if (id !== state.activeTabId) {
            return { tabs: newTabs };
          }
          // Closing the active tab — switch to adjacent
          const adjacent = newTabs[Math.min(idx, newTabs.length - 1)];
          return {
            tabs: newTabs,
            activeTabId: adjacent.id,
            content: adjacent.content,
            filePath: adjacent.filePath,
            isDirty: adjacent.isDirty,
            cursorLine: 1,
            cursorCol: 1,
          };
        }),

      activateTab: (id) =>
        set((state) => {
          if (id === state.activeTabId) return state;
          const tab = state.tabs.find((t) => t.id === id);
          if (!tab) return state;
          return {
            activeTabId: id,
            content: tab.content,
            filePath: tab.filePath,
            isDirty: tab.isDirty,
            cursorLine: 1,
            cursorCol: 1,
          };
        }),

      setShowEditor: (showEditor) => set({ showEditor }),
      setShowPreview: (showPreview) => set({ showPreview }),
      setShowToolbar: (showToolbar) => set({ showToolbar }),
      setShowSettings: (showSettings) => set({ showSettings }),
      setShowRecentFiles: (showRecentFiles) => set({ showRecentFiles }),
      setViewOnlyMode: (viewOnlyMode) => set({ viewOnlyMode }),
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
