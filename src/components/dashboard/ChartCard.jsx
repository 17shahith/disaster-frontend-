export default function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`card-panel chart-card ${className}`}>
      <header className="chart-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="chart-card__body">{children}</div>
    </section>
  );
}
