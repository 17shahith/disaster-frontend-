import Modal from './Modal';
import EntityForm from './EntityForm';
import StatusBadge from './StatusBadge';

/**
 * Generic "update status" dialog. Extra fields (e.g. timestamp, note) can be appended.
 * onSubmit receives the full form values: { status, ...extra }.
 */
export default function StatusUpdateModal({ open, item, title = 'Update status', label = 'Status', options, extraFields = [], initialExtra = {}, onSubmit, onClose }) {
  if (!item) return null;
  const fields = [{ name: 'status', label, type: 'select', options, required: true, col: 12 }, ...extraFields];
  return (
    <Modal open={open} title={title} subtitle={`${item.id} · ${item.title || item.name || item.resourceSummary || ''}`} onClose={onClose} size="sm">
      <p className="small text-muted mb-3">
        Current: <StatusBadge value={item.status} />
      </p>
      <EntityForm
        key={item.id}
        fields={fields}
        initialValues={{ status: item.status, ...initialExtra }}
        onSubmit={onSubmit}
        onCancel={onClose}
        submitLabel="Update"
        validate={(v) => (v.status === item.status && !extraFields.length ? { status: 'Choose a different status' } : {})}
      />
    </Modal>
  );
}
