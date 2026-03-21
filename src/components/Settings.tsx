import { useAppStore, Theme } from '../store/appStore';

export function Settings() {
  const { settings, updateSettings, setShowSettings } = useAppStore();

  const themes: { value: Theme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'solarized-light', label: 'Solarized Light' },
    { value: 'solarized-dark', label: 'Solarized Dark' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
    >
      <div className="settings-panel bg-panel text-panel-text rounded-lg shadow-xl w-[480px] max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-xl leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          {/* Theme */}
          <div className="setting-row">
            <label className="setting-label">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as Theme })}
              className="setting-select"
            >
              {themes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Font Family */}
          <div className="setting-row">
            <label className="setting-label">Font Family</label>
            <input
              type="text"
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="setting-input"
            />
          </div>

          {/* Font Size */}
          <div className="setting-row">
            <label className="setting-label">Font Size (px)</label>
            <input
              type="number"
              min={8}
              max={32}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="setting-input w-20"
            />
          </div>

          {/* Line Height */}
          <div className="setting-row">
            <label className="setting-label">Line Height</label>
            <input
              type="number"
              min={1}
              max={3}
              step={0.1}
              value={settings.lineHeight}
              onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
              className="setting-input w-20"
            />
          </div>

          {/* Toggles */}
          {(
            [
              ['wordWrap', 'Word Wrap'],
              ['scrollSync', 'Scroll Sync'],
              ['showLineNumbers', 'Show Line Numbers'],
              ['autoSave', 'Auto Save'],
              ['spellCheck', 'Spell Check'],
            ] as [keyof typeof settings, string][]
          ).map(([key, label]) => (
            <div key={key} className="setting-row">
              <label className="setting-label">{label}</label>
              <input
                type="checkbox"
                checked={settings[key] as boolean}
                onChange={(e) => updateSettings({ [key]: e.target.checked })}
                className="w-4 h-4"
              />
            </div>
          ))}

          {/* Auto Save Interval */}
          {settings.autoSave && (
            <div className="setting-row">
              <label className="setting-label">Auto Save Interval (s)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={settings.autoSaveInterval}
                onChange={(e) => updateSettings({ autoSaveInterval: Number(e.target.value) })}
                className="setting-input w-20"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowSettings(false)}
            className="px-4 py-2 rounded bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
