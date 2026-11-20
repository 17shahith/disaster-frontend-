import api, { unwrap, unwrapList } from './api';

/** Builds the standard REST operations for a resource endpoint. */
export const createCrudService = (endpoint) => ({
  getAll: (params) => api.get(endpoint, { params }).then((r) => unwrapList(r.data)),
  getById: (id) => api.get(`${endpoint}/${id}`).then((r) => unwrap(r.data)),
  create: (data) => api.post(endpoint, data).then((r) => unwrap(r.data)),
  update: (id, data) => api.put(`${endpoint}/${id}`, data).then((r) => unwrap(r.data)),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((r) => r.data),
  updateStatus: (id, status, extra = {}) =>
    api.patch(`${endpoint}/${id}/status`, { status, ...extra }).then((r) => unwrap(r.data)),
});
