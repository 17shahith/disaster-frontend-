import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import useAuth from '../hooks/useAuth';
import { ROLE_HOME } from '../utils/constants';

import LoginPage from '../pages/Login/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import IncidentsPage from '../pages/Incidents/IncidentsPage';
import RequestsPage from '../pages/Requests/RequestsPage';
import TeamsPage from '../pages/Teams/TeamsPage';
import SheltersPage from '../pages/Shelters/SheltersPage';
import SuppliesPage from '../pages/Supplies/SuppliesPage';
import AllocationsPage from '../pages/Allocations/AllocationsPage';
import DispatchPage from '../pages/Dispatch/DispatchPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import UsersPage from '../pages/Users/UsersPage';
import { NotFoundPage, UnauthorizedPage } from '../pages/Errors/ErrorPages';

const PROTECTED = [
  { path: 'dashboard', module: 'dashboard', element: <DashboardPage /> },
  { path: 'incidents', module: 'incidents', element: <IncidentsPage /> },
  { path: 'requests', module: 'requests', element: <RequestsPage /> },
  { path: 'teams', module: 'teams', element: <TeamsPage /> },
  { path: 'shelters', module: 'shelters', element: <SheltersPage /> },
  { path: 'supplies', module: 'supplies', element: <SuppliesPage /> },
  { path: 'allocations', module: 'allocations', element: <AllocationsPage /> },
  { path: 'dispatch', module: 'dispatch', element: <DispatchPage /> },
  { path: 'reports', module: 'reports', element: <ReportsPage /> },
  { path: 'users', module: 'users', element: <UsersPage /> },
];

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? ROLE_HOME[user.role] || '/dashboard' : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          {PROTECTED.map(({ path, module, element }) => (
            <Route key={path} path={path} element={<RoleRoute module={module}>{element}</RoleRoute>} />
          ))}
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
