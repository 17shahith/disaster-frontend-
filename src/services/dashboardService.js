import api, { unwrap } from './api';
import { ENDPOINTS } from './endpoints';
import { dashboardAdapter } from './adapters';

const dashboardService = {
  /** KPIs, chart series, recent incidents/allocations and the activity feed in one call. */
  getSummary: () => api.get(ENDPOINTS.dashboard).then((r) => dashboardAdapter.fromApi(unwrap(r.data))),
};

export default dashboardService;
