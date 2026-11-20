# Disaster Response Resource Coordinator — Frontend

A React + Vite web app for an emergency control room. It brings incidents, emergency requests, response teams, shelters, relief supplies, resource allocation and dispatch tracking together in one place, with navigation based on each user's role.

The frontend is independent of the backend. All data goes through an Axios service layer. Until the backend is ready, a **built-in mock API** answers the same REST calls in the browser, so every page and button already works.

---

## Tech stack

| Concern | Library |
|---|---|
| UI | React 18, JavaScript, HTML5, CSS3 |
| Build tool | Vite 5 |
| Styling | Bootstrap 5 (grid, forms, buttons) and a custom control-room theme (`src/index.css`) |
| Routing | React Router DOM 6 |
| HTTP | Axios |
| Charts | Recharts |
| Icons | Lucide React |

## Getting started

Prerequisites: **Node.js 18+** and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 3. Start the development server
npm run dev                 # http://localhost:5173

# Production build and local preview
npm run build
npm run preview
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL of the backend REST API |
| `VITE_USE_MOCK_API` | `true` | `true` serves all requests from the in-browser mock API. `false` sends them to `VITE_API_BASE_URL` |
| `VITE_API_TIMEOUT` | `15000` | Request timeout in milliseconds |

Restart `npm run dev` after you change `.env`.

### Demo accounts (mock API only)

| Role | Email | Password |
|---|---|---|
| Administrator | admin@drrc.gov | admin123 |
| Control Room Operator | operator@drrc.gov | operator123 |
| Response Team Lead | teamlead@drrc.gov | teamlead123 |
| Relief Coordinator | relief@drrc.gov | relief123 |

When the mock API is on, the login page shows one-click buttons for these accounts. Mock data is saved in the browser's `localStorage` under the key `drrc_mock_db_v1`. To restore the seed data, delete that key or clear site data.

## Features

- **Authentication**: login with validation, logout with a confirmation step, protected routes, role-based redirection, and automatic sign-out when the API returns `401`.
- **Dashboard**: 8 KPI cards (total incidents, active emergencies, pending requests, available teams, active shelters / free beds, supplies in stock, dispatched resources, completed operations). It also has incident-status and emergency-priority charts, recent incidents, recent allocations and an activity feed. All figures come from `GET /dashboard/summary`.
- **Incidents**: register, edit, view details (with an OpenStreetMap link), set severity, update status, record location and coordinates, delete.
- **Emergency requests**: create, edit, set priority, track status, and assign resources (opens an allocation form already linked to the request). The details view lists the resources assigned to the request.
- **Response teams**: register teams, update availability, assign a team to an incident, view assignment history.
- **Shelters**: capacity, occupancy and free beds per shelter, occupancy bars, an "update occupancy" action, availability status and a summary strip.
- **Relief supplies**: inventory CRUD, stock adjustments (restock / dispatch / correction), dispatched totals, and low-stock / out-of-stock alerts and filters.
- **Resource allocation**: allocate teams, shelters or supplies to incidents and requests. The form checks stock and free beds, has Active / History / All tabs, and a "record dispatch" shortcut.
- **Dispatch tracking**: record dispatches (pre-filled from an allocation), record progress with a timestamp and note, one-click "mark delivered / completed", a delivery timeline, and dispatch history.
- **Reports**: situation summary, incident distribution by type and severity, resource utilisation, team availability, shelter occupancy (chart and table), supply levels and completed operations. Export to CSV or print.
- **User management** (Administrator only): create, edit and deactivate users, and assign roles.

Shared across all modules: search, filters, sortable columns, pagination with a page-size selector, confirmation dialogs before deleting, success and error toasts, loading indicators, empty and error states, and a responsive layout (the sidebar becomes a slide-in menu on small screens).

## Roles and permissions

The permission matrix lives in `src/utils/permissions.js`. It controls the sidebar, the routes, and which buttons appear on each page. **The backend must enforce the same rules.** The frontend only hides what a role cannot use.

| Module | Administrator | Control Room Operator | Response Team Lead | Relief Coordinator |
|---|---|---|---|---|
| Dashboard / Reports | ✔ | ✔ | ✔ | ✔ |
| Incidents | full | create / edit / status | view / status | view |
| Emergency requests | full | create / edit / assign | view | create / edit / assign |
| Response teams | full | view / status / assign | create / edit / status / assign | — |
| Shelters | full | view | — | create / edit / occupancy |
| Relief supplies | full | view | — | create / edit / stock |
| Resource allocation | full | create / edit / status | view | create / edit / status |
| Dispatch tracking | full | create / edit / status | view / status | create / edit / status |
| User management | full | — | — | — |

"Full" means create, edit, status changes and delete. Only Administrators can delete records.

## Project structure

```
src/
  assets/                 static assets (logo)
  components/
    common/               reusable UI: CrudPage, DataTable, EntityForm, FormField, Modal,
                          ConfirmDialog, StatusBadge, StatusUpdateModal, RowActions,
                          PageHeader, ProgressBar, DetailsList, Spinner, EmptyState
    layout/               AppLayout, Sidebar, Topbar
    dashboard/            StatCard, ChartCard, ToneBarChart, ActivityFeed
  pages/                  Login, Dashboard, Incidents, Requests, Teams, Shelters,
                          Supplies, Allocations, Dispatch, Reports, Users, Errors
  services/
    api.js                Axios instance, auth header, 401 handling, mock switch
    endpoints.js          all REST paths in one place
    crudService.js        shared getAll/getById/create/update/remove/updateStatus
    authService.js  incidentService.js  requestService.js  teamService.js
    shelterService.js  supplyService.js  allocationService.js  dispatchService.js
    dashboardService.js  reportService.js  userService.js
    mock/                 TEMPORARY mock API (axios adapter and seed data)
  hooks/                  useAuth, useToast, useFetch, useLookups
  context/                AuthContext, ToastContext
  routes/                 AppRoutes, ProtectedRoute / RoleRoute
  utils/                  constants, permissions, navigation, validators, formatters, chartColors
  App.jsx  main.jsx  index.css
```

Pages never call Axios directly. They use the service modules, and the services use the shared Axios instance in `api.js`.

## Backend API contract

To connect a real backend, set `VITE_USE_MOCK_API=false` and set `VITE_API_BASE_URL`. If your paths differ, change them in `src/services/endpoints.js`.

Every request except login carries the header `Authorization: Bearer <token>`. Error responses should include a JSON body `{ "message": "..." }`. That message is shown to the user in a toast.

| Method | Path | Body / query | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user: { id, name, email, role, ... } }` |
| POST | `/auth/logout` | – | any |
| GET | `/auth/me` | – | `user` |
| GET | `/dashboard/summary` | – | `{ stats, incidentStatus[], priorityDistribution[], recentIncidents[], recentAllocations[], recentActivities[] }` |
| GET | `/reports/summary` | – | `{ generatedAt, totals, incidentsByType[], incidentsBySeverity[], incidentsByStatus[], resourceUtilization[], shelterOccupancy[], teamAvailability[], supplyLevels[], completedOperations }` |
| GET | `/activities` | `?limit=` | `activity[]` |
| GET / POST | `/{resource}` | filters as query params | list / created item |
| GET / PUT / DELETE | `/{resource}/{id}` | item fields | item |
| PATCH | `/{resource}/{id}/status` | `{ status, ...extra }` | item |
| PATCH | `/shelters/{id}/occupancy` | `{ occupancy }` | shelter |
| PATCH | `/supplies/{id}/stock` | `{ type: RESTOCK \| DISPATCH \| CORRECTION, quantity, note }` | supply |

`{resource}` is one of `incidents`, `requests`, `teams`, `shelters`, `supplies`, `allocations`, `dispatches`, `users`. List endpoints can return either a plain array or a paginated envelope (`{ data }`, `{ items }` or `{ content }`); both are accepted.

The exact shape of each response (field names, status values and the dashboard aggregates) is defined in `src/services/mock/mockAdapter.js` and `src/services/mock/seedData.js`. Use these two files as the reference contract. The mock also applies a few rules that the backend should own:

- Allocating a team marks it *Deployed*, and completing or cancelling the allocation releases it.
- A shelter becomes *Full* when its occupancy reaches capacity.
- Dispatch status changes set the dispatch, delivery and completion timestamps.
- Stock dispatches decrease the stock quantity and increase the dispatched total.

## Removing the mock API

When the backend is live, set `VITE_USE_MOCK_API=false`. You can then delete `src/services/mock/` and the two mock lines in `src/services/api.js`. No page or component imports the mock.
