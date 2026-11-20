import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const allocationService = createCrudService(ENDPOINTS.allocations);

export default allocationService;
