import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { Palette, Check, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeSwitcher — A sleek dropdown for switching between visual themes.
 * Shows colored accent dots and theme names. Includes "System Auto" option
 * that follows the OS light/dark preference.
 *
 * Props:
 *   collapsed — boolean, when true renders as a centered icon button
 */
export default function ThemeSwitcher({ collapsed = false }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
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
              left: '0',
              background: 'var(--surface-1)',
              borderColor: 'var(--border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest"
               style={{ color: 'var(--txt-dim)' }}>
              Choose theme
            </p>
            {THEMES.map((t) => {
              const isSelected = theme === t.id;
              const isAuto = t.id === 'auto';

              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                  style={{
                    color: isSelected ? 'var(--accent)' : 'var(--txt-muted)',
                    background: isSelected ? 'var(--accent-glow)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--surface-3)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {isAuto ? (
                    /* System Auto gets a monitor icon instead of a color dot */
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{
                           background: isSelected ? 'var(--accent-glow)' : 'var(--surface-3)',
                         }}>
                      <Monitor size={10} style={{
                        color: isSelected ? 'var(--accent)' : 'var(--txt-dim)',
                      }} />
                    </div>
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-200"
                      style={{
                        background: t.accent,
                        boxShadow: isSelected ? `0 0 12px ${t.accent}40` : 'none',
                      }}
                    />
                  )}
                  <div className="flex-1 text-left">
                    <span>{t.name}</span>
                    {isAuto && isSelected && (
                      <span className="block text-[10px] mt-0.5"
                            style={{ color: 'var(--txt-dim)' }}>
                        Using {resolvedTheme === 'arctic' ? 'light' : 'dark'}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={14} style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              );
            })}

            {/* Separator + mode labels */}
            <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex gap-3 px-3 py-1.5">
                <span className="text-[9px] font-medium uppercase tracking-wider"
                      style={{ color: 'var(--txt-dim)' }}>
                  Dark: Emerald, Cyber, Ocean, Solar, Rosé
                </span>
              </div>
              <div className="flex gap-3 px-3 pb-1">
                <span className="text-[9px] font-medium uppercase tracking-wider"
                      style={{ color: 'var(--txt-dim)' }}>
                  Light: Arctic
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
