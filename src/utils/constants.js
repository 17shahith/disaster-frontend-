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

/** Landing page after login for each role. */
export const ROLE_HOME = {
  ADMIN: '/dashboard',
  OPERATOR: '/dashboard',
  TEAM_LEAD: '/dashboard',
  RELIEF_COORDINATOR: '/dashboard',
};

export const INCIDENT_TYPES = ['Flood', 'Earthquake', 'Fire', 'Cyclone', 'Landslide', 'Building Collapse', 'Chemical Spill', 'Medical Emergency', 'Other'];
export const INCIDENT_STATUS = ['Reported', 'Active', 'Contained', 'Resolved', 'Closed'];
export const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

export const REQUEST_TYPES = ['Rescue', 'Medical', 'Food & Water', 'Shelter', 'Evacuation', 'Relief Supplies', 'Other'];
export const REQUEST_STATUS = ['Pending', 'Approved', 'In Progress', 'Fulfilled', 'Rejected'];
export const PRIORITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

export const TEAM_TYPES = ['Search & Rescue', 'Medical', 'Firefighting', 'Evacuation', 'Logistics', 'Hazmat'];
export const TEAM_STATUS = ['Available', 'Deployed', 'On Standby', 'Off Duty'];

export const SHELTER_STATUS = ['Open', 'Full', 'Closed'];

export const SUPPLY_CATEGORIES = ['Food', 'Water', 'Medical', 'Shelter', 'Hygiene', 'Clothing', 'Equipment'];
export const SUPPLY_UNITS = ['Units', 'Kits', 'Boxes', 'Packets', 'Litres', 'Bottles', 'Kg', 'Pieces'];

export const RESOURCE_TYPES = ['Response Team', 'Shelter', 'Relief Supply'];
export const ALLOCATION_STATUS = ['Planned', 'Allocated', 'Dispatched', 'Completed', 'Cancelled'];

export const DISPATCH_STATUS = ['Pending', 'In Transit', 'Delivered', 'Completed', 'Cancelled'];

export const USER_STATUS = ['Active', 'Inactive'];

/**
 * Maps every status / severity / priority value to a semantic tone.
 * danger = red (emergency), warning = orange (high priority),
 * success = green (completed), info = blue (information), neutral = gray.
 */
export const STATUS_TONES = {
  Critical: 'danger', High: 'warning', Medium: 'caution', Low: 'info',
  Reported: 'info', Active: 'danger', Contained: 'warning', Resolved: 'success', Closed: 'neutral',
  Pending: 'warning', Approved: 'info', 'In Progress': 'info', Fulfilled: 'success', Rejected: 'neutral',
  Available: 'success', Deployed: 'danger', 'On Standby': 'info', 'Off Duty': 'neutral',
  Open: 'success', Full: 'danger',
  Planned: 'neutral', Allocated: 'info', Dispatched: 'warning', Completed: 'success', Cancelled: 'neutral',
  'In Transit': 'warning', Delivered: 'info',
  Inactive: 'neutral', 'Low Stock': 'danger', 'In Stock': 'success', 'Out of Stock': 'danger',
};

export const PAGE_SIZE = 10;
