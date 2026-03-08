import { useState, useEffect, useCallback, useMemo } from 'react';
import { jobs } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Loader2, GitBranch, Clock, RotateCcw, ChevronDown, Eye,
  Plus, Minus, FileText, Check,
} from 'lucide-react';

/**
 * Simple line-by-line diff algorithm.
 * Returns an array of { type: 'equal'|'add'|'remove', line: string }.
 * Uses a basic LCS-based approach.
 */
function computeDiff(oldText, newText) {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result = [];
  let i = m, j = n;
  const stack = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'equal', line: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', line: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: 'remove', line: oldLines[i - 1] });
      i--;
    }
  }

  return stack.reverse();
}

/**
 * Format a datetime string to a readable format.
 */
function formatTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
}


/**
 * VersionHistory — displays a list of script versions with inline diffs.
 *
 * Props:
 *   jobId    — the job UUID
 *   onRestored — callback when a version is restored (to refresh parent)
 */
export default function VersionHistory({ jobId, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [restoringVersion, setRestoringVersion] = useState(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobs.getVersions(jobId, 100);
      setVersions(data.versions);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load versions', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleRestore = async (version) => {
    setRestoringVersion(version);
    try {
      await jobs.restoreVersion(jobId, version);
      toast.success(`Restored to version ${version}`);
      fetchVersions();
      if (onRestored) onRestored();
    } catch (err) {
      toast.error('Failed to restore version');
      console.error(err);
    } finally {
      setRestoringVersion(null);
    }
  };

  // Pre-compute diffs between consecutive versions
  const versionsWithDiff = useMemo(() => {
    if (versions.length === 0) return [];
    // versions are newest-first, so diff is versions[i] vs versions[i+1]
    return versions.map((v, i) => {
      const older = i < versions.length - 1 ? versions[i + 1] : null;
      const diff = older ? computeDiff(older.script_content, v.script_content) : null;
      const additions = diff ? diff.filter(d => d.type === 'add').length : 0;
      const deletions = diff ? diff.filter(d => d.type === 'remove').length : 0;
      return { ...v, diff, additions, deletions, isFirst: !older };
    });
  }, [versions]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-14 text-sm border border-dashed rounded-2xl"
           style={{ color: 'var(--txt-dim)', borderColor: 'var(--border)' }}>
        <GitBranch size={28} className="mx-auto mb-3 opacity-30" />
        <p>No version history available.</p>
        <p className="text-xs mt-1 opacity-60">Versions are saved automatically when you edit the script.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: 'var(--txt-muted)' }}>
          {total} version{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Version list */}
      <div className="space-y-2">
        {versionsWithDiff.map((v, idx) => {
          const isExpanded = expandedId === v.version;
          const isCurrent = idx === 0;

          return (
            <div key={v.version}>
              {/* Version header row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : v.version)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300"
                style={{
                  background: 'var(--surface-1)',
                  border: `1px solid ${isExpanded ? 'var(--border-hover)' : 'var(--border)'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Version icon */}
                <div className="p-2 rounded-lg" style={{
                  background: isCurrent ? 'var(--accent-glow)' : 'var(--surface-3)',
                }}>
                  <GitBranch size={14} style={{
                    color: isCurrent ? 'var(--accent)' : 'var(--txt-dim)',
                  }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold font-mono" style={{
                      color: isCurrent ? 'var(--accent)' : 'var(--txt)',
                    }}>
                      v{v.version}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        current
                      </span>
                    )}
                    {v.change_summary && (
                      <span className="text-xs truncate" style={{ color: 'var(--txt-muted)' }}>
                        — {v.change_summary}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--txt-dim)' }}>
                      {formatTime(v.created_at)}
                    </span>
                    {/* Change stats */}
                    {!v.isFirst && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        {v.additions > 0 && (
                          <span className="flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>
                            <Plus size={10} /> {v.additions}
                          </span>
                        )}
                        {v.deletions > 0 && (
                          <span className="flex items-center gap-0.5" style={{ color: '#ef4444' }}>
                            <Minus size={10} /> {v.deletions}
                          </span>
                        )}
                        {v.additions === 0 && v.deletions === 0 && (
                          <span style={{ color: 'var(--txt-dim)' }}>no changes</span>
                        )}
                      </div>
                    )}
                    {v.isFirst && (
                      <span className="text-[11px]" style={{ color: 'var(--txt-dim)' }}>initial</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Restore button (only for non-current) */}
                  {!isCurrent && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(v.version); }}
                      disabled={restoringVersion === v.version}
                      className="p-2 rounded-lg transition-all duration-200 text-xs font-medium flex items-center gap-1"
                      style={{ color: 'var(--txt-dim)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.background = 'var(--accent-glow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--txt-dim)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Restore this version"
                    >
                      {restoringVersion === v.version
                        ? <Loader2 size={13} className="animate-spin" />
                        : <RotateCcw size={13} />
                      }
                    </button>
                  )}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} style={{ color: 'var(--txt-dim)' }} />
                  </motion.div>
                </div>
              </div>

              {/* Expanded: diff or full content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 mb-2 rounded-xl overflow-hidden"
                         style={{ border: '1px solid var(--border)' }}>
                      {/* Diff header */}
                      <div className="flex items-center gap-2 px-4 py-2"
                           style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <FileText size={12} style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                          {v.isFirst ? 'Full Script' : `Changes from v${v.version - 1} → v${v.version}`}
                        </span>
                        <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--txt-dim)' }}>
                          {v.script_type}
                        </span>
                      </div>

                      {/* Diff content */}
                      <div className="max-h-96 overflow-auto"
                           style={{ background: 'var(--surface-0)' }}>
                        {v.isFirst ? (
                          /* Show full content for first version */
                          <pre className="px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap"
                               style={{ color: 'var(--txt-muted)' }}>
                            {v.script_content}
                          </pre>
                        ) : v.diff ? (
                          /* Show diff */
                          <div className="text-xs font-mono leading-relaxed">
                            {v.diff.map((line, li) => {
                              let bg = 'transparent';
                              let color = 'var(--txt-muted)';
                              let prefix = ' ';

                              if (line.type === 'add') {
                                bg = 'rgba(34, 197, 94, 0.08)';
                                color = 'var(--accent)';
                                prefix = '+';
                              } else if (line.type === 'remove') {
                                bg = 'rgba(239, 68, 68, 0.08)';
                                color = '#ef4444';
                                prefix = '-';
                              }

                              return (
                                <div key={li} className="flex"
                                     style={{ background: bg }}>
                                  {/* Line number gutter */}
                                  <span className="w-8 flex-shrink-0 text-right pr-2 select-none"
                                        style={{
                                          color: 'var(--txt-dim)',
                                          borderRight: '1px solid var(--border)',
                                          opacity: 0.5,
                                        }}>
                                    {li + 1}
                                  </span>
                                  {/* Prefix */}
                                  <span className="w-5 flex-shrink-0 text-center select-none font-bold"
                                        style={{ color }}>
                                    {prefix}
                                  </span>
                                  {/* Content */}
                                  <span className="px-2 py-0.5 whitespace-pre-wrap break-all"
                                        style={{ color }}>
                                    {line.line || ' '}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center text-xs"
                               style={{ color: 'var(--txt-dim)' }}>
                            No diff available
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
