import api, { unwrap } from './api';
import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const supplyService = {
  ...createCrudService(ENDPOINTS.supplies),
  /**
   * Adjusts stock levels.
   * @param {'RESTOCK'|'DISPATCH'|'CORRECTION'} type
   */
  adjustStock: (id, { type, quantity, note }) =>
    api.patch(`${ENDPOINTS.supplies}/${id}/stock`, { type, quantity, note }).then((r) => unwrap(r.data)),
};

export default supplyService;
