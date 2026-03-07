import { useState, useEffect, useCallback } from 'react';
import { jobs } from '../lib/api';
import { Plus, Trash2, Save, Loader2, Eye, EyeOff } from 'lucide-react';

export default function EnvVarsEditor({ jobId }) {
  const [envVars, setEnvVars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
    try {
      // Filter out empty keys
      const valid = envVars.filter((ev) => ev.key.trim());
      await jobs.setEnvBulk(
        jobId,
        valid.map((ev) => ({ var_key: ev.key.trim(), var_value: ev.value }))
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchEnv();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-accent" /></div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent">Environment variables saved</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-txt-muted">{envVars.length} variable{envVars.length !== 1 ? 's' : ''}</p>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent/10 transition-all"
        >
          <Plus size={14} />
          Add variable
        </button>
      </div>

      {/* Rows */}
      {envVars.length === 0 ? (
        <div className="text-center py-10 text-sm text-txt-dim border border-dashed border-border rounded-xl">
          No environment variables set. Click "Add variable" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {envVars.map((ev, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
              {/* Key */}
              <input
                type="text"
                value={ev.key}
                onChange={(e) => updateRow(idx, 'key', e.target.value)}
                placeholder="VARIABLE_NAME"
                spellCheck={false}
                className="w-48 flex-shrink-0 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm font-mono text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
              />
              <span className="text-txt-dim">=</span>
              {/* Value */}
              <div className="relative flex-1">
                <input
                  type={visibleKeys.has(idx) ? 'text' : 'password'}
                  value={ev.value}
                  onChange={(e) => updateRow(idx, 'value', e.target.value)}
                  placeholder="value"
                  spellCheck={false}
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-surface-2 border border-border text-sm font-mono text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => toggleVisible(idx)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-dim hover:text-txt-muted transition-colors"
                >
                  {visibleKeys.has(idx) ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Delete */}
              <button
                onClick={() => removeRow(idx)}
                className="p-2 rounded-lg text-txt-dim hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save */}
      {envVars.length > 0 && (
        <div className="flex justify-end mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-surface-0 text-sm font-semibold hover:bg-accent-bright disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save All</span>
          </button>
        </div>
      )}
    </div>
  );
}
