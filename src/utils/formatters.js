export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

export const timeAgo = (value) => {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const formatNumber = (value) =>
  value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString();

export const percent = (part, total) => (total ? Math.round((Number(part) / Number(total)) * 100) : 0);

/** Converts an ISO string into the value format used by <input type="datetime-local">. */
export const toDateTimeInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromDateTimeInput = (value) => (value ? new Date(value).toISOString() : null);

const humanizeField = (key) => {
  const text = key.replace(/_id$/, '').replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * User-facing message for a failed request. Flask errors look like
 * { success: false, message, errors: { field: 'reason' } }; field reasons are appended.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  const message = data?.message || error?.message || fallback;
  const details =
    data?.errors && typeof data.errors === 'object'
      ? Object.entries(data.errors)
          .filter(([key, value]) => typeof value === 'string' && key !== 'token')
          .map(([key, value]) => `${humanizeField(key)}: ${value}`)
      : [];
  return details.length ? `${message}. ${details.slice(0, 3).join(' ')}` : message;
};

export const downloadCsv = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
