import { ALLOCATION_STATUS, CLOSED_INCIDENT_STATUS, RESOURCE_TYPES } from '../../utils/constants';

/** Completed or closed incidents cannot receive allocations until they are reopened. */
const OPEN_INCIDENT = (i) => !CLOSED_INCIDENT_STATUS.includes(i.status);
const isEdit = (v) => Boolean(v.id);

export const RESOURCE_COLLECTION = {
  'Response Team': 'teams',
  Shelter: 'shelters',
  'Relief Supply': 'supplies',
};

/** Builds dropdown options for the selected resource type, showing availability. */
const resourceOptions = (values, lookups) => {
  const type = values.resourceType;
  if (type === 'Response Team') {
    return (lookups.teams || []).map((t) => ({
      value: t.id,
      label: `${t.name} — ${t.status}`,
      disabled: t.status !== 'Available' && t.id !== values.resourceId,
    }));
  }
  if (type === 'Shelter') {
    return (lookups.shelters || []).map((s) => ({
      value: s.id,
      label: `${s.name} — ${Math.max(0, s.capacity - s.occupancy)} beds free`,
      disabled: s.status !== 'Open' && s.id !== values.resourceId,
    }));
  }
  if (type === 'Relief Supply') {
    return (lookups.supplies || []).map((s) => ({
      value: s.id,
      label: `${s.name} — ${s.available} ${s.unit} available`,
      disabled: Number(s.available) <= 0 && s.id !== values.resourceId,
    }));
  }
  return [];
};

const findResource = (values, lookups) =>
  (lookups[RESOURCE_COLLECTION[values.resourceType]] || []).find((r) => r.id === values.resourceId);

export const buildAllocationFields = () => [
  {
    name: 'incidentId',
    label: 'Incident',
    type: 'select',
    required: true,
    col: 6,
    options: (v, lookups) =>
      (lookups.incidents || []).filter((i) => OPEN_INCIDENT(i) || i.id === v.incidentId).map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` })),
    onChange: () => ({ requestId: '' }),
    disabled: isEdit, // an allocation cannot be moved to another incident
  },
  {
    name: 'requestId',
    label: 'Emergency request (optional)',
    type: 'select',
    col: 6,
    placeholder: 'Not linked to a request',
    options: (values, lookups) =>
      (lookups.requests || [])
        .filter((r) => !values.incidentId || r.incidentId === values.incidentId)
        .map((r) => ({ value: r.id, label: `${r.id} · ${r.type} (${r.priority})` })),
  },
  {
    name: 'resourceType',
    label: 'Resource type',
    type: 'select',
    options: RESOURCE_TYPES,
    required: true,
    col: 4,
    onChange: (value) => ({ resourceId: '', quantity: value === 'Response Team' ? 1 : '' }),
    disabled: isEdit,
  },
  {
    name: 'resourceId',
    label: 'Resource',
    type: 'select',
    required: true,
    col: 8,
    options: resourceOptions,
    disabled: (v) => !v.resourceType || isEdit(v),
    placeholder: 'Select resource type first',
  },
  {
    name: 'quantity',
    label: 'Quantity / people',
    type: 'number',
    min: 1,
    required: true,
    col: 4,
    showIf: (v) => v.resourceType && v.resourceType !== 'Response Team',
    disabled: (v) => isEdit(v) && !['Pending', 'Approved'].includes(v.status),
    help: 'Supply units, or number of people for shelters',
  },
  // New allocations always start as Pending; the workflow is Pending -> Approved -> Allocated -> Completed.
  { name: 'status', label: 'Allocation status', type: 'select', options: ALLOCATION_STATUS, required: true, col: 4, showIf: isEdit },
  { name: 'notes', label: 'Notes', type: 'textarea', col: 12, rows: 2, maxLength: 500 },
  { name: 'progressNotes', label: 'Progress notes', type: 'textarea', col: 12, rows: 2, maxLength: 2000, showIf: isEdit },
];

/** Cross-field validation that needs the lookup lists (stock / bed availability). */
export const validateAllocation = (values, lookups) => {
  if (isEdit(values)) return {}; // quantity changes are validated by the server against reservations
  const resource = findResource(values, lookups);
  if (!resource || values.resourceType === 'Response Team') return {};
  const qty = Number(values.quantity);
  if (values.resourceType === 'Relief Supply' && qty > Number(resource.available)) {
    return { quantity: `Only ${resource.available} ${resource.unit} available` };
  }
  if (values.resourceType === 'Shelter' && qty > resource.capacity - resource.occupancy) {
    return { quantity: `Only ${Math.max(0, resource.capacity - resource.occupancy)} beds free` };
  }
  return {};
};

export const allocationPayload = (v) => ({
  ...v,
  requestId: v.requestId || null,
  quantity: v.resourceType === 'Response Team' ? undefined : Number(v.quantity),
});
