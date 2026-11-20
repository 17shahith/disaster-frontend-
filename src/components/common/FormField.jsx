const normalize = (options = []) =>
  options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));

/** A labelled input / select / textarea with inline validation message. */
export default function FormField({ field, value, error, onChange, onBlur, options, disabled }) {
  const id = `field-${field.name}`;
  const common = {
    id,
    name: field.name,
    disabled,
    onBlur,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  };
  const cls = error ? ' is-invalid' : '';

  let control;
  if (field.type === 'select') {
    control = (
      <select {...common} className={`form-select${cls}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
        {normalize(options).map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = (
      <textarea
        {...common}
        className={`form-control${cls}`}
        rows={field.rows || 3}
        placeholder={field.placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    control = (
      <input
        {...common}
        type={field.type || 'text'}
        className={`form-control${cls}`}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
        autoComplete={field.autoComplete || 'off'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {field.label} {field.required && <span className="text-danger">*</span>}
      </label>
      {control}
      {error ? (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      ) : (
        field.help && <div className="form-text">{typeof field.help === 'function' ? field.help() : field.help}</div>
      )}
    </div>
  );
}
