/** Two-column definition list for "view details" dialogs. */
export default function DetailsList({ item, fields, context }) {
  return (
    <dl className="details-list">
      {fields.map((f) => (
        <div key={f.key || f.label} className={`details-list__row ${f.full ? 'details-list__row--full' : ''}`}>
          <dt>{f.label}</dt>
          <dd>{f.render ? f.render(item, context) : item?.[f.key] ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
