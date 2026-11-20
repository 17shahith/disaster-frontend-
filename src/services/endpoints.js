/**
 * Central list of Flask REST endpoints (relative to VITE_API_BASE_URL).
 * Adjust paths here without touching any page or service logic.
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/profile',
  },
  dashboard: '/reports/dashboard',
  reports: '/reports/summary',
  snapshots: '/reports/snapshots',
  incidents: '/incidents',
  requests: '/requests',
  teams: '/teams',
  shelters: '/shelters',
  supplies: '/supplies',
  allocations: '/allocations',
  dispatches: '/dispatch',
  users: '/users',
};
