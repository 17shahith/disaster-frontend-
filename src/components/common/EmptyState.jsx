import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No records found', message, icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state">
      <Icon size={36} />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3 mb-0" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
