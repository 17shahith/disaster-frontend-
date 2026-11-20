import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ConfirmDialog from '../common/ConfirmDialog';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setConfirmLogout(false);
    toast.info('You have been signed out.', 'Signed out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} onLogout={() => setConfirmLogout(true)} />
      {menuOpen && <div className="sidebar-overlay d-lg-none" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <div className="app-main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        message="You will be returned to the login screen."
        confirmLabel="Logout"
        tone="primary"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
