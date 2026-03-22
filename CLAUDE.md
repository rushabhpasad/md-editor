# MD Editor — Claude Code Context

This file is automatically loaded by Claude Code when working in this repository.

## Project Overview

A cross-platform desktop Markdown editor built with **Tauri v2** (Rust backend) and **React 18 + TypeScript** (frontend). Features a resizable split-pane layout with a CodeMirror 6 editor on the left and a live HTML preview on the right.

## Tech Stack

| Concern | Technology |
|---|---|
| Desktop shell | Tauri v2 (Rust) |
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite + `@tailwindcss/vite` |
| Editor | CodeMirror 6 |
| Markdown rendering | marked.js (GFM) with highlight.js |
| Split pane | allotment |
| Styling | Tailwind CSS v4 + CSS custom properties |
| State management | Zustand (with `persist` middleware) |
| File I/O | `@tauri-apps/plugin-fs` + `@tauri-apps/plugin-dialog` |

## Repository Structure

```
md-editor/
├── .github/
│   ├── workflows/              # CI/CD: release.yml, publish-packages.yml
│   └── FUNDING.yml             # GitHub Sponsors config
│
├── samples/                    # Sample .md files for screenshots and demos
│   ├── welcome.md
│   ├── code-showcase.md
│   ├── writing-sample.md
│   └── features-overview.md
│
├── src-tauri/                  # Rust / Tauri backend
│   ├── src/
│   │   ├── lib.rs              # App entry: plugins, macOS app menu + File/Edit/View/Help menus,
│   │   │                       # menu-event emitter, RunEvent::Opened handler for "Open With"
│   │   └── main.rs             # Binary entry point (calls lib::run)
│   ├── capabilities/
│   │   └── default.json        # Tauri capability permissions (fs, dialog, opener)
│   ├── Cargo.toml
│   └── tauri.conf.json         # Window config (titleBarStyle: overlay, hiddenTitle: true),
│                               # bundle targets, fileAssociations (.md, .markdown)
│
├── src/                        # React frontend
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Top-level: menu listeners, keyboard shortcuts (incl. Cmd+W),
│   │                           # window title sync, auto-save, close guard, session restore
│   ├── index.css               # Tailwind import + utility class definitions
│   │
│   ├── components/
│   │   ├── Layout.tsx          # Allotment split-pane shell; derives show/hide from active tab's mode
│   │   ├── TitleBar.tsx        # Custom title bar (data-tauri-drag-region); shows filename centered;
│   │   │                       # uses --color-titlebar-bg for theme contrast
│   │   ├── Editor.tsx          # CodeMirror 6; exposes window.__editor* helpers including
│   │   │                       # __editorPrefixLines, __editorWrapBlock
│   │   ├── Preview.tsx         # Live HTML preview; manually updates innerHTML to preserve scroll
│   │   ├── Toolbar.tsx         # Formatting buttons + mode toggle + ⇅ Sync (per-tab) + ⊕ Changes
│   │   ├── StatusBar.tsx       # Word/char count, cursor Ln/Col; full file path with CSS ellipsis
│   │   ├── Settings.tsx        # Preferences modal; sectioned (Appearance/Editor/Scroll/Auto-save);
│   │   │                       # includes Default View Mode setting
│   │   ├── RecentFiles.tsx     # Recent files modal (last 10)
│   │   ├── About.tsx           # Custom About dialog with credits (Rushabh Pasad / Claude) + Donate
│   │   ├── ExportDialog.tsx    # Export to HTML or PDF (print dialog)
│   │   ├── DiffViewer.tsx      # LCS line-based diff of current vs last-saved content
│   │   ├── Dashboard.tsx       # Empty-state welcome screen (shown when tabs.length === 0);
│   │   │                       # New Doc / Open File / Recent Files list
│   │   ├── DragDropOverlay.tsx # Drag & drop file handler; always shows open-options dialog
│   │   └── TabBar.tsx          # Tab management UI
│   │
│   ├── hooks/
│   │   ├── useFile.ts          # Open / save / save-as / auto-save / exportToHtml / restoreSession
│   │   ├── useMarkdown.ts      # 150ms debounced marked.js render; resolves relative image paths
│   │   ├── useTheme.ts         # Applies data-theme attr + dark class to <html>; watches OS preference
│   │   └── useScrollSync.ts    # Per-tab scroll sync (reads activeTab.scrollSync)
│   │
│   ├── store/
│   │   └── appStore.ts         # Zustand store; Tab has mode/scrollSync/savedContent;
│   │                           # Settings has defaultMode; session tabs persisted
│   │
│   └── styles/
│       ├── themes.css          # CSS custom properties for all 4 themes incl. --color-titlebar-bg/text
│       ├── editor.css          # CodeMirror overrides (height, gutter, token colors per theme)
│       └── preview.css         # GitHub-style markdown preview typography
│
├── index.html                  # Entry HTML (title: "MD Editor")
├── vite.config.ts              # Vite config — includes @tailwindcss/vite plugin (required for v4)
├── CLAUDE.md                   # This file
└── README.md                   # User-facing documentation
```

## Development Commands

```bash
# Install dependencies (first time)
npm install

# Start dev server with hot reload (also compiles Rust)
npm run tauri dev

# Production build
npm run tauri build
# → Output: src-tauri/target/release/bundle/

# Regenerate app icons from an SVG or large PNG
npm run tauri icon path/to/icon.svg

# Type-check + frontend-only build (fast, no Rust)
npm run build
```

## Architecture Decisions & Gotchas

### Tailwind CSS v4
Tailwind v4 **requires** the `@tailwindcss/vite` plugin — there is no PostCSS config. The plugin is already registered in `vite.config.ts`. Do not add a `tailwind.config.js` or `postcss.config.js`.

### Title Bar Overlay
`tauri.conf.json` sets `"titleBarStyle": "overlay"` and `"hiddenTitle": true` to extend the webview behind the macOS traffic-light buttons. `TitleBar.tsx` is a React component that replaces the native title bar. Key details:
- `data-tauri-drag-region` attribute on the outer `<div>` enables native window dragging
- `paddingLeft: '78px'` clears the traffic-light buttons on macOS
- Background uses `var(--color-titlebar-bg)` so it has visible contrast in every theme (light themes get a slightly darker header)
- Shows `isDirty ? '● ' : ''` + filename, centered

### Structural Layout Uses Inline Styles
`Layout.tsx`, `Toolbar.tsx`, `TitleBar.tsx`, and `StatusBar.tsx` use `style={{...}}` for all structural properties (flexbox, height, colors). This is intentional — it makes the critical layout immune to CSS pipeline issues. Do not convert these to Tailwind classes.

### CodeMirror Theme is a Compartment
The `oneDark` theme is managed via a `Compartment` (`themeCompartment`) inside `Editor.tsx` so it can be reconfigured reactively when the user switches themes. Do **not** pass `oneDark` as a static extension — it will only apply on initial mount and won't update when the theme changes.

Similarly, `wordWrapCompartment`, `lineNumCompartment`, and `fontCompartment` allow word-wrap, line numbers, and font settings to be toggled without destroying and recreating the editor.

### Font Settings in the Editor
Font family, font size, and line height are applied via a `fontCompartment` that wraps `EditorView.theme()`. Do **not** attempt to apply these by setting inline styles on `.cm-editor`. That approach fails because:
- CodeMirror sets its own `font-family` on `.cm-content` and `.cm-scroller` internally
- `line-height` set on `.cm-editor` is ignored; CodeMirror reads it from `.cm-content`
- `EditorView.theme()` targets the correct selectors at the right CSS priority

The `createFontTheme(fontFamily, fontSize, lineHeight)` helper in `Editor.tsx` builds the theme object. The `fontCompartment` is reconfigured in a `useEffect` whenever those settings change.

For the **preview pane**, font family and line height are applied via inline styles on `innerRef.current` in a `useEffect` in `Preview.tsx`.

### Undo History — File Loading
When loading a file's content into the editor (`setContent` triggers the content-sync `useEffect`), the dispatch must include:
```ts
annotations: Transaction.addToHistory.of(false)
```
Without this annotation, CodeMirror records the load as an undoable action, and pressing Cmd+Z after opening a file blanks the editor. This annotation must be present on **any** programmatic content replacement that should not be undoable.

### Preview innerHTML vs dangerouslySetInnerHTML
`Preview.tsx` intentionally sets `el.innerHTML` manually inside a `useEffect` rather than using React's `dangerouslySetInnerHTML`. This is required to preserve `scrollTop` when the HTML updates. Using `dangerouslySetInnerHTML` would reset scroll to 0 on every debounce tick, which then triggers `syncFromPreview` and drags the editor to 0 too.

### Scroll Sync Buffer
`useScrollSync.ts` has a `SYNC_BUFFER = 0.20` (20%). Sync only fires when the two panes differ by more than 20% of their scrollable range. This prevents the oscillation where each sync triggers a counter-sync.

### Menu Events Flow
All native menu actions are emitted from Rust as `menu-event` Tauri events with the menu item ID as the payload (e.g. `"save"`, `"toggle_editor"`). The listener in `App.tsx` handles all cases. To add a new menu item:
1. Add it in `src-tauri/src/lib.rs` with a unique `id`
2. Handle the id string in the `switch` in `App.tsx`

### Toolbar → Editor Communication
The toolbar calls helpers exposed on `window`:
- `window.__editorInsert(before, after, placeholder)` — wraps selection or inserts with placeholder
- `window.__editorInsertLine(text)` — inserts text at the start of the current line
- `window.__editorPrefixLines(prefix)` — prepends `prefix` to every line in the current selection (used for headings, lists, blockquotes)
- `window.__editorWrapBlock(fenceBefore, fenceAfter, placeholder)` — wraps selected text in block fences (used for fenced code blocks)
- `window.__editorFind()` — opens the custom find/replace bar (Cmd+F)
- `window.__editorFocus()` — focuses the editor
- `window.__previewFind()` — opens the find bar in the Preview pane

These are set up in a `useEffect` inside `Editor.tsx` (editor helpers) and `Preview.tsx` (`__previewFind`).

### Editor Find/Replace Bar
`Editor.tsx` renders a custom floating find/replace bar at the top of the editor pane — similar to the preview find bar but with a Replace field. It completely replaces CodeMirror's built-in search panel.

- Cmd+F (or `__editorFind()`) shows the bar and focuses the find input
- Escape (or ×) closes it and clears the search state
- Uses `setSearchQuery` from `@codemirror/search` so CodeMirror highlights all matches natively
- Navigation via `findNext` / `findPrevious`; replace via `replaceNext` / `replaceAll`
- Shows **X / Y** match count (counted via a simple `indexOf` loop on the document string)
- The Cmd+F keymap binding is placed **before** `searchKeymap` in the keymap array so it takes priority; returning `true` prevents CodeMirror's default panel from opening

### Theme System
Themes work via CSS custom properties on `[data-theme="..."]` on `<html>`. `useTheme.ts` sets both the `data-theme` attribute and the `dark` class (for dark/solarized-dark). All component colors reference `var(--color-*)` variables defined in `src/styles/themes.css`.

Available themes: `light` | `dark` | `solarized-light` | `solarized-dark` | `system`

`--color-titlebar-bg` and `--color-titlebar-text` are defined for all four concrete themes and give the custom title bar visible contrast against the editor background (e.g. light theme uses a slightly darker gray header; dark theme uses a near-black header).

**When adding a new theme**, always define both `--color-titlebar-bg` and `--color-titlebar-text` in addition to the other `--color-*` variables.

### Zustand Store Persistence
The following are persisted to `localStorage` (key: `md-editor-storage`) via the `partialize` option:
- `settings` — all user preferences including `defaultMode`
- `recentFiles` — last 10 opened file paths
- `sessionTabs` — tab snapshots for session restore: named tabs store only their `filePath`; untitled tabs store `content`, `isDirty`, and `savedContent`. Empty untitled tabs are filtered out.
- `activeTabId` — which tab was active when the app closed

Document content for named files, UI visibility flags (`showSettings`, `showDiff`, etc.), and cursor position are **not** persisted.

## Key Files to Know

| Task | File |
|---|---|
| Add a menu item | `src-tauri/src/lib.rs` + `src/App.tsx` |
| Change theme colors | `src/styles/themes.css` |
| Change title bar appearance | `src/components/TitleBar.tsx` + `src/styles/themes.css` |
| Change preview typography | `src/styles/preview.css` |
| Change editor syntax colors | `src/styles/editor.css` |
| Add a toolbar button | `src/components/Toolbar.tsx` |
| Add a persistent setting | `src/store/appStore.ts` + `src/components/Settings.tsx` |
| Change file open/save behavior | `src/hooks/useFile.ts` |
| Change Tauri permissions | `src-tauri/capabilities/default.json` |
| Change About dialog content | `src/components/About.tsx` |
| Change export / print behavior | `src/hooks/useFile.ts` (exportToHtml) + `src/components/ExportDialog.tsx` |
| Change diff view | `src/components/DiffViewer.tsx` |
| Change tab view modes | `src/store/appStore.ts` (TabViewMode type) + `src/components/Layout.tsx` |
| Change dashboard / empty state | `src/components/Dashboard.tsx` + `src/components/Layout.tsx` |

## Rust Backend Notes

- Rust entry: `src-tauri/src/lib.rs` → `pub fn run()`
- Plugins registered: `tauri_plugin_fs`, `tauri_plugin_dialog`, `tauri_plugin_opener`
- The only custom Tauri command is `get_app_version` — everything else goes through plugins or menu events
- Menu is built in `.setup()` using the Tauri v2 menu builder API
- `app.on_menu_event(|app, event| app.emit("menu-event", event.id()))` is the bridge to the frontend

## Release & Distribution

### Publishing a new version

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` (all must match)
2. Commit, push, then push a version tag:
   ```bash
   git tag v1.2.3 && git push origin v1.2.3
   ```
3. The `release.yml` workflow builds all platforms and creates a **draft** GitHub Release
4. Review the draft on GitHub, then click **Publish release**
5. Publishing triggers `publish-packages.yml` which automatically updates:
   - **Homebrew** cask in `rushabhpasad/homebrew-tap` (Casks/md-editor.rb)
   - **winget** via a PR to `microsoft/winget-pkgs`
   - **Scoop** manifest in `rushabhpasad/scoop-bucket` (bucket/md-editor.json)

### Required GitHub Secrets

| Secret | Used by | Purpose |
|---|---|---|
| `APPLE_CERTIFICATE` | `release.yml` | Base64-encoded Developer ID Application `.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | `release.yml` | Password for the `.p12` |
| `APPLE_SIGNING_IDENTITY` | `release.yml` | `Developer ID Application: Name (TEAMID)` |
| `APPLE_ID` | `release.yml` | Apple ID email for notarization |
| `APPLE_PASSWORD` | `release.yml` | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | `release.yml` | 10-character Apple Team ID |
| `RELEASE_TOKEN` | `publish-packages.yml` | PAT with `repo` scope on the tap and bucket repos |
| `WINGET_TOKEN` | `publish-packages.yml` | PAT with `public_repo` scope for winget PR |

### Package manager companion repos

Two separate repositories must exist for automated distribution:

- **`rushabhpasad/homebrew-tap`** — Homebrew custom tap. Must contain a `Casks/` directory. Install: `brew tap rushabhpasad/tap && brew install --cask md-editor`
- **`rushabhpasad/scoop-bucket`** — Scoop custom bucket. Must contain a `bucket/` directory. Install: `scoop bucket add rushabhpasad https://github.com/rushabhpasad/scoop-bucket && scoop install md-editor`

### Platforms not yet automated (manual submission required)

- **MacPorts** — submit a Portfile to the [MacPorts ports tree](https://github.com/macports/macports-ports)
- **Chocolatey** — publish via [chocolatey.org](https://community.chocolatey.org/packages)
- **Flatpak / Flathub** — submit a manifest to [flathub/flathub](https://github.com/flathub/flathub)
- **Snap Store** — publish via `snapcraft` CLI

## Dashboard (Empty State)

When all tabs are closed (`tabs.length === 0`), `Layout.tsx` renders `<Dashboard />` instead of the editor layout. The dashboard shows:
- App name / tagline
- **New Document** button → calls `newTab()`
- **Open File…** button → calls `openFileInNewTab()` (shows file picker)
- **Recent Files** list (up to 7 entries) — each entry opens in a new tab

Once any tab is opened, `tabs.length > 0` again and the editor layout is shown. The dashboard is only visible while there are zero open tabs.

## Tab View Modes

Each tab has a `mode: 'edit' | 'preview' | 'split'` field (exported as `TabViewMode`). `Layout.tsx` derives `effectiveShowEditor` / `effectiveShowPreview` from this field on the active tab. The toolbar cycle button (✎ Edit → ⊟ Split → 👁 Preview) calls `setTabMode()` to rotate through modes. Cmd+Shift+V also cycles modes. When a file is opened from disk, mode defaults to `'preview'`. New/untitled tabs start in `'edit'` mode.

## Per-Tab Scroll Sync

Each tab has a `scrollSync: boolean` field. `useScrollSync.ts` reads this from the active tab instead of from global settings. The ⇅ Sync toolbar button and Cmd+Shift+S call `setTabScrollSync()` to toggle it for the active tab. The global `settings.scrollSync` is still present as the default for new tabs.

**Note:** Cmd+Shift+S is intentionally NOT registered as a native menu accelerator for Save As (the `save_as` menu item has `None::<&str>` for its accelerator). This allows the JavaScript keydown handler to intercept Cmd+Shift+S for sync toggle. Save As is still accessible via the File menu.

## Saved Content / Diff View

Each tab has `savedContent: string` — the content as of the last save (or file open). `useFile.ts` updates `savedContent` after every successful save. The "⊕ Changes" toolbar button (visible when `isDirty`) opens `DiffViewer.tsx` which runs a line-based LCS diff and displays added/removed lines.

## Session Restore

The Zustand `partialize` persists `sessionTabs` — an array of tab snapshots. For named files only the path is stored; for untitled docs the content is stored. On startup, `restoreSession()` in `useFile.ts` iterates the persisted tabs, reads named files from disk, and restores untitled content from the persisted data. Session restore is skipped if the app was opened with a `?file=` URL param.

## "Open With" / macOS File Associations

`tauri.conf.json` registers `.md` and `.markdown` as file types for MD Editor. When the OS opens a file with the app, Tauri emits `RunEvent::Opened { urls }` which the lib.rs run-loop handler converts to an `"open-file"` event with the file path. `App.tsx` listens for this event and calls `openFile(path)`.

## macOS Menu Structure

The native menu follows macOS conventions — the first menu is the **app name menu** ("MD Editor"), not "File":

| Menu | Items |
|---|---|
| **MD Editor** | About MD Editor, Donate/Support, separator, Settings... (⌘,), separator, Services, separator, Hide/Hide Others/Show All, separator, Quit |
| **File** | New File (⌘N), New Tab (⌘⇧N), Open... (⌘O), Open Recent ▶, separator, Save (⌘S), Save As... (menu only, no accelerator), separator, Export ▶ (HTML, PDF) |
| **Edit** | Undo, Redo, separator, Cut, Copy, Paste, Select All, separator, Find (⌘F) |
| **View** | Cycle View (⌘⇧V), Toggle Toolbar, View Only Mode, Show Changes, separator, font size items, separator, Theme ▶ |
| **Help** | MD Editor on GitHub |

Do **not** put Quit or Preferences in the File menu — on macOS those belong in the app-name menu.

## Common Pitfalls

- **Don't use `isDark` as a plain variable in Editor** — always use `settings.theme` and the `themeCompartment` so dark mode stays reactive
- **Don't use `dangerouslySetInnerHTML` in Preview** — the manual innerHTML approach is intentional (scroll preservation)
- **Don't add PostCSS config** — Tailwind v4 uses the Vite plugin, not PostCSS
- **Capabilities file must list permissions explicitly** — if you add a new Tauri plugin, add its permissions to `src-tauri/capabilities/default.json` or the plugin calls will be denied at runtime
- **Modal dialog backgrounds must use `var(--color-panel-bg)`** — `--color-settings-bg` is not defined anywhere. Any new modal overlay that references an undefined variable will render transparent against the app content. Always use `var(--color-panel-bg)` for modal/dialog panel backgrounds.
- **DragDropOverlay must register its event listener once** — the listener must be set up in a `useEffect` with empty deps `[]`. Use a `useRef` to capture current state values inside the single handler, not a re-registering pattern with state-based deps. Re-registering on content changes causes async teardown races where drops fire against stale handlers.
