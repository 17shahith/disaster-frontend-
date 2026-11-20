import { useState } from 'react';
import { ClipboardList, Network } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import AllocationFormModal from '../Allocations/AllocationFormModal';
import requestService from '../../services/requestService';
import useAuth from '../../hooks/useAuth';
import useLookups, { lookupName } from '../../hooks/useLookups';
import { CLOSED_INCIDENT_STATUS, PRIORITY_LEVELS, REQUEST_STATUS, REQUEST_TYPES } from '../../utils/constants';
import { formatDateTime, formatNumber, timeAgo } from '../../utils/formatters';
import { RESOURCE_COLLECTION } from '../Allocations/allocationFields';

const PRIORITY_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const SUGGESTED_RESOURCE = {
  Rescue: 'Response Team',
  'Medical Assistance': 'Response Team',
  Transportation: 'Response Team',
  Shelter: 'Shelter',
  Food: 'Relief Supply',
  'Drinking Water': 'Relief Supply',
};

const isClosedIncident = (i) => CLOSED_INCIDENT_STATUS.includes(i.status);

export default function RequestsPage() {
  const { can } = useAuth();
  const { lookups, reloadLookups } = useLookups(['incidents', 'requests', 'teams', 'shelters', 'supplies', 'allocations']);
  const [assigning, setAssigning] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const incidentOptions = lookups.incidents.filter((i) => !isClosedIncident(i)).map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` }));

  const formFields = [
    { name: 'incidentId', label: 'Related incident', type: 'select', required: true, col: 12, options: (v, l) => l.incidents.map((i) => ({ value: i.id, label: `${i.id} · ${i.title}`, disabled: isClosedIncident(i) && i.id !== v.incidentId })) },
    { name: 'type', label: 'Request type', type: 'select', options: REQUEST_TYPES, required: true, col: 4 },
    { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY_LEVELS, required: true, col: 4 },
    // New requests always start as Pending on the server; status is editable afterwards.
    { name: 'status', label: 'Status', type: 'select', options: REQUEST_STATUS, required: true, col: 4, showIf: (v) => Boolean(v.id) },
    { name: 'requesterName', label: 'Requested by', required: true, minLength: 3, col: 6 },
    { name: 'contact', label: 'Contact number', type: 'tel', required: true, col: 6, placeholder: '+91 90000 00000' },
    { name: 'location', label: 'Location', required: true, col: 8 },
    { name: 'peopleAffected', label: 'People affected', type: 'number', min: 1, required: true, col: 4 },
    { name: 'description', label: 'Details of the need', type: 'textarea', required: true, minLength: 10, col: 12 },
  ];

  const columns = [
    {
      key: 'type',
      label: 'Request',
      render: (r) => (
        <>
          <div className="fw-semibold">{r.type}</div>
          <div className="small text-muted">{r.id} · {r.requesterName}</div>
        </>
      ),
    },
    { key: 'incidentId', label: 'Incident', render: (r) => <span className="small">{lookupName(lookups.incidents, r.incidentId)}</span> },
    { key: 'priority', label: 'Priority', render: (r) => <StatusBadge value={r.priority} />, sortValue: (r) => PRIORITY_RANK[r.priority] },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'peopleAffected', label: 'People', className: 'text-end', render: (r) => formatNumber(r.peopleAffected), sortValue: (r) => Number(r.peopleAffected) || 0 },
    {
      key: 'assigned',
      label: 'Resources',
      sortable: false,
      render: (r) => {
        const count = lookups.allocations.filter((a) => a.requestId === r.id && a.status !== 'Cancelled').length;
        return count ? <span className="small">{count} allocated</span> : <span className="small text-muted">None</span>;
      },
    },
    { key: 'createdAt', label: 'Created', render: (r) => <span className="small text-nowrap" title={formatDateTime(r.createdAt)}>{timeAgo(r.createdAt)}</span> },
  ];

  const detailFields = [
    { label: 'Request type', key: 'type' },
    { label: 'Incident', render: (r) => lookupName(lookups.incidents, r.incidentId) },
    { label: 'Priority', render: (r) => <StatusBadge value={r.priority} /> },
    { label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { label: 'Requested by', key: 'requesterName' },
    { label: 'Contact', render: (r) => <a href={`tel:${r.contact}`}>{r.contact}</a> },
    { label: 'Location', key: 'location' },
    { label: 'People affected', render: (r) => formatNumber(r.peopleAffected) },
    { label: 'Created', render: (r) => formatDateTime(r.createdAt) },
    { label: 'Last updated', render: (r) => formatDateTime(r.updatedAt) },
    { label: 'Details', key: 'description', full: true },
    { label: 'Completion notes', render: (r) => r.completionNotes || '—', full: true },
  ];

  const renderAssigned = (request) => {
    const rows = lookups.allocations.filter((a) => a.requestId === request.id);
    return (
      <div className="mt-4">
        <h3 className="section-title">Assigned resources</h3>
        {rows.length ? (
          <ul className="simple-list">
            {rows.map((a) => (
              <li key={a.id}>
                <span>
                  <strong>{a.id}</strong> · {a.resourceType}: {lookupName(lookups[RESOURCE_COLLECTION[a.resourceType]], a.resourceId)}
                  {a.resourceType !== 'Response Team' && ` (${formatNumber(a.quantity)})`}
                </span>
                <StatusBadge value={a.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted small mb-0">No resources have been assigned to this request yet.</p>
        )}
      </div>
    );
  };

  return (
    <>
      <CrudPage
        module="requests"
        title="Emergency Requests"
        subtitle="Capture field requests, prioritise them and assign resources"
        icon={ClipboardList}
        entityName="Request"
        service={requestService}
        columns={columns}
        searchKeys={['id', 'type', 'requesterName', 'location', 'description', 'incidentId']}
        searchPlaceholder="Search by request ID, requester, location…"
        filters={[
          { key: 'status', label: 'statuses', options: REQUEST_STATUS },
          { key: 'priority', label: 'priorities', options: PRIORITY_LEVELS },
          { key: 'type', label: 'types', options: REQUEST_TYPES },
          { key: 'incidentId', label: 'incidents', options: incidentOptions },
        ]}
        formFields={formFields}
        defaultValues={{ status: 'Pending', peopleAffected: 1 }}
        detailFields={detailFields}
        renderDetailsExtra={renderAssigned}
        statusConfig={{ options: REQUEST_STATUS, label: 'Request status' }}
        lookups={lookups}
        refreshKey={refreshKey}
        onChanged={reloadLookups}
        rowActions={(row) => [
          {
            key: 'assign',
            label: 'Assign resources',
            icon: Network,
            tone: 'success',
            onClick: () => setAssigning(row),
            hidden: !can('requests', 'assign') || ['Completed', 'Cancelled'].includes(row.status),
          },
        ]}
      />

      <AllocationFormModal
        open={Boolean(assigning)}
        title="Assign resources to request"
        subtitle={assigning && `${assigning.id} · ${assigning.type} · ${assigning.peopleAffected} people`}
        initialValues={assigning ? { incidentId: assigning.incidentId, requestId: assigning.id, resourceType: SUGGESTED_RESOURCE[assigning.type] || '' } : {}}
        lockedFields={['incidentId', 'requestId']}
        lookups={lookups}
        onClose={() => setAssigning(null)}
        onSaved={async () => {
          // The server moves a Pending request to In Progress when resources are allocated to it.
          await reloadLookups();
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
