import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Theme definitions ──────────────────────────────────────────
export const THEMES = [
  { id: 'emerald', name: 'Emerald Night', emoji: '🌿', accent: '#22d3a7' },
  { id: 'cyber',   name: 'Cyber Violet',  emoji: '🔮', accent: '#c084fc' },
  { id: 'ocean',   name: 'Ocean Depth',   emoji: '🌊', accent: '#38bdf8' },
  { id: 'solar',   name: 'Solar Flare',   emoji: '☀️', accent: '#f59e0b' },
  { id: 'arctic',  name: 'Arctic Light',  emoji: '❄️', accent: '#0ea5e9' },
  { id: 'rose',    name: 'Rosé Noir',     emoji: '🌹', accent: '#fb7185' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('scron_theme') || 'emerald';
  });

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('scron_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
