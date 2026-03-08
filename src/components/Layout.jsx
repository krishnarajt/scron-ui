import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, LogOut, Terminal,
  PanelLeftClose, PanelLeftOpen, Menu, X, Palette,
} from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import ParticleCanvas from './ParticleCanvas';

/**
 * Hook: returns true when viewport is below the given breakpoint.
 */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Desktop sidebar collapse state
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('scron_sidebar_collapsed') === 'true';
  });

  // Mobile: slide-out drawer open
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('scron_sidebar_collapsed', String(next));
  };

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/requirements', icon: Package, label: 'Packages' },
  ];

  // ── Shared sidebar inner content ──────────────────────────
  const SidebarContent = ({ isDrawer = false }) => {
    const showLabels = isDrawer || !collapsed;

    return (
      <>
        {/* Logo */}
        <div className="px-3 py-4 border-b flex items-center" style={{ borderColor: 'var(--border)' }}>
          {!showLabels ? (
            <div className="w-full flex justify-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow relative overflow-hidden cursor-pointer"
                style={{ background: 'var(--accent-glow)' }}
                onClick={toggleSidebar}
                title="Expand sidebar"
              >
                <Terminal size={18} style={{ color: 'var(--accent)' }} className="relative z-10" />
                <div className="absolute inset-0 opacity-30"
                     style={{ background: 'linear-gradient(135deg, transparent 40%, var(--accent) 50%, transparent 60%)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite' }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow relative overflow-hidden flex-shrink-0"
                     style={{ background: 'var(--accent-glow)' }}>
                  <Terminal size={18} style={{ color: 'var(--accent)' }} className="relative z-10" />
                  <div className="absolute inset-0 opacity-30"
                       style={{ background: 'linear-gradient(135deg, transparent 40%, var(--accent) 50%, transparent 60%)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite' }} />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold tracking-tight gradient-text whitespace-nowrap">sCron</h1>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] whitespace-nowrap"
                     style={{ color: 'var(--txt-dim)' }}>scheduler</p>
                </div>
              </div>
              {!isDrawer && (
                <button onClick={toggleSidebar}
                  className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
                  style={{ color: 'var(--txt-dim)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-dim)'; e.currentTarget.style.background = 'transparent'; }}>
                  <PanelLeftClose size={16} />
                </button>
              )}
              {isDrawer && (
                <button onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
                  style={{ color: 'var(--txt-dim)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-dim)'; e.currentTarget.style.background = 'transparent'; }}>
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1.5">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              title={!showLabels ? label : undefined}
              className={({ isActive }) =>
                `sidebar-link flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive ? 'active' : ''
                } ${!showLabels ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--txt-muted)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                boxShadow: isActive ? '0 0 20px var(--accent-glow)' : 'none',
              })}>
              <Icon size={18} />
              {showLabels && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <ThemeSwitcher collapsed={!showLabels} />

          <button onClick={handleLogout}
            title={!showLabels ? 'Logout' : undefined}
            className={`flex items-center rounded-xl text-sm font-medium w-full transition-all duration-200 ${
              !showLabels ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            }`}
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <LogOut size={16} />
            {showLabels && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
          </button>

          {!showLabels && (
            <button onClick={toggleSidebar}
              className="flex items-center justify-center w-full py-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--txt-dim)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-dim)'; e.currentTarget.style.background = 'transparent'; }}
              title="Expand sidebar">
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>
      </>
    );
  };

  // ── MOBILE LAYOUT ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="noise-bg flex flex-col h-screen overflow-hidden relative">
        <ParticleCanvas className="opacity-20" particleCount={20} maxDistance={80} />

        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 relative z-10"
                style={{
                  background: 'rgba(from var(--surface-1) r g b / 0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderBottom: '1px solid var(--border)',
                }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--accent-glow)' }}>
              <Terminal size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-base font-bold gradient-text">sCron</span>
          </div>
          <button onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: 'var(--txt-muted)' }}>
            <Menu size={20} />
          </button>
        </header>

        {/* Mobile drawer overlay */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 modal-backdrop"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 bottom-0 w-72 z-50 flex flex-col"
                style={{
                  background: 'var(--surface-1)',
                  borderLeft: '1px solid var(--border)',
                  boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                }}
              >
                <SidebarContent isDrawer={true} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="px-4 py-5 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom navigation bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around"
             style={{
               background: 'rgba(from var(--surface-1) r g b / 0.9)',
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
               borderTop: '1px solid var(--border)',
               paddingBottom: 'env(safe-area-inset-bottom, 8px)',
             }}>
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className="flex flex-col items-center gap-1 py-2.5 px-4 transition-all duration-200"
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--txt-dim)',
              })}>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} />
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                           style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* Settings/drawer trigger in bottom nav */}
          <button onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 px-4 transition-all duration-200"
            style={{ color: 'var(--txt-dim)' }}>
            <Palette size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────
  return (
    <div className="noise-bg flex h-screen overflow-hidden relative">
      <ParticleCanvas className="opacity-30" particleCount={35} maxDistance={100} />

      {/* Desktop sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col relative z-10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: collapsed ? '68px' : '256px',
          background: 'rgba(from var(--surface-1) r g b / 0.7)',
          backdropFilter: 'blur(24px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
          borderRight: '1px solid var(--border)',
        }}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
