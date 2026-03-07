import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch {
      // error is set in context
    }
  };

  return (
    <div className="noise-bg min-h-screen flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in relative">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center animate-pulse-glow">
            <Terminal size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">sCron</h1>
            <p className="text-xs font-mono text-txt-dim uppercase tracking-widest">scheduler</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
          <p className="text-sm text-txt-muted mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                required
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-surface-0 text-sm font-semibold hover:bg-accent-bright disabled:opacity-50 transition-all duration-200"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign in</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-txt-muted mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-bright transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
