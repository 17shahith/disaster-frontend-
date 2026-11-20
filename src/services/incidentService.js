import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const incidentService = createCrudService(ENDPOINTS.incidents);

export default incidentService;
