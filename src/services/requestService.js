import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const requestService = createCrudService(ENDPOINTS.requests);

export default requestService;
