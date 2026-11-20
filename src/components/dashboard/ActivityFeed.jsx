import { Boxes, ClipboardList, Home, Network, Siren, Truck, UserCog, Users, Activity } from 'lucide-react';
import { timeAgo, formatDateTime } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';

const MODULE_ICONS = {
  Incidents: Siren,
  Requests: ClipboardList,
  Teams: Users,
  Shelters: Home,
  Supplies: Boxes,
  Allocation: Network,
  Dispatch: Truck,
  Users: UserCog,
};

export default function ActivityFeed({ items = [] }) {
  if (!items.length) return <EmptyState title="No recent activity" />;
  return (
    <ul className="activity-feed">
      {items.map((a) => {
        const Icon = MODULE_ICONS[a.module] || Activity;
        return (
          <li key={a.id}>
            <span className="activity-feed__icon">
              <Icon size={14} />
            </span>
            <div>
              <p>{a.message}</p>
              <small title={formatDateTime(a.timestamp)}>
                {a.user} · {timeAgo(a.timestamp)}
              </small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
