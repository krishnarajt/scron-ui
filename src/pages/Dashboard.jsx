import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobs } from '../lib/api';
import JobForm from '../components/JobForm';
import {
  Plus, Play, Pause, Clock, ChevronRight,
  RefreshCw, Loader2, AlertCircle, CheckCircle2, Zap,
} from 'lucide-react';

// Lazy-load cronstrue for human-readable cron descriptions
let cronstrue = null;
import('cronstrue').then((m) => { cronstrue = m.default; }).catch(() => {});

function cronToHuman(expr) {
  if (!cronstrue) return expr;
  try { return cronstrue.toString(expr, { use24HourTimeFormat: true }); }
  catch { return expr; }
}

export default function Dashboard() {
  const [jobList, setJobList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [triggeringId, setTriggeringId] = useState(null);
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    try {
      const data = await jobs.list();
      setJobList(data.jobs);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleTrigger = async (e, jobId) => {
    e.stopPropagation();
    setTriggeringId(jobId);
    try {
      await jobs.trigger(jobId);
    } catch (err) {
      console.error('Failed to trigger job', err);
    } finally {
      setTimeout(() => setTriggeringId(null), 1500);
    }
  };

  const handleCreated = () => {
    setShowCreate(false);
    fetchJobs();
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-txt-muted mt-1">
            {total} job{total !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            className="p-2 rounded-lg text-txt-muted hover:text-txt hover:bg-surface-3 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-surface-0 text-sm font-semibold hover:bg-accent-bright transition-all duration-200"
          >
            <Plus size={16} />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {jobList.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Clock size={40} className="mx-auto text-txt-dim mb-4" />
          <h3 className="text-lg font-medium mb-2">No jobs yet</h3>
          <p className="text-sm text-txt-muted mb-6">Create your first scheduled job to get started.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-surface-0 text-sm font-semibold hover:bg-accent-bright transition-all"
          >
            <Plus size={16} />
            <span>Create Job</span>
          </button>
        </div>
      )}

      {/* Job list */}
      <div className="stagger space-y-2">
        {jobList.map((job) => (
          <div
            key={job.id}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="group flex items-center gap-4 px-4 py-3.5 rounded-xl bg-surface-1 border border-border hover:border-border-hover cursor-pointer transition-all duration-200"
          >
            {/* Status dot */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${job.is_active ? 'bg-accent animate-pulse-glow' : 'bg-txt-dim'}`} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{job.name}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-surface-3 text-txt-muted flex-shrink-0">
                  {job.script_type}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono text-txt-muted">{job.cron_expression}</span>
                <span className="text-xs text-txt-dim hidden sm:inline">— {cronToHuman(job.cron_expression)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => handleTrigger(e, job.id)}
                disabled={triggeringId === job.id}
                className="p-2 rounded-lg text-txt-muted hover:text-accent hover:bg-accent/10 transition-all"
                title="Run now"
              >
                {triggeringId === job.id ? (
                  <CheckCircle2 size={15} className="text-accent" />
                ) : (
                  <Zap size={15} />
                )}
              </button>
              <ChevronRight size={16} className="text-txt-dim group-hover:text-txt-muted transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <JobForm onClose={() => setShowCreate(false)} onSaved={handleCreated} />
      )}
    </div>
  );
}
