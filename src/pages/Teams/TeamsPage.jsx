import { useState } from 'react';
import { Link2, Users } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import { PageLoader } from '../../components/common/Spinner';
import AllocationFormModal from '../Allocations/AllocationFormModal';
import teamService from '../../services/teamService';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useLookups, { lookupName } from '../../hooks/useLookups';
import { TEAM_STATUS, TEAM_TYPES } from '../../utils/constants';
import { formatDateTime, timeAgo } from '../../utils/formatters';

const FORM_FIELDS = [
  { name: 'name', label: 'Team name', required: true, minLength: 3, col: 8 },
  { name: 'type', label: 'Team type', type: 'select', options: TEAM_TYPES, required: true, col: 4 },
  { name: 'leader', label: 'Team leader', required: true, col: 6 },
  { name: 'contact', label: 'Contact number', type: 'tel', required: true, col: 6 },
  { name: 'members', label: 'Members', type: 'number', min: 1, max: 500, required: true, col: 4 },
  { name: 'baseLocation', label: 'Base location', required: true, col: 4 },
  { name: 'status', label: 'Availability', type: 'select', options: TEAM_STATUS, required: true, col: 4 },
];

function TeamAssignments({ teamId, lookups }) {
  const { data, loading } = useFetch(() => teamService.getAssignments(teamId), [teamId], []);
  return (
    <div className="mt-4">
      <h3 className="section-title">Assignment history</h3>
      {loading ? (
        <PageLoader label="Loading assignments…" />
      ) : data.length ? (
        <ul className="simple-list">
          {[...data]
            .sort((a, b) => String(b.allocatedAt).localeCompare(String(a.allocatedAt)))
            .map((a) => (
              <li key={a.id}>
                <span>
                  <strong>{a.id}</strong> · {lookupName(lookups.incidents, a.incidentId)}
                  <span className="d-block small text-muted">{formatDateTime(a.allocatedAt)}</span>
                </span>
                <StatusBadge value={a.status} />
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-muted small mb-0">This team has not been assigned to any incident yet.</p>
      )}
    </div>
  );
}

export default function TeamsPage() {
  const { can } = useAuth();
  const { lookups, reloadLookups } = useLookups(['incidents', 'requests', 'teams', 'shelters', 'supplies']);
  const [assigning, setAssigning] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns = [
    {
      key: 'name',
      label: 'Team',
      render: (t) => (
        <>
          <div className="fw-semibold">{t.name}</div>
          <div className="small text-muted">{t.id} · {t.type}</div>
        </>
      ),
    },
    {
      key: 'leader',
      label: 'Leader',
      render: (t) => (
        <>
          <div className="small">{t.leader}</div>
          <div className="small text-muted">{t.contact}</div>
        </>
      ),
    },
    { key: 'members', label: 'Members', className: 'text-end', sortValue: (t) => Number(t.members) },
    { key: 'baseLocation', label: 'Base' },
    { key: 'status', label: 'Availability', render: (t) => <StatusBadge value={t.status} /> },
    {
      key: 'currentIncidentId',
      label: 'Current assignment',
      render: (t) => (t.currentIncidentId ? <span className="small">{lookupName(lookups.incidents, t.currentIncidentId)}</span> : <span className="small text-muted">—</span>),
    },
  ];

  const detailFields = [
    { label: 'Team name', key: 'name' },
    { label: 'Type', key: 'type' },
    { label: 'Leader', key: 'leader' },
    { label: 'Contact', render: (t) => <a href={`tel:${t.contact}`}>{t.contact}</a> },
    { label: 'Members', key: 'members' },
    { label: 'Base location', key: 'baseLocation' },
    { label: 'Availability', render: (t) => <StatusBadge value={t.status} /> },
    { label: 'Current assignment', render: (t) => lookupName(lookups.incidents, t.currentIncidentId) },
    { label: 'Last updated', render: (t) => `${formatDateTime(t.updatedAt)} (${timeAgo(t.updatedAt)})`, full: true },
  ];

  return (
    <>
      <CrudPage
        module="teams"
        title="Response Teams"
        subtitle="Register teams, manage availability and assign them to incidents"
        icon={Users}
        entityName="Team"
        createLabel="Register Team"
        service={teamService}
        columns={columns}
        searchKeys={['id', 'name', 'type', 'leader', 'baseLocation']}
        searchPlaceholder="Search teams by name, leader, base…"
        filters={[
          { key: 'status', label: 'availability', options: TEAM_STATUS },
          { key: 'type', label: 'team types', options: TEAM_TYPES },
        ]}
        formFields={FORM_FIELDS}
        defaultValues={{ status: 'Available', members: 10 }}
        detailFields={detailFields}
        renderDetailsExtra={(t) => <TeamAssignments teamId={t.id} lookups={lookups} />}
        statusConfig={{ options: TEAM_STATUS, label: 'Availability', title: 'Update team availability', actionLabel: 'Update availability' }}
        lookups={lookups}
        refreshKey={refreshKey}
        onChanged={reloadLookups}
        rowActions={(row) => [
          {
            key: 'assign',
            label: 'Assign to incident',
            icon: Link2,
            tone: 'success',
            onClick: () => setAssigning(row),
            hidden: !can('teams', 'assign') || row.status !== 'Available',
          },
        ]}
      />

      <AllocationFormModal
        open={Boolean(assigning)}
        title="Assign team to incident"
        subtitle={assigning && `${assigning.id} · ${assigning.name}`}
        initialValues={assigning ? { resourceType: 'Response Team', resourceId: assigning.id } : {}}
        lockedFields={['resourceType', 'resourceId']}
        lookups={lookups}
        onClose={() => setAssigning(null)}
        onSaved={async () => {
          await reloadLookups();
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
