import { percent } from '../../utils/formatters';

/** Capacity / utilisation bar. Turns orange at 75% and red at 90%. */
export default function ProgressBar({ value, max, showLabel = true }) {
  const pct = Math.min(100, percent(value, max));
  const tone = pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'success';
  return (
    <div className="progress-cell">
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-fill progress-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="progress-label">{pct}%</span>}
    </div>
  );
}
