/**
 * Translation layer between the Flask API (snake_case, integer ids) and the
 * shapes used by pages and components (camelCase, string ids).
 *
 * Every resource has:
 *   fromApi(record)          -> UI object
 *   toApi(values, mode)      -> request body ('create' | 'update'); only keys present
 *                               in `values` are sent, so partial updates stay partial.
 * Pages never see backend field names, and services never hand raw API data to pages.
 */

// ---------------------------------------------------------------- helpers
const toId = (v) => (v === null || v === undefined || v === '' ? null : String(v));
const blankToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
const toNumber = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

/**
 * Builds an API payload from UI values. `map` is { uiKey: apiKey | [apiKey, transform] }.
 * Blank strings become null so optional fields can be cleared.
 */
const pick = (values, map) => {
  const out = {};
  Object.entries(map).forEach(([uiKey, target]) => {
    if (!(uiKey in values) || values[uiKey] === undefined) return;
    const [apiKey, transform] = Array.isArray(target) ? target : [target, (v) => v];
    out[apiKey] = transform(blankToNull(values[uiKey]));
  });
  return out;
};

/** Removes keys whose value is null (for fields the API requires to be present when sent). */
const withoutNulls = (obj, keys) => {
  keys.forEach((k) => {
    if (obj[k] === null) delete obj[k];
  });
  return obj;
};

/** { Open: 3, Full: 1 } -> [{ name: 'Open', value: 3 }, ...] (chart series). */
export const toSeries = (counts = {}) => Object.entries(counts).map(([name, value]) => ({ name, value }));

// ---------------------------------------------------------------- roles & users
export const ROLE_TO_API = {
  ADMIN: 'admin',
  OPERATOR: 'control_room_operator',
  TEAM_LEAD: 'response_team_lead',
  RELIEF_COORDINATOR: 'relief_coordinator',
};
const ROLE_FROM_API = Object.fromEntries(Object.entries(ROLE_TO_API).map(([ui, apiRole]) => [apiRole, ui]));

export const userAdapter = {
  fromApi: (u) => ({
    id: toId(u.id),
    username: u.username,
    name: u.full_name,
    email: u.email,
    phone: u.phone || '',
    role: ROLE_FROM_API[u.role] || u.role,
    status: u.is_active ? 'Active' : 'Inactive',
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }),
  toApi: (v) => {
    const body = pick(v, {
      username: 'username',
      name: 'full_name',
      email: 'email',
      phone: 'phone',
      role: ['role', (r) => ROLE_TO_API[r] || r],
      status: ['is_active', (s) => s === 'Active'],
      password: 'password',
    });
    return withoutNulls(body, ['username', 'full_name', 'email', 'role', 'password']);
  },
};

// ---------------------------------------------------------------- incidents
export const incidentAdapter = {
  fromApi: (i) => ({
    id: toId(i.id),
    title: i.title,
    type: i.incident_type,
    description: i.description,
    location: i.location,
    latitude: i.latitude ?? '',
    longitude: i.longitude ?? '',
    severity: i.severity,
    status: i.status,
    affectedPeople: i.affected_people,
    reportedBy: i.reported_source || i.reporter?.full_name || '',
    reportedAt: i.reported_at || i.created_at,
    registeredBy: i.reporter?.full_name || '',
    resolvedAt: i.resolved_at,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  }),
  toApi: (v) =>
    withoutNulls(
      pick(v, {
        title: 'title',
        type: 'incident_type',
        description: 'description',
        location: 'location',
        latitude: ['latitude', toNumber],
        longitude: ['longitude', toNumber],
        severity: 'severity',
        status: 'status',
        affectedPeople: ['affected_people', toNumber],
        reportedBy: 'reported_source',
        reportedAt: 'reported_at',
      }),
      ['title', 'incident_type', 'description', 'location', 'severity', 'status', 'affected_people'],
    ),
};

// ---------------------------------------------------------------- emergency requests
export const requestAdapter = {
  fromApi: (r) => ({
    id: toId(r.id),
    incidentId: toId(r.incident_id),
    incidentTitle: r.incident_title,
    type: r.category,
    description: r.description,
    priority: r.priority,
    status: r.status,
    requesterName: r.contact_name || r.requester?.full_name || '',
    contact: r.contact_phone || '',
    location: r.location || '',
    peopleAffected: r.people_affected,
    quantityRequested: r.quantity_requested,
    completionNotes: r.completion_notes || '',
    completedAt: r.completed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  toApi: (v) =>
    withoutNulls(
      pick(v, {
        incidentId: 'incident_id',
        type: 'category',
        description: 'description',
        priority: 'priority',
        status: 'status',
        requesterName: 'contact_name',
        contact: 'contact_phone',
        location: 'location',
        peopleAffected: ['people_affected', toNumber],
        quantityRequested: ['quantity_requested', toNumber],
        completionNotes: 'completion_notes',
      }),
      ['incident_id', 'category', 'description', 'priority', 'status', 'people_affected'],
    ),
};

// ---------------------------------------------------------------- response teams
export const teamAdapter = {
  fromApi: (t) => ({
    id: toId(t.id),
    name: t.name,
    type: t.team_type,
    leadId: toId(t.lead_id) || '',
    leader: t.lead?.full_name || 'Unassigned',
    contact: t.contact_phone || '',
    members: t.member_count,
    baseLocation: t.base_location || '',
    equipment: t.equipment || '',
    status: t.availability,
    currentIncidentId: toId(t.current_incident_id),
    currentIncidentTitle: t.current_incident_title,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }),
  toApi: (v) =>
    withoutNulls(
      pick(v, {
        name: 'name',
        type: 'team_type',
        members: ['member_count', toNumber],
        contact: 'contact_phone',
        baseLocation: 'base_location',
        equipment: 'equipment',
        status: 'availability',
        leadId: 'lead_id',
      }),
      ['name', 'team_type', 'member_count', 'availability'],
    ),
};

// ---------------------------------------------------------------- shelters
export const shelterAdapter = {
  fromApi: (s) => ({
    id: toId(s.id),
    name: s.name,
    location: s.location,
    capacity: s.capacity,
    occupancy: s.current_occupancy,
    availableBeds: s.available_beds,
    occupancyRate: s.occupancy_rate,
    status: s.status,
    managerName: s.contact_person || '',
    contact: s.contact_phone || '',
    facilities: s.facilities || '',
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }),
  toApi: (v) =>
    withoutNulls(
      pick(v, {
        name: 'name',
        location: 'location',
        capacity: ['capacity', toNumber],
        occupancy: ['current_occupancy', toNumber],
        status: 'status',
        managerName: 'contact_person',
        contact: 'contact_phone',
        facilities: 'facilities',
      }),
      ['name', 'location', 'capacity', 'current_occupancy', 'status'],
    ),
};

// ---------------------------------------------------------------- relief supplies
export const supplyAdapter = {
  fromApi: (s) => ({
    id: toId(s.id),
    name: s.name,
    category: s.category,
    unit: s.unit,
    quantity: s.quantity, // physical stock in the warehouse
    reserved: s.reserved_quantity, // promised to active allocations
    available: s.available_quantity, // quantity - reserved
    dispatched: s.dispatched_quantity,
    minThreshold: s.low_stock_threshold,
    isLowStock: s.is_low_stock,
    lowStockWarning: s.low_stock_warning,
    warehouse: s.warehouse_location || '',
    description: s.description || '',
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }),
  toApi: (v) =>
    withoutNulls(
      pick(v, {
        name: 'name',
        category: 'category',
        unit: 'unit',
        quantity: ['quantity', toNumber],
        minThreshold: ['low_stock_threshold', toNumber],
        warehouse: 'warehouse_location',
        description: 'description',
      }),
      ['name', 'category', 'unit', 'quantity', 'low_stock_threshold'],
    ),
  /** Stock adjustment form -> PUT body. RESTOCK adds stock; CORRECTION sets the counted quantity. */
  stockToApi: ({ type, quantity, note }) => {
    const body = type === 'RESTOCK' ? { restock_quantity: Number(quantity) } : { quantity: Number(quantity) };
    if (note && note.trim()) body.adjustment_note = note.trim().slice(0, 255);
    return body;
  },
};

// ---------------------------------------------------------------- allocations
export const RESOURCE_TYPE_TO_API = { 'Response Team': 'Team', 'Relief Supply': 'Supply', Shelter: 'Shelter' };
const RESOURCE_TYPE_FROM_API = Object.fromEntries(Object.entries(RESOURCE_TYPE_TO_API).map(([ui, a]) => [a, ui]));
const RESOURCE_ID_FIELD = { Team: 'team_id', Supply: 'supply_id', Shelter: 'shelter_id' };

export const allocationAdapter = {
  fromApi: (a) => ({
    id: toId(a.id),
    incidentId: toId(a.incident_id),
    incidentTitle: a.incident_title,
    requestId: toId(a.request_id),
    resourceType: RESOURCE_TYPE_FROM_API[a.resource_type] || a.resource_type,
    resourceId: toId(a.team_id ?? a.supply_id ?? a.shelter_id),
    resourceName: a.resource_name,
    quantity: a.quantity,
    dispatchedQuantity: a.dispatched_quantity,
    remainingQuantity: a.remaining_quantity,
    status: a.status,
    notes: a.notes || '',
    progressNotes: a.progress_notes || '',
    allocatedAt: a.created_at,
    allocatedBy: a.allocated_by?.full_name || '',
    approvedBy: a.approved_by?.full_name || '',
    approvedAt: a.approved_at,
    completedAt: a.completed_at,
    cancelledAt: a.cancelled_at,
    cancellationReason: a.cancellation_reason || '',
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }),
  toApi: (v, mode = 'create') => {
    const apiType = RESOURCE_TYPE_TO_API[v.resourceType] || v.resourceType;
    const isTeam = apiType === 'Team';
    if (mode === 'create') {
      const body = pick(v, { incidentId: 'incident_id', requestId: 'request_id', notes: 'notes' });
      body.resource_type = apiType;
      if (RESOURCE_ID_FIELD[apiType]) body[RESOURCE_ID_FIELD[apiType]] = v.resourceId;
      if (!isTeam) body.quantity = toNumber(v.quantity); // a team's quantity is its size, set by the server
      return withoutNulls(body, ['request_id']);
    }
    // Incident and resource are fixed once allocated; only workflow fields can change.
    const body = pick(v, {
      status: 'status',
      notes: 'notes',
      progressNotes: 'progress_notes',
      requestId: 'request_id',
      cancellationReason: 'cancellation_reason',
      ...(isTeam ? {} : { quantity: ['quantity', toNumber] }),
    });
    return withoutNulls(body, ['status', 'request_id', 'quantity', 'cancellation_reason']);
  },
};

// ---------------------------------------------------------------- dispatch records
export const dispatchAdapter = {
  fromApi: (d) => {
    const resourceType = RESOURCE_TYPE_FROM_API[d.resource_type] || d.resource_type;
    return {
      id: toId(d.id),
      allocationId: toId(d.allocation_id),
      incidentId: toId(d.incident_id),
      resourceType,
      resourceName: d.resource_name,
      resourceSummary: resourceType === 'Response Team' ? d.resource_name : `${d.quantity} × ${d.resource_name}`,
      quantity: d.quantity,
      teamId: toId(d.team_id),
      teamName: d.team_name || '',
      origin: d.origin || '',
      destination: d.destination || '',
      vehicle: d.vehicle_details || '',
      driver: d.driver_name || '',
      status: d.status,
      notes: d.notes || '',
      completionNotes: d.completion_notes || '',
      dispatchTime: d.dispatched_at,
      inTransitAt: d.in_transit_at,
      deliveredAt: d.delivered_at,
      completedAt: d.completed_at,
      createdBy: d.created_by?.full_name || '',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  },
  toApi: (v, mode = 'create') => {
    const body = pick(v, {
      ...(mode === 'create' ? { allocationId: 'allocation_id' } : { status: 'status', completionNotes: 'completion_notes' }),
      quantity: ['quantity', toNumber],
      origin: 'origin',
      destination: 'destination',
      vehicle: 'vehicle_details',
      driver: 'driver_name',
      notes: 'notes',
    });
    return withoutNulls(body, ['quantity', 'status', ...(mode === 'update' ? ['destination'] : [])]);
  },
  /** Status dialog: the optional note is stored as completion notes once goods arrive. */
  statusToApi: (status, { note } = {}) => {
    const body = { status };
    if (note && note.trim()) body[['Delivered', 'Completed'].includes(status) ? 'completion_notes' : 'notes'] = note.trim();
    return body;
  },
};

// ---------------------------------------------------------------- dashboard & reports
const ENTITY_MODULE = {
  incident: 'Incidents',
  emergency_request: 'Requests',
  team: 'Teams',
  shelter: 'Shelters',
  supply: 'Supplies',
  allocation: 'Allocation',
  dispatch: 'Dispatch',
  user: 'Users',
};

export const activityAdapter = {
  fromApi: (a) => ({
    id: toId(a.id),
    message: a.description,
    module: ENTITY_MODULE[a.entity_type] || a.entity_type,
    user: a.user || 'System',
    timestamp: a.created_at,
  }),
};

export const dashboardAdapter = {
  fromApi: (d) => ({
    generatedAt: d.generated_at,
    stats: {
      totalIncidents: d.total_incidents,
      activeEmergencies: d.active_incidents,
      criticalIncidents: d.critical_incidents,
      pendingRequests: d.pending_requests,
      openRequests: d.open_requests,
      availableTeams: d.available_teams,
      totalTeams: d.total_teams,
      activeShelters: d.active_shelters,
      availableBeds: d.available_shelter_beds,
      availableSupplies: d.total_available_supplies,
      lowStockItems: d.low_stock_items,
      activeAllocations: d.active_allocations,
      dispatchedResources: d.dispatched_resources,
      completedOperations: (d.completed_operations?.allocations || 0) + (d.completed_operations?.dispatches || 0),
    },
    incidentStatus: toSeries(d.incident_status),
    priorityDistribution: toSeries(d.priority_distribution),
    recentIncidents: (d.recent_incidents || []).map(incidentAdapter.fromApi),
    recentAllocations: (d.recent_allocations || []).map(allocationAdapter.fromApi),
    recentActivities: (d.recent_activities || []).map(activityAdapter.fromApi),
  }),
};

const sum = (items, key) => items.reduce((total, item) => total + (Number(item[key]) || 0), 0);

export const reportAdapter = {
  fromApi: ({ generated_at: generatedAt, dashboard, incidents, resources, shelters, teams }) => {
    const supplies = resources.supplies || [];
    const ops = dashboard.completed_operations || {};
    return {
      generatedAt,
      totals: {
        incidents: incidents.total,
        activeIncidents: dashboard.active_incidents,
        resolvedIncidents: ops.incidents,
        peopleAffected: incidents.affected_people,
        requests: incidents.requests.total,
        fulfilledRequests: incidents.requests.by_status.Completed || 0,
        allocations: resources.allocations.total,
        dispatches: resources.dispatches.total,
      },
      incidentsByType: toSeries(incidents.by_type).filter((r) => r.value > 0),
      incidentsBySeverity: toSeries(incidents.by_severity),
      incidentsByStatus: toSeries(incidents.by_status),
      resourceUtilization: [
        {
          name: 'Response teams',
          used: (teams.by_availability.Assigned || 0) + (teams.by_availability.Busy || 0),
          total: teams.total_teams,
        },
        { name: 'Shelter beds', used: shelters.total_occupancy, total: shelters.total_capacity },
        { name: 'Relief supplies', used: sum(supplies, 'dispatched'), total: sum(supplies, 'dispatched') + sum(supplies, 'quantity') },
      ],
      shelterOccupancy: (shelters.shelters || []).map((s) => ({
        name: s.name,
        capacity: s.capacity,
        occupancy: s.current_occupancy,
        status: s.status,
      })),
      teamAvailability: toSeries(teams.by_availability),
      supplyLevels: supplies.map((s) => ({
        name: s.name,
        quantity: s.available,
        dispatched: s.dispatched,
        minThreshold: s.low_stock_threshold,
        unit: s.unit,
      })),
      completedOperations: {
        allocations: ops.allocations,
        dispatches: ops.dispatches,
        incidentsResolved: ops.incidents,
        requestsFulfilled: ops.requests,
      },
    };
  },
};
