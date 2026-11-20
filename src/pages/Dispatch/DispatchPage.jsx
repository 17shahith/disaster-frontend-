import { CheckCircle2, PackageCheck, Send, Truck } from 'lucide-react';
import { useState } from 'react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import dispatchService from '../../services/dispatchService';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import useLookups, { lookupName } from '../../hooks/useLookups';
import { DISPATCH_STATUS, DISPATCHABLE_ALLOCATION_STATUS } from '../../utils/constants';
import { formatDateTime, formatNumber, getErrorMessage } from '../../utils/formatters';

/** Every stage is time-stamped by the server when the status changes. */
const STAGES = [
  { status: 'Prepared', label: 'Recorded', time: (d) => d.createdAt },
  { status: 'Dispatched', label: 'Dispatched', time: (d) => d.dispatchTime },
  { status: 'In Transit', label: 'In Transit', time: (d) => d.inTransitAt },
  { status: 'Delivered', label: 'Delivered', time: (d) => d.deliveredAt },
  { status: 'Completed', label: 'Completed', time: (d) => d.completedAt },
];

/** Small horizontal timeline showing dispatch → delivery → completion. */
function DispatchTimeline({ item }) {
  const reached = DISPATCH_STATUS.indexOf(item.status);
  return (
    <ol className="timeline">
      {STAGES.map((stage, i) => (
        <li key={stage.status} className={i <= reached ? 'done' : ''}>
          <span className="timeline__dot" />
          <strong>{stage.label}</strong>
          <small>{formatDateTime(stage.time(item))}</small>
        </li>
      ))}
    </ol>
  );
}

const isEdit = (v) => Boolean(v.id);

export default function DispatchPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { lookups, loaded, reloadLookups } = useLookups(['incidents', 'allocations', 'teams', 'shelters', 'supplies']);
  const [refreshKey, setRefreshKey] = useState(0);

  const describeAllocation = (a) => (a.resourceType === 'Response Team' ? a.resourceName : `${a.quantity} × ${a.resourceName}`);

  const prefillFromAllocation = (allocationId) => {
    const a = lookups.allocations.find((x) => x.id === allocationId);
    if (!a) return {};
    const incident = lookups.incidents.find((i) => i.id === a.incidentId);
    const shelter = a.resourceType === 'Shelter' ? lookups.shelters.find((s) => s.id === a.resourceId) : null;
    return {
      allocationId: a.id,
      incidentId: a.incidentId,
      quantity: a.remainingQuantity,
      destination: shelter?.location || incident?.location || '',
    };
  };

  const formFields = [
    {
      name: 'allocationId',
      label: 'Linked allocation',
      type: 'select',
      required: true,
      col: 12,
      help: 'Dispatches are recorded against an approved or allocated resource allocation',
      options: (values) =>
        lookups.allocations
          .filter((a) => (DISPATCHABLE_ALLOCATION_STATUS.includes(a.status) && a.remainingQuantity > 0) || a.id === values.allocationId)
          .map((a) => ({
            value: a.id,
            label: `${a.id} · ${a.resourceType}: ${describeAllocation(a)} — ${formatNumber(a.remainingQuantity)} left to dispatch`,
          })),
      onChange: (value) => (value ? prefillFromAllocation(value) : { incidentId: '', quantity: '' }),
      disabled: isEdit,
    },
    {
      name: 'incidentId',
      label: 'Incident',
      type: 'select',
      col: 12,
      placeholder: 'Set by the selected allocation',
      options: () => lookups.incidents.map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` })),
      disabled: true,
    },
    {
      name: 'quantity',
      label: 'Quantity dispatched',
      type: 'number',
      min: 1,
      required: true,
      col: 4,
      help: 'Units, people or responders; cannot exceed what is left on the allocation',
      disabled: (v) => isEdit(v) && v.status !== 'Prepared',
    },
    { name: 'origin', label: 'From (origin)', required: true, col: 4 },
    { name: 'destination', label: 'To (destination)', required: true, col: 4 },
    { name: 'vehicle', label: 'Vehicle number', required: true, col: 4, placeholder: 'KA-01-AB-1234' },
    { name: 'driver', label: 'Driver / escort', col: 4 },
    // New dispatches start as Prepared; stock leaves the warehouse when marked Dispatched.
    { name: 'status', label: 'Dispatch status', type: 'select', options: DISPATCH_STATUS, required: true, col: 4, showIf: isEdit },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2, col: 12 },
  ];

  const columns = [
    {
      key: 'resourceSummary',
      label: 'Dispatch',
      render: (d) => (
        <>
          <div className="fw-semibold">{d.resourceSummary}</div>
          <div className="small text-muted">
            {d.id}
            {d.allocationId && ` · allocation ${d.allocationId}`}
          </div>
        </>
      ),
    },
    {
      key: 'destination',
      label: 'Route',
      render: (d) => (
        <span className="small">
          {d.origin || '—'} <span className="text-muted">→</span> {d.destination}
        </span>
      ),
    },
    { key: 'vehicle', label: 'Vehicle', render: (d) => <span className="small text-nowrap">{d.vehicle || '—'}</span> },
    { key: 'status', label: 'Status', render: (d) => <StatusBadge value={d.status} /> },
    { key: 'dispatchTime', label: 'Dispatched', render: (d) => <span className="small text-nowrap">{formatDateTime(d.dispatchTime)}</span>, sortValue: (d) => d.dispatchTime || '' },
    {
      key: 'deliveredAt',
      label: 'Delivered / completed',
      render: (d) => (
        <span className="small text-nowrap">
          {formatDateTime(d.deliveredAt)}
          {d.completedAt && <span className="d-block text-success">Done {formatDateTime(d.completedAt)}</span>}
        </span>
      ),
      sortValue: (d) => d.deliveredAt || '',
    },
  ];

  const detailFields = [
    { label: 'Resources', key: 'resourceSummary', full: true },
    { label: 'Incident', render: (d) => lookupName(lookups.incidents, d.incidentId) },
    { label: 'Allocation', render: (d) => d.allocationId || '—' },
    { label: 'Origin', render: (d) => d.origin || '—' },
    { label: 'Destination', key: 'destination' },
    { label: 'Vehicle', render: (d) => d.vehicle || '—' },
    { label: 'Driver / escort', render: (d) => d.driver || '—' },
    { label: 'Delivery team', render: (d) => d.teamName || '—' },
    { label: 'Status', render: (d) => <StatusBadge value={d.status} /> },
    { label: 'Recorded by', render: (d) => d.createdBy || '—' },
    { label: 'Notes', render: (d) => d.notes || '—', full: true },
    { label: 'Completion notes', render: (d) => d.completionNotes || '—', full: true },
  ];

  const quickStatus = async (row, status) => {
    try {
      await dispatchService.updateStatus(row.id, status);
      toast.success(`${row.id} marked as ${status}`);
      setRefreshKey((k) => k + 1);
      reloadLookups();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const canStatus = can('dispatch', 'status');
  const canDispatch = can('dispatch', 'edit'); // only coordinators/admins release goods from the warehouse

  return (
    <CrudPage
      module="dispatch"
      title="Dispatch Tracking"
      subtitle="Record dispatches and track them through delivery and completion"
      icon={Truck}
      entityName="Dispatch"
      createLabel="Record Dispatch"
      service={dispatchService}
      tabs={[
        { key: 'open', label: 'Open dispatches', filter: (d) => d.status !== 'Completed' },
        { key: 'history', label: 'Dispatch history', filter: (d) => d.status === 'Completed' },
        { key: 'all', label: 'All' },
      ]}
      columns={columns}
      searchKeys={['id', 'resourceSummary', 'origin', 'destination', 'vehicle', 'driver', 'allocationId', 'incidentId']}
      searchPlaceholder="Search dispatches, vehicles, destinations…"
      filters={[
        { key: 'status', label: 'statuses', options: DISPATCH_STATUS },
        { key: 'incidentId', label: 'incidents', options: lookups.incidents.map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` })) },
      ]}
      formFields={formFields}
      defaultValues={{}}
      prefillFromParams={(params) => {
        const id = params.get('allocation');
        if (!id) return {};
        return loaded ? prefillFromAllocation(id) : null;
      }}
      detailFields={detailFields}
      renderDetailsExtra={(d) => (
        <div className="mt-4">
          <h3 className="section-title">Dispatch timeline</h3>
          <DispatchTimeline item={d} />
        </div>
      )}
      statusConfig={{
        options: DISPATCH_STATUS,
        label: 'Dispatch status',
        title: 'Record dispatch progress',
        actionLabel: 'Record progress',
        extraFields: [
          {
            name: 'note',
            label: 'Note',
            type: 'textarea',
            rows: 2,
            col: 12,
            placeholder: 'Received by, remarks…',
            help: 'The time of each stage is recorded automatically',
          },
        ],
      }}
      lookups={lookups}
      refreshKey={refreshKey}
      onChanged={reloadLookups}
      rowActions={(row) => [
        {
          key: 'dispatch',
          label: 'Mark dispatched now',
          icon: Send,
          tone: 'warning',
          onClick: () => quickStatus(row, 'Dispatched'),
          hidden: !canDispatch || row.status !== 'Prepared',
        },
        {
          key: 'deliver',
          label: 'Mark delivered now',
          icon: PackageCheck,
          tone: 'success',
          onClick: () => quickStatus(row, 'Delivered'),
          hidden: !canStatus || !['Dispatched', 'In Transit'].includes(row.status),
        },
        {
          key: 'complete',
          label: 'Mark completed now',
          icon: CheckCircle2,
          tone: 'success',
          onClick: () => quickStatus(row, 'Completed'),
          hidden: !canStatus || row.status !== 'Delivered',
        },
      ]}
    />
  );
}
