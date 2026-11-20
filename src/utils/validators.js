const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/**
 * Validates one field value against a field config:
 * { label, required, type, min, max, minLength, maxLength, validate(value, values) }
 */
export const validateField = (field, value, values) => {
  if (field.showIf && !field.showIf(values)) return null;
  if (isEmpty(value)) return field.required ? `${field.label} is required` : null;

  if (field.type === 'email' && !EMAIL_RE.test(value)) return 'Enter a valid email address';
  if (field.type === 'tel' && !PHONE_RE.test(value)) return 'Enter a valid phone number';
  if (field.type === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) return `${field.label} must be a number`;
    if (field.min !== undefined && n < field.min) return `${field.label} must be at least ${field.min}`;
    if (field.max !== undefined && n > field.max) return `${field.label} must be at most ${field.max}`;
  }
  if (field.minLength && String(value).trim().length < field.minLength)
    return `${field.label} must be at least ${field.minLength} characters`;
  if (field.maxLength && String(value).length > field.maxLength)
    return `${field.label} must be at most ${field.maxLength} characters`;
  return field.validate ? field.validate(value, values) || null : null;
};

export const validateFields = (fields, values) =>
  fields.reduce((errors, field) => {
    const message = validateField(field, values[field.name], values);
    if (message) errors[field.name] = message;
    return errors;
  }, {});
