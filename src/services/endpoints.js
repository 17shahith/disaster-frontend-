/**
 * Central list of REST endpoints. Adjust these paths to match the backend
 * without touching any page or service logic.
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  dashboard: '/dashboard/summary',
  reports: '/reports/summary',
  activities: '/activities',
  incidents: '/incidents',
  requests: '/requests',
  teams: '/teams',
  shelters: '/shelters',
  supplies: '/supplies',
  allocations: '/allocations',
  dispatches: '/dispatches',
  users: '/users',
};
