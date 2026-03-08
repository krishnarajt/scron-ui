import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, setTokens, clearTokens, getTokens } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getTokens().accessToken;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(username, password);
      setTokens(data.accessToken, data.refreshToken);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.signup(username, password);
      setTokens(data.accessToken, data.refreshToken);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setIsAuthenticated(false);
  }, []);

  // Listen for forced logouts (e.g. from api.js on refresh failure)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'scron_access_token' && !e.newValue) {
        setIsAuthenticated(false);
      }
    };
    // Handle session expiry event dispatched by api.js
    const onSessionExpired = () => {
      setIsAuthenticated(false);
      setError('Your session has expired. Please log in again.');
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('scron:session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('scron:session-expired', onSessionExpired);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, error, login, signup, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
