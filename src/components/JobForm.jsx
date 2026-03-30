import { useState, useEffect } from 'react';
import { jobs, tags as tagsApi, templates as templatesApi } from '../lib/api';
import { X, Loader2, Save, Sparkles, HelpCircle, Clock, Tag, GitBranch, Timer, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeEditor from './CodeEditor';
import toast from 'react-hot-toast';

// ── Common cron presets ──────────────────────────────────────
const CRON_PRESETS = [
  { label: 'Every minute',     cron: '* * * * *' },
  { label: 'Every 5 minutes',  cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every hour',       cron: '0 * * * *' },
  { label: 'Every 6 hours',    cron: '0 */6 * * *' },
  { label: 'Daily at midnight',cron: '0 0 * * *' },
  { label: 'Daily at 9 AM',    cron: '0 9 * * *' },
  { label: 'Weekly (Mon 9 AM)',cron: '0 9 * * 1' },
  { label: 'Monthly (1st)',    cron: '0 0 1 * *' },
];

// ── Cron field breakdown ─────────────────────────────────────
const CRON_FIELDS = [
  { name: 'Minute',      range: '0–59',  symbols: '* , - /',  example: '*/5 = every 5 min' },
  { name: 'Hour',        range: '0–23',  symbols: '* , - /',  example: '9 = 9 AM' },
  { name: 'Day of Month',range: '1–31',  symbols: '* , - /',  example: '1 = first day' },
  { name: 'Month',       range: '1–12',  symbols: '* , - /',  example: '*/3 = quarterly' },
  { name: 'Day of Week', range: '0–6',   symbols: '* , - /',  example: '1 = Monday' },
];

/**
 * Modal form for creating or editing a job.
 * Features a full CodeMirror editor for the script field,
 * animated modal transitions, glassmorphism styling,
 * and a detailed cron expression helper.
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
  const [timeoutSeconds, setTimeoutSeconds] = useState(job?.timeout_seconds || 0);
  const [dependsOn, setDependsOn] = useState(job?.depends_on || []);
  const [tagIds, setTagIds] = useState(job?.tags?.map(t => t.id) || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCronHelp, setShowCronHelp] = useState(false);

  // Data for dependency & tag selectors
  const [allJobs, setAllJobs] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [templateList, setTemplateList] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch available jobs (for dependency picker), tags, and templates
  useEffect(() => {
    jobs.list().then(data => {
      // Filter out the current job when editing
      const filtered = (data.jobs || []).filter(j => j.id !== job?.id);
      setAllJobs(filtered);
    }).catch(() => {});
    tagsApi.list().then(data => {
      setAllTags(data.tags || []);
    }).catch(() => {});
    if (!isEdit) {
      templatesApi.list().then(data => {
        setTemplateList(data.templates || []);
      }).catch(() => {});
    }
  }, [job?.id, isEdit]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Apply a template
  const applyTemplate = (tmpl) => {
    setName(tmpl.name || '');
    setDescription(tmpl.description || '');
    setScriptContent(tmpl.script_content || '');
    setScriptType(tmpl.script_type || 'python');
    setCronExpression(tmpl.cron_expression || '');
    setShowTemplates(false);
    toast.success(`Template "${tmpl.name}" applied`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name, description, script_content: scriptContent,
        script_type: scriptType, cron_expression: cronExpression, is_active: isActive,
        timeout_seconds: timeoutSeconds,
        depends_on: dependsOn,
        tag_ids: tagIds,
      };
      if (isEdit) {
        await jobs.update(job.id, payload);
        toast.success('Job updated successfully');
      } else {
        await jobs.create(payload);
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

  // Split current cron for visual highlight
  const cronParts = cronExpression.trim().split(/\s+/);

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

          {/* Template picker — only for new jobs */}
          {!isEdit && templateList.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 text-xs font-semibold transition-colors duration-200 mb-2"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-bright)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
              >
                <FileCode size={13} />
                <span>{showTemplates ? 'Hide templates' : 'Start from a template'}</span>
              </button>
              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl"
                         style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                      {templateList.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => applyTemplate(tmpl)}
                          className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                          style={{ background: 'var(--surface-2)', color: 'var(--txt-muted)', border: '1px solid var(--border)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-medium uppercase tracking-wider"
                       style={{ color: 'var(--txt-muted)' }}>
                  Cron expression
                </label>
                <button
                  type="button"
                  onClick={() => setShowCronHelp(!showCronHelp)}
                  className="transition-colors duration-200"
                  style={{ color: showCronHelp ? 'var(--accent)' : 'var(--txt-dim)' }}
                  title="Cron syntax help"
                >
                  <HelpCircle size={13} />
                </button>
              </div>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                required
                className="input-field font-mono"
                placeholder="*/5 * * * *"
              />
              {/* Visual field breakdown */}
              {cronParts.length >= 5 && (
                <div className="flex gap-1 mt-2">
                  {CRON_FIELDS.slice(0, 5).map((field, i) => (
                    <div key={field.name} className="flex-1 text-center">
                      <div className="px-1 py-0.5 rounded text-[11px] font-mono font-medium"
                           style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        {cronParts[i] || '*'}
                      </div>
                      <p className="text-[9px] mt-0.5 truncate" style={{ color: 'var(--txt-dim)' }}>
                        {field.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {cronParts.length < 5 && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--txt-dim)' }}>
                  Format: min hour day month weekday
                </p>
              )}
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

          {/* ── Cron Help Panel ── */}
          <AnimatePresence>
            {showCronHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl p-4 space-y-4"
                     style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Cron Syntax Reference</span>
                  </div>

                  {/* Field explanations */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ color: 'var(--txt-dim)' }}>
                          <th className="text-left font-medium pb-1.5 pr-3">Field</th>
                          <th className="text-left font-medium pb-1.5 pr-3">Range</th>
                          <th className="text-left font-medium pb-1.5 pr-3">Special</th>
                          <th className="text-left font-medium pb-1.5">Example</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono" style={{ color: 'var(--txt-muted)' }}>
                        {CRON_FIELDS.map((f) => (
                          <tr key={f.name}>
                            <td className="py-1 pr-3 font-sans font-medium" style={{ color: 'var(--txt)' }}>{f.name}</td>
                            <td className="py-1 pr-3">{f.range}</td>
                            <td className="py-1 pr-3">{f.symbols}</td>
                            <td className="py-1" style={{ color: 'var(--accent)' }}>{f.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Symbol legend */}
                  <div className="text-[11px] leading-relaxed" style={{ color: 'var(--txt-dim)' }}>
                    <span style={{ color: 'var(--accent)' }}>*</span> = every &nbsp;
                    <span style={{ color: 'var(--accent)' }}>,</span> = multiple values &nbsp;
                    <span style={{ color: 'var(--accent)' }}>-</span> = range &nbsp;
                    <span style={{ color: 'var(--accent)' }}>/</span> = step
                  </div>

                  {/* Quick presets */}
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-2"
                       style={{ color: 'var(--txt-dim)' }}>
                      Quick presets
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CRON_PRESETS.map((p) => (
                        <button
                          key={p.cron}
                          type="button"
                          onClick={() => { setCronExpression(p.cron); setShowCronHelp(false); }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                          style={{
                            background: cronExpression === p.cron ? 'var(--accent-glow)' : 'var(--surface-2)',
                            color: cronExpression === p.cron ? 'var(--accent)' : 'var(--txt-muted)',
                            border: `1px solid ${cronExpression === p.cron ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                          onMouseEnter={(e) => {
                            if (cronExpression !== p.cron) e.currentTarget.style.borderColor = 'var(--border-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (cronExpression !== p.cron) e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Timeout */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                   style={{ color: 'var(--txt-muted)' }}>
              <span className="flex items-center gap-1.5">
                <Timer size={12} />
                Timeout <span style={{ color: 'var(--txt-dim)' }}>(seconds, 0 = default)</span>
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 0)}
              className="input-field"
              placeholder="3600"
            />
          </div>

          {/* Dependencies */}
          {allJobs.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <GitBranch size={12} />
                  Dependencies <span style={{ color: 'var(--txt-dim)' }}>(upstream jobs)</span>
                </span>
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl"
                   style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', minHeight: '42px' }}>
                {allJobs.map((j) => {
                  const selected = dependsOn.includes(j.id);
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => {
                        if (selected) setDependsOn(dependsOn.filter(d => d !== j.id));
                        else setDependsOn([...dependsOn, j.id]);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                      style={{
                        background: selected ? 'var(--accent-glow)' : 'var(--surface-2)',
                        color: selected ? 'var(--accent)' : 'var(--txt-muted)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      {j.name}
                    </button>
                  );
                })}
              </div>
              {dependsOn.length > 0 && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--txt-dim)' }}>
                  This job will only run after {dependsOn.length} upstream job{dependsOn.length !== 1 ? 's' : ''} succeed.
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <Tag size={12} />
                  Tags
                </span>
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl"
                   style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', minHeight: '42px' }}>
                {allTags.map((t) => {
                  const selected = tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (selected) setTagIds(tagIds.filter(id => id !== t.id));
                        else setTagIds([...tagIds, t.id]);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
                      style={{
                        background: selected ? `${t.color}22` : 'var(--surface-2)',
                        color: selected ? t.color : 'var(--txt-muted)',
                        border: `1px solid ${selected ? t.color : 'var(--border)'}`,
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
