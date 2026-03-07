import { useState, useEffect } from 'react';
import { analytics } from '../lib/api';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { Loader2, TrendingUp, Clock, Activity, CheckCircle2, XCircle, Timer } from 'lucide-react';

/**
 * Custom tooltip that uses theme CSS vars for styling.
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
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Format date labels for X axis: "Mar 5"
 */
function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format seconds to human-readable duration.
 */
function formatDuration(seconds) {
  if (seconds == null || seconds === 0) return '0s';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}


// ── Donut chart colors ──────────────────────────────────────
const STATUS_COLORS = {
  success: 'var(--accent)',
  failure: '#ef4444',
  running: '#f59e0b',
};


export default function DashboardCharts() {
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [ov, tl, bd] = await Promise.all([
          analytics.getOverview(),
          analytics.getTimeline(14),
          analytics.getJobBreakdown(),
        ]);
        setOverview(ov);
        setTimeline(tl);
        setBreakdown(bd);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!overview) return null;

  // Donut data
  const donutData = [
    { name: 'Success', value: overview.success_count, color: 'var(--accent)' },
    { name: 'Failed', value: overview.failure_count, color: '#ef4444' },
    { name: 'Running', value: overview.running_count, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const hasExecutions = overview.total_executions > 0;

  return (
    <div className="space-y-6">
      {/* ── Overview stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Runs',
            value: overview.total_executions,
            icon: Activity,
            color: 'var(--gradient-1)',
          },
          {
            label: 'Success Rate',
            value: `${overview.success_rate}%`,
            icon: CheckCircle2,
            color: 'var(--accent)',
          },
          {
            label: 'Failures',
            value: overview.failure_count,
            icon: XCircle,
            color: '#ef4444',
          },
          {
            label: 'Avg Duration',
            value: formatDuration(overview.avg_duration_seconds),
            icon: Timer,
            color: 'var(--gradient-2)',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="stat-glow rounded-xl p-4 relative overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--txt-dim)' }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              <div className="p-2.5 rounded-lg" style={{ background: `${stat.color}15` }}>
                <stat.icon size={17} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                 style={{ background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)` }} />
          </motion.div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Execution Timeline (area chart) — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold">Execution Timeline</h3>
            <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--txt-dim)' }}>Last 14 days</span>
          </div>
          {hasExecutions ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFailure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fill: 'var(--txt-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--txt-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="success"
                  name="Success"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#gradSuccess)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--accent)' }}
                />
                <Area
                  type="monotone"
                  dataKey="failure"
                  name="Failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#gradFailure)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm"
                 style={{ color: 'var(--txt-dim)' }}>
              No execution data yet
            </div>
          )}
        </motion.div>

        {/* Status donut chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold">Status Breakdown</h3>
          </div>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex gap-4 mt-2">
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

      {/* ── Per-job breakdown bar chart ── */}
      {breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold">Executions by Job</h3>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, breakdown.length * 40)}>
            <BarChart
              data={breakdown}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: 'var(--txt-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="job_name"
                width={120}
                tick={{ fill: 'var(--txt-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="success" name="Success" stackId="a" fill="var(--accent)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failure" name="Failed" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
