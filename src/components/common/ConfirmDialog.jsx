import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? undefined : onCancel}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-light" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`btn btn-${tone}`} onClick={handleConfirm} disabled={busy}>
            {busy && <Spinner size="sm" />} {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-dialog">
        <div className={`confirm-dialog__icon confirm-dialog__icon--${tone}`}>
          <AlertTriangle size={24} />
        </div>
        <p className="mb-0">{message}</p>
      </div>
    </Modal>
  );
}
