import { useState, useEffect } from 'react';
import { jobs } from '../lib/api';
import { Clock, CalendarClock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Format an ISO datetime to a nice readable string with relative time.
 */
function formatRun(isoStr) {
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = d - now;
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);

  let relative;
  if (diffMin < 1) relative = 'now';
  else if (diffMin < 60) relative = `in ${diffMin}m`;
  else if (diffHr < 24) relative = `in ${diffHr}h`;
  else relative = `in ${Math.round(diffHr / 24)}d`;

  const time = d.toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return { time, relative };
}

/**
 * NextRuns — Shows the next N scheduled execution times for a job.
 *
 * Props:
 *   jobId — the job's UUID
 *   cronExpression — for display purposes
 */
export default function NextRuns({ jobId, cronExpression }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await jobs.getNextRuns(jobId, 5);
        setRuns(data.next_runs || []);
      } catch (err) {
        console.error('Failed to load next runs', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 size={12} className="animate-spin" style={{ color: 'var(--txt-dim)' }} />
        <span className="text-xs" style={{ color: 'var(--txt-dim)' }}>Loading schedule...</span>
      </div>
    );
  }

  if (runs.length === 0) return null;

  return (
    <div className="rounded-xl p-4 mt-4"
         style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock size={14} style={{ color: 'var(--accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          Next Scheduled Runs
        </span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--txt-dim)' }}>
          {cronExpression}
        </span>
      </div>
      <div className="space-y-1.5">
        {runs.map((run, i) => {
          const { time, relative } = formatRun(run);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="flex items-center gap-3 py-1.5"
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: '12px' }}>
                <div className="w-2 h-2 rounded-full"
                     style={{
                       background: i === 0 ? 'var(--accent)' : 'var(--txt-dim)',
                       boxShadow: i === 0 ? '0 0 6px var(--accent-glow)' : 'none',
                     }}
                />
                {i < runs.length - 1 && (
                  <div className="w-px flex-1 mt-1"
                       style={{ background: 'var(--border)', minHeight: '12px' }} />
                )}
              </div>

              {/* Time info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Clock size={11} style={{ color: 'var(--txt-dim)' }} />
                <span className="text-xs font-mono" style={{ color: i === 0 ? 'var(--txt)' : 'var(--txt-muted)' }}>
                  {time}
                </span>
              </div>
              <span className="text-[11px] font-semibold flex-shrink-0"
                    style={{ color: i === 0 ? 'var(--accent)' : 'var(--txt-dim)' }}>
                {relative}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
