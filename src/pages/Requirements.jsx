import { useState, useEffect, useCallback } from 'react';
import { jobs } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CodeEditor from '../components/CodeEditor';
import { Save, Loader2, Package, CheckCircle2, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export default function Requirements() {
  const [content, setContent] = useState('');
  const [installOutput, setInstallOutput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showOutput, setShowOutput] = useState(false);

  const fetchReqs = useCallback(async () => {
    try {
      const data = await jobs.getRequirements();
      setContent(data.content || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReqs(); }, [fetchReqs]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setInstallOutput(null);
    try {
      const data = await jobs.updateRequirements(content);
      toast.success('Requirements saved and installed');
      if (data.last_install_output) {
        setInstallOutput(data.last_install_output);
        setShowOutput(true);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="gradient-text">Requirements</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--txt-muted)' }}>
            Shared Python packages for all jobs
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
        >
          {error}
        </motion.div>
      )}

      {/* Info box */}
      <div className="mb-5 px-5 py-4 rounded-2xl"
           style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'var(--accent-glow)' }}>
            <Package size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="text-sm leading-relaxed" style={{ color: 'var(--txt-muted)' }}>
            <p>
              Edit the{' '}
              <code className="font-mono text-xs px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--surface-3)', color: 'var(--accent)' }}>
                requirements.txt
              </code>{' '}
              below. When you save,{' '}
              <code className="font-mono text-xs px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--surface-3)', color: 'var(--accent)' }}>
                pip install -r requirements.txt
              </code>{' '}
              runs on the server. All jobs share this package environment.
            </p>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <CodeEditor
        value={content}
        onChange={setContent}
        language="python"
        placeholder={"# Add Python packages, one per line\nrequests\npandas\nbeautifulsoup4"}
        minHeight={300}
        maxHeight={500}
      />

      {/* Save button */}
      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? 'Installing…' : 'Save & Install'}</span>
        </button>
      </div>

      {/* Pip output */}
      <AnimatePresence>
        {installOutput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <button
              onClick={() => setShowOutput(!showOutput)}
              className="flex items-center gap-2 text-sm font-semibold mb-3 transition-colors duration-200"
              style={{ color: 'var(--txt-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--txt)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt-muted)'}
            >
              <Terminal size={14} style={{ color: 'var(--accent)' }} />
              <span>pip install output</span>
              {showOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showOutput && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-4 rounded-2xl font-mono text-xs whitespace-pre-wrap break-all leading-relaxed max-h-64 overflow-y-auto"
                  style={{
                    background: 'var(--surface-0)',
                    border: '1px solid var(--border)',
                    color: 'var(--txt-muted)',
                  }}
                >
                  {installOutput}
                </motion.pre>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
