import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Terminal, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState(null);
  const { signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await signup(username, password);
      navigate('/');
    } catch {
      // error is set in context
    }
  };

  const displayError = localError || error;

  return (
    <div className="noise-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background particle animation */}
      <ParticleCanvas className="opacity-40" particleCount={60} maxDistance={140} />

      {/* Floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
           style={{
             backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
             backgroundSize: '60px 60px',
           }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow relative overflow-hidden"
            style={{
              background: 'var(--accent-glow)',
              boxShadow: '0 0 40px var(--accent-glow)',
            }}
          >
            <Terminal size={24} style={{ color: 'var(--accent)' }} className="relative z-10" />
            <div className="absolute inset-0"
                 style={{
                   background: `linear-gradient(135deg, transparent 30%, var(--accent) 50%, transparent 70%)`,
                   backgroundSize: '200% 200%',
                   animation: 'shimmer 3s ease-in-out infinite',
                   opacity: 0.2,
                 }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">sCron</h1>
            <p className="text-xs font-mono uppercase tracking-[0.3em]"
               style={{ color: 'var(--txt-dim)' }}>
              job scheduler
            </p>
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(from var(--surface-1) r g b / 0.7)',
            backdropFilter: 'blur(24px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px var(--border)',
          }}
        >
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
               style={{ background: 'linear-gradient(90deg, transparent, var(--gradient-1), var(--gradient-2), var(--gradient-3), transparent)' }} />

          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="text-xl font-bold">Create account</h2>
          </div>
          <p className="text-sm mb-8" style={{ color: 'var(--txt-muted)' }}>Set up your sCron instance</p>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
              }}
            >
              {displayError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); setLocalError(null); }}
                required
                autoFocus
                className="input-field"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                required
                className="input-field"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setLocalError(null); }}
                required
                className="input-field"
                placeholder="Repeat password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-3 !text-base disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm mt-6"
          style={{ color: 'var(--txt-muted)' }}
        >
          Already have an account?{' '}
          <Link to="/login" className="font-semibold transition-colors duration-200"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-bright)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
          >
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
