import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';

const userService = createCrudService(ENDPOINTS.users);

export default userService;
