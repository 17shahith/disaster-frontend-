/**
 * TEMPORARY MOCK API — an axios adapter that imitates the backend REST API so the
 * UI can be developed and demonstrated without a server. It is only active when
 * VITE_USE_MOCK_API=true and is never imported by pages or components.
 * Data is persisted to localStorage under MOCK_DB_KEY.
 */
import { AxiosError } from 'axios';
import { buildSeedData } from './seedData';

const MOCK_DB_KEY = 'drrc_mock_db_v1';
const LATENCY_MS = 350;

const ID_PREFIX = {
  incidents: 'INC', requests: 'REQ', teams: 'TEAM', shelters: 'SHL', supplies: 'SUP',
  allocations: 'ALC', dispatches: 'DSP', users: 'USR', activities: 'ACT',
};
const RESOURCES = Object.keys(ID_PREFIX).filter((k) => k !== 'activities');
const MODULE_LABEL = {
  incidents: 'Incidents', requests: 'Requests', teams: 'Teams', shelters: 'Shelters', supplies: 'Supplies',
  allocations: 'Allocation', dispatches: 'Dispatch', users: 'Users',
};

let db = load();

function load() {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to seed */
  }
  const seed = buildSeedData();
  persist(seed);
  return seed;
}

function persist(data = db) {
  try {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

export const resetMockDatabase = () => {
  db = buildSeedData();
  persist();
};

const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => new Date().toISOString();
const stripPassword = ({ password, ...user }) => user;

const nextId = (collection) => {
  const prefix = ID_PREFIX[collection];
  const max = (db[collection] || []).reduce((m, item) => {
    const n = Number(String(item.id).split('-').pop());
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${max + 1 || 1001}`;
};

const nameOf = (collection, id) => {
  const item = db[collection]?.find((x) => x.id === id);
  return item?.name || item?.title || id;
};

function logActivity(message, module, user) {
  db.activities.unshift({ id: nextId('activities'), message, module, user: user?.name || 'System', timestamp: now() });
  db.activities = db.activities.slice(0, 200);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const countBy = (items, key, keys) => {
  const counts = Object.fromEntries((keys || []).map((k) => [k, 0]));
  items.forEach((i) => {
    counts[i[key]] = (counts[i[key]] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const sum = (items, key) => items.reduce((s, i) => s + (Number(i[key]) || 0), 0);

/* ---------------- aggregate endpoints (computed by the backend in production) --------------- */

function dashboardSummary() {
  const { incidents, requests, teams, shelters, supplies, allocations, dispatches, activities } = db;
  const openIncidents = incidents.filter((i) => !['Resolved', 'Closed'].includes(i.status));
  return {
    stats: {
      totalIncidents: incidents.length,
      activeEmergencies: incidents.filter((i) => i.status === 'Active').length,
      pendingRequests: requests.filter((r) => r.status === 'Pending').length,
      availableTeams: teams.filter((t) => t.status === 'Available').length,
      totalTeams: teams.length,
      activeShelters: shelters.filter((s) => s.status !== 'Closed').length,
      availableBeds: shelters.filter((s) => s.status !== 'Closed').reduce((a, s) => a + Math.max(0, s.capacity - s.occupancy), 0),
      availableSupplies: sum(supplies, 'quantity'),
      lowStockItems: supplies.filter((s) => Number(s.quantity) <= Number(s.minThreshold)).length,
      dispatchedResources: dispatches.filter((d) => ['In Transit', 'Delivered'].includes(d.status)).length,
      completedOperations:
        dispatches.filter((d) => d.status === 'Completed').length + allocations.filter((a) => a.status === 'Completed').length,
    },
    incidentStatus: countBy(incidents, 'status', ['Reported', 'Active', 'Contained', 'Resolved', 'Closed']),
    priorityDistribution: countBy(
      [...openIncidents.map((i) => ({ level: i.severity })), ...requests.filter((r) => !['Fulfilled', 'Rejected'].includes(r.status)).map((r) => ({ level: r.priority }))],
      'level',
      ['Critical', 'High', 'Medium', 'Low'],
    ),
    recentIncidents: [...incidents].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)).slice(0, 5),
    recentAllocations: [...allocations]
      .sort((a, b) => b.allocatedAt.localeCompare(a.allocatedAt))
      .slice(0, 5)
      .map((a) => ({ ...a, incidentTitle: nameOf('incidents', a.incidentId), resourceName: resourceName(a) })),
    recentActivities: [...activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8),
  };
}

function resourceName(a) {
  const col = { 'Response Team': 'teams', Shelter: 'shelters', 'Relief Supply': 'supplies' }[a.resourceType];
  return nameOf(col, a.resourceId);
}

function reportSummary() {
  const { incidents, requests, teams, shelters, supplies, allocations, dispatches } = db;
  const deployed = teams.filter((t) => t.status === 'Deployed').length;
  const totalCapacity = sum(shelters, 'capacity');
  const totalOccupancy = sum(shelters, 'occupancy');
  const totalStock = sum(supplies, 'quantity');
  const totalDispatched = sum(supplies, 'dispatched');
  return {
    generatedAt: now(),
    totals: {
      incidents: incidents.length,
      activeIncidents: incidents.filter((i) => i.status === 'Active').length,
      resolvedIncidents: incidents.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length,
      peopleAffected: sum(incidents, 'affectedPeople'),
      requests: requests.length,
      fulfilledRequests: requests.filter((r) => r.status === 'Fulfilled').length,
      allocations: allocations.length,
      dispatches: dispatches.length,
    },
    incidentsByType: countBy(incidents, 'type').filter((x) => x.value > 0),
    incidentsBySeverity: countBy(incidents, 'severity', ['Critical', 'High', 'Medium', 'Low']),
    incidentsByStatus: countBy(incidents, 'status', ['Reported', 'Active', 'Contained', 'Resolved', 'Closed']),
    resourceUtilization: [
      { name: 'Response teams', used: deployed, total: teams.length },
      { name: 'Shelter beds', used: totalOccupancy, total: totalCapacity },
      { name: 'Relief supplies', used: totalDispatched, total: totalDispatched + totalStock },
    ],
    shelterOccupancy: shelters.map((s) => ({ name: s.name, capacity: s.capacity, occupancy: s.occupancy, status: s.status })),
    teamAvailability: countBy(teams, 'status', ['Available', 'Deployed', 'On Standby', 'Off Duty']),
    supplyLevels: supplies.map((s) => ({ name: s.name, quantity: s.quantity, dispatched: s.dispatched, minThreshold: s.minThreshold, unit: s.unit })),
    completedOperations: {
      allocations: allocations.filter((a) => a.status === 'Completed').length,
      dispatches: dispatches.filter((d) => d.status === 'Completed').length,
      incidentsResolved: incidents.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length,
      requestsFulfilled: requests.filter((r) => r.status === 'Fulfilled').length,
    },
  };
}

/* ------------------------------------ side effects ------------------------------------ */

function afterAllocationChange(allocation) {
  if (allocation.resourceType !== 'Response Team') return;
  const team = db.teams.find((t) => t.id === allocation.resourceId);
  if (!team) return;
  if (['Cancelled', 'Completed'].includes(allocation.status)) {
    team.status = 'Available';
    team.currentIncidentId = null;
  } else {
    team.status = 'Deployed';
    team.currentIncidentId = allocation.incidentId;
  }
  team.updatedAt = now();
}

const shelterStatusFor = (s) => (s.status === 'Closed' ? 'Closed' : Number(s.occupancy) >= Number(s.capacity) ? 'Full' : 'Open');

/* ---------------------------------------- router ---------------------------------------- */

function currentUser(config) {
  const auth = config.headers?.Authorization || config.headers?.authorization || '';
  const token = String(auth).replace('Bearer ', '');
  if (!token.startsWith('mock-token-')) return null;
  const user = db.users.find((u) => u.id === token.replace('mock-token-', ''));
  return user && user.status === 'Active' ? user : null;
}

function handle(config) {
  const method = (config.method || 'get').toLowerCase();
  const path = (config.url || '').replace(config.baseURL || '', '').split('?')[0];
  const [root, id, action] = path.split('/').filter(Boolean);
  const body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data || {};
  const params = config.params || {};

  if (root === 'auth') {
    if (id === 'login' && method === 'post') {
      const user = db.users.find((u) => u.email.toLowerCase() === String(body.email || '').toLowerCase());
      if (!user || user.password !== body.password) throw new HttpError(401, 'Invalid email or password');
      if (user.status !== 'Active') throw new HttpError(403, 'This account has been deactivated');
      return { token: `mock-token-${user.id}`, user: stripPassword(user) };
    }
    if (id === 'logout') return { success: true };
  }

  const user = currentUser(config);
  if (!user) throw new HttpError(401, 'Your session has expired. Please sign in again.');

  if (root === 'auth' && id === 'me') return stripPassword(user);
  if (root === 'dashboard' && id === 'summary') return dashboardSummary();
  if (root === 'reports' && id === 'summary') return reportSummary();
  if (root === 'activities') {
    return [...db.activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, Number(params.limit) || 50);
  }

  if (!RESOURCES.includes(root)) throw new HttpError(404, `Endpoint /${root} not found`);
  if (root === 'users' && user.role !== 'ADMIN') throw new HttpError(403, 'Only administrators can manage users');

  const collection = db[root];
  const output = (item) => (root === 'users' ? stripPassword(item) : item);
  const label = MODULE_LABEL[root];

  // Collection routes
  if (!id) {
    if (method === 'get') {
      return collection
        .filter((item) => Object.entries(params).every(([k, v]) => v === undefined || v === '' || String(item[k]) === String(v)))
        .map(output);
    }
    if (method === 'post') {
      if (root === 'users' && db.users.some((u) => u.email.toLowerCase() === String(body.email).toLowerCase())) {
        throw new HttpError(409, 'A user with this email already exists');
      }
      const timestamp = now();
      const item = { ...body, id: nextId(root), createdAt: timestamp, updatedAt: timestamp };
      if (root === 'incidents') item.reportedAt = item.reportedAt || timestamp;
      if (root === 'allocations') {
        item.allocatedAt = timestamp;
        item.allocatedBy = user.name;
        afterAllocationChange(item);
      }
      if (root === 'shelters') item.status = shelterStatusFor(item);
      if (root === 'supplies') item.dispatched = Number(item.dispatched) || 0;
      if (root === 'users' && !item.password) item.password = 'password123';
      collection.unshift(item);
      logActivity(`${label}: created ${item.id}${item.title || item.name ? ` – ${item.title || item.name}` : ''}`, label, user);
      return output(item);
    }
  }

  const item = collection.find((x) => x.id === id);
  if (!item) throw new HttpError(404, `${id} was not found`);

  if (!action) {
    if (method === 'get') return output(item);
    if (method === 'put') {
      const { password, ...rest } = body;
      Object.assign(item, rest, { id: item.id, updatedAt: now() });
      if (root === 'users' && password) item.password = password;
      if (root === 'shelters') item.status = shelterStatusFor(item);
      if (root === 'allocations') afterAllocationChange(item);
      logActivity(`${label}: updated ${item.id}`, label, user);
      return output(item);
    }
    if (method === 'delete') {
      if (root === 'users' && item.id === user.id) throw new HttpError(400, 'You cannot delete your own account');
      db[root] = collection.filter((x) => x.id !== id);
      logActivity(`${label}: deleted ${item.id}`, label, user);
      return { success: true };
    }
  }

  if (action === 'status' && method === 'patch') {
    item.status = body.status;
    item.updatedAt = now();
    if (root === 'dispatches') {
      const at = body.timestamp || now();
      if (body.status === 'In Transit' && !item.dispatchTime) item.dispatchTime = at;
      if (body.status === 'Delivered') item.deliveredAt = at;
      if (body.status === 'Completed') {
        item.completedAt = at;
        item.deliveredAt = item.deliveredAt || at;
      }
      if (body.note) item.notes = body.note;
    }
    if (root === 'allocations') afterAllocationChange(item);
    if (root === 'teams' && item.status !== 'Deployed') item.currentIncidentId = null;
    logActivity(`${label}: ${item.id} status changed to ${item.status}`, label, user);
    return output(item);
  }

  if (root === 'shelters' && action === 'occupancy' && method === 'patch') {
    const occupancy = Number(body.occupancy);
    if (Number.isNaN(occupancy) || occupancy < 0) throw new HttpError(400, 'Occupancy must be a positive number');
    if (occupancy > item.capacity) throw new HttpError(400, 'Occupancy cannot exceed shelter capacity');
    item.occupancy = occupancy;
    item.status = shelterStatusFor(item);
    item.updatedAt = now();
    logActivity(`Shelters: ${item.name} occupancy updated to ${occupancy}/${item.capacity}`, 'Shelters', user);
    return item;
  }

  if (root === 'supplies' && action === 'stock' && method === 'patch') {
    const qty = Number(body.quantity);
    if (Number.isNaN(qty) || qty < 0 || (qty === 0 && body.type !== 'CORRECTION')) throw new HttpError(400, 'Quantity must be greater than zero');
    if (body.type === 'RESTOCK') item.quantity += qty;
    else if (body.type === 'DISPATCH') {
      if (qty > item.quantity) throw new HttpError(400, `Only ${item.quantity} ${item.unit} available`);
      item.quantity -= qty;
      item.dispatched = (Number(item.dispatched) || 0) + qty;
    } else if (body.type === 'CORRECTION') item.quantity = qty;
    else throw new HttpError(400, 'Unknown stock adjustment type');
    item.updatedAt = now();
    logActivity(`Supplies: ${item.name} ${body.type.toLowerCase()} of ${qty} ${item.unit}`, 'Supplies', user);
    return item;
  }

  throw new HttpError(405, `${method.toUpperCase()} ${path} is not supported`);
}

export default function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const data = clone(handle(config));
        persist();
        resolve({ data, status: 200, statusText: 'OK', headers: {}, config, request: {} });
      } catch (err) {
        const status = err.status || 500;
        const response = { data: { message: err.message }, status, statusText: 'Error', headers: {}, config, request: {} };
        reject(new AxiosError(err.message, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, response));
      }
    }, LATENCY_MS);
  });
}
