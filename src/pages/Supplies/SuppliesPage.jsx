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

const stockLevel = (s) => (Number(s.quantity) <= 0 ? 'Out of Stock' : Number(s.quantity) <= Number(s.minThreshold) ? 'Low Stock' : 'In Stock');

const FORM_FIELDS = [
  { name: 'name', label: 'Item name', required: true, minLength: 2, col: 8 },
  { name: 'category', label: 'Category', type: 'select', options: SUPPLY_CATEGORIES, required: true, col: 4 },
  { name: 'quantity', label: 'Quantity in stock', type: 'number', min: 0, required: true, col: 4 },
  { name: 'unit', label: 'Unit', type: 'select', options: SUPPLY_UNITS, required: true, col: 4 },
  { name: 'minThreshold', label: 'Low-stock threshold', type: 'number', min: 0, required: true, col: 4, help: 'Alert when stock falls to this level' },
  { name: 'warehouse', label: 'Warehouse / storage location', required: true, col: 12 },
];

const ADJUST_TYPES = [
  { value: 'RESTOCK', label: 'Restock (add to inventory)' },
  { value: 'DISPATCH', label: 'Dispatch (remove from inventory)' },
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
  { key: 'quantity', label: 'Available', className: 'text-end fw-semibold', render: (s) => `${formatNumber(s.quantity)} ${s.unit}`, sortValue: (s) => Number(s.quantity) },
  { key: 'minThreshold', label: 'Threshold', className: 'text-end', render: (s) => formatNumber(s.minThreshold), sortValue: (s) => Number(s.minThreshold) },
  { key: 'dispatched', label: 'Dispatched', className: 'text-end', render: (s) => formatNumber(s.dispatched), sortValue: (s) => Number(s.dispatched) },
  { key: 'stock', label: 'Stock level', render: (s) => <StatusBadge value={stockLevel(s)} />, sortValue: (s) => Number(s.quantity) - Number(s.minThreshold) },
  { key: 'warehouse', label: 'Warehouse' },
];

const detailFields = [
  { label: 'Item', key: 'name' },
  { label: 'Category', key: 'category' },
  { label: 'Available', render: (s) => `${formatNumber(s.quantity)} ${s.unit}` },
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
              {s.name}: <strong>{formatNumber(s.quantity)}</strong> {s.unit} left (threshold {formatNumber(s.minThreshold)})
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

      <Modal open={Boolean(adjusting)} title="Update inventory" subtitle={adjusting && `${adjusting.name} · ${formatNumber(adjusting.quantity)} ${adjusting.unit} in stock`} onClose={() => setAdjusting(null)} size="sm">
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
                  if (values.type === 'DISPATCH' && Number(v) > Number(adjusting.quantity)) return `Only ${adjusting.quantity} ${adjusting.unit} available`;
                  return null;
                },
              },
              { name: 'note', label: 'Note', type: 'textarea', rows: 2, col: 12, placeholder: 'Reference, destination or reason' },
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
