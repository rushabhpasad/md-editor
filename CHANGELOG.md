# Changelog

All notable changes to MD Editor are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] — 2026-03-22

### Added
- **Dashboard** — welcome screen shown when no tabs are open, with quick-access buttons
  for New Document, Open File, and Recent Files (up to 7 entries)
- **Find/Replace in editor** — custom find/replace bar (Cmd+F) with match count (X/Y),
  next/prev navigation, Replace, and Replace All; replaces CodeMirror's built-in panel
- **Find in Preview** — find bar with match count and next/prev navigation in the preview pane
- **Print options** — Export dialog now offers Print Preview (PDF via system dialog) and
  Print Raw Markdown in addition to Export as HTML
- **Cycle View shortcut** — Cmd+Shift+V cycles through Edit → Split → Preview modes
- **Toggle Scroll Sync shortcut** — Cmd+Shift+S toggles per-tab scroll sync
- **Font family dropdown** — Settings now shows a curated dropdown of 8 monospace font
  choices instead of a free-text field

### Fixed
- **Font/line-height not applied** — font family, font size, and line height from Settings
  are now correctly applied to both the editor (via `EditorView.theme()` compartment) and
  the preview pane
- **Undo blanks editor after file open** — file loads are now marked with
  `Transaction.addToHistory.of(false)` so Cmd+Z cannot undo a file load
- **Save always showed Save As dialog** — stale-closure bug in the save handler; now reads
  fresh state via `useAppStore.getState()` inside all async file operations
- **Export HTML produced empty file** — same stale-closure root cause as save bug above
- **Close window dialog had no cancel** — two-step dialog now allows keeping the window open
  without saving or discarding: "Save All / Don't Save" → "Discard & Close / Keep Open"
- **Open File replaced current tab** — Cmd+O and File → Open now always open in a new tab
- **Dashboard not shown on cold start** — app now starts with no tabs open so the dashboard
  is always shown when there is no previous session to restore

### Changed
- View menu: removed Toggle Editor, Toggle Preview, Toggle Scroll Sync items; added
  Cycle View (Cmd+Shift+V)
- Save As no longer has a keyboard accelerator (Cmd+Shift+S is now Toggle Scroll Sync)
- Closing all tabs now shows the dashboard rather than keeping a blank untitled tab

---

## [1.0.5] — 2026-03-22

### Added
- **Tabs** — open multiple documents simultaneously, each with its own view mode and
  scroll sync state; Cmd+Shift+N opens a new tab, Cmd+W closes the active tab
- **Per-tab view modes** — each tab independently tracks Edit / Split / Preview mode;
  toolbar cycle button and View → Cycle View rotate through modes
- **Per-tab scroll sync** — ⇅ Sync toolbar button toggles scroll sync independently per tab
- **Session restore** — reopens tabs (including unsaved content) from the previous session
- **"Open With" / file associations** — set MD Editor as the default app for `.md` and
  `.markdown` files; Tauri emits `open-file` event for OS-level file opens
- **About dialog** — custom credits dialog with Donate / Sponsor link
- **Export dialog** — consolidated Export to HTML and Export as PDF actions
- **Show Changes (Diff view)** — line-based LCS diff comparing current content vs last-saved
- **Drag & drop** — drop a `.md` file onto the window to open it (always shows options dialog)

### Fixed
- Drag-and-drop handler race condition on content changes
- Transparent modal backgrounds (undefined CSS variable)
- Title bar contrast in light/solarized themes
- Status bar full file path overflow

---

## [1.0.4] and earlier

Initial public releases — core editor, split-pane preview, themes, toolbar, settings,
recent files, keyboard shortcuts, auto-save, and distribution via Homebrew / winget / Scoop.
