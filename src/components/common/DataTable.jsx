import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import EmptyState from './EmptyState';
import { PageLoader } from './Spinner';
import { PAGE_SIZE } from '../../utils/constants';

/**
 * Searchable, filterable, sortable, paginated table.
 *
 * columns: [{ key, label, render?(row), sortable?, sortValue?(row), className? }]
 * filters: [{ key, label, options: string[] | {value,label}[], getValue?(row) }]
 * searchKeys: fields included in free-text search (defaults to all column keys)
 * actions: (row) => ReactNode   — rendered in a trailing "Actions" column
 */
export default function DataTable({
  columns,
  data = [],
  loading,
  filters = [],
  searchKeys,
  searchPlaceholder = 'Search…',
  actions,
  pageSize: initialPageSize = PAGE_SIZE,
  emptyTitle,
  emptyMessage,
  toolbarExtra,
  onRowClick,
}) {
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const keys = searchKeys || columns.map((c) => c.key);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = data.filter((row) =>
      filters.every((f) => {
        const selected = filterValues[f.key];
        if (!selected) return true;
        const value = f.getValue ? f.getValue(row) : row[f.key];
        return String(value) === selected;
      }),
    );
    if (q) rows = rows.filter((row) => keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
    if (sort.key) {
      const col = columns.find((c) => c.key === sort.key);
      const get = col?.sortValue || ((r) => r[sort.key]);
      rows = [...rows].sort((a, b) => {
        const av = get(a);
        const bv = get(b);
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, filterValues, sort, columns, filters]);

  useEffect(() => setPage(1), [query, filterValues, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const hasActiveFilters = query || Object.values(filterValues).some(Boolean);

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    setSort((s) => (s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const from = Math.max(1, currentPage - 2);
    const to = Math.min(totalPages, from + 4);
    for (let p = Math.max(1, to - 4); p <= to; p += 1) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="data-table card-panel">
      <div className="data-table__toolbar">
        <div className="search-input">
          <Search size={16} />
          <input type="search" className="form-control" placeholder={searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search table" />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            className="form-select data-table__filter"
            value={filterValues[f.key] || ''}
            onChange={(e) => setFilterValues((v) => ({ ...v, [f.key]: e.target.value }))}
            aria-label={`Filter by ${f.label}`}
          >
            <option value="">All {f.label}</option>
            {f.options.map((o) => {
              const opt = typeof o === 'object' ? o : { value: o, label: o };
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
        ))}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none"
            onClick={() => {
              setQuery('');
              setFilterValues({});
            }}
          >
            <X size={14} /> Clear
          </button>
        )}
        {toolbarExtra && <div className="ms-auto d-flex gap-2">{toolbarExtra}</div>}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching records' : emptyTitle || 'No records yet'}
          message={hasActiveFilters ? 'Try a different search term or clear the filters.' : emptyMessage}
        />
      ) : (
        <div className="table-responsive">
          <table className="table app-table align-middle mb-0">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.className || ''} ${col.sortable === false ? '' : 'sortable'}`}
                    onClick={() => toggleSort(col)}
                    aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.label}
                    {sort.key === col.key && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </th>
                ))}
                {actions && <th className="text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                  {actions && (
                    <td className="text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="data-table__footer">
          <span className="text-muted small">
            Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
            {filtered.length !== data.length && ` (filtered from ${data.length})`}
          </span>
          <div className="d-flex align-items-center gap-2">
            <select className="form-select form-select-sm w-auto" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Rows per page">
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <nav className="pager" aria-label="Pagination">
              <button type="button" className="pager__btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              {pageNumbers.map((p) => (
                <button key={p} type="button" className={`pager__btn ${p === currentPage ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button type="button" className="pager__btn" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
