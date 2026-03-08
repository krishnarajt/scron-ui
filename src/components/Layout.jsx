import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, LogOut, Terminal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import ParticleCanvas from './ParticleCanvas';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('scron_sidebar_collapsed') === 'true';
  });

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
    { to: '/requirements', icon: Package, label: 'Requirements' },
  ];

  return (
    <div className="noise-bg flex h-screen overflow-hidden relative">
      {/* Background particle animation */}
      <ParticleCanvas className="opacity-30" particleCount={35} maxDistance={100} />

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col relative z-10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: collapsed ? '68px' : '256px',
          background: 'rgba(from var(--surface-1) r g b / 0.7)',
          backdropFilter: 'blur(24px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo + collapse toggle */}
        <div className="px-3 py-4 border-b flex items-center" style={{ borderColor: 'var(--border)' }}>
          {collapsed ? (
            /* Collapsed: icon only */
            <div className="w-full flex justify-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow relative overflow-hidden cursor-pointer"
                style={{ background: 'var(--accent-glow)' }}
                onClick={toggleSidebar}
                title="Expand sidebar"
              >
                <Terminal size={18} style={{ color: 'var(--accent)' }} className="relative z-10" />
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `linear-gradient(135deg, transparent 40%, var(--accent) 50%, transparent 60%)`,
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          ) : (
            /* Expanded: logo + collapse button */
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow relative overflow-hidden flex-shrink-0"
                  style={{ background: 'var(--accent-glow)' }}
                >
                  <Terminal size={18} style={{ color: 'var(--accent)' }} className="relative z-10" />
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(135deg, transparent 40%, var(--accent) 50%, transparent 60%)`,
                      backgroundSize: '200% 200%',
                      animation: 'shimmer 3s ease-in-out infinite',
                    }}
                  />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold tracking-tight gradient-text whitespace-nowrap">sCron</h1>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] whitespace-nowrap"
                     style={{ color: 'var(--txt-dim)' }}>
                    scheduler
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
                style={{ color: 'var(--txt-dim)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-dim)'; e.currentTarget.style.background = 'transparent'; }}
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1.5">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `sidebar-link flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive ? 'active' : ''
                } ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--txt-muted)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                boxShadow: isActive ? '0 0 20px var(--accent-glow)' : 'none',
              })}
            >
              <Icon size={18} />
              {!collapsed && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer with theme switcher */}
        <div className="px-2 py-3 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
          {/* Theme switcher — icon-only when collapsed */}
          <ThemeSwitcher collapsed={collapsed} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center rounded-xl text-sm font-medium w-full transition-all duration-200 ${
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            }`}
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
            {!collapsed && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
          </button>

          {/* Expand button when collapsed */}
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-full py-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--txt-dim)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-dim)'; e.currentTarget.style.background = 'transparent'; }}
              title="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
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
