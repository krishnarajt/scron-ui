import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeSwitcher — A sleek dropdown for switching between visual themes.
 * Shows colored accent dots and theme names.
 * Supports a collapsed mode where only the icon is shown.
 *
 * Props:
 *   collapsed — boolean, when true renders as a centered icon button
 */
export default function ThemeSwitcher({ collapsed = false }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Switch theme"
        className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
          collapsed ? 'justify-center w-full py-2.5 px-0' : 'gap-2 px-3 py-2 w-full'
        }`}
        style={{ color: 'var(--txt-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Palette size={16} />
        {!collapsed && <span>Theme</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full mb-2 w-56 p-2 rounded-xl border shadow-2xl z-50"
            style={{
              left: collapsed ? '0' : '0',
              background: 'var(--surface-1)',
              borderColor: 'var(--border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest"
               style={{ color: 'var(--txt-dim)' }}>
              Choose theme
            </p>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                style={{
                  color: theme === t.id ? 'var(--accent)' : 'var(--txt-muted)',
                  background: theme === t.id ? 'var(--accent-glow)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (theme !== t.id) e.currentTarget.style.background = 'var(--surface-3)';
                }}
                onMouseLeave={(e) => {
                  if (theme !== t.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Accent color dot */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-200"
                  style={{
                    background: t.accent,
                    boxShadow: theme === t.id ? `0 0 12px ${t.accent}40` : 'none',
                  }}
                />
                <span className="flex-1 text-left">{t.name}</span>
                {theme === t.id && (
                  <Check size={14} style={{ color: 'var(--accent)' }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
