import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';

/** KPI tile. tone: danger | warning | success | info | neutral */
export default function StatCard({ label, value, icon: Icon, tone = 'info', hint, to }) {
  const content = (
    <>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <span className={`stat-card__icon stat-card__icon--${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="stat-card__value">{formatNumber(value)}</div>
      {hint && <div className="stat-card__hint">{hint}</div>}
    </>
  );
  return to ? (
    <Link to={to} className={`stat-card stat-card--${tone} stat-card--link`}>
      {content}
    </Link>
  ) : (
    <div className={`stat-card stat-card--${tone}`}>{content}</div>
  );
}
