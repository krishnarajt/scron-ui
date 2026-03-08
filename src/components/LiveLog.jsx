import { useState, useEffect, useRef, useCallback } from 'react';
import { getTokens } from '../lib/api';
import { motion } from 'framer-motion';
import {
  Radio, Wifi, WifiOff, ArrowDown, Pause, Play, X, Loader2, Terminal,
} from 'lucide-react';

/**
 * LiveLog — Real-time log viewer via WebSocket.
 *
 * Connects to the backend WebSocket endpoint and displays log lines
 * as they arrive. Features auto-scroll, pause/resume, and connection
 * status indicator.
 *
 * Props:
 *   jobId       — the job UUID (uses /ws/logs/job/{jobId})
 *   executionId — (optional) specific execution (uses /ws/logs/{executionId})
 *   onClose     — callback to close the live log panel
 */
export default function LiveLog({ jobId, executionId, onClose }) {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | connected | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const wsRef = useRef(null);
  const logEndRef = useRef(null);
  const containerRef = useRef(null);

  // Build WebSocket URL
  // In production (Vercel), we connect directly to the backend host because
  // Vercel rewrites only handle HTTP, not WebSocket upgrades.
  // In development, Vite's proxy handles WS forwarding on the same origin.
  const getWsUrl = useCallback(() => {
    const { accessToken } = getTokens();
    const wsBase = import.meta.env.VITE_WS_BASE;

    let base;
    if (wsBase) {
      // Explicit WS base URL configured (production)
      base = `${wsBase}/api/ws/logs`;
    } else {
      // Dev mode — use same origin via Vite proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      base = `${protocol}//${host}/api/ws/logs`;
    }

    if (executionId) {
      return `${base}/${executionId}?token=${accessToken}`;
    }
    return `${base}/job/${jobId}?token=${accessToken}`;
  }, [jobId, executionId]);

  useEffect(() => {
    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'log') {
          setLines((prev) => [...prev, data.line]);
        } else if (data.type === 'done') {
          setStatus('done');
        } else if (data.type === 'error') {
          setStatus('error');
          setErrorMsg(data.message || 'Unknown error');
        } else if (data.type === 'meta') {
          // Contains execution_id for job-based streams
        }
      } catch {
        // Non-JSON message, treat as raw log line
        setLines((prev) => [...prev, event.data]);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      setErrorMsg('WebSocket connection failed');
    };

    ws.onclose = (event) => {
      if (status !== 'done' && status !== 'error') {
        if (event.code === 4001) {
          setStatus('error');
          setErrorMsg('Authentication failed');
        } else if (event.code !== 1000) {
          setStatus('error');
          setErrorMsg(`Connection closed (code ${event.code})`);
        }
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [getWsUrl]);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const statusConfig = {
    connecting: { icon: Loader2, color: '#f59e0b', label: 'Connecting', animate: true },
    connected: { icon: Radio, color: 'var(--accent)', label: 'Live', animate: true },
    done: { icon: Wifi, color: 'var(--txt-dim)', label: 'Finished', animate: false },
    error: { icon: WifiOff, color: '#ef4444', label: 'Error', animate: false },
  };

  const sc = statusConfig[status] || statusConfig.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3"
           style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <sc.icon
              size={14}
              style={{ color: sc.color }}
              className={sc.animate ? 'animate-pulse' : ''}
            />
            {status === 'connected' && (
              <div className="absolute inset-0 rounded-full animate-ping"
                   style={{ background: 'var(--accent)', opacity: 0.3 }} />
            )}
          </div>
          <span className="text-xs font-semibold" style={{ color: sc.color }}>
            {sc.label}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* Line count */}
          <span className="text-[10px] font-mono mr-2" style={{ color: 'var(--txt-dim)' }}>
            {lines.length} lines
          </span>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => {
              setAutoScroll(!autoScroll);
              if (!autoScroll && logEndRef.current) {
                logEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{
              color: autoScroll ? 'var(--accent)' : 'var(--txt-dim)',
              background: autoScroll ? 'var(--accent-glow)' : 'transparent',
            }}
            title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
          >
            <ArrowDown size={13} />
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all duration-200"
              style={{ color: 'var(--txt-dim)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-muted)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-dim)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Log output */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto font-mono text-xs leading-relaxed"
        style={{
          background: 'var(--surface-0)',
          maxHeight: '400px',
          minHeight: '120px',
        }}
      >
        {lines.length === 0 && status === 'connected' && (
          <div className="flex items-center justify-center gap-2 py-8"
               style={{ color: 'var(--txt-dim)' }}>
            <Terminal size={14} className="animate-pulse" />
            <span className="text-xs">Waiting for output...</span>
          </div>
        )}

        {errorMsg && (
          <div className="px-4 py-3 text-xs" style={{ color: '#ef4444' }}>
            {errorMsg}
          </div>
        )}

        {lines.map((line, i) => (
          <div
            key={i}
            className="flex hover:bg-white/[0.02] transition-colors duration-100"
          >
            {/* Line number */}
            <span
              className="w-10 flex-shrink-0 text-right pr-2 py-0.5 select-none"
              style={{
                color: 'var(--txt-dim)',
                borderRight: '1px solid var(--border)',
                fontSize: '10px',
                opacity: 0.6,
              }}
            >
              {i + 1}
            </span>
            {/* Content */}
            <span className="px-3 py-0.5 whitespace-pre-wrap break-all"
                  style={{ color: 'var(--txt-muted)' }}>
              {line}
            </span>
          </div>
        ))}

        {/* Done indicator */}
        {status === 'done' && lines.length > 0 && (
          <div className="px-4 py-2 text-[11px] font-semibold"
               style={{
                 color: 'var(--accent)',
                 background: 'var(--accent-glow)',
                 borderTop: '1px solid var(--border)',
               }}>
            — Process finished —
          </div>
        )}

        <div ref={logEndRef} />
      </div>
    </motion.div>
  );
}
