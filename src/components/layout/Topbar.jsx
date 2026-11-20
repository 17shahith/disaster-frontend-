import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Database, Menu } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/navigation';
import { ROLE_LABELS } from '../../utils/constants';
import { USE_MOCK_API } from '../../services/api';

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="topbar__chip d-none d-md-inline-flex">
      <Clock size={14} />
      {now.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.path));

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-2 min-w-0">
        <button type="button" className="icon-btn d-lg-none" onClick={onMenu} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <span className="topbar__crumb text-truncate">{current?.label || 'Control Room'}</span>
      </div>
      <div className="d-flex align-items-center gap-2">
        {USE_MOCK_API && (
          <span className="topbar__chip topbar__chip--warning" title="Requests are served by the in-browser mock API (VITE_USE_MOCK_API=true)">
            <Database size={14} /> <span className="d-none d-sm-inline">Mock API</span>
          </span>
        )}
        <LiveClock />
        <span className="topbar__role d-none d-md-inline">{ROLE_LABELS[user?.role]}</span>
      </div>
    </header>
  );
}
