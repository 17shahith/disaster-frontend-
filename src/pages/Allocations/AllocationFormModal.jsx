import Modal from '../../components/common/Modal';
import EntityForm from '../../components/common/EntityForm';
import allocationService from '../../services/allocationService';
import useToast from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/formatters';
import { buildAllocationFields, allocationPayload, validateAllocation } from './allocationFields';

/**
 * Stand-alone "allocate resources" dialog used from other modules
 * (assign resources to a request, assign a team to an incident).
 */
export default function AllocationFormModal({ open, title = 'Allocate resources', subtitle, initialValues, lookups, lockedFields = [], onClose, onSaved }) {
  const toast = useToast();

  const fields = buildAllocationFields().map((f) => (lockedFields.includes(f.name) ? { ...f, disabled: true } : f));

  const handleSubmit = async (values) => {
    try {
      const created = await allocationService.create(allocationPayload(values));
      toast.success(`Allocation ${created?.id || ''} created`);
      onSaved?.(created);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return (
    <Modal open={open} title={title} subtitle={subtitle} onClose={onClose} size="lg" closeOnBackdrop={false}>
      {open && (
        <EntityForm
          fields={fields}
          initialValues={{ status: 'Allocated', quantity: 1, ...initialValues }}
          lookups={lookups}
          validate={(v) => validateAllocation(v, lookups)}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Allocate"
        />
      )}
    </Modal>
  );
}
