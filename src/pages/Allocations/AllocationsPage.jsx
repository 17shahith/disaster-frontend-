import { Network, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import allocationService from '../../services/allocationService';
import useAuth from '../../hooks/useAuth';
import useLookups, { lookupName } from '../../hooks/useLookups';
import { ALLOCATION_STATUS, RESOURCE_TYPES } from '../../utils/constants';
import { formatDateTime, formatNumber, timeAgo } from '../../utils/formatters';
import { RESOURCE_COLLECTION, allocationPayload, buildAllocationFields, validateAllocation } from './allocationFields';

const FORM_FIELDS = buildAllocationFields();

export default function AllocationsPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { lookups, reloadLookups } = useLookups(['incidents', 'requests', 'teams', 'shelters', 'supplies']);

  const resourceLabel = (a) => lookupName(lookups[RESOURCE_COLLECTION[a.resourceType]], a.resourceId);

  const columns = [
    { key: 'id', label: 'ID', render: (a) => <span className="fw-semibold">{a.id}</span> },
    {
      key: 'resourceId',
      label: 'Resource',
      render: (a) => (
        <>
          <div className="fw-semibold">{resourceLabel(a)}</div>
          <div className="small text-muted">
            {a.resourceType}
            {a.resourceType !== 'Response Team' && ` · ${formatNumber(a.quantity)}`}
          </div>
        </>
      ),
      sortValue: resourceLabel,
    },
    { key: 'incidentId', label: 'Incident', render: (a) => <span className="small">{lookupName(lookups.incidents, a.incidentId)}</span> },
    { key: 'requestId', label: 'Request', render: (a) => <span className="small">{a.requestId || '—'}</span> },
    { key: 'status', label: 'Status', render: (a) => <StatusBadge value={a.status} /> },
    {
      key: 'allocatedAt',
      label: 'Allocated',
      render: (a) => (
        <span className="small text-nowrap" title={formatDateTime(a.allocatedAt)}>
          {timeAgo(a.allocatedAt)}
          <span className="d-block text-muted">{a.allocatedBy}</span>
        </span>
      ),
    },
  ];

  const detailFields = [
    { label: 'Resource type', key: 'resourceType' },
    { label: 'Resource', render: resourceLabel },
    { label: 'Quantity', render: (a) => (a.resourceType === 'Response Team' ? '1 team' : formatNumber(a.quantity)) },
    { label: 'Status', render: (a) => <StatusBadge value={a.status} /> },
    { label: 'Incident', render: (a) => lookupName(lookups.incidents, a.incidentId), full: true },
    { label: 'Emergency request', render: (a) => (a.requestId ? `${a.requestId} · ${lookups.requests.find((r) => r.id === a.requestId)?.type || ''}` : '—') },
    { label: 'Allocated by', key: 'allocatedBy' },
    { label: 'Allocated at', render: (a) => formatDateTime(a.allocatedAt) },
    { label: 'Last updated', render: (a) => formatDateTime(a.updatedAt) },
    { label: 'Notes', key: 'notes', full: true },
  ];

  const isHistory = (a) => ['Completed', 'Cancelled'].includes(a.status);

  return (
    <CrudPage
      module="allocations"
      title="Resource Allocation"
      subtitle="Allocate response teams, shelters and supplies to incidents and requests"
      icon={Network}
      entityName="Allocation"
      createLabel="Allocate Resources"
      service={allocationService}
      tabs={[
        { key: 'active', label: 'Active allocations', filter: (a) => !isHistory(a) },
        { key: 'history', label: 'Allocation history', filter: isHistory },
        { key: 'all', label: 'All' },
      ]}
      columns={columns}
      searchKeys={['id', 'resourceType', 'incidentId', 'requestId', 'notes', 'allocatedBy']}
      searchPlaceholder="Search allocations…"
      filters={[
        { key: 'status', label: 'statuses', options: ALLOCATION_STATUS },
        { key: 'resourceType', label: 'resource types', options: RESOURCE_TYPES },
        { key: 'incidentId', label: 'incidents', options: lookups.incidents.map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` })) },
      ]}
      formFields={FORM_FIELDS}
      defaultValues={{ status: 'Allocated', quantity: 1 }}
      toFormValues={(a) => ({ ...a, requestId: a.requestId || '' })}
      toPayload={allocationPayload}
      validate={(v) => validateAllocation(v, lookups)}
      detailFields={detailFields}
      statusConfig={{ options: ALLOCATION_STATUS, label: 'Allocation status' }}
      lookups={lookups}
      onChanged={reloadLookups}
      rowActions={(row) => [
        {
          key: 'dispatch',
          label: 'Record dispatch',
          icon: Truck,
          tone: 'success',
          onClick: () => navigate(`/dispatch?new=1&allocation=${row.id}`),
          hidden: !can('dispatch', 'create') || !['Planned', 'Allocated'].includes(row.status),
        },
      ]}
    />
  );
}
