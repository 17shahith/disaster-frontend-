export default function Spinner({ size = 'md', label }) {
  return (
    <span className={`app-spinner app-spinner--${size}`} role="status">
      <span className="visually-hidden">{label || 'Loading…'}</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading data…' }) {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}
