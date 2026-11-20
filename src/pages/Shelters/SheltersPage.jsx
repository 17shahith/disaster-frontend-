import { useState } from 'react';
import { BedDouble, Home, UsersRound } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Modal from '../../components/common/Modal';
import EntityForm from '../../components/common/EntityForm';
import shelterService from '../../services/shelterService';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { ACTIVE_SHELTER_STATUS, SHELTER_STATUS } from '../../utils/constants';
import { formatDateTime, formatNumber, getErrorMessage, percent } from '../../utils/formatters';

const freeBeds = (s) => Math.max(0, Number(s.capacity) - Number(s.occupancy));

const FORM_FIELDS = [
  { name: 'name', label: 'Shelter name', required: true, minLength: 3, col: 8 },
  { name: 'status', label: 'Availability', type: 'select', options: SHELTER_STATUS, required: true, col: 4, help: 'Set to Full automatically when occupancy reaches capacity' },
  { name: 'location', label: 'Location / address', required: true, col: 12 },
  { name: 'capacity', label: 'Capacity (beds)', type: 'number', min: 1, required: true, col: 4 },
  {
    name: 'occupancy',
    label: 'Current occupancy',
    type: 'number',
    min: 0,
    required: true,
    col: 4,
    validate: (v, values) => (Number(v) > Number(values.capacity) ? 'Occupancy cannot exceed capacity' : null),
  },
  { name: 'contact', label: 'Contact number', type: 'tel', required: true, col: 4 },
  { name: 'managerName', label: 'Shelter manager', required: true, col: 6 },
  { name: 'facilities', label: 'Facilities', col: 6, placeholder: 'Kitchen, toilets, medical desk…' },
];

const columns = [
  {
    key: 'name',
    label: 'Shelter',
    render: (s) => (
      <>
        <div className="fw-semibold">{s.name}</div>
        <div className="small text-muted">{s.id} · {s.location}</div>
      </>
    ),
  },
  { key: 'capacity', label: 'Capacity', className: 'text-end', render: (s) => formatNumber(s.capacity), sortValue: (s) => Number(s.capacity) },
  { key: 'occupancy', label: 'Occupied', className: 'text-end', render: (s) => formatNumber(s.occupancy), sortValue: (s) => Number(s.occupancy) },
  { key: 'beds', label: 'Available beds', className: 'text-end fw-semibold', render: (s) => formatNumber(freeBeds(s)), sortValue: freeBeds },
  { key: 'utilisation', label: 'Occupancy', render: (s) => <ProgressBar value={s.occupancy} max={s.capacity} />, sortValue: (s) => percent(s.occupancy, s.capacity) },
  { key: 'status', label: 'Status', render: (s) => <StatusBadge value={s.status} /> },
];

const detailFields = [
  { label: 'Shelter name', key: 'name' },
  { label: 'Status', render: (s) => <StatusBadge value={s.status} /> },
  { label: 'Location', key: 'location', full: true },
  { label: 'Capacity', render: (s) => `${formatNumber(s.capacity)} beds` },
  { label: 'Occupancy', render: (s) => `${formatNumber(s.occupancy)} people (${percent(s.occupancy, s.capacity)}%)` },
  { label: 'Available beds', render: (s) => formatNumber(freeBeds(s)) },
  { label: 'Manager', key: 'managerName' },
  { label: 'Contact', render: (s) => <a href={`tel:${s.contact}`}>{s.contact}</a> },
  { label: 'Facilities', key: 'facilities' },
  { label: 'Last updated', render: (s) => formatDateTime(s.updatedAt), full: true },
];

function ShelterSummary({ items }) {
  const open = items.filter((s) => ACTIVE_SHELTER_STATUS.includes(s.status));
  const capacity = open.reduce((a, s) => a + Number(s.capacity), 0);
  const occupancy = open.reduce((a, s) => a + Number(s.occupancy), 0);
  return (
    <div className="mini-stats">
      <div className="mini-stat">
        <Home size={18} />
        <div><strong>{open.length}</strong><span>Active shelters</span></div>
      </div>
      <div className="mini-stat">
        <UsersRound size={18} />
        <div><strong>{formatNumber(occupancy)}</strong><span>People sheltered</span></div>
      </div>
      <div className="mini-stat mini-stat--success">
        <BedDouble size={18} />
        <div><strong>{formatNumber(Math.max(0, capacity - occupancy))}</strong><span>Beds available</span></div>
      </div>
      <div className="mini-stat mini-stat--wide">
        <div className="w-100">
          <span className="small text-muted">Overall occupancy of active shelters</span>
          <ProgressBar value={occupancy} max={capacity} />
        </div>
      </div>
    </div>
  );
}

export default function SheltersPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [occupancyItem, setOccupancyItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const updateOccupancy = async ({ occupancy }) => {
    try {
      await shelterService.updateOccupancy(occupancyItem.id, occupancy);
      toast.success(`${occupancyItem.name}: occupancy updated to ${occupancy}`);
      setOccupancyItem(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return (
    <>
      <CrudPage
        module="shelters"
        title="Shelter Management"
        subtitle="Monitor shelter capacity, occupancy and available beds"
        icon={Home}
        entityName="Shelter"
        createLabel="Register Shelter"
        service={shelterService}
        columns={columns}
        searchKeys={['id', 'name', 'location', 'managerName', 'facilities']}
        searchPlaceholder="Search shelters by name, location, manager…"
        filters={[{ key: 'status', label: 'statuses', options: SHELTER_STATUS }]}
        formFields={FORM_FIELDS}
        defaultValues={{ status: 'Open', occupancy: 0 }}
        detailFields={detailFields}
        statusConfig={{ options: SHELTER_STATUS, label: 'Availability', title: 'Update shelter availability', actionLabel: 'Update availability' }}
        renderHeader={(items) => <ShelterSummary items={items} />}
        refreshKey={refreshKey}
        rowActions={(row) => [
          { key: 'occupancy', label: 'Update occupancy', icon: UsersRound, tone: 'success', onClick: () => setOccupancyItem(row), hidden: !can('shelters', 'status') },
        ]}
      />

      <Modal open={Boolean(occupancyItem)} title="Update occupancy" subtitle={occupancyItem && `${occupancyItem.name} · capacity ${occupancyItem.capacity}`} onClose={() => setOccupancyItem(null)} size="sm">
        {occupancyItem && (
          <EntityForm
            key={occupancyItem.id}
            fields={[
              {
                name: 'occupancy',
                label: 'Current occupancy',
                type: 'number',
                min: 0,
                max: Number(occupancyItem.capacity),
                required: true,
                col: 12,
                help: `Capacity: ${occupancyItem.capacity} beds`,
              },
            ]}
            initialValues={{ occupancy: occupancyItem.occupancy }}
            onSubmit={updateOccupancy}
            onCancel={() => setOccupancyItem(null)}
            submitLabel="Update"
          />
        )}
      </Modal>
    </>
  );
}
