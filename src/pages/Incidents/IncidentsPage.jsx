import { MapPin, Siren } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import incidentService from '../../services/incidentService';
import { INCIDENT_STATUS, INCIDENT_TYPES, OPEN_INCIDENT_STATUS, SEVERITY_LEVELS } from '../../utils/constants';
import { formatDateTime, formatNumber, fromDateTimeInput, timeAgo, toDateTimeInput } from '../../utils/formatters';

const SEVERITY_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const coordinate = (label, min, max) => ({
  type: 'number',
  step: 'any',
  col: 3,
  validate: (v) => (v !== '' && v !== null && (Number(v) < min || Number(v) > max) ? `${label} must be between ${min} and ${max}` : null),
});

const FORM_FIELDS = [
  { name: 'title', label: 'Incident title', required: true, minLength: 5, maxLength: 120, col: 12, placeholder: 'e.g. Riverbank flooding in Ward 12' },
  { name: 'type', label: 'Incident type', type: 'select', options: INCIDENT_TYPES, required: true, col: 4 },
  { name: 'severity', label: 'Severity', type: 'select', options: SEVERITY_LEVELS, required: true, col: 4 },
  // A new incident cannot start as Completed/Closed; reopening is done by setting an open status.
  { name: 'status', label: 'Status', type: 'select', options: (v) => (v.id ? INCIDENT_STATUS : OPEN_INCIDENT_STATUS), required: true, col: 4 },
  { name: 'location', label: 'Location / address', required: true, minLength: 3, col: 6, placeholder: 'Area, landmark, district' },
  { name: 'latitude', label: 'Latitude', ...coordinate('Latitude', -90, 90) },
  { name: 'longitude', label: 'Longitude', ...coordinate('Longitude', -180, 180) },
  { name: 'affectedPeople', label: 'People affected (est.)', type: 'number', min: 0, col: 4 },
  { name: 'reportedBy', label: 'Reported by', required: true, col: 4, placeholder: 'Agency or person' },
  { name: 'reportedAt', label: 'Reported at', type: 'datetime-local', required: true, col: 4 },
  { name: 'description', label: 'Description', type: 'textarea', required: true, minLength: 10, col: 12, rows: 3 },
];

const columns = [
  {
    key: 'title',
    label: 'Incident',
    render: (r) => (
      <>
        <div className="fw-semibold">{r.title}</div>
        <div className="small text-muted">{r.id} · {r.type}</div>
      </>
    ),
  },
  {
    key: 'location',
    label: 'Location',
    render: (r) => (
      <span className="small d-inline-flex gap-1 align-items-start">
        <MapPin size={14} className="mt-1 flex-shrink-0 text-muted" />
        {r.location}
      </span>
    ),
  },
  { key: 'severity', label: 'Severity', render: (r) => <StatusBadge value={r.severity} />, sortValue: (r) => SEVERITY_RANK[r.severity] },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  { key: 'affectedPeople', label: 'Affected', className: 'text-end', render: (r) => formatNumber(r.affectedPeople), sortValue: (r) => Number(r.affectedPeople) || 0 },
  { key: 'reportedAt', label: 'Reported', render: (r) => <span className="small text-nowrap" title={formatDateTime(r.reportedAt)}>{timeAgo(r.reportedAt)}</span> },
];

const detailFields = [
  { label: 'Title', key: 'title', full: true },
  { label: 'Type', key: 'type' },
  { label: 'Severity', render: (i) => <StatusBadge value={i.severity} /> },
  { label: 'Status', render: (i) => <StatusBadge value={i.status} /> },
  { label: 'People affected', render: (i) => formatNumber(i.affectedPeople) },
  { label: 'Location', key: 'location', full: true },
  {
    label: 'Coordinates',
    render: (i) =>
      i.latitude && i.longitude ? (
        <a href={`https://www.openstreetmap.org/?mlat=${i.latitude}&mlon=${i.longitude}#map=14/${i.latitude}/${i.longitude}`} target="_blank" rel="noreferrer">
          {i.latitude}, {i.longitude} (open map)
        </a>
      ) : (
        '—'
      ),
  },
  { label: 'Reported by', key: 'reportedBy' },
  { label: 'Registered by', render: (i) => i.registeredBy || '—' },
  { label: 'Reported at', render: (i) => formatDateTime(i.reportedAt) },
  { label: 'Last updated', render: (i) => formatDateTime(i.updatedAt) },
  { label: 'Description', key: 'description', full: true },
];

export default function IncidentsPage() {
  return (
    <CrudPage
      module="incidents"
      title="Incident Management"
      subtitle="Register, classify and track every reported incident"
      icon={Siren}
      entityName="Incident"
      createLabel="Register Incident"
      service={incidentService}
      columns={columns}
      searchKeys={['id', 'title', 'type', 'location', 'reportedBy', 'description']}
      searchPlaceholder="Search incidents by title, ID, location…"
      filters={[
        { key: 'status', label: 'statuses', options: INCIDENT_STATUS },
        { key: 'severity', label: 'severities', options: SEVERITY_LEVELS },
        { key: 'type', label: 'types', options: INCIDENT_TYPES },
      ]}
      formFields={FORM_FIELDS}
      defaultValues={{ status: 'Reported', severity: '', affectedPeople: 0, reportedAt: toDateTimeInput(new Date()) }}
      toFormValues={(i) => ({ ...i, reportedAt: toDateTimeInput(i.reportedAt) })}
      toPayload={(v) => ({
        ...v,
        latitude: v.latitude === '' || v.latitude == null ? null : Number(v.latitude),
        longitude: v.longitude === '' || v.longitude == null ? null : Number(v.longitude),
        reportedAt: fromDateTimeInput(v.reportedAt),
      })}
      detailFields={detailFields}
      statusConfig={{ options: INCIDENT_STATUS, label: 'Incident status' }}
    />
  );
}
