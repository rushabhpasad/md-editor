import { useAppStore } from '../store/appStore';

export function TitleBar() {
  const { filePath, isDirty } = useAppStore();
  const fileName = filePath ? filePath.split(/[/\\]/).pop()! : 'Untitled';

  return (
    // data-tauri-drag-region lets the user drag the window by clicking this strip.
    // paddingLeft reserves space for macOS traffic-light buttons (~78px).
    // On Windows/Linux the overlay style is ignored so this strip is the sole title bar.
    <div
      data-tauri-drag-region
      style={{
        height: '38px',
        flexShrink: 0,
        backgroundColor: 'var(--color-titlebar-bg)',
        borderBottom: '1px solid var(--color-toolbar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        // Reserve space for macOS traffic lights on the left
        paddingLeft: '78px',
        paddingRight: '78px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-titlebar-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '60%',
        }}
      >
        {isDirty ? '● ' : ''}{fileName}
      </span>
    </div>
  );
}
