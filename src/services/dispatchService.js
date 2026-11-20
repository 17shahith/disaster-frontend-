import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { dispatchAdapter } from './adapters';

const dispatchService = createCrudService(ENDPOINTS.dispatches, dispatchAdapter);

export default dispatchService;
