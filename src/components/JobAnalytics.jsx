import { useState, useEffect, useCallback } from 'react';
import { analytics } from '../lib/api';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Loader2, CheckCircle2, XCircle, Timer, TrendingUp,
  Activity, Gauge, ArrowUp, ArrowDown, Minus, Clock,
} from 'lucide-react';

/**
 * Custom chart tooltip styled with theme CSS vars.
 */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs font-mono shadow-xl"
         style={{
           background: 'var(--surface-1)',
           border: '1px solid var(--border)',
           color: 'var(--txt)',
         }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--txt-muted)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: 'var(--txt-muted)' }}>{entry.name}:</span>
          <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  if (seconds == null || seconds === 0) return '0s';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatTimeShort(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}


/**
 * JobAnalytics — full analytics tab for a single job.
 * Shows stats cards, success/failure donut, duration trend,
 * and daily timeline.
 *
 * Props:
 *   jobId — the job's UUID
 */
export default function JobAnalytics({ jobId }) {
  const [stats, setStats] = useState(null);
  const [durationTrend, setDurationTrend] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [st, dur, tl] = await Promise.all([
        analytics.getJobStats(jobId),
        analytics.getJobDuration(jobId, 50),
        analytics.getJobTimeline(jobId, 14),
      ]);
      setStats(st);
      setDurationTrend(dur.map((d, i) => ({
        ...d,
        index: i + 1,
        label: formatTimeShort(d.started_at),
      })));
      setTimeline(tl);
    } catch (err) {
      console.error('Failed to load job analytics', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-14 text-sm" style={{ color: 'var(--txt-dim)' }}>
        No analytics data available for this job.
      </div>
    );
  }

  // Donut data for success/failure
  const donutData = [
    { name: 'Success', value: stats.success_count, color: 'var(--accent)' },
    { name: 'Failed', value: stats.failure_count, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Duration trend direction
  let durationDirection = 'stable';
  if (durationTrend.length >= 4) {
    const recentAvg = durationTrend.slice(-3).reduce((s, d) => s + d.duration_seconds, 0) / 3;
    const olderAvg = durationTrend.slice(0, 3).reduce((s, d) => s + d.duration_seconds, 0) / 3;
    if (recentAvg > olderAvg * 1.15) durationDirection = 'up';
    else if (recentAvg < olderAvg * 0.85) durationDirection = 'down';
  }

  const hasExecutions = stats.total_executions > 0;

  return (
    <div className="space-y-6">
      {/* ── Stats cards row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Runs',
            value: stats.total_executions,
            icon: Activity,
            color: 'var(--gradient-1)',
          },
          {
            label: 'Success Rate',
            value: `${stats.success_rate}%`,
            icon: Gauge,
            color: stats.success_rate >= 80 ? 'var(--accent)' : stats.success_rate >= 50 ? '#f59e0b' : '#ef4444',
          },
          {
            label: 'Avg Duration',
            value: formatDuration(stats.avg_duration_seconds),
            icon: Timer,
            color: 'var(--gradient-2)',
          },
          {
            label: 'Last Status',
            value: stats.last_status ? stats.last_status.charAt(0).toUpperCase() + stats.last_status.slice(1) : 'N/A',
            icon: stats.last_status === 'success' ? CheckCircle2 : stats.last_status === 'failure' ? XCircle : Clock,
            color: stats.last_status === 'success' ? 'var(--accent)' : stats.last_status === 'failure' ? '#ef4444' : 'var(--txt-dim)',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="stat-glow rounded-xl p-4 relative overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--txt-dim)' }}>{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg" style={{ background: `${stat.color}15` }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                 style={{ background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)` }} />
          </motion.div>
        ))}
      </div>

      {/* ── Charts row: Duration trend + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Duration trend (area chart) — 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold">Duration Trend</h3>
            {/* Direction indicator */}
            {durationTrend.length >= 4 && (
              <div className="flex items-center gap-1 ml-auto text-[10px] font-semibold"
                   style={{
                     color: durationDirection === 'up' ? '#ef4444' : durationDirection === 'down' ? 'var(--accent)' : 'var(--txt-dim)',
                   }}>
                {durationDirection === 'up' && <><ArrowUp size={11} /> Slowing</>}
                {durationDirection === 'down' && <><ArrowDown size={11} /> Faster</>}
                {durationDirection === 'stable' && <><Minus size={11} /> Stable</>}
              </div>
            )}
          </div>
          {durationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={durationTrend} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="index"
                  tick={{ fill: 'var(--txt-dim)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  label={{ value: 'Run #', position: 'insideBottomRight', offset: -5, style: { fill: 'var(--txt-dim)', fontSize: 9 } }}
                />
                <YAxis
                  tick={{ fill: 'var(--txt-dim)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}s`}
                />
                {stats.avg_duration_seconds > 0 && (
                  <ReferenceLine
                    y={stats.avg_duration_seconds}
                    stroke="var(--txt-dim)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="duration_seconds"
                  name="Duration (s)"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#gradDuration)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const color = payload.status === 'failure' ? '#ef4444' : 'var(--accent)';
                    return <circle cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
                  }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--accent)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm"
                 style={{ color: 'var(--txt-dim)' }}>
              No duration data yet
            </div>
          )}
          {/* Min / Max / Avg row */}
          {hasExecutions && (
            <div className="flex gap-6 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Min', value: formatDuration(stats.min_duration_seconds) },
                { label: 'Avg', value: formatDuration(stats.avg_duration_seconds) },
                { label: 'Max', value: formatDuration(stats.max_duration_seconds) },
              ].map((s) => (
                <div key={s.label} className="text-xs">
                  <span style={{ color: 'var(--txt-dim)' }}>{s.label}: </span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--txt-muted)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Success/Failure donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Gauge size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold">Success / Failure</h3>
          </div>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {stats.success_rate}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--txt-dim)' }}>
                    success
                  </span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-5 mt-3">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: 'var(--txt-muted)' }}>{d.name}</span>
                    <span className="font-semibold font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm"
                 style={{ color: 'var(--txt-dim)' }}>
              No data
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Daily timeline ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-xl p-5"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold">Daily Execution Count</h3>
          <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--txt-dim)' }}>Last 14 days</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradJobSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradJobFailure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fill: 'var(--txt-dim)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--txt-dim)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="success" name="Success" stroke="var(--accent)" strokeWidth={2} fill="url(#gradJobSuccess)" dot={false} />
            <Area type="monotone" dataKey="failure" name="Failed" stroke="#ef4444" strokeWidth={2} fill="url(#gradJobFailure)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
