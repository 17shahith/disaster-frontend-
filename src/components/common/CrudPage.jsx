import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, RefreshCw, RotateCw, Trash2 } from 'lucide-react';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import Modal from './Modal';
import EntityForm from './EntityForm';
import ConfirmDialog from './ConfirmDialog';
import DetailsList from './DetailsList';
import RowActions from './RowActions';
import StatusUpdateModal from './StatusUpdateModal';
import { ErrorState } from './EmptyState';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import useFetch from '../../hooks/useFetch';
import { getErrorMessage } from '../../utils/formatters';

/**
 * Standard management page: list + search/filter + create/edit form + details + status + delete.
 * Page-specific behaviour is injected through props (columns, formFields, extra row actions, ...).
 */
export default function CrudPage({
  module,
  title,
  subtitle,
  icon,
  entityName,
  service,
  columns,
  filters,
  searchKeys,
  searchPlaceholder,
  formFields,
  defaultValues = {},
  toFormValues = (item) => item,
  toPayload = (values) => values,
  validate,
  detailFields,
  renderDetailsExtra,
  statusConfig,
  rowActions,
  renderHeader,
  lookups = {},
  refreshKey = 0,
  onChanged,
  formSize = 'lg',
  createLabel,
  tabs,
  prefillFromParams,
}) {
  const { can } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: items, loading, error, reload } = useFetch(() => service.getAll(), [], []);

  const [formState, setFormState] = useState(null); // { mode: 'create' | 'edit', item }
  const [viewing, setViewing] = useState(null);
  const [statusItem, setStatusItem] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.key);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    reload({ silent: true });
  }, [refreshKey, reload]);

  // Deep links: ?new=1 opens the create form, ?view=<id> opens details.
  useEffect(() => {
    if (searchParams.get('new') && can(module, 'create')) {
      const prefill = prefillFromParams ? prefillFromParams(searchParams) : {};
      if (prefill === null) return; // reference data not loaded yet — try again on next render
      setFormState({ mode: 'create', item: null, prefill });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, can, module, prefillFromParams]);

  useEffect(() => {
    const id = searchParams.get('view');
    if (id && items?.length) {
      const found = items.find((i) => i.id === id);
      if (found) setViewing(found);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, items, setSearchParams]);

  const afterChange = async () => {
    await reload({ silent: true });
    onChanged?.();
  };

  const handleSave = async (values) => {
    const payload = toPayload(values, formState?.item);
    try {
      if (formState.mode === 'create') {
        const created = await service.create(payload);
        toast.success(`${entityName} ${created?.id || ''} created successfully`);
      } else {
        await service.update(formState.item.id, payload);
        toast.success(`${entityName} ${formState.item.id} updated successfully`);
      }
      setFormState(null);
      await afterChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const handleStatus = async ({ status, ...extra }) => {
    try {
      await service.updateStatus(statusItem.id, status, statusConfig.toExtra ? statusConfig.toExtra(extra) : extra);
      toast.success(`${entityName} ${statusItem.id} status updated to ${status}`);
      setStatusItem(null);
      await afterChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await service.remove(deleting.id);
      toast.success(`${entityName} ${deleting.id} deleted`);
      setDeleting(null);
      if (viewing?.id === deleting.id) setViewing(null);
      await afterChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const buildActions = (row) => [
    { key: 'view', label: 'View details', icon: Eye, onClick: () => setViewing(row) },
    { key: 'edit', label: `Edit ${entityName.toLowerCase()}`, icon: Pencil, onClick: () => setFormState({ mode: 'edit', item: row }), hidden: !can(module, 'edit') },
    {
      key: 'status',
      label: statusConfig?.actionLabel || 'Update status',
      icon: RotateCw,
      tone: 'info',
      onClick: () => setStatusItem(row),
      hidden: !statusConfig || !can(module, 'status'),
    },
    ...(rowActions ? rowActions(row) : []),
    { key: 'delete', label: `Delete ${entityName.toLowerCase()}`, icon: Trash2, tone: 'danger', onClick: () => setDeleting(row), hidden: !can(module, 'delete') },
  ];

  const initialValues = useMemo(
    () => (formState?.mode === 'edit' ? toFormValues(formState.item) : { ...defaultValues, ...formState?.prefill }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formState],
  );

  // Keep the details dialog in sync after the list reloads.
  const viewingItem = viewing ? items.find((i) => i.id === viewing.id) || viewing : null;

  const currentTab = tabs?.find((t) => t.key === activeTab);
  const tableData = currentTab?.filter ? items.filter(currentTab.filter) : items;

  return (
    <div className="page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => afterChange()} title="Refresh data">
              <RefreshCw size={16} /> <span className="d-none d-sm-inline">Refresh</span>
            </button>
            {can(module, 'create') && (
              <button type="button" className="btn btn-primary" onClick={() => setFormState({ mode: 'create', item: null })}>
                <Plus size={16} /> {createLabel || `New ${entityName}`}
              </button>
            )}
          </>
        }
      />

      {renderHeader && !loading && renderHeader(items)}
      {error && <ErrorState message={error} onRetry={() => reload()} />}

      {tabs && (
        <div className="tabs-bar" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={`tabs-bar__tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {!loading && <span className="tabs-bar__count">{t.filter ? items.filter(t.filter).length : items.length}</span>}
            </button>
          ))}
        </div>
      )}

      {!error && (
        <DataTable
          key={activeTab}
          columns={columns}
          data={tableData}
          loading={loading}
          filters={filters}
          searchKeys={searchKeys}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={can(module, 'create') ? `Click "${createLabel || `New ${entityName}`}" to add the first record.` : undefined}
          actions={(row) => <RowActions actions={buildActions(row)} />}
        />
      )}

      <Modal
        open={Boolean(formState)}
        title={formState?.mode === 'edit' ? `Edit ${entityName}` : createLabel || `New ${entityName}`}
        subtitle={formState?.mode === 'edit' ? formState.item.id : 'Fields marked * are required'}
        onClose={() => setFormState(null)}
        size={formSize}
        closeOnBackdrop={false}
      >
        {formState && (
          <EntityForm
            key={formState.item?.id || 'new'}
            fields={formFields}
            initialValues={initialValues}
            lookups={lookups}
            validate={validate}
            onSubmit={handleSave}
            onCancel={() => setFormState(null)}
            submitLabel={formState.mode === 'edit' ? 'Save changes' : `Create ${entityName}`}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewingItem)}
        title={`${entityName} details`}
        subtitle={viewingItem?.id}
        onClose={() => setViewing(null)}
        size="lg"
        footer={
          viewingItem && (
            <>
              {can(module, 'edit') && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setFormState({ mode: 'edit', item: viewingItem });
                    setViewing(null);
                  }}
                >
                  <Pencil size={16} /> Edit
                </button>
              )}
              <button type="button" className="btn btn-light" onClick={() => setViewing(null)}>
                Close
              </button>
            </>
          )
        }
      >
        {viewingItem && (
          <>
            <DetailsList item={viewingItem} fields={detailFields} context={lookups} />
            {renderDetailsExtra && renderDetailsExtra(viewingItem)}
          </>
        )}
      </Modal>

      {statusConfig && (
        <StatusUpdateModal
          open={Boolean(statusItem)}
          item={statusItem}
          title={statusConfig.title || `Update ${entityName.toLowerCase()} status`}
          label={statusConfig.label}
          options={statusConfig.options}
          extraFields={statusConfig.extraFields}
          initialExtra={statusItem && statusConfig.initialExtra ? statusConfig.initialExtra(statusItem) : {}}
          onSubmit={handleStatus}
          onClose={() => setStatusItem(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${entityName.toLowerCase()}?`}
        message={
          deleting && (
            <>
              <strong>{deleting.id}</strong> {deleting.title || deleting.name ? `– ${deleting.title || deleting.name}` : ''} will be permanently removed. This action
              cannot be undone.
            </>
          )
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
