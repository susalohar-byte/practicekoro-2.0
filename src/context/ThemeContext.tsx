import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';
export type PlatformThemeMode = ThemeMode | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setPlatformDefault: (mode: PlatformThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'pk_theme';

function savedPreference(): ThemeMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}
function deviceTheme(): ThemeMode {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyToDocument(resolved: 'light' | 'dark', animate = false) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 320);
  }
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  // Keep the browser UI (mobile chrome bar, PWA shell) in sync
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = resolved === 'dark' ? '#0b1120' : '#4f46e5';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<ThemeMode | null>(savedPreference);
  const [platformDefault, setPlatformDefaultState] = useState<PlatformThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(deviceTheme);
  const theme: ThemeMode =
    preference ?? (platformDefault === 'system' ? systemTheme : platformDefault);
  const setPlatformDefault = useCallback((mode: PlatformThemeMode) => {
    if (['light', 'dark', 'system'].includes(mode)) setPlatformDefaultState(mode);
  }, []);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const changed = () => setSystemTheme(media.matches ? 'dark' : 'light');
    changed();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', changed);
      return () => media.removeEventListener('change', changed);
    }
    media.addListener?.(changed);
    return () => media.removeListener?.(changed);
  }, []);
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setPreference(savedPreference());
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  // Apply on every change (animated; first mount applies silently)
  const firstRun = React.useRef(true);
  useEffect(() => {
    applyToDocument(theme, !firstRun.current);
    firstRun.current = false;
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    if (mode !== 'light' && mode !== 'dark') return;
    setPreference(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore inaccessible storage
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme: theme, setTheme, toggleTheme, setPlatformDefault }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
