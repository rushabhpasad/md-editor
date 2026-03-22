import { useEffect, useRef, useState, useCallback } from 'react';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from '@codemirror/view';
import { EditorState, Compartment, Transaction } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {
  defaultKeymap,
  historyKeymap,
  history,
  indentWithTab,
} from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
  searchKeymap,
  highlightSelectionMatches,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  setSearchQuery,
  SearchQuery,
} from '@codemirror/search';
import {
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { useAppStore } from '../store/appStore';
import { useScrollSync } from '../hooks/useScrollSync';

interface EditorProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

// Markdown auto-pairing: wraps selection or inserts paired markers
function markdownPairExtension() {
  return EditorView.inputHandler.of((view, from, to, insert) => {
    const pairs: Record<string, string> = { '*': '*', '_': '_', '~': '~', '`': '`' };
    if (!(insert in pairs)) return false;

    const sel = view.state.selection.main;
    if (!sel.empty) {
      const selected = view.state.doc.sliceString(sel.from, sel.to);
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: `${insert}${selected}${pairs[insert]}` },
        selection: { anchor: sel.from + 1, head: sel.to + 1 },
      });
      return true;
    }

    const before = view.state.doc.sliceString(Math.max(0, from - 1), from);
    if ((insert === '*' || insert === '~') && before === insert) {
      view.dispatch({
        changes: { from, to, insert: `${insert}${insert}` },
        selection: { anchor: from },
      });
      return true;
    }

    return false;
  });
}

// Build a CodeMirror theme for user font settings
function createFontTheme(fontFamily: string, fontSize: number, lineHeight: number) {
  return EditorView.theme({
    '&': { fontSize: `${fontSize}px` },
    '.cm-content': {
      fontFamily,
      lineHeight: String(lineHeight),
    },
    '.cm-scroller': { fontFamily },
    '.cm-gutters': { fontSize: `${fontSize}px` },
  });
}

// Count plain-text occurrences of query in text (case-insensitive)
function countMatches(text: string, query: string): number {
  if (!query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let count = 0, pos = 0;
  while ((pos = t.indexOf(q, pos)) !== -1) { count++; pos += q.length; }
  return count;
}

export function Editor({ previewRef }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const wordWrapCompartment = useRef(new Compartment());
  const lineNumCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const fontCompartment = useRef(new Compartment());

  const { content, setContent, setDirty, setCursor, settings } = useAppStore();
  const { syncFromEditor } = useScrollSync();

  const isDarkTheme = (t: string) => t === 'dark' || t === 'solarized-dark';

  // Find/Replace bar state
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const findInputRef = useRef<HTMLInputElement>(null);
  // Refs for stale-closure-safe access from CodeMirror keymap
  const showFindBarRef = useRef(false);
  showFindBarRef.current = showFindBar;
  const findQueryRef = useRef('');
  findQueryRef.current = findQuery;
  const replaceQueryRef = useRef('');
  replaceQueryRef.current = replaceQuery;

  // openFindBar is used inside the CodeMirror keymap and window helper
  const _openFindBar = useCallback(() => {
    setShowFindBar(true);
    setTimeout(() => findInputRef.current?.focus(), 50);
  }, []);
  void _openFindBar; // suppress unused-var; actual callers use setShowFindBar directly

  const closeFindBar = useCallback(() => {
    setShowFindBar(false);
    setFindQuery('');
    setReplaceQuery('');
    setMatchCount(0);
    setCurrentMatch(0);
    const view = viewRef.current;
    if (view) {
      view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: '' })) });
      view.focus();
    }
  }, []);

  // Update CodeMirror search state and count matches when query changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (!showFindBar || !findQuery) {
      view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: '' })) });
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    const sq = new SearchQuery({ search: findQuery, replace: replaceQueryRef.current });
    view.dispatch({ effects: setSearchQuery.of(sq) });

    const count = countMatches(view.state.doc.toString(), findQuery);
    setMatchCount(count);

    if (count > 0) {
      findNext(view);
      setCurrentMatch(1);
    } else {
      setCurrentMatch(0);
    }
  }, [findQuery, showFindBar]);

  // Keep replace query in sync with CodeMirror search state
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !findQueryRef.current) return;
    const sq = new SearchQuery({ search: findQueryRef.current, replace: replaceQuery });
    view.dispatch({ effects: setSearchQuery.of(sq) });
  }, [replaceQuery]);

  const handleFindNext = useCallback(() => {
    const view = viewRef.current;
    if (!view || matchCount === 0) return;
    findNext(view);
    setCurrentMatch((n) => (n >= matchCount ? 1 : n + 1));
  }, [matchCount]);

  const handleFindPrev = useCallback(() => {
    const view = viewRef.current;
    if (!view || matchCount === 0) return;
    findPrevious(view);
    setCurrentMatch((n) => (n <= 1 ? matchCount : n - 1));
  }, [matchCount]);

  const handleReplaceNext = useCallback(() => {
    const view = viewRef.current;
    if (!view || matchCount === 0) return;
    replaceNext(view);
    // Recount after replacement
    const count = countMatches(view.state.doc.toString(), findQueryRef.current);
    setMatchCount(count);
    setCurrentMatch((n) => Math.min(n, count));
  }, [matchCount]);

  const handleReplaceAll = useCallback(() => {
    const view = viewRef.current;
    if (!view || matchCount === 0) return;
    replaceAll(view);
    setMatchCount(0);
    setCurrentMatch(0);
  }, [matchCount]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        closeBrackets(),
        markdownPairExtension(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        indentOnInput(),
        keymap.of([
          // Custom Mod-f: open our find bar instead of CodeMirror's built-in panel
          {
            key: 'Mod-f',
            run: () => {
              setShowFindBar(true);
              setTimeout(() => findInputRef.current?.focus(), 50);
              return true;
            },
          },
          // Escape closes the find bar if it's open
          {
            key: 'Escape',
            run: () => {
              if (showFindBarRef.current) {
                setShowFindBar(false);
                setFindQuery('');
                setReplaceQuery('');
                setMatchCount(0);
                setCurrentMatch(0);
                const view = viewRef.current;
                if (view) {
                  view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: '' })) });
                  view.focus();
                }
                return true;
              }
              return false;
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          // Include searchKeymap but Mod-f won't fire (already handled above)
          ...searchKeymap,
          indentWithTab,
        ]),
        wordWrapCompartment.current.of(
          settings.wordWrap ? EditorView.lineWrapping : []
        ),
        lineNumCompartment.current.of(
          settings.showLineNumbers ? lineNumbers() : []
        ),
        themeCompartment.current.of(
          isDarkTheme(settings.theme) ? [oneDark] : []
        ),
        fontCompartment.current.of(
          createFontTheme(settings.fontFamily, settings.fontSize, settings.lineHeight)
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setContent(update.state.doc.toString());
            setDirty(true);
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            setCursor(line.number, head - line.from + 1);
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync content from outside (file open / new file) — NOT recorded in undo history
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
        // Prevent this replacement from being added to undo history so that
        // Cmd+Z after opening a file doesn't undo back to the previous content.
        annotations: Transaction.addToHistory.of(false),
      });
    }
  }, [content]);

  // Dynamically switch dark/light CodeMirror theme
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.current.reconfigure(
        isDarkTheme(settings.theme) ? [oneDark] : []
      ),
    });
  }, [settings.theme]);

  // Dynamically toggle word wrap
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: wordWrapCompartment.current.reconfigure(
        settings.wordWrap ? EditorView.lineWrapping : []
      ),
    });
  }, [settings.wordWrap]);

  // Dynamically toggle line numbers
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: lineNumCompartment.current.reconfigure(
        settings.showLineNumbers ? lineNumbers() : []
      ),
    });
  }, [settings.showLineNumbers]);

  // Dynamically apply font settings via a CodeMirror theme compartment.
  // Using EditorView.theme() correctly targets .cm-content/.cm-scroller so
  // font-family and line-height are actually respected (unlike setting them on
  // the outer .cm-editor which CodeMirror may not inherit from).
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: fontCompartment.current.reconfigure(
        createFontTheme(settings.fontFamily, settings.fontSize, settings.lineHeight)
      ),
    });
  }, [settings.fontFamily, settings.fontSize, settings.lineHeight]);

  const handleScroll = useCallback(() => {
    const scroller = containerRef.current?.querySelector('.cm-scroller') as HTMLElement;
    if (scroller && previewRef.current) {
      syncFromEditor(scroller, previewRef.current);
    }
  }, [syncFromEditor, previewRef]);

  useEffect(() => {
    const scroller = containerRef.current?.querySelector('.cm-scroller') as HTMLElement;
    if (!scroller) return;
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Expose helpers for toolbar and App-level actions
  useEffect(() => {
    (window as any).__editorInsert = (before: string, after: string, placeholder: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to);
      const text = selected || placeholder;
      view.dispatch({
        changes: { from, to, insert: `${before}${text}${after}` },
        selection: { anchor: from + before.length, head: from + before.length + text.length },
      });
      view.focus();
    };

    (window as any).__editorInsertLine = (text: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, to: line.from, insert: text + '\n' },
      });
      view.focus();
    };

    (window as any).__editorFocus = () => viewRef.current?.focus();

    // __editorFind opens the custom find/replace bar
    (window as any).__editorFind = () => {
      setShowFindBar(true);
      setTimeout(() => findInputRef.current?.focus(), 50);
    };

    (window as any).__editorPrefixLines = (prefix: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const startLine = view.state.doc.lineAt(from);
      const endLine = view.state.doc.lineAt(to);
      const changes = [];
      for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
        const line = view.state.doc.line(lineNum);
        changes.push({ from: line.from, to: line.from, insert: prefix });
      }
      view.dispatch({ changes });
      view.focus();
    };

    (window as any).__editorWrapBlock = (fenceBefore: string, fenceAfter: string, placeholder: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to);
      const text = selected || placeholder;
      view.dispatch({
        changes: { from, to, insert: `${fenceBefore}\n${text}\n${fenceAfter}` },
        selection: { anchor: from + fenceBefore.length + 1, head: from + fenceBefore.length + 1 + text.length },
      });
      view.focus();
    };
  }, []);

  // ── Styles ────────────────────────────────────────────────────────────────

  const findBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-toolbar-bg)',
    flexShrink: 0,
    flexWrap: 'wrap',
  };

  const inputStyle: React.CSSProperties = {
    flex: '1 1 120px',
    maxWidth: '200px',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid var(--color-input-border, var(--color-border))',
    background: 'var(--color-input-bg, var(--color-app-bg))',
    color: 'var(--color-app-text)',
    fontSize: '13px',
    outline: 'none',
  };

  const navBtnStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--color-app-text)',
    fontSize: '13px',
    lineHeight: 1.5,
  };

  const replaceBtnStyle: React.CSSProperties = {
    ...navBtnStyle,
    fontSize: '12px',
    padding: '2px 10px',
  };

  const countStyle: React.CSSProperties = {
    fontSize: '12px',
    opacity: 0.55,
    whiteSpace: 'nowrap',
    minWidth: '56px',
  };

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '18px',
    background: 'var(--color-border)',
    margin: '0 2px',
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {showFindBar && (
        <div style={findBarStyle}>
          {/* Find row */}
          <input
            ref={findInputRef}
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? handleFindPrev() : handleFindNext(); }
              if (e.key === 'Escape') closeFindBar();
            }}
            placeholder="Find…"
            style={inputStyle}
          />
          <span style={countStyle}>
            {findQuery
              ? matchCount === 0 ? 'No matches' : `${currentMatch} / ${matchCount}`
              : ''}
          </span>
          <button style={navBtnStyle} title="Previous (Shift+Enter)" onClick={handleFindPrev}>↑</button>
          <button style={navBtnStyle} title="Next (Enter)" onClick={handleFindNext}>↓</button>

          <div style={dividerStyle} />

          {/* Replace row */}
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') closeFindBar(); }}
            placeholder="Replace…"
            style={inputStyle}
          />
          <button style={replaceBtnStyle} title="Replace next" onClick={handleReplaceNext}>Replace</button>
          <button style={replaceBtnStyle} title="Replace all" onClick={handleReplaceAll}>All</button>

          <button
            style={{ ...navBtnStyle, border: 'none', opacity: 0.5, marginLeft: 'auto' }}
            title="Close (Esc)"
            onClick={closeFindBar}
          >
            ×
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="editor-container h-full overflow-hidden"
        spellCheck={settings.spellCheck}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
