import api, { unwrap } from './api';
import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const shelterService = {
  ...createCrudService(ENDPOINTS.shelters),
  updateOccupancy: (id, occupancy) =>
    api.patch(`${ENDPOINTS.shelters}/${id}/occupancy`, { occupancy }).then((r) => unwrap(r.data)),
};

export default shelterService;
