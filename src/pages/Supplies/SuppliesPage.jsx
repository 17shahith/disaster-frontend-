import { useState } from 'react';
import { AlertTriangle, Boxes, PackagePlus } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import EntityForm from '../../components/common/EntityForm';
import supplyService from '../../services/supplyService';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { SUPPLY_CATEGORIES, SUPPLY_UNITS } from '../../utils/constants';
import { formatDateTime, formatNumber, getErrorMessage } from '../../utils/formatters';

/** Based on available stock (physical stock minus quantities reserved by active allocations). */
const stockLevel = (s) => (Number(s.available) <= 0 ? 'Out of Stock' : Number(s.available) <= Number(s.minThreshold) ? 'Low Stock' : 'In Stock');

const FORM_FIELDS = [
  { name: 'name', label: 'Item name', required: true, minLength: 2, col: 8 },
  { name: 'category', label: 'Category', type: 'select', options: SUPPLY_CATEGORIES, required: true, col: 4 },
  {
    name: 'quantity',
    label: 'Quantity in stock',
    type: 'number',
    min: 0,
    required: true,
    col: 4,
    validate: (v, values) => (values.id && Number(v) < Number(values.reserved) ? `${values.reserved} are reserved by active allocations` : null),
  },
  // Keep a unit that is not in the preset list (e.g. created through the API) selectable.
  { name: 'unit', label: 'Unit', type: 'select', options: (v) => (v.unit && !SUPPLY_UNITS.includes(v.unit) ? [v.unit, ...SUPPLY_UNITS] : SUPPLY_UNITS), required: true, col: 4 },
  { name: 'minThreshold', label: 'Low-stock threshold', type: 'number', min: 0, required: true, col: 4, help: 'Alert when available stock falls to this level' },
  { name: 'warehouse', label: 'Warehouse / storage location', required: true, col: 12 },
];

// Stock leaves the warehouse only through allocations and dispatch records, which keeps reservations consistent.
const ADJUST_TYPES = [
  { value: 'RESTOCK', label: 'Restock (add to inventory)' },
  { value: 'CORRECTION', label: 'Stock count correction (set exact quantity)' },
];

const columns = [
  {
    key: 'name',
    label: 'Item',
    render: (s) => (
      <>
        <div className="fw-semibold">{s.name}</div>
        <div className="small text-muted">{s.id} · {s.category}</div>
      </>
    ),
  },
  {
    key: 'available',
    label: 'Available',
    className: 'text-end fw-semibold',
    render: (s) => (
      <>
        {formatNumber(s.available)} {s.unit}
        {s.reserved > 0 && <div className="small text-muted fw-normal">{formatNumber(s.quantity)} in stock · {formatNumber(s.reserved)} reserved</div>}
      </>
    ),
    sortValue: (s) => Number(s.available),
  },
  { key: 'minThreshold', label: 'Threshold', className: 'text-end', render: (s) => formatNumber(s.minThreshold), sortValue: (s) => Number(s.minThreshold) },
  { key: 'dispatched', label: 'Dispatched', className: 'text-end', render: (s) => formatNumber(s.dispatched), sortValue: (s) => Number(s.dispatched) },
  { key: 'stock', label: 'Stock level', render: (s) => <StatusBadge value={stockLevel(s)} />, sortValue: (s) => Number(s.available) - Number(s.minThreshold) },
  { key: 'warehouse', label: 'Warehouse' },
];

const detailFields = [
  { label: 'Item', key: 'name' },
  { label: 'Category', key: 'category' },
  { label: 'Available', render: (s) => `${formatNumber(s.available)} ${s.unit}` },
  { label: 'In stock / reserved', render: (s) => `${formatNumber(s.quantity)} in stock · ${formatNumber(s.reserved)} reserved for allocations` },
  { label: 'Stock level', render: (s) => <StatusBadge value={stockLevel(s)} /> },
  { label: 'Low-stock threshold', render: (s) => `${formatNumber(s.minThreshold)} ${s.unit}` },
  { label: 'Total dispatched', render: (s) => `${formatNumber(s.dispatched)} ${s.unit}` },
  { label: 'Warehouse', key: 'warehouse' },
  { label: 'Last updated', render: (s) => formatDateTime(s.updatedAt) },
];

function LowStockAlerts({ items }) {
  const low = items.filter((s) => stockLevel(s) !== 'In Stock');
  if (!low.length) return null;
  return (
    <div className="alert-banner alert-banner--danger" role="alert">
      <AlertTriangle size={20} className="flex-shrink-0" />
      <div>
        <strong>{low.length} item(s) at or below the low-stock threshold</strong>
        <ul>
          {low.map((s) => (
            <li key={s.id}>
              {s.name}: <strong>{formatNumber(s.available)}</strong> {s.unit} available (threshold {formatNumber(s.minThreshold)})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SuppliesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [adjusting, setAdjusting] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const adjustStock = async (values) => {
    try {
      const updated = await supplyService.adjustStock(adjusting.id, values);
      toast.success(`${adjusting.name}: stock is now ${formatNumber(updated?.quantity)} ${adjusting.unit}`);
      setAdjusting(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return (
    <>
      <CrudPage
        module="supplies"
        title="Relief Supplies"
        subtitle="Manage inventory, track dispatched quantities and watch low-stock alerts"
        icon={Boxes}
        entityName="Supply Item"
        createLabel="Add Supplies"
        service={supplyService}
        columns={columns}
        searchKeys={['id', 'name', 'category', 'warehouse']}
        searchPlaceholder="Search items, categories, warehouses…"
        filters={[
          { key: 'category', label: 'categories', options: SUPPLY_CATEGORIES },
          { key: 'stock', label: 'stock levels', options: ['In Stock', 'Low Stock', 'Out of Stock'], getValue: stockLevel },
        ]}
        formFields={FORM_FIELDS}
        defaultValues={{ unit: 'Units', quantity: 0, minThreshold: 10 }}
        detailFields={detailFields}
        renderHeader={(items) => <LowStockAlerts items={items} />}
        refreshKey={refreshKey}
        rowActions={(row) => [
          { key: 'stock', label: 'Adjust stock', icon: PackagePlus, tone: 'success', onClick: () => setAdjusting(row), hidden: !can('supplies', 'status') },
        ]}
      />

      <Modal
        open={Boolean(adjusting)}
        title="Update inventory"
        subtitle={adjusting && `${adjusting.name} · ${formatNumber(adjusting.quantity)} ${adjusting.unit} in stock, ${formatNumber(adjusting.reserved)} reserved`}
        onClose={() => setAdjusting(null)}
        size="sm"
      >
        {adjusting && (
          <EntityForm
            key={adjusting.id}
            fields={[
              { name: 'type', label: 'Adjustment', type: 'select', options: ADJUST_TYPES, required: true, col: 12 },
              {
                name: 'quantity',
                label: 'Quantity',
                type: 'number',
                min: 0,
                required: true,
                col: 12,
                validate: (v, values) => {
                  if (values.type !== 'CORRECTION' && Number(v) <= 0) return 'Quantity must be greater than zero';
                  if (values.type === 'CORRECTION' && Number(v) < Number(adjusting.reserved)) {
                    return `Cannot go below the ${adjusting.reserved} ${adjusting.unit} reserved for active allocations`;
                  }
                  return null;
                },
              },
              { name: 'note', label: 'Note', type: 'textarea', rows: 2, col: 12, maxLength: 255, placeholder: 'Delivery reference or reason for correction' },
            ]}
            initialValues={{ type: 'RESTOCK', quantity: '' }}
            onSubmit={adjustStock}
            onCancel={() => setAdjusting(null)}
            submitLabel="Update stock"
          />
        )}
      </Modal>
    </>
  );
}
