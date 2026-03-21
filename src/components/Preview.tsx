import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useMarkdown } from '../hooks/useMarkdown';
import { useScrollSync } from '../hooks/useScrollSync';
import { openUrl } from '@tauri-apps/plugin-opener';

interface PreviewProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export function Preview({ previewRef }: PreviewProps) {
  const { content, filePath } = useAppStore();
  const html = useMarkdown(content, filePath);
  const innerRef = useRef<HTMLDivElement>(null);
  const { syncFromPreview } = useScrollSync();
  // Flag: suppress scroll-sync while we're doing an innerHTML update
  const isUpdatingRef = useRef(false);

  // Forward ref to parent
  useEffect(() => {
    if (innerRef.current) {
      (previewRef as React.MutableRefObject<HTMLDivElement | null>).current = innerRef.current;
    }
  }, [previewRef]);

  // Update innerHTML manually, preserving scroll position.
  // dangerouslySetInnerHTML would reset scrollTop to 0 on every render.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    isUpdatingRef.current = true;
    const savedScroll = el.scrollTop;
    el.innerHTML = html;
    el.scrollTop = savedScroll;

    // Re-attach link handler after innerHTML replacement
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target?.href) {
        e.preventDefault();
        openUrl(target.href).catch(() => {});
      }
    };
    el.addEventListener('click', handleClick);

    requestAnimationFrame(() => {
      isUpdatingRef.current = false;
    });

    return () => el.removeEventListener('click', handleClick);
  }, [html]);

  const handleScroll = useCallback(() => {
    if (isUpdatingRef.current) return;
    const el = innerRef.current;
    if (!el) return;
    const editorScroller = document.querySelector('.cm-scroller') as HTMLElement;
    if (editorScroller) syncFromPreview(el, editorScroller);
  }, [syncFromPreview]);

  return (
    <div
      ref={innerRef}
      onScroll={handleScroll}
      className="preview-pane h-full overflow-y-auto px-8 py-6"
    />
  );
}
