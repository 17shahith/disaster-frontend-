import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const dispatchService = createCrudService(ENDPOINTS.dispatches);

export default dispatchService;
