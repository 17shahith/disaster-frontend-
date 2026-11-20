import api, { unwrapList } from './api';
import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const teamService = {
  ...createCrudService(ENDPOINTS.teams),
  /** Allocation history for one team (team assignments). */
  getAssignments: (teamId) =>
    api
      .get(ENDPOINTS.allocations, { params: { resourceType: 'Response Team', resourceId: teamId } })
      .then((r) => unwrapList(r.data)),
};

export default teamService;
