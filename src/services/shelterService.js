import api, { unwrap } from './api';
import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { shelterAdapter } from './adapters';

const shelterService = {
  ...createCrudService(ENDPOINTS.shelters, shelterAdapter),
  /** The backend rejects occupancy above capacity and switches Open/Full automatically. */
  updateOccupancy: (id, occupancy) =>
    api
      .put(`${ENDPOINTS.shelters}/${id}`, { current_occupancy: Number(occupancy) })
      .then((r) => shelterAdapter.fromApi(unwrap(r.data))),
};

export default shelterService;
