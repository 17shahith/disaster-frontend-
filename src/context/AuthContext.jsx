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

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

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
      logout,
      can: (module, action = 'view') => canAccess(user?.role, module, action),
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
