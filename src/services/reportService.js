import api, { unwrap } from './api';
import { ENDPOINTS } from './endpoints';

const reportService = {
  getSummary: (params) => api.get(ENDPOINTS.reports, { params }).then((r) => unwrap(r.data)),
};

export default reportService;
