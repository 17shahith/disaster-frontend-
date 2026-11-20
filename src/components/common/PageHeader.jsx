export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="page-header">
      <div className="page-header__title">
        {Icon && (
          <span className="page-header__icon">
            <Icon size={22} />
          </span>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
