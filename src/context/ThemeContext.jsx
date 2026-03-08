import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Theme definitions ──────────────────────────────────────────
// 'mode' marks which system preference each theme maps to.
// 'auto' resolves to 'emerald' (dark) or 'arctic' (light) based on OS pref.
export const THEMES = [
  { id: 'auto',    name: 'System Auto',   emoji: '🖥️', accent: '#888888', mode: 'auto' },
  { id: 'emerald', name: 'Emerald Night', emoji: '🌿', accent: '#22d3a7', mode: 'dark' },
  { id: 'cyber',   name: 'Cyber Violet',  emoji: '🔮', accent: '#c084fc', mode: 'dark' },
  { id: 'ocean',   name: 'Ocean Depth',   emoji: '🌊', accent: '#38bdf8', mode: 'dark' },
  { id: 'solar',   name: 'Solar Flare',   emoji: '☀️', accent: '#f59e0b', mode: 'dark' },
  { id: 'arctic',  name: 'Arctic Light',  emoji: '❄️', accent: '#0ea5e9', mode: 'light' },
  { id: 'rose',    name: 'Rosé Noir',     emoji: '🌹', accent: '#fb7185', mode: 'dark' },
];

// Which themes to use when 'auto' is selected
const AUTO_DARK  = 'emerald';
const AUTO_LIGHT = 'arctic';

const ThemeContext = createContext(null);

/**
 * Detect the OS color scheme preference.
 */
function getSystemPreference() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Resolve a theme id to an actual data-theme attribute value.
 * If 'auto', resolve based on system preference.
 */
function resolveTheme(themeId) {
  if (themeId === 'auto') {
    return getSystemPreference() === 'light' ? AUTO_LIGHT : AUTO_DARK;
  }
  return themeId;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('scron_theme') || 'auto';
  });

  // The actual applied theme (resolved from 'auto')
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(
    localStorage.getItem('scron_theme') || 'auto'
  ));

  const applyTheme = useCallback((themeId) => {
    const resolved = resolveTheme(themeId);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    // Update the theme-color meta tag for PWA/mobile browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    const themeObj = THEMES.find(t => t.id === resolved);
    if (meta && themeObj) {
      meta.setAttribute('content', themeObj.accent);
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('scron_theme', newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for OS color scheme changes (for auto mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const currentTheme = THEMES.find(t => t.id === resolvedTheme) || THEMES[1];

  return (
    <ThemeContext.Provider value={{
      theme,           // The user's selection ('auto', 'emerald', etc.)
      resolvedTheme,   // The actual applied theme ('emerald', 'arctic', etc.)
      setTheme,
      currentTheme,
      themes: THEMES,
      isAuto: theme === 'auto',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
