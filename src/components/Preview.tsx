import { useRef, useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useMarkdown } from '../hooks/useMarkdown';
import { useScrollSync } from '../hooks/useScrollSync';
import { openUrl } from '@tauri-apps/plugin-opener';

interface PreviewProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Walk all text nodes in el, highlight occurrences of query with <mark class="search-match">.
// Returns total match count. Does NOT reset innerHTML — caller must reset first.
function highlightTextNodes(el: HTMLElement, query: string): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node as Text);

  const regex = new RegExp(escapeRegex(query), 'gi');
  let count = 0;

  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    const matches = [...text.matchAll(regex)];
    if (!matches.length) continue;

    const parent = textNode.parentNode!;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;

    for (const match of matches) {
      count++;
      if (match.index! > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
      }
      const mark = document.createElement('mark');
      mark.className = 'search-match';
      mark.textContent = match[0];
      frag.appendChild(mark);
      lastIdx = match.index! + match[0].length;
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    parent.replaceChild(frag, textNode);
  }
  return count;
}

export function Preview({ previewRef }: PreviewProps) {
  const { content, filePath, settings } = useAppStore();
  const html = useMarkdown(content, filePath);
  const innerRef = useRef<HTMLDivElement>(null);
  const { syncFromPreview } = useScrollSync();
  const isUpdatingRef = useRef(false);
  const baseHtmlRef = useRef('');

  // Find bar state
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0); // 0-based
  const showFindRef = useRef(false);
  const findQueryRef = useRef('');
  const matchIndexRef = useRef(0);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Keep refs in sync
  showFindRef.current = showFind;
  findQueryRef.current = findQuery;
  matchIndexRef.current = matchIndex;

  // Forward ref to parent
  useEffect(() => {
    if (innerRef.current) {
      (previewRef as React.MutableRefObject<HTMLDivElement | null>).current = innerRef.current;
    }
  }, [previewRef]);

  // Apply font settings from user preferences to the preview pane
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.fontFamily = settings.fontFamily;
    el.style.lineHeight = String(settings.lineHeight);
  }, [settings.fontFamily, settings.lineHeight]);

  // Expose __previewFind for App.tsx / menu handlers
  useEffect(() => {
    (window as any).__previewFind = () => {
      setShowFind(true);
      setTimeout(() => findInputRef.current?.focus(), 50);
    };
    return () => { delete (window as any).__previewFind; };
  }, []);

  // Apply highlights to el's current DOM (innerHTML must already be set to base HTML)
  const applyHighlights = useCallback((el: HTMLElement, query: string, activeIdx: number) => {
    const count = query ? highlightTextNodes(el, query) : 0;
    // Mark the active match
    if (count > 0) {
      const marks = el.querySelectorAll<HTMLElement>('.search-match');
      const safeIdx = Math.min(activeIdx, count - 1);
      marks[safeIdx]?.classList.add('current-match');
      marks[safeIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return count;
  }, []);

  // Update innerHTML, preserve scroll, re-apply search highlights
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    isUpdatingRef.current = true;
    const savedScroll = el.scrollTop;
    el.innerHTML = html;
    baseHtmlRef.current = html;

    // Re-apply search highlights if the find bar is open
    if (showFindRef.current && findQueryRef.current) {
      const count = applyHighlights(el, findQueryRef.current, matchIndexRef.current);
      setMatchCount(count);
      if (count > 0 && matchIndexRef.current >= count) setMatchIndex(count - 1);
    }

    el.scrollTop = savedScroll;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target?.href) {
        e.preventDefault();
        openUrl(target.href).catch(() => {});
      }
    };
    el.addEventListener('click', handleClick);

    requestAnimationFrame(() => { isUpdatingRef.current = false; });
    return () => el.removeEventListener('click', handleClick);
  }, [html, applyHighlights]);

  // Re-apply highlights whenever find query or showFind changes
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (!showFind || !findQuery) {
      // Restore clean HTML, preserve scroll
      isUpdatingRef.current = true;
      const savedScroll = el.scrollTop;
      el.innerHTML = baseHtmlRef.current;
      el.scrollTop = savedScroll;
      requestAnimationFrame(() => { isUpdatingRef.current = false; });
      setMatchCount(0);
      setMatchIndex(0);
      return;
    }

    isUpdatingRef.current = true;
    const savedScroll = el.scrollTop;
    el.innerHTML = baseHtmlRef.current;
    const count = applyHighlights(el, findQuery, 0);
    el.scrollTop = count > 0 ? el.scrollTop : savedScroll; // let scrollIntoView win if match found
    requestAnimationFrame(() => { isUpdatingRef.current = false; });
    setMatchCount(count);
    setMatchIndex(0);
  }, [findQuery, showFind, applyHighlights]);

  const navigateMatch = useCallback((dir: 1 | -1) => {
    if (matchCount === 0) return;
    const el = innerRef.current;
    if (!el) return;

    const newIdx = (matchIndex + dir + matchCount) % matchCount;
    setMatchIndex(newIdx);

    // Update highlighted mark classes without rebuilding DOM
    const marks = el.querySelectorAll<HTMLElement>('.search-match');
    marks.forEach((m) => m.classList.remove('current-match'));
    marks[newIdx]?.classList.add('current-match');
    marks[newIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [matchIndex, matchCount]);

  const closeFind = useCallback(() => {
    setShowFind(false);
    setFindQuery('');
  }, []);

  const handleScroll = useCallback(() => {
    if (isUpdatingRef.current) return;
    const el = innerRef.current;
    if (!el) return;
    const editorScroller = document.querySelector('.cm-scroller') as HTMLElement;
    if (editorScroller) syncFromPreview(el, editorScroller);
  }, [syncFromPreview]);

  const findBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-toolbar-bg)',
    flexShrink: 0,
  };

  const findBtnStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--color-app-text)',
    fontSize: '13px',
    lineHeight: 1.4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {showFind && (
        <div style={findBarStyle}>
          <input
            ref={findInputRef}
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); navigateMatch(e.shiftKey ? -1 : 1); }
              if (e.key === 'Escape') closeFind();
            }}
            placeholder="Find in preview…"
            style={{
              flex: 1,
              maxWidth: '220px',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-input-border)',
              background: 'var(--color-input-bg)',
              color: 'var(--color-app-text)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '12px', opacity: 0.6, whiteSpace: 'nowrap', minWidth: '60px' }}>
            {findQuery
              ? matchCount === 0
                ? 'No matches'
                : `${matchIndex + 1} / ${matchCount}`
              : ''}
          </span>
          <button style={findBtnStyle} title="Previous match (Shift+Enter)" onClick={() => navigateMatch(-1)}>↑</button>
          <button style={findBtnStyle} title="Next match (Enter)" onClick={() => navigateMatch(1)}>↓</button>
          <button
            style={{ ...findBtnStyle, border: 'none', opacity: 0.6 }}
            title="Close find bar (Esc)"
            onClick={closeFind}
          >
            ×
          </button>
        </div>
      )}
      <div
        ref={innerRef}
        onScroll={handleScroll}
        className="preview-pane h-full overflow-y-auto px-8 py-6"
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
