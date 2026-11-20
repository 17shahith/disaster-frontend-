import { ROLES } from './constants';

const { ADMIN, OPERATOR, TEAM_LEAD, RELIEF_COORDINATOR } = ROLES;
const ALL = [ADMIN, OPERATOR, TEAM_LEAD, RELIEF_COORDINATOR];

/**
 * Frontend permission matrix: module -> action -> roles allowed.
 * It mirrors the Flask role checks so the UI only offers actions the API will accept.
 * The backend enforces these rules independently (including record-level rules,
 * e.g. team leads may only manage their own teams and assignments).
 */
export const PERMISSIONS = {
  dashboard: { view: ALL },
  incidents: {
    view: ALL, // team leads see only incidents assigned to their teams
    create: [ADMIN, OPERATOR],
    edit: [ADMIN, OPERATOR],
    status: [ADMIN, OPERATOR],
    delete: [ADMIN],
  },
  requests: {
    view: ALL,
    create: [ADMIN, OPERATOR],
    edit: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    status: [ADMIN, OPERATOR, RELIEF_COORDINATOR, TEAM_LEAD],
    assign: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    delete: [ADMIN, OPERATOR],
  },
  teams: {
    view: [ADMIN, OPERATOR, TEAM_LEAD, RELIEF_COORDINATOR],
    create: [ADMIN, TEAM_LEAD],
    edit: [ADMIN, TEAM_LEAD],
    status: [ADMIN, TEAM_LEAD],
    assign: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    delete: [ADMIN],
  },
  shelters: {
    view: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    create: [ADMIN, RELIEF_COORDINATOR],
    edit: [ADMIN, RELIEF_COORDINATOR],
    status: [ADMIN, RELIEF_COORDINATOR],
    delete: [ADMIN, RELIEF_COORDINATOR],
  },
  supplies: {
    view: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    create: [ADMIN, RELIEF_COORDINATOR],
    edit: [ADMIN, RELIEF_COORDINATOR],
    status: [ADMIN, RELIEF_COORDINATOR],
    delete: [ADMIN, RELIEF_COORDINATOR],
  },
  allocations: {
    view: ALL,
    create: [ADMIN, OPERATOR, RELIEF_COORDINATOR], // operators: response teams only
    edit: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    status: ALL, // team leads: mark their own team's assignment Completed
    delete: [], // allocations are cancelled, never deleted (history is kept)
  },
  dispatch: {
    view: ALL,
    create: [ADMIN, RELIEF_COORDINATOR],
    edit: [ADMIN, RELIEF_COORDINATOR],
    status: ALL.filter((r) => r !== OPERATOR), // team leads: transit/delivery of their own dispatches
    delete: [ADMIN, RELIEF_COORDINATOR], // only while Prepared
  },
  reports: { view: ALL },
  // Accounts are deactivated (Account status = Inactive), never deleted, to keep the audit trail intact.
  users: { view: [ADMIN], create: [ADMIN], edit: [ADMIN], delete: [] },
};

export const can = (role, module, action = 'view') =>
  Boolean(role && PERMISSIONS[module]?.[action]?.includes(role));
