import { useState, useEffect } from 'react';
import { jobs } from '../lib/api';
import { X, Loader2, Save } from 'lucide-react';

/**
 * Modal form for creating or editing a job.
 * Props:
 *   job      — existing job object (null for create)
 *   onClose  — close the modal
 *   onSaved  — callback after successful save
 */
export default function JobForm({ job = null, onClose, onSaved }) {
  const isEdit = !!job;

  const [name, setName] = useState(job?.name || '');
  const [description, setDescription] = useState(job?.description || '');
  const [scriptContent, setScriptContent] = useState(job?.script_content || '');
  const [scriptType, setScriptType] = useState(job?.script_type || 'python');
  const [cronExpression, setCronExpression] = useState(job?.cron_expression || '');
  const [isActive, setIsActive] = useState(job?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await jobs.update(job.id, {
          name, description, script_content: scriptContent,
          script_type: scriptType, cron_expression: cronExpression, is_active: isActive,
        });
      } else {
        await jobs.create({
          name, description, script_content: scriptContent,
          script_type: scriptType, cron_expression: cronExpression, is_active: isActive,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-1 border border-border rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface-1 z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Job' : 'Create New Job'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-txt-muted hover:text-txt hover:bg-surface-3 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Job name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
              placeholder="e.g. Daily DB Backup"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Description <span className="text-txt-dim">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
              placeholder="What does this job do?"
            />
          </div>

          {/* Cron + Script type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Cron expression</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm font-mono text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
                placeholder="*/5 * * * *"
              />
              <p className="text-[11px] text-txt-dim mt-1">min hour dom month dow</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Script type</label>
              <div className="flex gap-2">
                {['python', 'bash'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setScriptType(t)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-mono font-medium border transition-all ${
                      scriptType === t
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-surface-2 text-txt-muted hover:text-txt hover:border-border-hover'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Script content */}
          <div>
            <label className="block text-xs font-medium text-txt-muted mb-1.5 uppercase tracking-wider">Script</label>
            <textarea
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              required
              rows={12}
              spellCheck={false}
              className="code-editor w-full px-4 py-3 rounded-lg bg-surface-0 border border-border text-sm font-mono text-txt placeholder-txt-dim focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none resize-y leading-relaxed"
              placeholder={scriptType === 'python' ? 'import os\nprint("Hello from sCron")' : '#!/bin/bash\necho "Hello from sCron"'}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isActive ? 'bg-accent' : 'bg-surface-4'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-txt-muted">{isActive ? 'Active — will run on schedule' : 'Paused — will not run'}</span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-txt-muted hover:text-txt hover:bg-surface-3 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-surface-0 text-sm font-semibold hover:bg-accent-bright disabled:opacity-50 transition-all duration-200"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isEdit ? 'Save Changes' : 'Create Job'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
