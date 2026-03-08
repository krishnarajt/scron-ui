/**
 * API client for scron backend.
 *
 * Handles:
 * - Bearer token injection on every request
 * - Automatic token refresh on 401
 * - Retry after refresh (once)
 * - Logout on double 401 (refresh also failed)
 */

const API_BASE = '/api';

// ── Token storage ──────────────────────────────────────────────
// Stored in memory + localStorage so they survive page reloads
// but the in-memory copy is the primary source of truth.

let _accessToken = localStorage.getItem('scron_access_token') || null;
let _refreshToken = localStorage.getItem('scron_refresh_token') || null;

export function getTokens() {
  return { accessToken: _accessToken, refreshToken: _refreshToken };
}

export function setTokens(accessToken, refreshToken) {
  _accessToken = accessToken;
  _refreshToken = refreshToken;
  if (accessToken) localStorage.setItem('scron_access_token', accessToken);
  else localStorage.removeItem('scron_access_token');
  if (refreshToken) localStorage.setItem('scron_refresh_token', refreshToken);
  else localStorage.removeItem('scron_refresh_token');
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  localStorage.removeItem('scron_access_token');
  localStorage.removeItem('scron_refresh_token');
}

// ── Refresh lock ───────────────────────────────────────────────
// Prevents multiple concurrent refresh requests.
let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    if (!_refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

// ── Core request function ──────────────────────────────────────

/**
 * Make an authenticated API request.
 * Automatically retries once with a refreshed token on 401.
 */
export async function api(path, options = {}) {
  const { body, method = 'GET', noAuth = false, ...rest } = options;

  const headers = { 'Content-Type': 'application/json', ...rest.headers };
  if (!noAuth && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const fetchOptions = {
    method,
    headers,
    ...rest,
  };
  if (body !== undefined) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let res = await fetch(`${API_BASE}${path}`, fetchOptions);

  // If 401 and we have a refresh token, try to refresh and retry once
  if (res.status === 401 && _refreshToken && !noAuth) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
    } catch {
      // Refresh failed — dispatch event so the app can handle gracefully
      // (e.g. show a modal, save draft state) instead of losing unsaved work
      clearTokens();
      window.dispatchEvent(new CustomEvent('scron:session-expired', {
        detail: { reason: 'refresh_failed' },
      }));
      throw new Error('Session expired');
    }
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }

  return res.json();
}

// ── Convenience wrappers ───────────────────────────────────────

export const auth = {
  login: (username, password) =>
    api('/auth/login', { method: 'POST', body: { username, password }, noAuth: true }),
  signup: (username, password, email = null) =>
    api('/auth/signup', { method: 'POST', body: { username, password, email }, noAuth: true }),
  logout: () => {
    const rt = _refreshToken;
    if (rt) api('/auth/logout', { method: 'POST', body: { refreshToken: rt } }).catch(() => {});
    clearTokens();
  },
};

export const profile = {
  get: () => api('/profile'),
  update: (data) => api('/profile', { method: 'PATCH', body: data }),
};

export const jobs = {
  list: (tagId = null) => api(`/jobs${tagId ? `?tag_id=${tagId}` : ''}`),
  get: (id) => api(`/jobs/${id}`),
  create: (data) => api('/jobs', { method: 'POST', body: data }),
  update: (id, data) => api(`/jobs/${id}`, { method: 'PATCH', body: data }),
  delete: (id) => api(`/jobs/${id}`, { method: 'DELETE' }),
  trigger: (id) => api(`/jobs/${id}/trigger`, { method: 'POST' }),

  // Cancel a running execution
  cancel: (jobId, executionId) =>
    api(`/jobs/${jobId}/executions/${executionId}/cancel`, { method: 'POST' }),

  // Replay a past execution
  replay: (jobId, executionId) =>
    api(`/jobs/${jobId}/replay`, { method: 'POST', body: { execution_id: executionId } }),

  // Environment variables
  getEnv: (jobId) => api(`/jobs/${jobId}/env`),
  setEnv: (jobId, varKey, varValue) =>
    api(`/jobs/${jobId}/env`, { method: 'POST', body: { var_key: varKey, var_value: varValue } }),
  setEnvBulk: (jobId, envVars) =>
    api(`/jobs/${jobId}/env`, { method: 'PUT', body: { env_vars: envVars } }),
  deleteEnv: (jobId, varKey) =>
    api(`/jobs/${jobId}/env/${encodeURIComponent(varKey)}`, { method: 'DELETE' }),

  // Executions
  getExecutions: (jobId, limit = 50, offset = 0) =>
    api(`/jobs/${jobId}/executions?limit=${limit}&offset=${offset}`),

  // Script versions
  getVersions: (jobId, limit = 50) =>
    api(`/jobs/${jobId}/versions?limit=${limit}`),
  getVersion: (jobId, version) =>
    api(`/jobs/${jobId}/versions/${version}`),
  restoreVersion: (jobId, version) =>
    api(`/jobs/${jobId}/versions/${version}/restore`, { method: 'POST' }),

  // Duplicate
  duplicate: (jobId) =>
    api(`/jobs/${jobId}/duplicate`, { method: 'POST' }),

  // Next scheduled runs
  getNextRuns: (jobId, count = 5) =>
    api(`/jobs/${jobId}/next-runs?count=${count}`),

  // Live log stream status
  getStreamStatus: (jobId) =>
    api(`/jobs/${jobId}/stream-status`),

  // Requirements (under /config, not /jobs)
  getRequirements: () => api('/config/requirements'),
  updateRequirements: (content) =>
    api('/config/requirements', { method: 'PUT', body: { content } }),
};

export const tags = {
  list: () => api('/tags'),
  create: (name, color = '#6366f1') =>
    api('/tags', { method: 'POST', body: { name, color } }),
  update: (id, data) => api(`/tags/${id}`, { method: 'PATCH', body: data }),
  delete: (id) => api(`/tags/${id}`, { method: 'DELETE' }),
};

export const notifications = {
  get: () => api('/notifications'),
  update: (data) => api('/notifications', { method: 'PUT', body: data }),
};

export const templates = {
  list: () => api('/templates'),
};

export const analytics = {
  // Global dashboard analytics
  getOverview: () => api('/analytics/overview'),
  getTimeline: (days = 14) => api(`/analytics/timeline?days=${days}`),
  getHeatmap: (days = 7) => api(`/analytics/heatmap?days=${days}`),
  getJobBreakdown: () => api('/analytics/jobs/breakdown'),

  // Per-job analytics
  getJobStats: (jobId) => api(`/analytics/jobs/${jobId}/stats`),
  getJobDuration: (jobId, limit = 50) =>
    api(`/analytics/jobs/${jobId}/duration?limit=${limit}`),
  getJobTimeline: (jobId, days = 14) =>
    api(`/analytics/jobs/${jobId}/timeline?days=${days}`),
};
