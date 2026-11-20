import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { can as canAccess } from '../utils/permissions';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // Re-validate a stored session against the backend on startup: picks up role
  // changes or deactivation, and a rejected token logs the user out (via auth:expired).
  useEffect(() => {
    if (!authService.getStoredUser()) return;
    authService
      .me()
      .then(setUser)
      .catch(() => {
        /* 401 is handled by the API interceptor; keep the session on network errors */
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback((values) => authService.register(values), []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      can: (module, action = 'view') => canAccess(user?.role, module, action),
    }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
