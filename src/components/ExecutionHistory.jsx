import { useState, useEffect, useCallback } from 'react';
import { jobs } from '../lib/api';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
  success: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', label: 'Success' },
  failure: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Failed' },
  running: { icon: Clock, color: 'text-warn', bg: 'bg-warn/10', label: 'Running' },
};

export default function ExecutionHistory({ jobId }) {
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-accent" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-txt-muted">{total} execution{total !== 1 ? 's' : ''}</p>
        <button
          onClick={fetchExecutions}
          className="p-2 rounded-lg text-txt-muted hover:text-txt hover:bg-surface-3 transition-all"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {executions.length === 0 ? (
        <div className="text-center py-10 text-sm text-txt-dim border border-dashed border-border rounded-xl">
          No executions yet. This job hasn't run.
        </div>
      ) : (
        <div className="space-y-1.5 stagger">
          {executions.map((exec) => {
            const cfg = STATUS_CONFIG[exec.status] || STATUS_CONFIG.running;
            const Icon = cfg.icon;
            const isExpanded = expanded === exec.id;

            return (
              <div key={exec.id}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : exec.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-border hover:border-border-hover cursor-pointer transition-all"
                >
                  {/* Status icon */}
                  <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                      {exec.exit_code != null && exec.exit_code !== 0 && (
                        <span className="text-xs font-mono text-txt-dim">exit {exec.exit_code}</span>
                      )}
                    </div>
                    <p className="text-xs text-txt-dim mt-0.5 font-mono">{formatTime(exec.started_at)}</p>
                  </div>

                  {/* Duration */}
                  <span className="text-xs font-mono text-txt-muted flex-shrink-0">
                    {formatDuration(exec.duration_seconds)}
                  </span>
                </div>

                {/* Expanded error detail */}
                {isExpanded && exec.error_summary && (
                  <div className="ml-10 mt-1 mb-2 px-4 py-3 rounded-lg bg-surface-0 border border-border">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={12} className="text-danger" />
                      <span className="text-xs font-medium text-danger">Error output</span>
                    </div>
                    <pre className="text-xs font-mono text-txt-muted whitespace-pre-wrap break-all leading-relaxed">
                      {exec.error_summary}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
