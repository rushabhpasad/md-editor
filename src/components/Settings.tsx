import { useAppStore, Theme, TabViewMode } from '../store/appStore';

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  opacity: 0.5,
  marginBottom: '12px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--color-input-bg)',
  border: '1px solid var(--color-input-border)',
  color: 'var(--color-app-text)',
  borderRadius: '6px',
  padding: '4px 8px',
  fontSize: '13px',
};

export function Settings() {
  const { settings, updateSettings, setShowSettings } = useAppStore();

  const themes: { value: Theme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'solarized-light', label: 'Solarized Light' },
    { value: 'solarized-dark', label: 'Solarized Dark' },
  ];

  const fontOptions: { value: string; label: string }[] = [
    { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
    { value: "'Fira Code', monospace", label: 'Fira Code' },
    { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
    { value: "Menlo, monospace", label: 'Menlo' },
    { value: "Monaco, monospace", label: 'Monaco' },
    { value: "Consolas, monospace", label: 'Consolas' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: "monospace", label: 'System Monospace' },
  ];

  const modes: { value: TabViewMode; label: string }[] = [
    { value: 'split', label: 'Split (Editor + Preview)' },
    { value: 'edit', label: 'Edit only' },
    { value: 'preview', label: 'Preview only' },
  ];

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const panelStyle: React.CSSProperties = {
    background: 'var(--color-panel-bg)',
    color: 'var(--color-app-text)',
    borderRadius: '12px',
    padding: '24px',
    width: '480px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Preferences</h2>
          <button
            onClick={() => setShowSettings(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-app-text)', fontSize: '20px', opacity: 0.5, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Appearance */}
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>Appearance</div>

          <div style={rowStyle}>
            <label style={labelStyle}>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as Theme })}
              style={{ ...inputStyle, width: '200px' }}
            >
              {themes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Editor */}
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>Editor</div>

          <div style={rowStyle}>
            <label style={labelStyle}>Default View Mode</label>
            <select
              value={settings.defaultMode}
              onChange={(e) => updateSettings({ defaultMode: e.target.value as TabViewMode })}
              style={{ ...inputStyle, width: '200px' }}
            >
              {modes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Font Family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              style={{ ...inputStyle, width: '200px' }}
            >
              {fontOptions.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Font Size (px)</label>
            <input
              type="number"
              min={8}
              max={32}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              style={{ ...inputStyle, width: '72px' }}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Line Height</label>
            <input
              type="number"
              min={1}
              max={3}
              step={0.1}
              value={settings.lineHeight}
              onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
              style={{ ...inputStyle, width: '72px' }}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Word Wrap</label>
            <input
              type="checkbox"
              checked={settings.wordWrap}
              onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Show Line Numbers</label>
            <input
              type="checkbox"
              checked={settings.showLineNumbers}
              onChange={(e) => updateSettings({ showLineNumbers: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Spell Check</label>
            <input
              type="checkbox"
              checked={settings.spellCheck}
              onChange={(e) => updateSettings({ spellCheck: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Scroll Sync */}
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>Scroll Sync</div>

          <div style={rowStyle}>
            <label style={labelStyle}>Scroll Sync (default for new tabs)</label>
            <input
              type="checkbox"
              checked={settings.scrollSync}
              onChange={(e) => updateSettings({ scrollSync: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Auto Save */}
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>Auto Save</div>

          <div style={rowStyle}>
            <label style={labelStyle}>Auto Save</label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>

          {settings.autoSave && (
            <div style={rowStyle}>
              <label style={labelStyle}>Auto Save Interval (seconds)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={settings.autoSaveInterval}
                onChange={(e) => updateSettings({ autoSaveInterval: Number(e.target.value) })}
                style={{ ...inputStyle, width: '72px' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--color-accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
