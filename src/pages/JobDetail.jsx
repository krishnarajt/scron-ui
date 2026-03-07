import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobs } from '../lib/api';
import JobForm from '../components/JobForm';
import EnvVarsEditor from '../components/EnvVarsEditor';
import ExecutionHistory from '../components/ExecutionHistory';
import CodeEditor from '../components/CodeEditor';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Pencil, Trash2, Zap, CheckCircle2,
  Code2, KeyRound, History, Play, Pause, AlertTriangle,
} from 'lucide-react';

const TABS = [
  { id: 'script', label: 'Script', icon: Code2 },
  { id: 'env', label: 'Variables', icon: KeyRound },
  { id: 'history', label: 'History', icon: History },
];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('script');
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const data = await jobs.get(id);
      setJob(data);
    } catch (err) {
      console.error('Failed to load job', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await jobs.trigger(id);
      toast.success('Job triggered successfully');
    } catch (err) {
      toast.error('Failed to trigger job');
      console.error(err);
    } finally {
      setTimeout(() => setTriggering(false), 1500);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await jobs.delete(id);
      toast.success('Job deleted');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete job');
      console.error(err);
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const updated = await jobs.update(id, { is_active: !job.is_active });
      setJob(updated);
      toast.success(updated.is_active ? 'Job activated' : 'Job paused');
    } catch (err) {
      toast.error('Failed to update job');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm mb-6 transition-all duration-200 group"
        style={{ color: 'var(--txt-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--txt)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt-muted)'}
      >
        <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Back to jobs</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{job.name}</h1>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold uppercase"
                  style={{ background: 'var(--surface-3)', color: 'var(--txt-muted)' }}>
              {job.script_type}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    background: job.is_active ? 'var(--accent-glow)' : 'var(--surface-3)',
                    color: job.is_active ? 'var(--accent)' : 'var(--txt-dim)',
                    boxShadow: job.is_active ? '0 0 10px var(--accent-glow)' : 'none',
                  }}>
              {job.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          {job.description && (
            <p className="text-sm" style={{ color: 'var(--txt-muted)' }}>{job.description}</p>
          )}
          <p className="text-xs font-mono mt-1.5" style={{ color: 'var(--txt-dim)' }}>
            {job.cron_expression}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle active */}
          <button
            onClick={handleToggleActive}
            className="p-2.5 rounded-xl transition-all duration-200"
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
            title={job.is_active ? 'Pause job' : 'Activate job'}
          >
            {job.is_active ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Trigger */}
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            style={{
              color: 'var(--accent)',
              background: 'var(--accent-glow)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            {triggering ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            <span>Run now</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => setShowEdit(true)}
            className="p-2.5 rounded-xl transition-all duration-200"
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
            title="Edit job"
          >
            <Pencil size={16} />
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5"
            >
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200"
                style={{ background: '#ef4444' }}
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost !text-xs"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--txt-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--txt-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Delete job"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-300 -mb-px relative ${
              tab === tabId ? 'tab-active' : ''
            }`}
            style={{
              color: tab === tabId ? 'var(--accent)' : 'var(--txt-muted)',
              borderBottom: tab === tabId ? 'none' : '2px solid transparent',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === 'script' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: 'var(--txt-dim)' }}>
                {job.script_type === 'python' ? 'Python script' : 'Bash script'}
              </span>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 text-xs font-semibold transition-colors duration-200"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-bright)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
              >
                <Pencil size={12} />
                Edit
              </button>
            </div>
            <CodeEditor
              value={job.script_content}
              language={job.script_type}
              readOnly={true}
              minHeight={200}
              maxHeight={600}
            />
          </div>
        )}

        {tab === 'env' && <EnvVarsEditor jobId={id} />}
        {tab === 'history' && <ExecutionHistory jobId={id} />}
      </motion.div>

      {/* Edit modal */}
      {showEdit && (
        <JobForm
          job={job}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchJob(); }}
        />
      )}
    </div>
  );
}
