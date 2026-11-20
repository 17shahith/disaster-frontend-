import { fetchAll } from './api';
import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { allocationAdapter, teamAdapter } from './adapters';

const teamService = {
  ...createCrudService(ENDPOINTS.teams, teamAdapter),
  /** Allocation history for one team (team assignments). */
  getAssignments: (teamId) =>
    fetchAll(ENDPOINTS.allocations, { team_id: teamId }).then((items) => items.map(allocationAdapter.fromApi)),
};

export default teamService;
