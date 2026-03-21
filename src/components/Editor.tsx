import { useEffect, useRef, useCallback } from 'react';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
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
  openSearchPanel,
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
    // If text is selected, wrap it
    if (!sel.empty) {
      const selected = view.state.doc.sliceString(sel.from, sel.to);
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: `${insert}${selected}${pairs[insert]}` },
        selection: { anchor: sel.from + 1, head: sel.to + 1 },
      });
      return true;
    }

    // For *, check if the previous char is also * to form **
    const before = view.state.doc.sliceString(Math.max(0, from - 1), from);
    if ((insert === '*' || insert === '~') && before === insert) {
      // Second * or ~: insert the closing pair and place cursor between
      view.dispatch({
        changes: { from, to, insert: `${insert}${insert}` },
        selection: { anchor: from },
      });
      return true;
    }

    return false;
  });
}

export function Editor({ previewRef }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const wordWrapCompartment = useRef(new Compartment());
  const lineNumCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());

  const { content, setContent, setDirty, setCursor, settings } = useAppStore();
  const { syncFromEditor } = useScrollSync();

  const isDarkTheme = (t: string) => t === 'dark' || t === 'solarized-dark';

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
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
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

  // Sync content from outside (file open / new file)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
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

  // Apply font settings via CSS
  useEffect(() => {
    const cmEl = containerRef.current?.querySelector('.cm-editor') as HTMLElement;
    if (cmEl) {
      cmEl.style.fontSize = `${settings.fontSize}px`;
      cmEl.style.lineHeight = String(settings.lineHeight);
      cmEl.style.fontFamily = settings.fontFamily;
    }
  }, [settings.fontSize, settings.lineHeight, settings.fontFamily]);

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

    (window as any).__editorFind = () => {
      const view = viewRef.current;
      if (!view) return;
      openSearchPanel(view);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="editor-container h-full overflow-hidden"
      spellCheck={settings.spellCheck}
    />
  );
}
