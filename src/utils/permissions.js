import { ROLES } from './constants';

const { ADMIN, OPERATOR, TEAM_LEAD, RELIEF_COORDINATOR } = ROLES;
const ALL = [ADMIN, OPERATOR, TEAM_LEAD, RELIEF_COORDINATOR];

/**
 * Frontend permission matrix: module -> action -> roles allowed.
 * The backend must enforce the same rules; this only drives what the UI shows.
 */
export const PERMISSIONS = {
  dashboard: { view: ALL },
  incidents: {
    view: ALL,
    create: [ADMIN, OPERATOR],
    edit: [ADMIN, OPERATOR],
    status: [ADMIN, OPERATOR, TEAM_LEAD],
    delete: [ADMIN],
  },
  requests: {
    view: ALL,
    create: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    edit: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    status: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    assign: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    delete: [ADMIN],
  },
  teams: {
    view: [ADMIN, OPERATOR, TEAM_LEAD],
    create: [ADMIN, TEAM_LEAD],
    edit: [ADMIN, TEAM_LEAD],
    status: [ADMIN, OPERATOR, TEAM_LEAD],
    assign: [ADMIN, OPERATOR, TEAM_LEAD],
    delete: [ADMIN],
  },
  shelters: {
    view: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    create: [ADMIN, RELIEF_COORDINATOR],
    edit: [ADMIN, RELIEF_COORDINATOR],
    status: [ADMIN, RELIEF_COORDINATOR],
    delete: [ADMIN],
  },
  supplies: {
    view: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    create: [ADMIN, RELIEF_COORDINATOR],
    edit: [ADMIN, RELIEF_COORDINATOR],
    status: [ADMIN, RELIEF_COORDINATOR],
    delete: [ADMIN],
  },
  allocations: {
    view: ALL,
    create: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    edit: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    status: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    delete: [ADMIN],
  },
  dispatch: {
    view: ALL,
    create: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    edit: [ADMIN, OPERATOR, RELIEF_COORDINATOR],
    status: ALL,
    delete: [ADMIN],
  },
  reports: { view: ALL },
  users: { view: [ADMIN], create: [ADMIN], edit: [ADMIN], delete: [ADMIN] },
};

export const can = (role, module, action = 'view') =>
  Boolean(role && PERMISSIONS[module]?.[action]?.includes(role));
