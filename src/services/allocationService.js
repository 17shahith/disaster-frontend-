import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { allocationAdapter } from './adapters';

const allocationService = createCrudService(ENDPOINTS.allocations, allocationAdapter);

export default allocationService;
