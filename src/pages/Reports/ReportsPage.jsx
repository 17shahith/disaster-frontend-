import { useState } from 'react';
import { Archive, BarChart3, Download, Eye, History, Printer, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import Spinner, { PageLoader } from '../../components/common/Spinner';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Modal from '../../components/common/Modal';
import EntityForm from '../../components/common/EntityForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ChartCard from '../../components/dashboard/ChartCard';
import ToneBarChart from '../../components/dashboard/ToneBarChart';
import reportService from '../../services/reportService';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useToast from '../../hooks/useToast';
import { CATEGORICAL, CHART_INK } from '../../utils/chartColors';
import { downloadCsv, formatDateTime, formatNumber, getErrorMessage, percent, timeAgo } from '../../utils/formatters';

const SNAPSHOT_FIELDS = [
  { name: 'title', label: 'Title', required: true, minLength: 3, maxLength: 150, col: 12, placeholder: 'e.g. 08:00 morning briefing' },
  { name: 'notes', label: 'Notes', type: 'textarea', rows: 3, maxLength: 2000, col: 12, placeholder: 'Context for whoever reads this report later' },
];

/** Saved situation reports (stored in MongoDB). Opening one shows it in place of the live report. */
function SavedReports({ items, loading, error, openingId, onOpen, onDelete, canDelete }) {
  return (
    <ChartCard title="Saved situation reports" subtitle="Snapshots of the report frozen at the time they were saved" action={<History size={16} className="text-muted" />}>
      {loading ? (
        <PageLoader label="Loading saved reports…" />
      ) : error ? (
        <p className="text-muted small mb-0">Saved reports are unavailable right now: {error}</p>
      ) : !items.length ? (
        <EmptyState title="No saved reports yet" message="Use “Save snapshot” to keep a copy of the current situation report." />
      ) : (
        <ul className="simple-list">
          {items.map((s) => (
            <li key={s.id}>
              <span className="min-w-0">
                <strong>{s.title}</strong>
                <span className="d-block small text-muted">
                  {s.createdBy} · {formatDateTime(s.createdAt)} ({timeAgo(s.createdAt)})
                </span>
                <span className="d-block small">
                  {formatNumber(s.highlights.totalIncidents)} incidents · {formatNumber(s.highlights.activeIncidents)} active ·{' '}
                  {formatNumber(s.highlights.criticalIncidents)} critical · {formatNumber(s.highlights.peopleAffected)} people affected
                </span>
                {s.notes && <span className="d-block small text-muted fst-italic">{s.notes}</span>}
              </span>
              <span className="d-flex gap-1 flex-shrink-0 no-print">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onOpen(s)} disabled={Boolean(openingId)}>
                  {openingId === s.id ? <Spinner size="sm" /> : <Eye size={14} />} Open
                </button>
                {canDelete && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(s)} aria-label={`Delete ${s.title}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

function ShelterTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip chart-tooltip--stack">
      <strong>{label}</strong>
      {payload.map((p) => (
        <span key={p.dataKey}>
          <span className="chart-tooltip__swatch" style={{ background: p.color }} /> {p.name}: {formatNumber(p.value)}
        </span>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const { data: liveData, loading, error, reload } = useFetch(() => reportService.getSummary(), []);
  const saved = useFetch(() => reportService.listSnapshots(), [], []);
  const [snapshot, setSnapshot] = useState(null); // saved report currently shown instead of the live one
  const [openingId, setOpeningId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const data = snapshot?.report || liveData;

  const openSnapshot = async (item) => {
    setOpeningId(item.id);
    try {
      setSnapshot(await reportService.getSnapshot(item.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setOpeningId(null);
    }
  };

  const saveSnapshot = async (values) => {
    try {
      const created = await reportService.saveSnapshot(values);
      toast.success(`“${created.title}” saved`, 'Situation report saved');
      setSaving(false);
      await saved.reload({ silent: true });
      reload({ silent: true }); // the live report shows the moment it was saved
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const deleteSnapshot = async () => {
    try {
      await reportService.deleteSnapshot(deleting.id);
      toast.success(`“${deleting.title}” deleted`);
      if (snapshot?.id === deleting.id) setSnapshot(null);
      setDeleting(null);
      await saved.reload({ silent: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ...Object.entries(data.totals).map(([k, v]) => ({ section: 'Totals', metric: k, value: v, total: '' })),
      ...data.incidentsByType.map((r) => ({ section: 'Incidents by type', metric: r.name, value: r.value, total: '' })),
      ...data.incidentsBySeverity.map((r) => ({ section: 'Incidents by severity', metric: r.name, value: r.value, total: '' })),
      ...data.incidentsByStatus.map((r) => ({ section: 'Incidents by status', metric: r.name, value: r.value, total: '' })),
      ...data.resourceUtilization.map((r) => ({ section: 'Resource utilisation', metric: r.name, value: r.used, total: r.total })),
      ...data.shelterOccupancy.map((r) => ({ section: 'Shelter occupancy', metric: r.name, value: r.occupancy, total: r.capacity })),
      ...data.teamAvailability.map((r) => ({ section: 'Team availability', metric: r.name, value: r.value, total: '' })),
      ...data.supplyLevels.map((r) => ({ section: 'Supply levels', metric: r.name, value: r.quantity, total: r.dispatched })),
      ...Object.entries(data.completedOperations).map(([k, v]) => ({ section: 'Completed operations', metric: k, value: v, total: '' })),
    ];
    const day = (snapshot ? new Date(snapshot.generatedAt) : new Date()).toISOString().slice(0, 10);
    downloadCsv(`situation-report-${day}${snapshot ? '-saved' : ''}.csv`, rows);
    toast.success('Situation report exported as CSV');
  };

  const t = data?.totals || {};
  const ops = data?.completedOperations || {};

  return (
    <div className="page report-page">
      <PageHeader
        title="Reports & Situation Summary"
        subtitle={data ? `${snapshot ? 'Saved report · generated' : 'Generated'} ${formatDateTime(data.generatedAt)}` : 'Consolidated operational picture'}
        icon={BarChart3}
        actions={
          <div className="d-flex gap-2 no-print">
            <button type="button" className="btn btn-outline-secondary" onClick={() => { setSnapshot(null); reload(); saved.reload({ silent: true }); }} disabled={loading}>
              <RefreshCw size={16} /> <span className="d-none d-sm-inline">Refresh</span>
            </button>
            {can('reports', 'snapshot') && !snapshot && (
              <button type="button" className="btn btn-outline-primary" onClick={() => setSaving(true)} disabled={!liveData}>
                <Save size={16} /> <span className="d-none d-sm-inline">Save snapshot</span>
              </button>
            )}
            <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()} disabled={!data}>
              <Printer size={16} /> <span className="d-none d-sm-inline">Print</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={exportCsv} disabled={!data}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        }
      />

      {snapshot && (
        <div className="alert-banner alert-banner--info" role="status">
          <Archive size={20} className="flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Viewing saved report “{snapshot.title}”</strong>
            <div className="small">
              Saved by {snapshot.createdBy} on {formatDateTime(snapshot.createdAt)}. Figures are frozen at that time.
              {snapshot.notes && <> Notes: {snapshot.notes}</>}
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-primary no-print" onClick={() => setSnapshot(null)}>
            Back to live report
          </button>
        </div>
      )}

      {error && !snapshot && <ErrorState message={error} onRetry={() => reload()} />}
      {loading && !data && <PageLoader label="Compiling situation report…" />}

      {data && (
        <>
          <div className="summary-strip">
            <div><span>Total incidents</span><strong>{formatNumber(t.incidents)}</strong></div>
            <div className="text-danger-emphasis"><span>Active incidents</span><strong>{formatNumber(t.activeIncidents)}</strong></div>
            <div><span>Resolved / closed</span><strong>{formatNumber(t.resolvedIncidents)}</strong></div>
            <div><span>People affected</span><strong>{formatNumber(t.peopleAffected)}</strong></div>
            <div><span>Requests fulfilled</span><strong>{formatNumber(t.fulfilledRequests)} / {formatNumber(t.requests)}</strong></div>
            <div><span>Dispatches</span><strong>{formatNumber(t.dispatches)}</strong></div>
          </div>

          <div className="grid-2">
            <ChartCard title="Incident distribution by type" subtitle="All registered incidents">
              <ToneBarChart data={data.incidentsByType} unit="incidents" layout="vertical" height={Math.max(220, data.incidentsByType.length * 40)} />
            </ChartCard>
            <ChartCard title="Incidents by severity" subtitle="Across all statuses">
              <ToneBarChart data={data.incidentsBySeverity} unit="incidents" />
            </ChartCard>
          </div>

          <div className="grid-2">
            <ChartCard title="Resource utilisation" subtitle="Share of each resource pool currently in use">
              <ul className="utilisation-list">
                {data.resourceUtilization.map((r) => (
                  <li key={r.name}>
                    <div className="d-flex justify-content-between small mb-1">
                      <strong>{r.name}</strong>
                      <span className="text-muted">
                        {formatNumber(r.used)} of {formatNumber(r.total)} ({percent(r.used, r.total)}%)
                      </span>
                    </div>
                    <ProgressBar value={r.used} max={r.total} showLabel={false} />
                  </li>
                ))}
              </ul>
              <h3 className="section-title mt-4">Completed operations</h3>
              <div className="ops-grid">
                <div><strong>{ops.incidentsResolved}</strong><span>Incidents resolved</span></div>
                <div><strong>{ops.requestsFulfilled}</strong><span>Requests fulfilled</span></div>
                <div><strong>{ops.allocations}</strong><span>Allocations completed</span></div>
                <div><strong>{ops.dispatches}</strong><span>Dispatches completed</span></div>
              </div>
            </ChartCard>
            <ChartCard title="Team availability" subtitle="Current status of all response teams">
              <ToneBarChart data={data.teamAvailability} unit="teams" />
            </ChartCard>
          </div>

          <ChartCard title="Shelter occupancy" subtitle="Occupied beds versus capacity per shelter">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.shelterOccupancy} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: CHART_INK.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: CHART_INK.grid }} interval={0} tickFormatter={(v) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
                <YAxis tick={{ fill: CHART_INK.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(15, 27, 51, 0.05)' }} content={<ShelterTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: CHART_INK.text }} />
                <Bar dataKey="capacity" name="Capacity" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                <Bar dataKey="occupancy" name="Occupied" fill={CATEGORICAL[1]} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
            <div className="table-responsive mt-3">
              <table className="table app-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Shelter</th>
                    <th className="text-end">Capacity</th>
                    <th className="text-end">Occupied</th>
                    <th className="text-end">Free beds</th>
                    <th>Occupancy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shelterOccupancy.map((s) => (
                    <tr key={s.name}>
                      <td className="fw-semibold">{s.name}</td>
                      <td className="text-end">{formatNumber(s.capacity)}</td>
                      <td className="text-end">{formatNumber(s.occupancy)}</td>
                      <td className="text-end">{formatNumber(Math.max(0, s.capacity - s.occupancy))}</td>
                      <td style={{ minWidth: 140 }}><ProgressBar value={s.occupancy} max={s.capacity} /></td>
                      <td><StatusBadge value={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Relief supply levels" subtitle="Current stock, total dispatched and low-stock threshold">
            <div className="table-responsive">
              <table className="table app-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">In stock</th>
                    <th className="text-end">Threshold</th>
                    <th className="text-end">Dispatched</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.supplyLevels.map((s) => {
                    const level = s.quantity <= 0 ? 'Out of Stock' : s.quantity <= s.minThreshold ? 'Low Stock' : 'In Stock';
                    return (
                      <tr key={s.name}>
                        <td className="fw-semibold">{s.name}</td>
                        <td className="text-end">{formatNumber(s.quantity)} {s.unit}</td>
                        <td className="text-end">{formatNumber(s.minThreshold)}</td>
                        <td className="text-end">{formatNumber(s.dispatched)}</td>
                        <td><StatusBadge value={level} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}

      <div className="no-print">
        <SavedReports
          items={saved.data || []}
          loading={saved.loading}
          error={saved.error}
          openingId={openingId}
          onOpen={openSnapshot}
          onDelete={setDeleting}
          canDelete={can('reports', 'deleteSnapshot')}
        />
      </div>

      <Modal open={saving} title="Save situation report" subtitle="Freezes the current report so it can be reviewed later" onClose={() => setSaving(false)} size="sm" closeOnBackdrop={false}>
        {saving && <EntityForm fields={SNAPSHOT_FIELDS} initialValues={{}} onSubmit={saveSnapshot} onCancel={() => setSaving(false)} submitLabel="Save snapshot" />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete saved report?"
        message={deleting && <><strong>{deleting.title}</strong> will be permanently removed. This action cannot be undone.</>}
        onConfirm={deleteSnapshot}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
