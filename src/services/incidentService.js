import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { incidentAdapter } from './adapters';

const incidentService = createCrudService(ENDPOINTS.incidents, incidentAdapter);

export default incidentService;
