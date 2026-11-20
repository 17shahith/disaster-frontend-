import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/** Requires a signed-in user. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Requires the signed-in user's role to have `view` access to `module`. */
export function RoleRoute({ module, children }) {
  const { can } = useAuth();
  if (!can(module)) return <Navigate to="/unauthorized" replace />;
  return children;
}
