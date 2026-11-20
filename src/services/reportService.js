import api, { fetchAll, unwrap } from './api';
import { ENDPOINTS } from './endpoints';
import { reportAdapter, snapshotAdapter } from './adapters';

const reportService = {
  /** Consolidated live situation report (one consistent snapshot of all report sections). */
  getSummary: () => api.get(ENDPOINTS.reports).then((r) => reportAdapter.fromApi(unwrap(r.data))),

  /* Saved situation reports (stored in MongoDB by the backend). */
  listSnapshots: () => fetchAll(ENDPOINTS.snapshots).then((items) => items.map(snapshotAdapter.fromApi)),
  /** Returns { ...meta, report } where `report` has the same shape as getSummary(). */
  getSnapshot: (id) => api.get(`${ENDPOINTS.snapshots}/${id}`).then((r) => snapshotAdapter.fromApi(unwrap(r.data))),
  saveSnapshot: ({ title, notes }) =>
    api.post(ENDPOINTS.snapshots, { title, notes: notes || null }).then((r) => snapshotAdapter.fromApi(unwrap(r.data))),
  deleteSnapshot: (id) => api.delete(`${ENDPOINTS.snapshots}/${id}`).then((r) => unwrap(r.data)),
};

export default reportService;
