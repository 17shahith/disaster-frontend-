import { NavLink } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/navigation';
import { APP_NAME, ROLE_LABELS } from '../../utils/constants';

export default function Sidebar({ open, onNavigate, onLogout }) {
  const { user, can } = useAuth();
  const items = NAV_ITEMS.filter((item) => can(item.module));

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <ShieldAlert size={22} />
        </span>
        <div>
          <strong>{APP_NAME}</strong>
          <small>Emergency Control Room</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`} onClick={onNavigate}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="avatar">{user?.name?.charAt(0) || '?'}</span>
          <div className="text-truncate">
            <strong className="d-block text-truncate">{user?.name}</strong>
            <small>{ROLE_LABELS[user?.role]}</small>
          </div>
        </div>
        <button type="button" className="sidebar__link sidebar__logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
