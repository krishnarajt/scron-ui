import { useState, useEffect, useCallback } from 'react';
import { jobs } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, ChevronDown, Radio, StopCircle, RotateCcw } from 'lucide-react';

function formatDuration(seconds) {
  if (seconds == null) return '—';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: 'var(--accent)',
    bg: 'var(--accent-glow)',
    label: 'Success',
  },
  failure: {
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    label: 'Failed',
  },
  running: {
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'Running',
  },
};

export default function ExecutionHistory({ jobId, onOpenLiveLog }) {
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [replayingId, setReplayingId] = useState(null);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobs.getExecutions(jobId, 100);
      setExecutions(data.executions);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load executions', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchExecutions(); }, [fetchExecutions]);

  const handleCancel = async (e, execId) => {
    e.stopPropagation();
    setCancellingId(execId);
    try {
      const result = await jobs.cancel(jobId, execId);
      if (result.cancelled) {
        toast.success('Cancellation signal sent');
      } else {
        toast.error(result.message || 'Could not cancel');
      }
      // Refresh after a short delay to show updated status
      setTimeout(fetchExecutions, 1500);
    } catch (err) {
      toast.error('Failed to cancel execution');
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleReplay = async (e, execId) => {
    e.stopPropagation();
    setReplayingId(execId);
    try {
      await jobs.replay(jobId, execId);
      toast.success('Execution replayed');
      setTimeout(fetchExecutions, 1000);
    } catch (err) {
      toast.error('Failed to replay execution');
      console.error(err);
    } finally {
      setReplayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const hasDetail = (exec) => exec.log_output || exec.error_summary;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: 'var(--txt-muted)' }}>
          {total} execution{total !== 1 ? 's' : ''}
        </p>
        <button
          onClick={fetchExecutions}
          className="p-2.5 rounded-xl transition-all duration-200"
          style={{ color: 'var(--txt-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-muted)'; }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {executions.length === 0 ? (
        <div className="text-center py-14 text-sm border border-dashed rounded-2xl"
             style={{ color: 'var(--txt-dim)', borderColor: 'var(--border)' }}>
          <Clock size={32} className="mx-auto mb-3 opacity-30" />
          <p>No executions yet.</p>
          <p className="text-xs mt-1 opacity-60">This job hasn't run.</p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {executions.map((exec) => {
            const cfg = STATUS_CONFIG[exec.status] || STATUS_CONFIG.running;
            const Icon = cfg.icon;
            const isExpanded = expanded === exec.id;

            return (
              <div key={exec.id}>
                <div
                  onClick={() => hasDetail(exec) && setExpanded(isExpanded ? null : exec.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    hasDetail(exec) ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    if (hasDetail(exec)) {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Status icon */}
                  <div className="p-2 rounded-lg" style={{ background: cfg.bg }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      {exec.status === 'running' && onOpenLiveLog && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenLiveLog(exec.id); }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all duration-200"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          <Radio size={8} className="animate-pulse" />
                          live
                        </button>
                      )}
                      {exec.exit_code != null && exec.exit_code !== 0 && (
                        <span className="text-xs font-mono" style={{ color: 'var(--txt-dim)' }}>
                          exit {exec.exit_code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--txt-dim)' }}>
                      {formatTime(exec.started_at)}
                    </p>
                  </div>

                  {/* Duration + actions + expand indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono" style={{ color: 'var(--txt-muted)' }}>
                      {formatDuration(exec.duration_seconds)}
                    </span>

                    {/* Cancel button — only for running executions */}
                    {exec.status === 'running' && (
                      <button
                        onClick={(e) => handleCancel(e, exec.id)}
                        disabled={cancellingId === exec.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase transition-all duration-200"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        title="Cancel execution"
                      >
                        {cancellingId === exec.id ? <Loader2 size={10} className="animate-spin" /> : <StopCircle size={10} />}
                        Cancel
                      </button>
                    )}

                    {/* Replay button — only for completed executions (success or failure) */}
                    {(exec.status === 'success' || exec.status === 'failure') && (
                      <button
                        onClick={(e) => handleReplay(e, exec.id)}
                        disabled={replayingId === exec.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase transition-all duration-200"
                        style={{
                          background: 'var(--accent-glow)',
                          color: 'var(--accent)',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-glow)'}
                        title="Replay this execution with its exact script version"
                      >
                        {replayingId === exec.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                        Replay
                      </button>
                    )}
                    {hasDetail(exec) && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={14} style={{ color: 'var(--txt-dim)' }} />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="ml-10 mt-1 mb-2 space-y-2 overflow-hidden"
                    >
                      {/* Log output */}
                      {exec.log_output && (
                        <div className="px-4 py-3 rounded-xl"
                             style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileText size={12} style={{ color: 'var(--accent)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Output log</span>
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed max-h-80 overflow-y-auto"
                               style={{ color: 'var(--txt-muted)' }}>
                            {exec.log_output}
                          </pre>
                        </div>
                      )}

                      {/* Error summary */}
                      {exec.error_summary && (
                        <div className="px-4 py-3 rounded-xl"
                             style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={12} style={{ color: '#ef4444' }} />
                            <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Error summary</span>
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed"
                               style={{ color: 'rgba(239,68,68,0.8)' }}>
                            {exec.error_summary}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
