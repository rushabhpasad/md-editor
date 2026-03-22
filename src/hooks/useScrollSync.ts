import { useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

const SYNC_BUFFER = 0.001; // don't sync if scroll positions are within 0.2% of each other

export function useScrollSync() {
  const { tabs, activeTabId } = useAppStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const scrollSyncEnabled = activeTab?.scrollSync ?? true;
  const isSyncingRef = useRef(false);

  const syncFromEditor = useCallback(
    (editorEl: HTMLElement, previewEl: HTMLElement) => {
      if (!scrollSyncEnabled || isSyncingRef.current) return;

      const srcMax = editorEl.scrollHeight - editorEl.clientHeight || 1;
      const dstMax = previewEl.scrollHeight - previewEl.clientHeight || 1;
      const srcPct = editorEl.scrollTop / srcMax;
      const dstPct = previewEl.scrollTop / dstMax;

      if (Math.abs(srcPct - dstPct) < SYNC_BUFFER) return;

      isSyncingRef.current = true;
      previewEl.scrollTop = srcPct * dstMax;
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    },
    [scrollSyncEnabled]
  );

  const syncFromPreview = useCallback(
    (previewEl: HTMLElement, editorEl: HTMLElement) => {
      if (!scrollSyncEnabled || isSyncingRef.current) return;

      const srcMax = previewEl.scrollHeight - previewEl.clientHeight || 1;
      const dstMax = editorEl.scrollHeight - editorEl.clientHeight || 1;
      const srcPct = previewEl.scrollTop / srcMax;
      const dstPct = editorEl.scrollTop / dstMax;

      if (Math.abs(srcPct - dstPct) < SYNC_BUFFER) return;

      isSyncingRef.current = true;
      editorEl.scrollTop = srcPct * dstMax;
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    },
    [scrollSyncEnabled]
  );

  return { syncFromEditor, syncFromPreview };
}
