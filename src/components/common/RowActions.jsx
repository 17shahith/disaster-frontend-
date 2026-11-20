/** Compact icon buttons for a table row. actions: [{ key, label, icon, onClick, tone, hidden }] */
export default function RowActions({ actions }) {
  return (
    <div className="row-actions">
      {actions
        .filter((a) => !a.hidden)
        .map(({ key, label, icon: Icon, onClick, tone }) => (
          <button key={key} type="button" className={`row-action row-action--${tone || 'default'}`} onClick={onClick} title={label} aria-label={label}>
            <Icon size={16} />
          </button>
        ))}
    </div>
  );
}
