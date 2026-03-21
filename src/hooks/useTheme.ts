import { useEffect } from 'react';
import { useAppStore, Theme } from '../store/appStore';

export function useTheme() {
  const { settings, updateSettings } = useAppStore();

  const resolvedTheme = (): 'light' | 'dark' | 'solarized-light' | 'solarized-dark' => {
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme as 'light' | 'dark' | 'solarized-light' | 'solarized-dark';
  };

  useEffect(() => {
    const root = document.documentElement;
    const theme = resolvedTheme();
    root.setAttribute('data-theme', theme);

    // Update class for dark mode detection
    if (theme === 'dark' || theme === 'solarized-dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') {
        const root = document.documentElement;
        const theme = resolvedTheme();
        root.setAttribute('data-theme', theme);
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme]);

  const setTheme = (theme: Theme) => updateSettings({ theme });

  return { theme: settings.theme, resolvedTheme, setTheme };
}
