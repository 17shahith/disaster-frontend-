import api, { fetchAll, unwrap } from './api';

/**
 * Builds the standard REST operations for a Flask resource endpoint.
 * `adapter` converts between API records and UI objects (see adapters.js).
 */
export const createCrudService = (endpoint, adapter) => {
  const fromApi = (r) => adapter.fromApi(unwrap(r.data));
  return {
    getAll: (params) => fetchAll(endpoint, params).then((items) => items.map(adapter.fromApi)),
    getById: (id) => api.get(`${endpoint}/${id}`).then(fromApi),
    create: (values) => api.post(endpoint, adapter.toApi(values, 'create')).then(fromApi),
    update: (id, values) => api.put(`${endpoint}/${id}`, adapter.toApi(values, 'update')).then(fromApi),
    remove: (id) => api.delete(`${endpoint}/${id}`).then((r) => unwrap(r.data)),
    /** Status changes are ordinary partial updates; the backend validates the workflow. */
    updateStatus: (id, status, extra = {}) => {
      const body = adapter.statusToApi ? adapter.statusToApi(status, extra) : adapter.toApi({ status }, 'update');
      return api.put(`${endpoint}/${id}`, body).then(fromApi);
    },
  };
};
