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
├── src-tauri/                  # Rust / Tauri backend
│   ├── src/
│   │   ├── lib.rs              # App entry: plugins, native menu, menu-event emitter
│   │   └── main.rs             # Binary entry point (calls lib::run)
│   ├── capabilities/
│   │   └── default.json        # Tauri capability permissions (fs, dialog, opener)
│   ├── Cargo.toml
│   └── tauri.conf.json         # Window config, bundle targets, product name
│
├── src/                        # React frontend
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Top-level: menu listeners, keyboard shortcuts, auto-save, close guard
│   ├── index.css               # Tailwind import + utility class definitions
│   │
│   ├── components/
│   │   ├── Layout.tsx          # Allotment split-pane shell; all structural layout uses inline styles
│   │   ├── Editor.tsx          # CodeMirror 6 instance; exposes helpers on window.__editor*
│   │   ├── Preview.tsx         # Live HTML preview; manually updates innerHTML to preserve scroll
│   │   ├── Toolbar.tsx         # 15 formatting buttons; fully inline-styled (no Tailwind dependency)
│   │   ├── StatusBar.tsx       # Word/char count, cursor Ln/Col, file path; fully inline-styled
│   │   ├── Settings.tsx        # Preferences modal
│   │   └── RecentFiles.tsx     # Recent files modal (last 10)
│   │
│   ├── hooks/
│   │   ├── useFile.ts          # Open / save / save-as / auto-save via Tauri plugins
│   │   ├── useMarkdown.ts      # 150ms debounced marked.js render; resolves relative image paths
│   │   ├── useTheme.ts         # Applies data-theme attr + dark class to <html>; watches OS preference
│   │   └── useScrollSync.ts    # Bidirectional scroll sync with 20% buffer to prevent oscillation
│   │
│   ├── store/
│   │   └── appStore.ts         # Zustand store; settings + recentFiles persisted to localStorage
│   │
│   └── styles/
│       ├── themes.css          # CSS custom properties for all 4 themes
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

### Structural Layout Uses Inline Styles
`Layout.tsx`, `Toolbar.tsx`, and `StatusBar.tsx` use `style={{...}}` for all structural properties (flexbox, height, colors). This is intentional — it makes the critical layout immune to CSS pipeline issues. Do not convert these to Tailwind classes.

### CodeMirror Theme is a Compartment
The `oneDark` theme is managed via a `Compartment` (`themeCompartment`) inside `Editor.tsx` so it can be reconfigured reactively when the user switches themes. Do **not** pass `oneDark` as a static extension — it will only apply on initial mount and won't update when the theme changes.

Similarly, `wordWrapCompartment` and `lineNumCompartment` allow word-wrap and line numbers to be toggled without destroying and recreating the editor.

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
- `window.__editorFind()` — opens CodeMirror's search panel
- `window.__editorFocus()` — focuses the editor

These are set up in a `useEffect` inside `Editor.tsx`.

### Theme System
Themes work via CSS custom properties on `[data-theme="..."]` on `<html>`. `useTheme.ts` sets both the `data-theme` attribute and the `dark` class (for dark/solarized-dark). All component colors reference `var(--color-*)` variables defined in `src/styles/themes.css`.

Available themes: `light` | `dark` | `solarized-light` | `solarized-dark` | `system`

### Zustand Store Persistence
Only `settings` and `recentFiles` are persisted to `localStorage` (key: `md-editor-storage`). Document content, file path, and UI visibility flags are session-only. The `partialize` option in the store config controls what gets persisted.

## Key Files to Know

| Task | File |
|---|---|
| Add a menu item | `src-tauri/src/lib.rs` + `src/App.tsx` |
| Change theme colors | `src/styles/themes.css` |
| Change preview typography | `src/styles/preview.css` |
| Change editor syntax colors | `src/styles/editor.css` |
| Add a toolbar button | `src/components/Toolbar.tsx` |
| Add a persistent setting | `src/store/appStore.ts` + `src/components/Settings.tsx` |
| Change file open/save behavior | `src/hooks/useFile.ts` |
| Change Tauri permissions | `src-tauri/capabilities/default.json` |

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

## Common Pitfalls

- **Don't use `isDark` as a plain variable in Editor** — always use `settings.theme` and the `themeCompartment` so dark mode stays reactive
- **Don't use `dangerouslySetInnerHTML` in Preview** — the manual innerHTML approach is intentional (scroll preservation)
- **Don't add PostCSS config** — Tailwind v4 uses the Vite plugin, not PostCSS
- **Capabilities file must list permissions explicitly** — if you add a new Tauri plugin, add its permissions to `src-tauri/capabilities/default.json` or the plugin calls will be denied at runtime
