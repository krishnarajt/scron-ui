import { useState, useEffect, useCallback } from 'react';
import { jobs } from '../lib/api';
import { Save, Loader2, Package, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Requirements() {
  const [content, setContent] = useState('');
  const [installOutput, setInstallOutput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
    setInstallOutput(null);
    try {
      const data = await jobs.updateRequirements(content);
      setSuccess(true);
      if (data.last_install_output) {
        setInstallOutput(data.last_install_output);
        setShowOutput(true);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requirements</h1>
          <p className="text-sm text-txt-muted mt-1">Shared Python packages for all jobs</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent flex items-center gap-2">
          <CheckCircle2 size={14} />
          Requirements saved and installed
        </div>
      )}

      {/* Info box */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-surface-1 border border-border">
        <div className="flex items-start gap-3">
          <Package size={16} className="text-accent mt-0.5 flex-shrink-0" />
          <div className="text-sm text-txt-muted leading-relaxed">
            <p>
              Edit the <code className="font-mono text-xs bg-surface-3 px-1.5 py-0.5 rounded">requirements.txt</code> below.
              When you save, <code className="font-mono text-xs bg-surface-3 px-1.5 py-0.5 rounded">pip install -r requirements.txt</code> runs
              on the server. All jobs share this package environment.
            </p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={16}
        spellCheck={false}
        className="code-editor w-full px-5 py-4 rounded-xl bg-surface-0 border border-border font-mono text-sm text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none resize-y leading-relaxed"
        placeholder={"# Add Python packages, one per line\nrequests\npandas\nbeautifulsoup4"}
      />

      {/* Save button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-surface-0 text-sm font-semibold hover:bg-accent-bright disabled:opacity-50 transition-all duration-200"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? 'Installing…' : 'Save & Install'}</span>
        </button>
      </div>

      {/* Pip output */}
      {installOutput && (
        <div className="mt-6">
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="flex items-center gap-2 text-sm font-medium text-txt-muted hover:text-txt transition-colors mb-2"
          >
            {showOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>pip install output</span>
          </button>
          {showOutput && (
            <pre className="px-4 py-3 rounded-xl bg-surface-0 border border-border font-mono text-xs text-txt-muted whitespace-pre-wrap break-all leading-relaxed max-h-64 overflow-y-auto">
              {installOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
