import {
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  LayoutDashboard,
  Network,
  Siren,
  Truck,
  UserCog,
  Users,
} from 'lucide-react';

/** Sidebar items. `module` is the permission key in utils/permissions.js. */
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { path: '/incidents', label: 'Incidents', icon: Siren, module: 'incidents' },
  { path: '/requests', label: 'Emergency Requests', icon: ClipboardList, module: 'requests' },
  { path: '/teams', label: 'Response Teams', icon: Users, module: 'teams' },
  { path: '/shelters', label: 'Shelters', icon: Home, module: 'shelters' },
  { path: '/supplies', label: 'Relief Supplies', icon: Boxes, module: 'supplies' },
  { path: '/allocations', label: 'Resource Allocation', icon: Network, module: 'allocations' },
  { path: '/dispatch', label: 'Dispatch Tracking', icon: Truck, module: 'dispatch' },
  { path: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { path: '/users', label: 'User Management', icon: UserCog, module: 'users' },
];
