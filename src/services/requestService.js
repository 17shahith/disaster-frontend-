import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { requestAdapter } from './adapters';

const requestService = createCrudService(ENDPOINTS.requests, requestAdapter);

export default requestService;
