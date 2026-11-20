import api, { unwrap, unwrapList } from './api';
import { ENDPOINTS } from './endpoints';

const dashboardService = {
  getSummary: () => api.get(ENDPOINTS.dashboard).then((r) => unwrap(r.data)),
  getActivities: (params) => api.get(ENDPOINTS.activities, { params }).then((r) => unwrapList(r.data)),
};

export default dashboardService;
