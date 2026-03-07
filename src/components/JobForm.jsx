import { useState, useEffect } from 'react';
import { jobs } from '../lib/api';
import { X, Loader2, Save, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeEditor from './CodeEditor';
import toast from 'react-hot-toast';

/**
 * Modal form for creating or editing a job.
 * Now features a full CodeMirror editor for the script field,
 * animated modal transitions, and glassmorphism styling.
 *
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
        toast.success('Job updated successfully');
      } else {
        await jobs.create({
          name, description, script_content: scriptContent,
          script_type: scriptType, cron_expression: cronExpression, is_active: isActive,
        });
        toast.success('Job created successfully');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Gradient top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
             style={{ background: 'linear-gradient(90deg, var(--gradient-1), var(--gradient-2), var(--gradient-3))' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 rounded-t-2xl"
             style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-glow)' }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Job' : 'Create New Job'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
            >
              {error}
            </motion.div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                   style={{ color: 'var(--txt-muted)' }}>
              Job name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="input-field"
              placeholder="e.g. Daily DB Backup"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                   style={{ color: 'var(--txt-muted)' }}>
              Description <span style={{ color: 'var(--txt-dim)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="What does this job do?"
            />
          </div>

          {/* Cron + Script type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                Cron expression
              </label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                required
                className="input-field font-mono"
                placeholder="*/5 * * * *"
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--txt-dim)' }}>
                min hour dom month dow
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                Script type
              </label>
              <div className="flex gap-2">
                {['python', 'bash'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setScriptType(t)}
                    className="flex-1 px-3 py-3 rounded-xl text-sm font-mono font-semibold transition-all duration-300"
                    style={{
                      border: `1px solid ${scriptType === t ? 'var(--accent)' : 'var(--border)'}`,
                      background: scriptType === t ? 'var(--accent-glow)' : 'var(--surface-2)',
                      color: scriptType === t ? 'var(--accent)' : 'var(--txt-muted)',
                      boxShadow: scriptType === t ? '0 0 15px var(--accent-glow)' : 'none',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Script content — FULL CODE EDITOR */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                   style={{ color: 'var(--txt-muted)' }}>
              Script
            </label>
            <CodeEditor
              value={scriptContent}
              onChange={setScriptContent}
              language={scriptType}
              placeholder={scriptType === 'python'
                ? 'import os\nprint("Hello from sCron")'
                : '#!/bin/bash\necho "Hello from sCron"'
              }
              minHeight={200}
              maxHeight={400}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="relative w-12 h-6 rounded-full transition-all duration-300"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, var(--accent), var(--accent-dim))'
                  : 'var(--surface-4)',
                boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-300"
                style={{ transform: isActive ? 'translateX(26px)' : 'translateX(4px)' }}
              />
            </button>
            <span className="text-sm" style={{ color: 'var(--txt-muted)' }}>
              {isActive ? 'Active — will run on schedule' : 'Paused — will not run'}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isEdit ? 'Save Changes' : 'Create Job'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
