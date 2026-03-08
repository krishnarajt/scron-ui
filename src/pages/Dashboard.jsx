import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobs } from '../lib/api';
import JobForm from '../components/JobForm';
import DashboardCharts from '../components/DashboardCharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus, Clock, ChevronRight,
  RefreshCw, Loader2, CheckCircle2, Zap,
  BarChart3, ChevronDown, ChevronUp, Copy,
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
      toast.success('Job triggered');
    } catch (err) {
      toast.error('Failed to trigger job');
      console.error('Failed to trigger job', err);
    } finally {
      setTimeout(() => setTriggeringId(null), 1500);
    }
  };

  const handleCreated = () => {
    setShowCreate(false);
    fetchJobs();
  };

  const handleDuplicate = async (e, jobId) => {
    e.stopPropagation();
    try {
      const newJob = await jobs.duplicate(jobId);
      toast.success(`Duplicated as "${newJob.name}"`);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to duplicate job');
      console.error(err);
    }
  };

  // Compute stats
  const activeCount = jobList.filter(j => j.is_active).length;
  const pausedCount = jobList.filter(j => !j.is_active).length;
  const [showCharts, setShowCharts] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--txt-dim)' }}>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--txt-muted)' }}>
            Manage your scheduled jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            className="p-2.5 rounded-xl transition-all duration-200"
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* ── Analytics Section ── */}
      {jobList.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-2 mb-4 text-sm font-semibold transition-colors duration-200"
            style={{ color: 'var(--txt-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--txt)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt-muted)'}
          >
            <BarChart3 size={15} style={{ color: 'var(--accent)' }} />
            <span>Analytics</span>
            {showCharts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showCharts && <DashboardCharts />}
        </div>
      )}

      {/* ── Jobs Section Header ── */}
      {jobList.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--txt-muted)' }}>
            {total} job{total !== 1 ? 's' : ''} configured
          </h2>
        </div>
      )}

      {/* Empty state */}
      {jobList.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 border border-dashed rounded-2xl"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center animate-float"
               style={{ background: 'var(--accent-glow)' }}>
            <Clock size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--txt-muted)' }}>
            Create your first scheduled job to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Job</span>
          </button>
        </motion.div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {jobList.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2), 0 0 20px var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Status dot */}
            <div className="relative flex-shrink-0">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: job.is_active ? 'var(--accent)' : 'var(--txt-dim)',
                  boxShadow: job.is_active ? '0 0 8px var(--accent-glow)' : 'none',
                }}
              />
              {job.is_active && (
                <div
                  className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                  style={{ background: 'var(--accent)', opacity: 0.3 }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-sm truncate">{job.name}</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase flex-shrink-0"
                      style={{ background: 'var(--surface-3)', color: 'var(--txt-muted)' }}>
                  {job.script_type}
                </span>
                {!job.is_active && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase flex-shrink-0"
                        style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    paused
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono" style={{ color: 'var(--txt-muted)' }}>
                  {job.cron_expression}
                </span>
                <span className="text-xs hidden sm:inline" style={{ color: 'var(--txt-dim)' }}>
                  — {cronToHuman(job.cron_expression)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={(e) => handleTrigger(e, job.id)}
                disabled={triggeringId === job.id}
                className="p-2.5 rounded-xl transition-all duration-200"
                style={{ color: 'var(--txt-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--txt-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Run now"
              >
                {triggeringId === job.id ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
                ) : (
                  <Zap size={16} />
                )}
              </button>
              <button
                onClick={(e) => handleDuplicate(e, job.id)}
                className="p-2.5 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--txt-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--txt-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Duplicate job"
              >
                <Copy size={14} />
              </button>
              <ChevronRight
                size={16}
                className="transition-all duration-200"
                style={{ color: 'var(--txt-dim)' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <JobForm onClose={() => setShowCreate(false)} onSaved={handleCreated} />
      )}
    </div>
  );
}
