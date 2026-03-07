import { useState, useEffect, useCallback } from 'react';
import { jobs } from '../lib/api';
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function EnvVarsEditor({ jobId }) {
  const [envVars, setEnvVars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState(new Set());

  const fetchEnv = useCallback(async () => {
    try {
      const data = await jobs.getEnv(jobId);
      setEnvVars(data.env_vars.map((ev) => ({ key: ev.var_key, value: ev.var_value, saved: true })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchEnv(); }, [fetchEnv]);

  const addRow = () => {
    setEnvVars([...envVars, { key: '', value: '', saved: false }]);
  };

  const removeRow = (idx) => {
    setEnvVars(envVars.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, field, val) => {
    setEnvVars(envVars.map((ev, i) => (i === idx ? { ...ev, [field]: val, saved: false } : ev)));
  };

  const toggleVisible = (key) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const valid = envVars.filter((ev) => ev.key.trim());
      await jobs.setEnvBulk(
        jobId,
        valid.map((ev) => ({ var_key: ev.key.trim(), var_value: ev.value }))
      );
      toast.success('Environment variables saved');
      fetchEnv();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3 py-2.5 rounded-lg text-sm"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
        >
          {error}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--txt-muted)' }}>
          {envVars.length} variable{envVars.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-glow)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Plus size={14} />
          Add variable
        </button>
      </div>

      {/* Rows */}
      {envVars.length === 0 ? (
        <div className="text-center py-10 text-sm border border-dashed rounded-xl"
             style={{ color: 'var(--txt-dim)', borderColor: 'var(--border)' }}>
          <KeyRound size={28} className="mx-auto mb-3 opacity-30" />
          <p>No environment variables set.</p>
          <p className="text-xs mt-1 opacity-60">Click "Add variable" to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {envVars.map((ev, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 group"
              >
                {/* Key */}
                <input
                  type="text"
                  value={ev.key}
                  onChange={(e) => updateRow(idx, 'key', e.target.value)}
                  placeholder="VARIABLE_NAME"
                  spellCheck={false}
                  className="w-48 flex-shrink-0 px-3 py-2 rounded-lg text-sm font-mono transition-all duration-200 outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--txt)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-glow)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <span className="font-mono text-sm flex-shrink-0" style={{ color: 'var(--txt-dim)' }}>=</span>
                {/* Value */}
                <div className="relative flex-1 min-w-0">
                  <input
                    type={visibleKeys.has(idx) ? 'text' : 'password'}
                    value={ev.value}
                    onChange={(e) => updateRow(idx, 'value', e.target.value)}
                    placeholder="value"
                    spellCheck={false}
                    className="w-full px-3 py-2 pr-9 rounded-lg text-sm font-mono transition-all duration-200 outline-none"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--txt)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-glow)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisible(idx)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: 'var(--txt-dim)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--txt-muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt-dim)'}
                  >
                    {visibleKeys.has(idx) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Delete */}
                <button
                  onClick={() => removeRow(idx)}
                  className="p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  style={{ color: 'var(--txt-dim)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--txt-dim)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Save */}
      {envVars.length > 0 && (
        <div className="flex justify-end mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save All</span>
          </button>
        </div>
      )}
    </div>
  );
}
