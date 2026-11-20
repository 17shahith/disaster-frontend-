import { STATUS_TONES } from '../../utils/constants';

export default function StatusBadge({ value, tone }) {
  if (!value) return <span className="text-muted">—</span>;
  const resolved = tone || STATUS_TONES[value] || 'neutral';
  return (
    <span className={`status-badge status-badge--${resolved}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {value}
    </span>
  );
}
