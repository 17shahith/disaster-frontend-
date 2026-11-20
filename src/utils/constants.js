export const APP_NAME = 'DRRC';
export const APP_FULL_NAME = 'Disaster Response Resource Coordinator';

export const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  TEAM_LEAD: 'TEAM_LEAD',
  RELIEF_COORDINATOR: 'RELIEF_COORDINATOR',
};

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  OPERATOR: 'Control Room Operator',
  TEAM_LEAD: 'Response Team Lead',
  RELIEF_COORDINATOR: 'Relief Coordinator',
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

/** Roles that may self-register (administrators are created by an administrator). */
export const SELF_REGISTER_ROLE_OPTIONS = ROLE_OPTIONS.filter((r) => r.value !== ROLES.ADMIN);

/** Landing page after login for each role. */
export const ROLE_HOME = {
  ADMIN: '/dashboard',
  OPERATOR: '/dashboard',
  TEAM_LEAD: '/dashboard',
  RELIEF_COORDINATOR: '/dashboard',
};

/*
 * Vocabularies below mirror the Flask backend (app/constants.py), which validates
 * every value and enforces the status workflows.
 */
export const INCIDENT_TYPES = ['Flood', 'Earthquake', 'Fire', 'Cyclone', 'Building Collapse', 'Other'];
export const INCIDENT_STATUS = ['Reported', 'Active', 'In Progress', 'Completed', 'Closed'];
/** Statuses a new incident may start in; Completed/Closed incidents accept no new requests or allocations. */
export const OPEN_INCIDENT_STATUS = ['Reported', 'Active', 'In Progress'];
export const CLOSED_INCIDENT_STATUS = ['Completed', 'Closed'];
export const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

export const REQUEST_TYPES = ['Medical Assistance', 'Food', 'Drinking Water', 'Rescue', 'Shelter', 'Transportation', 'Other'];
export const REQUEST_STATUS = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
export const PRIORITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

export const TEAM_TYPES = ['Rescue', 'Medical', 'Fire', 'Search and Rescue', 'Logistics', 'Other'];
/** 'Assigned' is set by the server when a team is allocated; it cannot be chosen manually. */
export const TEAM_STATUS = ['Available', 'Assigned', 'Busy', 'Unavailable'];
export const TEAM_MANUAL_STATUS = ['Available', 'Busy', 'Unavailable'];

export const SHELTER_STATUS = ['Open', 'Full', 'Closed', 'Under Maintenance'];
export const ACTIVE_SHELTER_STATUS = ['Open', 'Full'];

export const SUPPLY_CATEGORIES = ['Food', 'Drinking Water', 'Medicine', 'Clothing', 'Rescue Equipment', 'Other'];
export const SUPPLY_UNITS = ['Units', 'Kits', 'Boxes', 'Packets', 'Litres', 'Bottles', 'Kg', 'Pieces'];

export const RESOURCE_TYPES = ['Response Team', 'Shelter', 'Relief Supply'];
/** Pending -> Approved -> Allocated -> Completed, or Cancelled before dispatch. */
export const ALLOCATION_STATUS = ['Pending', 'Approved', 'Allocated', 'Completed', 'Cancelled'];
export const DISPATCHABLE_ALLOCATION_STATUS = ['Approved', 'Allocated'];

/** Prepared -> Dispatched -> (In Transit) -> Delivered -> Completed. Stock is deducted on Dispatched. */
export const DISPATCH_STATUS = ['Prepared', 'Dispatched', 'In Transit', 'Delivered', 'Completed'];

export const USER_STATUS = ['Active', 'Inactive'];

/**
 * Maps every status / severity / priority value to a semantic tone.
 * danger = red (emergency), warning = orange (high priority),
 * success = green (completed), info = blue (information), neutral = gray.
 */
export const STATUS_TONES = {
  Critical: 'danger', High: 'warning', Medium: 'caution', Low: 'info',
  Reported: 'info', Active: 'danger', 'In Progress': 'warning', Closed: 'neutral',
  Pending: 'warning', Approved: 'info', Cancelled: 'neutral',
  Available: 'success', Assigned: 'danger', Busy: 'warning', Unavailable: 'neutral',
  Open: 'success', Full: 'danger', 'Under Maintenance': 'neutral',
  Allocated: 'info', Completed: 'success',
  Prepared: 'neutral', Dispatched: 'warning', 'In Transit': 'warning', Delivered: 'info',
  Inactive: 'neutral', 'Low Stock': 'danger', 'In Stock': 'success', 'Out of Stock': 'danger',
};

export const PAGE_SIZE = 10;
