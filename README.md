<<<<<<< HEAD
# Disaster Response Resource Coordinator — Frontend

A React + Vite web app for an emergency control room. It brings incidents, emergency requests, response teams, shelters, relief supplies, resource allocation and dispatch tracking together in one place, with navigation based on each user's role.

The app is connected to the **Flask REST API** in the separate `Disaster Response-backend` project. All data is read and written through that API: the browser never touches the SQLite database, and nothing is hard-coded or mocked.

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

## Running the application

The frontend and backend run independently, each on its own port. Start the backend first.

**1. Backend** (in `Disaster Response-backend`, Python 3.12+)

```bash
pip install -r requirements.txt
flask --app run.py db upgrade      # first run: create the SQLite schema
flask --app run.py seed            # first run: demo users, teams, shelters, supplies and 5 scenarios
python run.py                      # http://127.0.0.1:5000
```

**2. Frontend** (in this folder, Node.js 18+)

```bash
npm install
cp .env.example .env               # Windows PowerShell: Copy-Item .env.example .env
npm run dev                        # http://localhost:5173
```

Open http://localhost:5173.

For a production build, run `npm run build`; `npm run preview` serves the result locally.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:5000/api` | Base URL of the Flask REST API |
| `VITE_API_TIMEOUT` | `15000` | Request timeout in milliseconds |

Restart `npm run dev` after you change `.env`. The backend's CORS settings allow `http://localhost:5173` and `http://127.0.0.1:5173` by default. If the frontend is served from any other origin, set `CORS_ORIGINS` in the backend.

### Demo accounts

`flask seed` creates these accounts. All of them use the password `Password@123`, which can be changed with `SEED_DEFAULT_PASSWORD` in the backend.

| Role | Email |
|---|---|
| Administrator | admin@drrc.local |
| Control Room Operator | operator@drrc.local |
| Response Team Lead | teamlead@drrc.local, teamlead2@drrc.local |
| Relief Coordinator | coordinator@drrc.local |

New users can also sign up on the **Create account** page. Self-registration offers every role except Administrator.

## Features

- **Authentication**:
  - Login, registration, and logout (with a confirmation step). Logout revokes the tokens on the server.
  - Protected routes and role-based redirection.
  - The stored session is re-validated against the server on startup, so role changes and deactivation take effect.
  - An expired access token is refreshed automatically. If the refresh fails, the user is sent back to the login page.
- **Dashboard**:
  - 8 KPI cards: total and active incidents (with the critical count), pending requests, available teams, active shelters and free beds, available supplies, dispatched resources (with active allocations), and completed operations.
  - Incident-status and emergency-priority charts, recent incidents, recent allocations and an activity feed.
  - All figures come from `GET /api/reports/dashboard`.
- **Incidents**: register, edit, view details (with an OpenStreetMap link), set severity, update status, record the reporting source and time, location and coordinates, delete (Administrator).
- **Emergency requests**: create, edit, set priority, track status, record completion notes, and assign resources (opens an allocation form already linked to the request).
- **Response teams**: register teams (an Administrator picks the lead account; a team lead registering a team becomes its lead), update availability, assign a team to an incident, view assignment history.
- **Shelters**: capacity, occupancy and free beds per shelter, an "update occupancy" action that rejects anything above capacity, availability status that switches to Full automatically, and a summary strip.
- **Relief supplies**:
  - Inventory CRUD, with stock shown as in stock / reserved by allocations / available.
  - Stock adjustments: restock or count correction.
  - Dispatched totals and low-stock alerts.
- **Resource allocation**:
  - Allocate teams, shelters or supplies to incidents and requests, checked against the available stock and free beds.
  - Workflow: Pending → Approved → Allocated → Completed, or Cancelled.
  - Active / History / All tabs, and a "record dispatch" shortcut.
- **Dispatch tracking**:
  - Record a dispatch against an allocation; the quantity defaults to what is left to dispatch.
  - Driver and vehicle details.
  - Workflow: Prepared → Dispatched → In Transit → Delivered → Completed. Stock is deducted when the dispatch is marked Dispatched.
  - One-click "mark dispatched / delivered / completed" actions and a timeline with the time of each stage as recorded by the server.
- **Reports**: situation summary, incident distribution, resource utilisation, team availability, shelter occupancy (chart and table), supply levels and completed operations, from a single snapshot (`GET /api/reports/summary`). Export to CSV or print.
  - **Saved situation reports**: Operators and Coordinators can **Save snapshot** to freeze the current report, with a title and notes. Every role can open a saved report in the same view, marked by a banner, and go back to the live report. Only Administrators can delete one. The backend stores snapshots in MongoDB; if MongoDB is unavailable, the list shows a short notice and everything else keeps working.
- **User management** (Administrator only): create, edit, assign roles, and deactivate accounts by setting the account status to Inactive. Accounts are never deleted, so the audit history is kept.

Shared across all modules:
- Search, filters, sortable columns, and pagination with a page-size selector.
- Confirmation dialogs before deleting.
- Success and error toasts. Server validation messages include the field details.
- Loading indicators, and empty and error states.
- A responsive layout: the sidebar becomes a slide-in menu on small screens.

## Roles and permissions

The permission matrix lives in `src/utils/permissions.js`. It controls the sidebar, the routes, and which buttons appear, and it mirrors the Flask role checks so the UI only offers actions the API will accept. **The backend enforces every rule independently**, including record-level rules such as "team leads may only manage their own teams and assignments".

| Module | Administrator | Control Room Operator | Response Team Lead | Relief Coordinator |
|---|---|---|---|---|
| Dashboard / Reports | ✔ | ✔ | ✔ | ✔ |
| Incidents | full | create / edit / status | view (assigned incidents only) | view |
| Emergency requests | full | create / edit / status / assign / delete | view and update status (assigned incidents) | edit / status / assign |
| Response teams | full | view / assign | create / edit / availability (own teams) | view / assign |
| Shelters | full | view | — | full |
| Relief supplies | full | view | — | full |
| Resource allocation | full | team assignments | view and complete own team's assignment | full |
| Dispatch tracking | full | view | record transit / delivery / completion of own dispatches | full |
| User management | full | — | — | — |

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
  pages/                  Login, Register, Dashboard, Incidents, Requests, Teams, Shelters,
                          Supplies, Allocations, Dispatch, Reports, Users, Errors
  services/
    api.js                Axios instance: base URL, JSON headers, JWT header, token refresh,
                          401 handling, network-error messages, pagination helper
    endpoints.js          all Flask REST paths in one place
    adapters.js           translation between Flask records and UI objects
    crudService.js        shared getAll/getById/create/update/remove/updateStatus
    authService.js  incidentService.js  requestService.js  teamService.js
    shelterService.js  supplyService.js  allocationService.js  dispatchService.js
    dashboardService.js  reportService.js  userService.js
  hooks/                  useAuth, useToast, useFetch, useLookups
  context/                AuthContext, ToastContext
  routes/                 AppRoutes, ProtectedRoute / RoleRoute
  utils/                  constants, permissions, navigation, validators, formatters, chartColors
  App.jsx  main.jsx  index.css
```

Pages never call Axios directly. They use the service modules, and the services use the shared Axios instance in `api.js`.

## How the integration works

- **One API client.** `src/services/api.js` creates the only Axios instance:
  - It reads `VITE_API_BASE_URL` and sends `Authorization: Bearer <access token>` with every request.
  - On a `401` it calls `POST /auth/refresh` once (concurrent requests share that single refresh) and retries. If that fails, it clears the session and fires `auth:expired`; `AuthContext` then logs out and `ProtectedRoute` redirects to `/login`.
  - It turns network failures and timeouts into readable messages.
- **One translation layer.** Flask uses snake_case fields and integer ids and wraps every response as `{ success, message, data }`. `src/services/adapters.js` converts each resource both ways, so pages keep working with camelCase objects and string ids.
  - Partial updates send only the fields that changed, and blank optional fields are sent as `null`.
  - Some form fields have a different name on the server, for example `peopleAffected` ↔ `people_affected`, `minThreshold` ↔ `low_stock_threshold` and `driver` ↔ `driver_name`.
- **Status vocabularies match the backend.** `src/utils/constants.js` uses the backend's values exactly: incident, request, team, shelter, allocation and dispatch statuses, categories and types. The server enforces the status workflows and returns a clear `409` message for an invalid transition.
- **Lists.** List endpoints are paginated (at most 100 per page). `fetchAll` collects every page, and the tables then search, filter, sort and paginate on the client.
- **Errors.** Failed requests show a toast with the server's message plus up to three field-level validation details, for example *"Invalid incident information. Incident type: Must be one of: …"*.

### Endpoints used

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/profile` |
| Dashboard | `GET /reports/dashboard` |
| Reports | `GET /reports/summary` |
| Saved situation reports | `GET / POST /reports/snapshots`, `GET / DELETE /reports/snapshots/{id}` |
| Incidents, requests, teams, shelters, supplies | `GET / POST /{resource}`, `GET / PUT / DELETE /{resource}/{id}` |
| Allocations | `GET / POST /allocations`, `GET / PUT /allocations/{id}` (allocations are cancelled, never deleted) |
| Dispatch | `GET / POST /dispatch`, `GET / PUT / DELETE /dispatch/{id}` (delete only while Prepared) |
| Team assignment history | `GET /allocations?team_id={id}` |
| Users (Administrator) | `GET / POST /users`, `GET / PUT /users/{id}` |

Status changes, shelter occupancy and stock adjustments are ordinary `PUT` updates. The full API reference is in the backend project at `docs/API.md`.

## Integration check

```bash
npm run test:integration
```

This runs the **real frontend service layer** (the services, the adapters and the Axios interceptors) in Node against the running Flask API. It takes each role through the whole workflow:

- Login, registration, the dashboard and reports.
- Incident and request CRUD.
- Team assignment and its completion by the team lead.
- Shelter capacity and stock limits.
- Allocation → dispatch → delivery, including the inventory deduction.
- Role-based (403) responses, token refresh, expiry and logout revocation.

It also saves, lists, opens and deletes a situation-report snapshot in MongoDB. It then prints a PASS/FAIL line for each of the 68 checks.

Requirements:
- The backend must be running at `http://127.0.0.1:5000` and seeded with `flask seed`.
- The check creates records whose names start with `E2E`, so run it against a development or demo database, never production.
=======
# disaster-frontend-
>>>>>>> 20638690bdda7d6ed85b37cb79c5c5c0855cc8e9
