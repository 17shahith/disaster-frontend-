import { useMemo, useState } from 'react';
import FormField from './FormField';
import Spinner from './Spinner';
import { validateField, validateFields } from '../../utils/validators';

/**
 * Config-driven form with validation.
 *
 * field = {
 *   name, label, type ('text'|'number'|'email'|'tel'|'password'|'select'|'textarea'|'date'|'datetime-local'),
 *   required, min, max, minLength, maxLength, placeholder, help,
 *   col (Bootstrap column width, default 6),
 *   options: array | (values, lookups) => array,
 *   showIf: (values) => boolean,
 *   disabled: boolean | (values) => boolean,
 *   validate: (value, values) => string | null,
 *   onChange: (value, values) => partial values to merge (for dependent fields)
 * }
 */
export default function EntityForm({ fields, initialValues, lookups = {}, onSubmit, onCancel, submitLabel = 'Save', validate }) {
  const [values, setValues] = useState(() => ({ ...initialValues }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const visibleFields = useMemo(() => fields.filter((f) => !f.showIf || f.showIf(values)), [fields, values]);

  const setFieldValue = (field, value) => {
    setValues((prev) => {
      const next = { ...prev, [field.name]: value, ...(field.onChange ? field.onChange(value, prev) : {}) };
      if (touched[field.name]) {
        setErrors((e) => ({ ...e, [field.name]: validateField(field, value, next) }));
      }
      return next;
    });
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field.name]: true }));
    setErrors((e) => ({ ...e, [field.name]: validateField(field, values[field.name], values) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = { ...validateFields(visibleFields, values), ...(validate ? validate(values) : {}) };
    setTouched(Object.fromEntries(visibleFields.map((f) => [f.name, true])));
    setErrors(fieldErrors);
    if (Object.values(fieldErrors).some(Boolean)) return;

    const payload = { ...values };
    visibleFields.forEach((f) => {
      if (f.type === 'number' && payload[f.name] !== '' && payload[f.name] !== null && payload[f.name] !== undefined) {
        payload[f.name] = Number(payload[f.name]);
      }
    });
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch {
      // Errors are reported by the caller via toast; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        {visibleFields.map((field) => {
          const options = typeof field.options === 'function' ? field.options(values, lookups) : field.options;
          const disabled = typeof field.disabled === 'function' ? field.disabled(values) : field.disabled;
          return (
            <div key={field.name} className={`col-12 col-md-${field.col || 6}`}>
              <FormField
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                options={options}
                disabled={disabled || submitting}
                onChange={(v) => setFieldValue(field, v)}
                onBlur={() => handleBlur(field)}
              />
            </div>
          );
        })}
      </div>
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-light" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <Spinner size="sm" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
