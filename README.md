# MD Editor

A lightweight, cross-platform desktop Markdown editor with a live split-pane preview.

![MD Editor screenshot placeholder](docs/screenshot.png)

## Features

- **Custom title bar** — shows the current filename centered; theme-contrast background (darker header in light themes, near-black in dark themes); native window dragging
- **Split-pane layout** — resizable editor and preview side by side; toggle between Edit, Split, and Preview modes per tab
- **Tabs** — open multiple documents simultaneously, each with its own view mode and scroll sync state
- **Live preview** — GitHub Flavored Markdown rendered in real time (150 ms debounce)
- **Syntax highlighting** — editor syntax coloring for Markdown; fenced code blocks highlighted via highlight.js
- **Formatting toolbar** — one-click bold, italic, headings, code blocks, links, images, lists, blockquotes, tables; heading/list buttons correctly apply to selected lines
- **Keyboard shortcuts** — full set of shortcuts for all common actions (see table below)
- **Four themes** — Light, Dark, Solarized Light, Solarized Dark; auto-detects system preference
- **Persistent settings** — font family/size, line height, word wrap, scroll sync, auto-save, and more
- **Per-tab scroll sync (⇅ Sync)** — editor and preview scroll together; toggle independently per tab
- **File management** — open, save, save-as, recent files (last 10), unsaved-changes guard with Save/Discard/Cancel, drag & drop
- **"Open With" support** — set MD Editor as the default app for `.md` and `.markdown` files
- **Session restore** — reopens last-open tabs (including untitled documents) on next launch
- **Export** — Export to HTML (standalone file with styles), Print Preview (PDF via system dialog), or Print Raw Markdown
- **Find in editor** — custom find/replace bar (Cmd+F) with match count and Replace / Replace All; identical find bar in Preview pane
- **Dashboard** — welcome screen with New Document, Open File, and Recent Files when no tabs are open
- **Show Changes** — diff view comparing current content against the last-saved version
- **Multi-window** — open files in separate windows
- **View-only mode** — read-only preview without the editor
- **Auto-save** — optional timed auto-save to the current file
- **Status bar** — live word count, character count, cursor position, file encoding
- **Donate / Sponsor** — support open source development via [GitHub Sponsors](https://github.com/sponsors/rushabhpasad)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://tauri.app) (Rust + WebView) |
| Frontend | React 18 + TypeScript |
| Editor | CodeMirror 6 |
| Markdown parser | marked.js (GFM) |
| Code highlighting | highlight.js |
| Split pane | allotment |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| File I/O | Tauri `fs` + `dialog` plugins |

## Installation

### macOS

**Homebrew** (recommended)

```bash
brew tap rushabhpasad/tap
brew install --cask md-editor
```

**Direct download**

Download the `.dmg` from the [Releases page](https://github.com/rushabhpasad/md-editor/releases), open it, and drag **MD Editor** to your Applications folder.

> **"MD Editor is damaged and can't be opened"** — the app may not yet be code-signed with an Apple Developer ID in older releases. Remove the quarantine attribute with:
>
> ```bash
> xattr -cr "/Applications/MD Editor.app"
> ```
>
> Alternatively, right-click the app → **Open** → click **Open** in the dialog.

**MacPorts** *(community-maintained, submission pending)*

```bash
sudo port install md-editor
```

---

### Windows

**winget**

```bash
winget install rushabhpasad.MDEditor
```

**Scoop**

```bash
scoop bucket add rushabhpasad https://github.com/rushabhpasad/scoop-bucket
scoop install md-editor
```

**Chocolatey** *(submission pending)*

```bash
choco install md-editor
```

**Direct download**

Download the `.msi` or `.exe` installer from the [Releases page](https://github.com/rushabhpasad/md-editor/releases).

---

### Linux

**apt / deb**

```bash
curl -LO https://github.com/rushabhpasad/md-editor/releases/latest/download/md-editor_amd64.deb
sudo dpkg -i md-editor_amd64.deb
```

**AppImage**

```bash
curl -LO https://github.com/rushabhpasad/md-editor/releases/latest/download/md-editor_amd64.AppImage
chmod +x md-editor_amd64.AppImage
./md-editor_amd64.AppImage
```

**Flatpak** *(Flathub submission pending)*

```bash
flatpak install flathub com.rpasad.MDEditor
```

**Snap** *(Snap Store submission pending)*

```bash
snap install md-editor
```

---

## Prerequisites (Building from Source)

- [Rust](https://www.rust-lang.org/tools/install) (stable, 1.77+)
- [Node.js](https://nodejs.org) 18+
- Tauri system dependencies for your platform — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/rushabhpasad/md-editor.git
cd md-editor

# Install frontend dependencies
npm install

# Start the development build (hot-reloads both Rust and frontend)
npm run tauri dev
```

## Building for Production

```bash
npm run tauri build
```

Distributable bundles are written to `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

| Action | macOS | Windows / Linux |
|---|---|---|
| New File (new tab) | Cmd+N | Ctrl+N |
| New Tab | Cmd+Shift+N | Ctrl+Shift+N |
| Open (in new tab) | Cmd+O | Ctrl+O |
| Save | Cmd+S | Ctrl+S |
| Save As | File menu | File menu |
| Close Tab | Cmd+W | Ctrl+W |
| Find / Replace | Cmd+F | Ctrl+F |
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| Cycle View (Edit→Split→Preview) | Cmd+Shift+V | Ctrl+Shift+V |
| Toggle Scroll Sync (per tab) | Cmd+Shift+S | Ctrl+Shift+S |
| Toggle Preview | Cmd+Shift+P | Ctrl+Shift+P |
| Toggle Editor | Cmd+Shift+E | Ctrl+Shift+E |
| Toggle View-only Mode | Cmd+Shift+R | Ctrl+Shift+R |
| Toggle Theme | Cmd+Shift+T | Ctrl+Shift+T |
| Increase Font | Cmd++ | Ctrl++ |
| Decrease Font | Cmd+- | Ctrl+- |
| Reset Font | Cmd+0 | Ctrl+0 |
| Settings | Cmd+, | Ctrl+, |

## Project Structure

```
md-editor/
├── .github/
│   └── workflows/
│       ├── release.yml             # Build & sign all platforms on git tag push
│       └── publish-packages.yml   # Push to Homebrew/winget/Scoop on release publish
│
├── src-tauri/          # Rust / Tauri backend
│   └── src/
│       ├── lib.rs      # App setup, native menu, plugin registration
│       └── main.rs     # Entry point
│
└── src/                # React frontend
    ├── components/
    │   ├── Layout.tsx        # Split-pane shell; renders Dashboard when no tabs open
    │   ├── Dashboard.tsx     # Welcome screen (new doc / open / recent files)
    │   ├── TitleBar.tsx      # Custom title bar with filename + drag region
    │   ├── Editor.tsx        # CodeMirror 6 instance with custom find/replace bar
    │   ├── Preview.tsx       # Live HTML preview with find bar
    │   ├── Toolbar.tsx       # Formatting buttons + mode toggle + sync
    │   ├── TabBar.tsx        # Tab management UI
    │   ├── StatusBar.tsx     # Word/char count, cursor, full path
    │   ├── Settings.tsx      # Preferences modal (sectioned)
    │   ├── RecentFiles.tsx   # Recent files modal
    │   ├── About.tsx         # About dialog (credits + donate)
    │   ├── ExportDialog.tsx  # Export to HTML / Print PDF / Print Raw Markdown
    │   ├── DiffViewer.tsx    # Show changes since last save
    │   └── DragDropOverlay.tsx # Drag & drop handler
    ├── hooks/
    │   ├── useFile.ts        # Open / save / recent file logic
    │   ├── useMarkdown.ts    # Debounced MD → HTML conversion
    │   ├── useTheme.ts       # Theme switching & system detection
    │   └── useScrollSync.ts  # Bidirectional scroll sync
    ├── store/
    │   └── appStore.ts   # Zustand global state + persisted settings
    └── styles/
        ├── themes.css    # CSS custom properties for all themes
        ├── editor.css    # CodeMirror overrides
        └── preview.css   # GitHub-style preview typography
```

## Settings

Open via **MD Editor → Settings...** or `Cmd/Ctrl+,`.

| Setting | Default |
|---|---|
| Theme | System |
| Default View Mode | Split |
| Font Family | JetBrains Mono (dropdown of 8 choices) |
| Font Size | 14px |
| Line Height | 1.6 |
| Word Wrap | On |
| Scroll Sync (default for new tabs) | On |
| Auto Save | Off |
| Auto Save Interval | 30s |
| Show Line Numbers | On |
| Spell Check | Off |

## Sample Files

The `samples/` directory contains ready-to-open Markdown files for exploring the editor's features:

| File | Contents |
|---|---|
| `samples/welcome.md` | Feature overview with tables, code blocks, and checkboxes |
| `samples/code-showcase.md` | Syntax highlighting demo in 6 languages |
| `samples/writing-sample.md` | Long-form prose demonstrating typography |
| `samples/features-overview.md` | App-store-style feature sheet |

## Support

If MD Editor is useful to you, consider [sponsoring development](https://github.com/sponsors/rushabhpasad) — it helps keep the project free and open source.

## Credits

Created by **Rushabh Pasad** · Built with the help of [Claude](https://claude.ai) (Anthropic)

## Contributing

Contributions are welcome! Please open an issue before submitting a large pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a pull request

## License

MIT — see [LICENSE](LICENSE) for details.
