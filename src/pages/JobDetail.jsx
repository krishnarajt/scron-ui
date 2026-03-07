import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobs } from '../lib/api';
import JobForm from '../components/JobForm';
import EnvVarsEditor from '../components/EnvVarsEditor';
import ExecutionHistory from '../components/ExecutionHistory';
import {
  ArrowLeft, Loader2, Pencil, Trash2, Zap, CheckCircle2,
  Code2, KeyRound, History, Play, Pause,
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
    try { await jobs.trigger(id); }
    catch (err) { console.error(err); }
    finally { setTimeout(() => setTriggering(false), 1500); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await jobs.delete(id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const updated = await jobs.update(id, { is_active: !job.is_active });
      setJob(updated);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="animate-fade-in">
      {/* Back + header */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-txt-muted hover:text-txt mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to jobs</span>
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{job.name}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium uppercase bg-surface-3 text-txt-muted">
              {job.script_type}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${job.is_active ? 'bg-accent/10 text-accent' : 'bg-surface-3 text-txt-dim'}`}>
              {job.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          {job.description && <p className="text-sm text-txt-muted">{job.description}</p>}
          <p className="text-xs font-mono text-txt-dim mt-1">{job.cron_expression}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle active */}
          <button
            onClick={handleToggleActive}
            className="p-2 rounded-lg text-txt-muted hover:text-txt hover:bg-surface-3 transition-all"
            title={job.is_active ? 'Pause job' : 'Activate job'}
          >
            {job.is_active ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Trigger */}
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all"
          >
            {triggering ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            <span>Run now</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => setShowEdit(true)}
            className="p-2 rounded-lg text-txt-muted hover:text-txt hover:bg-surface-3 transition-all"
            title="Edit job"
          >
            <Pencil size={16} />
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger text-white hover:bg-red-600 transition-all"
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-txt-muted hover:bg-surface-3 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Delete job"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              tab === tabId
                ? 'border-accent text-accent'
                : 'border-transparent text-txt-muted hover:text-txt hover:border-border-hover'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === 'script' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-txt-dim uppercase tracking-wider">
                {job.script_type === 'python' ? 'Python script' : 'Bash script'}
              </span>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-bright transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
            </div>
            <pre className="px-5 py-4 rounded-xl bg-surface-0 border border-border font-mono text-sm text-txt leading-relaxed overflow-x-auto whitespace-pre">
              {job.script_content}
            </pre>
          </div>
        )}

        {tab === 'env' && <EnvVarsEditor jobId={id} />}
        {tab === 'history' && <ExecutionHistory jobId={id} />}
      </div>

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
