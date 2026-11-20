import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  BedDouble,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Network,
  RefreshCw,
  Siren,
  Truck,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { PageLoader } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/EmptyState';
import EmptyState from '../../components/common/EmptyState';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import ToneBarChart from '../../components/dashboard/ToneBarChart';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import dashboardService from '../../services/dashboardService';
import useFetch from '../../hooks/useFetch';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';
import { formatNumber, timeAgo } from '../../utils/formatters';

const QUICK_ACTIONS = [
  { module: 'incidents', label: 'Register incident', to: '/incidents?new=1', icon: Siren },
  { module: 'requests', label: 'New request', to: '/requests?new=1', icon: ClipboardList },
  { module: 'allocations', label: 'Allocate resources', to: '/allocations?new=1', icon: Network },
  { module: 'dispatch', label: 'Record dispatch', to: '/dispatch?new=1', icon: Truck },
  { module: 'teams', label: 'Register team', to: '/teams?new=1', icon: Users },
  { module: 'supplies', label: 'Add supplies', to: '/supplies?new=1', icon: Boxes },
];

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardService.getSummary(), []);
  const s = data?.stats || {};
  const link = (module, path) => (can(module) ? path : undefined);

  const actions = QUICK_ACTIONS.filter((a) => can(a.module, 'create')).slice(0, 3);

  return (
    <div className="page">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
        subtitle={`${ROLE_LABELS[user?.role]} · Situation overview across all active operations`}
        icon={LayoutDashboard}
        actions={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => reload()} disabled={loading}>
              <RefreshCw size={16} /> <span className="d-none d-sm-inline">Refresh</span>
            </button>
            {actions.map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to} className="btn btn-primary">
                <Icon size={16} /> {label}
              </Link>
            ))}
          </>
        }
      />

      {error && <ErrorState message={error} onRetry={() => reload()} />}
      {loading && !data && <PageLoader label="Loading situation overview…" />}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Total incidents" value={s.totalIncidents} icon={Siren} tone="info" hint="All registered incidents" to={link('incidents', '/incidents')} />
            <StatCard
              label="Active emergencies"
              value={s.activeEmergencies}
              icon={AlertOctagon}
              tone="danger"
              hint={`${formatNumber(s.criticalIncidents)} critical · require immediate response`}
              to={link('incidents', '/incidents')}
            />
            <StatCard label="Pending requests" value={s.pendingRequests} icon={ClipboardList} tone="warning" hint="Awaiting resource assignment" to={link('requests', '/requests')} />
            <StatCard label="Available teams" value={s.availableTeams} icon={Users} tone="success" hint={`of ${formatNumber(s.totalTeams)} registered teams`} to={link('teams', '/teams')} />
            <StatCard label="Active shelters" value={s.activeShelters} icon={BedDouble} tone="info" hint={`${formatNumber(s.availableBeds)} beds available`} to={link('shelters', '/shelters')} />
            <StatCard
              label="Relief supplies available"
              value={s.availableSupplies}
              icon={Boxes}
              tone={s.lowStockItems ? 'warning' : 'info'}
              hint={s.lowStockItems ? `${s.lowStockItems} item(s) at low stock` : 'All items above threshold'}
              to={link('supplies', '/supplies')}
            />
            <StatCard
              label="Dispatched resources"
              value={s.dispatchedResources}
              icon={Truck}
              tone="warning"
              hint={`On the road · ${formatNumber(s.activeAllocations)} active allocations`}
              to={link('dispatch', '/dispatch')}
            />
            <StatCard label="Completed operations" value={s.completedOperations} icon={CheckCircle2} tone="success" hint="Allocations & dispatches closed" to={link('allocations', '/allocations')} />
          </div>

          <div className="grid-2">
            <ChartCard title="Incident status" subtitle="Number of incidents in each stage">
              <ToneBarChart data={data.incidentStatus} unit="incidents" />
            </ChartCard>
            <ChartCard title="Emergency priority" subtitle="Open incidents and requests by severity / priority">
              <ToneBarChart data={data.priorityDistribution} unit="open items" layout="vertical" />
            </ChartCard>
          </div>

          <div className="grid-3">
            <ChartCard
              title="Recent incidents"
              action={can('incidents') && <Link to="/incidents" className="small">View all</Link>}
              className="grid-3__wide"
            >
              {data.recentIncidents.length ? (
                <div className="table-responsive">
                  <table className="table app-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Incident</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th className="text-end">Reported</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentIncidents.map((i) => (
                        <tr key={i.id}>
                          <td>
                            <Link to={`/incidents?view=${i.id}`} className="fw-semibold text-reset text-decoration-none">
                              {i.title}
                            </Link>
                            <div className="small text-muted">
                              {i.id} · {i.location}
                            </div>
                          </td>
                          <td><StatusBadge value={i.severity} /></td>
                          <td><StatusBadge value={i.status} /></td>
                          <td className="text-end small text-muted text-nowrap">{timeAgo(i.reportedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No incidents registered" />
              )}
            </ChartCard>

            <ChartCard title="Recent activity" action={<Activity size={16} className="text-muted" />}>
              <ActivityFeed items={data.recentActivities} />
            </ChartCard>
          </div>

          <ChartCard title="Recent resource allocations" action={can('allocations') && <Link to="/allocations" className="small">View all</Link>}>
            {data.recentAllocations.length ? (
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Allocation</th>
                      <th>Resource</th>
                      <th>Incident</th>
                      <th>Status</th>
                      <th className="text-end">Allocated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAllocations.map((a) => (
                      <tr key={a.id}>
                        <td className="fw-semibold">{a.id}</td>
                        <td>
                          {a.resourceName}
                          <div className="small text-muted">
                            {a.resourceType}
                            {a.resourceType !== 'Response Team' && a.quantity ? ` · ${formatNumber(a.quantity)}` : ''}
                          </div>
                        </td>
                        <td className="small">{a.incidentTitle}</td>
                        <td><StatusBadge value={a.status} /></td>
                        <td className="text-end small text-muted text-nowrap">{timeAgo(a.allocatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No allocations yet" />
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
