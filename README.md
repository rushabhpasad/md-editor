# MD Editor

A lightweight, cross-platform desktop Markdown editor with a live split-pane preview.

![MD Editor screenshot placeholder](docs/screenshot.png)

## Features

- **Split-pane layout** — resizable editor and preview side by side, collapsible to either side
- **Live preview** — GitHub Flavored Markdown rendered in real time (150 ms debounce)
- **Syntax highlighting** — editor syntax coloring for Markdown; fenced code blocks highlighted via highlight.js
- **Formatting toolbar** — one-click bold, italic, strikethrough, headings, code, links, images, lists, blockquotes, tables
- **Keyboard shortcuts** — full set of shortcuts for all common actions (see table below)
- **Four themes** — Light, Dark, Solarized Light, Solarized Dark; auto-detects system preference
- **Persistent settings** — font family/size, line height, word wrap, scroll sync, auto-save, and more
- **Bidirectional scroll sync** — editor and preview scroll together proportionally
- **File management** — open, save, save-as, recent files (last 10), unsaved-changes guard
- **Auto-save** — optional timed auto-save to the current file
- **Status bar** — live word count, character count, cursor position, file encoding

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

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable, 1.77+)
- [Node.js](https://nodejs.org) 18+
- Tauri system dependencies for your platform — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/md-editor.git
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
| New File | Cmd+N | Ctrl+N |
| Open | Cmd+O | Ctrl+O |
| Save | Cmd+S | Ctrl+S |
| Save As | Cmd+Shift+S | Ctrl+Shift+S |
| Find | Cmd+F | Ctrl+F |
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| Toggle Preview | Cmd+Shift+P | Ctrl+Shift+P |
| Toggle Editor | Cmd+Shift+E | Ctrl+Shift+E |
| Toggle Theme | Cmd+Shift+T | Ctrl+Shift+T |
| Increase Font | Cmd++ | Ctrl++ |
| Decrease Font | Cmd+- | Ctrl+- |
| Reset Font | Cmd+0 | Ctrl+0 |
| Preferences | Cmd+, | Ctrl+, |

## Project Structure

```
md-editor/
├── src-tauri/          # Rust / Tauri backend
│   └── src/
│       ├── lib.rs      # App setup, native menu, plugin registration
│       └── main.rs     # Entry point
│
└── src/                # React frontend
    ├── components/
    │   ├── Editor.tsx      # CodeMirror 6 instance
    │   ├── Preview.tsx     # Live HTML preview
    │   ├── Toolbar.tsx     # Formatting buttons
    │   ├── StatusBar.tsx   # Word/char count, cursor, encoding
    │   ├── Settings.tsx    # Preferences modal
    │   ├── RecentFiles.tsx # Recent files modal
    │   └── Layout.tsx      # Split-pane shell
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

Open via **Edit → Preferences** or `Cmd/Ctrl+,`.

| Setting | Default |
|---|---|
| Theme | System |
| Font Family | JetBrains Mono |
| Font Size | 14px |
| Line Height | 1.6 |
| Word Wrap | On |
| Scroll Sync | On |
| Auto Save | Off |
| Auto Save Interval | 30s |
| Show Line Numbers | On |
| Spell Check | Off |

## Contributing

Contributions are welcome! Please open an issue before submitting a large pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a pull request

## License

MIT — see [LICENSE](LICENSE) for details.
