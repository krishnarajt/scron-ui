import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, LogOut, Terminal, Sparkles } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import ParticleCanvas from './ParticleCanvas';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/requirements', icon: Package, label: 'Requirements' },
  ];

  return (
    <div className="noise-bg flex h-screen overflow-hidden relative">
      {/* Background particle animation */}
      <ParticleCanvas className="opacity-30" particleCount={35} maxDistance={100} />

      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col relative z-10"
        style={{
          background: 'rgba(from var(--surface-1) r g b / 0.7)',
          backdropFilter: 'blur(24px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow relative overflow-hidden"
              style={{ background: 'var(--accent-glow)' }}
            >
              <Terminal size={18} style={{ color: 'var(--accent)' }} className="relative z-10" />
              {/* Inner shimmer */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(135deg, transparent 40%, var(--accent) 50%, transparent 60%)`,
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text">sCron</h1>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em]"
                 style={{ color: 'var(--txt-dim)' }}>
                scheduler
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive ? 'active' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--txt-muted)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                boxShadow: isActive ? `0 0 20px var(--accent-glow)` : 'none',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
              {/* Active indicator glow */}
            </NavLink>
          ))}
        </nav>

        {/* Footer with theme switcher */}
        <div className="px-3 py-3 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <ThemeSwitcher />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200"
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--txt-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content with page transitions */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
