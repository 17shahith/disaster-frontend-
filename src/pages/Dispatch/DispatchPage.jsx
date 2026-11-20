import { CheckCircle2, PackageCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import dispatchService from '../../services/dispatchService';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import useLookups, { lookupName } from '../../hooks/useLookups';
import { DISPATCH_STATUS } from '../../utils/constants';
import { formatDateTime, fromDateTimeInput, getErrorMessage, toDateTimeInput } from '../../utils/formatters';
import { RESOURCE_COLLECTION } from '../Allocations/allocationFields';

const STAGES = ['Pending', 'In Transit', 'Delivered', 'Completed'];

/** Small horizontal timeline showing dispatch → delivery → completion. */
function DispatchTimeline({ item }) {
  const reached = item.status === 'Cancelled' ? -1 : STAGES.indexOf(item.status);
  const times = [null, item.dispatchTime, item.deliveredAt, item.completedAt];
  return (
    <ol className="timeline">
      {STAGES.map((stage, i) => (
        <li key={stage} className={i <= reached ? 'done' : ''}>
          <span className="timeline__dot" />
          <strong>{stage === 'Pending' ? 'Recorded' : stage}</strong>
          <small>{i === 0 ? formatDateTime(item.createdAt) : formatDateTime(times[i])}</small>
        </li>
      ))}
    </ol>
  );
}

export default function DispatchPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { lookups, loaded, reloadLookups } = useLookups(['incidents', 'allocations', 'teams', 'shelters', 'supplies']);
  const [refreshKey, setRefreshKey] = useState(0);

  const describeAllocation = (a) => {
    const name = lookupName(lookups[RESOURCE_COLLECTION[a.resourceType]], a.resourceId);
    return a.resourceType === 'Response Team' ? name : `${a.quantity} × ${name}`;
  };

  const prefillFromAllocation = (allocationId) => {
    const a = lookups.allocations.find((x) => x.id === allocationId);
    return a ? { allocationId: a.id, incidentId: a.incidentId, resourceSummary: describeAllocation(a) } : {};
  };

  const formFields = [
    {
      name: 'allocationId',
      label: 'Linked allocation',
      type: 'select',
      col: 12,
      placeholder: 'Not linked to an allocation',
      options: (values) =>
        lookups.allocations
          .filter((a) => ['Planned', 'Allocated', 'Dispatched'].includes(a.status) || a.id === values.allocationId)
          .map((a) => ({ value: a.id, label: `${a.id} · ${a.resourceType}: ${describeAllocation(a)}` })),
      onChange: (value) => (value ? prefillFromAllocation(value) : {}),
    },
    {
      name: 'incidentId',
      label: 'Incident',
      type: 'select',
      required: true,
      col: 12,
      options: () => lookups.incidents.map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` })),
    },
    { name: 'resourceSummary', label: 'Resources dispatched', required: true, minLength: 3, col: 12, placeholder: 'e.g. 500 food packets, 2 rescue boats' },
    { name: 'origin', label: 'From (origin)', required: true, col: 6 },
    { name: 'destination', label: 'To (destination)', required: true, col: 6 },
    { name: 'vehicle', label: 'Vehicle number', required: true, col: 4, placeholder: 'KA-01-AB-1234' },
    { name: 'driver', label: 'Driver / escort', col: 4 },
    { name: 'status', label: 'Dispatch status', type: 'select', options: DISPATCH_STATUS, required: true, col: 4 },
    {
      name: 'dispatchTime',
      label: 'Dispatch time',
      type: 'datetime-local',
      col: 6,
      showIf: (v) => v.status && v.status !== 'Pending',
      required: true,
    },
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
            {d.allocationId && ` · ${d.allocationId}`}
          </div>
        </>
      ),
    },
    {
      key: 'destination',
      label: 'Route',
      render: (d) => (
        <span className="small">
          {d.origin} <span className="text-muted">→</span> {d.destination}
        </span>
      ),
    },
    { key: 'vehicle', label: 'Vehicle', render: (d) => <span className="small text-nowrap">{d.vehicle}</span> },
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
    { label: 'Origin', key: 'origin' },
    { label: 'Destination', key: 'destination' },
    { label: 'Vehicle', key: 'vehicle' },
    { label: 'Driver / escort', render: (d) => d.driver || '—' },
    { label: 'Status', render: (d) => <StatusBadge value={d.status} /> },
    { label: 'Notes', render: (d) => d.notes || '—' },
  ];

  const quickStatus = async (row, status) => {
    try {
      await dispatchService.updateStatus(row.id, status, { timestamp: new Date().toISOString() });
      toast.success(`${row.id} marked as ${status}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const canStatus = can('dispatch', 'status');

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
        { key: 'open', label: 'Open dispatches', filter: (d) => !['Completed', 'Cancelled'].includes(d.status) },
        { key: 'history', label: 'Dispatch history', filter: (d) => ['Completed', 'Cancelled'].includes(d.status) },
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
      defaultValues={{ status: 'Pending', dispatchTime: toDateTimeInput(new Date()) }}
      toFormValues={(d) => ({ ...d, allocationId: d.allocationId || '', dispatchTime: toDateTimeInput(d.dispatchTime) || toDateTimeInput(new Date()) })}
      toPayload={(v) => ({
        ...v,
        allocationId: v.allocationId || null,
        dispatchTime: v.status === 'Pending' ? null : fromDateTimeInput(v.dispatchTime),
      })}
      prefillFromParams={(params) => {
        const id = params.get('allocation');
        if (!id) return {};
        return loaded ? prefillFromAllocation(id) : null;
      }}
      detailFields={detailFields}
      renderDetailsExtra={(d) => (
        <div className="mt-4">
          <h3 className="section-title">Dispatch timeline</h3>
          {d.status === 'Cancelled' ? <p className="text-muted small">This dispatch was cancelled.</p> : <DispatchTimeline item={d} />}
        </div>
      )}
      statusConfig={{
        options: DISPATCH_STATUS,
        label: 'Dispatch status',
        title: 'Record dispatch progress',
        actionLabel: 'Record progress',
        extraFields: [
          {
            name: 'timestamp',
            label: 'Time of event',
            type: 'datetime-local',
            required: true,
            col: 12,
            help: 'Used as the dispatch, delivery or completion time',
            validate: (v) => (new Date(v) > new Date(Date.now() + 5 * 60000) ? 'Time cannot be in the future' : null),
          },
          { name: 'note', label: 'Note', type: 'textarea', rows: 2, col: 12, placeholder: 'Received by, remarks…' },
        ],
        initialExtra: () => ({ timestamp: toDateTimeInput(new Date()) }),
        toExtra: (extra) => ({ ...extra, timestamp: fromDateTimeInput(extra.timestamp) }),
      }}
      lookups={lookups}
      refreshKey={refreshKey}
      onChanged={reloadLookups}
      rowActions={(row) => [
        {
          key: 'deliver',
          label: 'Mark delivered now',
          icon: PackageCheck,
          tone: 'success',
          onClick: () => quickStatus(row, 'Delivered'),
          hidden: !canStatus || row.status !== 'In Transit',
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
