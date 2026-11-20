import api, { unwrap } from './api';
import { ENDPOINTS } from './endpoints';
import { reportAdapter } from './adapters';

const reportService = {
  /** Consolidated situation report (one consistent snapshot of all report sections). */
  getSummary: () => api.get(ENDPOINTS.reports).then((r) => reportAdapter.fromApi(unwrap(r.data))),
};

export default reportService;
