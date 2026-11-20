/**
 * End-to-end integration check: drives the REAL frontend service layer
 * (src/services/*, adapters, Axios interceptors) against the live Flask API.
 * Usage: npm run test:integration  (backend running on VITE_API_BASE_URL default, seeded with `flask seed`)
 * NOTE: creates records prefixed "E2E" - run it against a development/demo database, never production.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// ---- browser shims (must exist before the services run) ----
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.window = new EventTarget();
let expiredEvents = 0;
window.addEventListener('auth:expired', () => { expiredEvents += 1; });

const SRC = process.argv[2];
const mod = (p) => import(pathToFileURL(path.join(SRC, p)).href);

const api = await mod('services/api.js');
const authService = (await mod('services/authService.js')).default;
const dashboardService = (await mod('services/dashboardService.js')).default;
const reportService = (await mod('services/reportService.js')).default;
const incidentService = (await mod('services/incidentService.js')).default;
const requestService = (await mod('services/requestService.js')).default;
const teamService = (await mod('services/teamService.js')).default;
const shelterService = (await mod('services/shelterService.js')).default;
const supplyService = (await mod('services/supplyService.js')).default;
const allocationService = (await mod('services/allocationService.js')).default;
const dispatchService = (await mod('services/dispatchService.js')).default;
const userService = (await mod('services/userService.js')).default;
const { allocationPayload } = await mod('pages/Allocations/allocationFields.js');
const { getErrorMessage } = await mod('utils/formatters.js');
const { can } = await mod('utils/permissions.js');

// ---- tiny test harness ----
const results = [];
const check = (name, cond, detail = '') => {
  results.push({ name, ok: Boolean(cond), detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  -> ${detail}` : ''}`);
};
const expectError = async (name, fn, status, contains) => {
  try {
    await fn();
    check(name, false, 'expected an error but the call succeeded');
  } catch (err) {
    const msg = getErrorMessage(err);
    check(name, err.response?.status === status && (!contains || msg.includes(contains)), `status=${err.response?.status} msg="${msg}"`);
    return msg;
  }
};
const PASSWORD = 'Password@123';
const as = async (username) => {
  api.clearSession();
  return authService.login(`${username}@drrc.local`, PASSWORD);
};
const stamp = Date.now().toString().slice(-6);

console.log(`API: ${api.API_BASE_URL}\n`);

// 1. Authentication -------------------------------------------------------
console.log('== Authentication');
await expectError('invalid login is rejected with 401 + message', () => authService.login('coordinator@drrc.local', 'wrong-pass1'), 401, 'Invalid');
const coord = await as('coordinator');
check('login returns mapped user + role', coord.role === 'RELIEF_COORDINATOR' && coord.name === 'Ravi Relief Coordinator', JSON.stringify(coord));
check('JWT access + refresh tokens stored', api.getAccessToken()?.split('.').length === 3 && api.getRefreshToken());
const me = await authService.me();
check('profile (/auth/profile) validates token', me.username === 'coordinator' && me.status === 'Active');
const reg = await authService.register({ username: `newop${stamp}`, name: 'New Operator', email: `newop${stamp}@test.local`, password: 'Secure123', role: 'OPERATOR' });
check('registration creates account with mapped role', reg.role === 'OPERATOR' && reg.username === `newop${stamp}`);
await expectError('registration validation errors surface field details', () => authService.register({ username: 'x', name: 'N', email: 'bad', password: 'short', role: 'OPERATOR' }), 400, 'Username:');

// 2. Dashboard & reports ---------------------------------------------------
console.log('\n== Dashboard & reports');
const dash = await dashboardService.getSummary();
const allIncidents = await incidentService.getAll();
const open = allIncidents.filter((i) => ['Reported', 'Active', 'In Progress'].includes(i.status));
check('dashboard KPIs match live database records', dash.stats.totalIncidents === allIncidents.length && dash.stats.activeEmergencies === open.length
  && dash.stats.criticalIncidents === open.filter((i) => i.severity === 'Critical').length && allIncidents.length >= 5, JSON.stringify(dash.stats));
check('dashboard charts are {name,value} series', dash.incidentStatus.some((r) => r.name === 'In Progress' && r.value > 0) && dash.priorityDistribution.length === 4);
check('dashboard recent lists + activity feed mapped', dash.recentIncidents[0]?.id && dash.recentAllocations[0]?.resourceName && dash.recentActivities[0]?.message);
const report = await reportService.getSummary();
check('report summary mapped for ReportsPage', report.totals.incidents === allIncidents.length && report.shelterOccupancy.length === (await shelterService.getAll()).length && report.supplyLevels[0].minThreshold !== undefined && report.resourceUtilization.length === 3, JSON.stringify(report.totals));

// 3. Incidents & requests (operator) ---------------------------------------
console.log('\n== Incidents & emergency requests');
await as('operator');
const reportedAt = new Date(Date.now() - 3600_000).toISOString();
const inc = await incidentService.create({ title: `E2E Flash Flood ${stamp}`, type: 'Flood', severity: 'High', status: 'Reported', location: 'Ward 12, Riverside', latitude: '13.08', longitude: '80.27', affectedPeople: 120, reportedBy: 'District Police', reportedAt, description: 'Water level rising quickly near the bridge.' });
check('incident created with UI field names', inc.id && inc.type === 'Flood' && inc.reportedBy === 'District Police' && inc.affectedPeople === 120 && inc.latitude === 13.08, JSON.stringify(inc));
const incUpd = await incidentService.update(inc.id, { ...inc, severity: 'Critical', status: 'Active' });
check('incident updated', incUpd.severity === 'Critical' && incUpd.status === 'Active');
const incList = await incidentService.getAll();
check('incident list (all pages) contains new record', incList.length === allIncidents.length + 1 && incList.some((i) => i.id === inc.id));
await expectError('invalid incident rejected with field errors', () => incidentService.create({ title: 'X', type: 'Tsunami', severity: 'High', status: 'Reported', location: 'L', description: 'd' }), 400, 'Incident type:');
const req = await requestService.create({ incidentId: inc.id, type: 'Rescue', priority: 'Critical', requesterName: 'Ward Officer', contact: '+91 90000 11111', location: 'Bridge road', peopleAffected: 14, description: 'Family stranded on a rooftop.' });
check('request linked to incident, status Pending', req.incidentId === inc.id && req.status === 'Pending' && req.requesterName === 'Ward Officer');
await expectError('operator cannot create dispatch (RBAC 403)', () => dispatchService.create({ allocationId: '1', quantity: 1 }), 403);
check('frontend permission matrix agrees (operator cannot dispatch)', !can('OPERATOR', 'dispatch', 'create') && can('RELIEF_COORDINATOR', 'dispatch', 'create'));

// 4. Teams (team lead) -----------------------------------------------------
console.log('\n== Response teams');
await as('teamlead');
const team = await teamService.create({ name: `E2E Boat Rescue ${stamp}`, type: 'Rescue', contact: '+91 90000 22222', members: 6, baseLocation: 'North Jetty', status: 'Available' });
check('team lead registers team and becomes its leader', team.leader === 'Arjun Team Lead' && team.status === 'Available' && team.members === 6, JSON.stringify(team));
const teamOff = await teamService.updateStatus(team.id, 'Unavailable');
check('team availability updated via status action', teamOff.status === 'Unavailable');
await teamService.updateStatus(team.id, 'Available');
const teamLeadIncidents = (await incidentService.getAll()).map((i) => i.id);
check('team lead only sees incidents assigned to their teams', !teamLeadIncidents.includes(inc.id));

// 5. Team assignment (operator) + completion (team lead) -------------------
console.log('\n== Team assignment');
await as('operator');
const teamAlloc = await allocationService.create(allocationPayload({ incidentId: inc.id, requestId: req.id, resourceType: 'Response Team', resourceId: team.id, quantity: 1, notes: 'Boat rescue' }));
check('operator assigns team (allocation Pending, team Assigned)', teamAlloc.status === 'Pending' && teamAlloc.resourceType === 'Response Team' && teamAlloc.quantity === 6);
check('request moved to In Progress by server', (await requestService.getById(req.id)).status === 'In Progress');
await expectError('unavailable/assigned team cannot be double-assigned', () => allocationService.create(allocationPayload({ incidentId: inc.id, resourceType: 'Response Team', resourceId: team.id })), 409);
await allocationService.updateStatus(teamAlloc.id, 'Approved');
await allocationService.updateStatus(teamAlloc.id, 'Allocated');
await as('teamlead');
check('assigned incident now visible to team lead', (await incidentService.getAll()).some((i) => i.id === inc.id));
const doneAlloc = await allocationService.updateStatus(teamAlloc.id, 'Completed');
check('team lead completes own assignment', doneAlloc.status === 'Completed');
check('team released to Available', (await teamService.getById(team.id)).status === 'Available');
const history = await teamService.getAssignments(team.id);
check('team assignment history', history.length === 1 && history[0].status === 'Completed');

// 6. Shelters & supplies (coordinator) --------------------------------------
console.log('\n== Shelters & supplies');
await as('coordinator');
const shelter = await shelterService.create({ name: `E2E School Shelter ${stamp}`, status: 'Open', location: 'Govt School, Ward 12', capacity: 50, occupancy: 10, contact: '+91 90000 33333', managerName: 'Head Master', facilities: 'Toilets' });
check('shelter created, available beds computed', shelter.availableBeds === 40 && shelter.managerName === 'Head Master');
await expectError('occupancy above capacity rejected', () => shelterService.updateOccupancy(shelter.id, 51), 400, 'exceed');
const occ = await shelterService.updateOccupancy(shelter.id, 50);
check('shelter becomes Full automatically', occ.status === 'Full' && occ.occupancy === 50);
await shelterService.updateOccupancy(shelter.id, 20);

const supply = await supplyService.create({ name: `E2E Water Cans ${stamp}`, category: 'Drinking Water', quantity: 300, unit: 'Litres', minThreshold: 50, warehouse: 'Central Warehouse' });
check('supply created', supply.quantity === 300 && supply.available === 300 && supply.warehouse === 'Central Warehouse');
const restocked = await supplyService.adjustStock(supply.id, { type: 'RESTOCK', quantity: 100, note: 'Donation batch' });
check('restock adds to inventory', restocked.quantity === 400);
await expectError('negative inventory rejected', () => supplyService.adjustStock(supply.id, { type: 'CORRECTION', quantity: -5 }), 400);

// 7. Allocation -> dispatch -> delivery (coordinator) ------------------------
console.log('\n== Allocation & dispatch');
await expectError('allocation above available stock rejected', () => allocationService.create(allocationPayload({ incidentId: inc.id, resourceType: 'Relief Supply', resourceId: supply.id, quantity: 401 })), 409, 'Insufficient');
const supAlloc = await allocationService.create(allocationPayload({ incidentId: inc.id, requestId: req.id, resourceType: 'Relief Supply', resourceId: supply.id, quantity: 150, notes: 'Water for rescued families' }));
const reserved = await supplyService.getById(supply.id);
check('allocation reserves stock (available drops, stock unchanged)', reserved.quantity === 400 && reserved.reserved === 150 && reserved.available === 250);
const shelterAlloc = await allocationService.create(allocationPayload({ incidentId: inc.id, resourceType: 'Shelter', resourceId: shelter.id, quantity: 25 }));
check('shelter allocation adds occupancy', (await shelterService.getById(shelter.id)).occupancy === 45 && shelterAlloc.status === 'Pending');
await expectError('dispatch requires approved allocation', () => dispatchService.create({ allocationId: supAlloc.id, quantity: 10, origin: 'W', destination: 'D', vehicle: 'V' }), 409, 'approved');
await allocationService.updateStatus(supAlloc.id, 'Approved');
// edit-form round trip: full UI object re-submitted, only notes changed
const edited = await allocationService.update(supAlloc.id, { ...(await allocationService.getById(supAlloc.id)), notes: 'Priority: rooftop families' });
check('allocation edit form round-trips', edited.notes === 'Priority: rooftop families' && edited.status === 'Approved');
await expectError('dispatch quantity above remaining rejected', () => dispatchService.create({ allocationId: supAlloc.id, quantity: 151, origin: 'W', destination: 'D', vehicle: 'V' }), 400, 'Maximum dispatchable quantity is 150');
const disp = await dispatchService.create({ allocationId: supAlloc.id, incidentId: inc.id, quantity: 150, origin: 'Central Warehouse', destination: 'Ward 12 relief point', vehicle: 'TN-01-AB-1234', driver: 'R. Kumar', notes: 'Fragile' });
check('dispatch recorded (Prepared) with driver/vehicle', disp.status === 'Prepared' && disp.driver === 'R. Kumar' && disp.vehicle === 'TN-01-AB-1234' && disp.resourceSummary.startsWith('150 ×'), JSON.stringify(disp));
const sent = await dispatchService.updateStatus(disp.id, 'Dispatched');
const afterDispatch = await supplyService.getById(supply.id);
check('marking Dispatched deducts inventory', sent.dispatchTime && afterDispatch.quantity === 250 && afterDispatch.reserved === 0 && afterDispatch.dispatched === 150, JSON.stringify(afterDispatch));
check('allocation auto-moves to Allocated', (await allocationService.getById(supAlloc.id)).status === 'Allocated');
// dispatch edit form re-sends unchanged quantity after dispatch (regression for backend fix)
const dEdit = await dispatchService.update(disp.id, { ...sent, driver: 'S. Rao' });
check('dispatch edit after dispatch (unchanged quantity) accepted', dEdit.driver === 'S. Rao');
await expectError('backward dispatch status rejected', () => dispatchService.updateStatus(disp.id, 'Prepared'), 409, 'Invalid dispatch status change');
await dispatchService.updateStatus(disp.id, 'In Transit');
await dispatchService.updateStatus(disp.id, 'Delivered', { note: 'Received by ward officer' });
const done = await dispatchService.updateStatus(disp.id, 'Completed');
check('dispatch timeline timestamps recorded', done.inTransitAt && done.deliveredAt && done.completedAt && done.completionNotes === 'Received by ward officer');
check('supply allocation auto-completes after full delivery', (await allocationService.getById(supAlloc.id)).status === 'Completed');

// 8. Closing incident with active allocations is blocked ---------------------
console.log('\n== Business rules across modules');
await as('operator');
await expectError('incident with active allocations cannot be completed', () => incidentService.updateStatus(inc.id, 'Completed'), 409, 'active resource allocations');
await as('coordinator');
await allocationService.update(shelterAlloc.id, { ...(await allocationService.getById(shelterAlloc.id)), status: 'Cancelled' });
check('cancelling shelter allocation frees beds', (await shelterService.getById(shelter.id)).occupancy === 20);
await as('operator');
const closed = await incidentService.updateStatus(inc.id, 'Completed');
check('incident completed once allocations are closed', closed.status === 'Completed' && closed.resolvedAt);
await as('coordinator');
await expectError('completed incident rejects new allocations', () => allocationService.create(allocationPayload({ incidentId: inc.id, resourceType: 'Relief Supply', resourceId: supply.id, quantity: 1 })), 409, 'Reopen');

// 9. Users (admin) -----------------------------------------------------------
console.log('\n== User management');
await expectError('non-admin cannot list users', () => userService.getAll(), 403);
await as('admin');
const users = await userService.getAll();
check('admin lists users with mapped roles/status', users.some((u) => u.role === 'TEAM_LEAD') && users.every((u) => ['Active', 'Inactive'].includes(u.status)));
const leads = await userService.getTeamLeads();
check('team-lead picker source', leads.length >= 2 && leads.every((u) => u.role === 'TEAM_LEAD'));
const nu = await userService.create({ name: 'E2E Coordinator', username: `e2ecoord${stamp}`, email: `e2ecoord${stamp}@test.local`, phone: '', role: 'RELIEF_COORDINATOR', status: 'Active', password: 'Secure123' });
check('admin creates user', nu.role === 'RELIEF_COORDINATOR' && nu.status === 'Active');
const off = await userService.update(nu.id, { ...nu, status: 'Inactive' });
check('admin deactivates via account status', off.status === 'Inactive');
await expectError('deactivated user cannot log in', () => authService.login(`e2ecoord${stamp}@test.local`, 'Secure123'), 403);

// 10. Token expiry / refresh / logout ----------------------------------------
console.log('\n== Token handling');
await as('coordinator');
localStorage.setItem(api.TOKEN_KEY, 'expired.or.invalid');
const viaRefresh = await shelterService.getById(shelter.id);
check('invalid/expired access token is refreshed transparently', viaRefresh.id === shelter.id && api.getAccessToken() !== 'expired.or.invalid');
const before = expiredEvents;
localStorage.setItem(api.TOKEN_KEY, 'bad.token.x');
localStorage.setItem(api.REFRESH_TOKEN_KEY, 'bad.refresh.x');
await expectError('unrecoverable 401 rejects the call', () => shelterService.getAll(), 401);
check('session cleared + auth:expired emitted (redirect to login)', expiredEvents === before + 1 && !api.getAccessToken() && !authService.getStoredUser());
await as('coordinator');
const oldAccess = api.getAccessToken();
const oldRefresh = api.getRefreshToken();
await authService.logout();
check('logout clears local session', !api.getAccessToken() && !api.getRefreshToken());
const raw = (await import(pathToFileURL(path.join(SRC, '../node_modules/axios/index.js')).href)).default;
const probe = (token, url, method = 'get') => raw({ method, url: `${api.API_BASE_URL}${url}`, headers: { Authorization: `Bearer ${token}` } }).then((r) => r.status, (e) => e.response?.status);
check('logout revoked access token on server', (await probe(oldAccess, '/auth/profile')) === 401);
check('logout revoked refresh token on server', (await probe(oldRefresh, '/auth/refresh', 'post')) === 401);

// 11. Network failure message ------------------------------------------------
const offline = raw.create({ baseURL: 'http://127.0.0.1:5999/api', timeout: 2000 });
offline.interceptors.response.use(undefined, api.default.interceptors.response.handlers[0].rejected);
try { await offline.get('/health'); } catch (err) { check('network error produces friendly message', getErrorMessage(err).startsWith('Unable to reach the server')); }

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
