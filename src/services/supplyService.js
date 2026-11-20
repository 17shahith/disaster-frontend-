import api, { unwrap } from './api';
import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { supplyAdapter } from './adapters';

const supplyService = {
  ...createCrudService(ENDPOINTS.supplies, supplyAdapter),
  /**
   * Adjusts stock levels.
   * @param {'RESTOCK'|'CORRECTION'} type  RESTOCK adds to stock; CORRECTION sets the counted quantity.
   * Stock leaves the warehouse only through allocations + dispatch records.
   */
  adjustStock: (id, values) =>
    api.put(`${ENDPOINTS.supplies}/${id}`, supplyAdapter.stockToApi(values)).then((r) => supplyAdapter.fromApi(unwrap(r.data))),
};

export default supplyService;
