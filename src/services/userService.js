import { createCrudService } from './crudService';
import { ENDPOINTS } from './endpoints';
import { ROLE_TO_API, userAdapter } from './adapters';

const crud = createCrudService(ENDPOINTS.users, userAdapter);

/** Administrator-only. DELETE deactivates the account (history is preserved). */
const userService = {
  ...crud,
  /** Active response team lead accounts (for assigning a team's lead). */
  getTeamLeads: () => crud.getAll({ role: ROLE_TO_API.TEAM_LEAD, is_active: 'true' }),
};

export default userService;
