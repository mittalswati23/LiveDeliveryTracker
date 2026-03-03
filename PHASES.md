# Live Delivery Tracker — Phase-Wise Build Plan

**Project:** Trackr Dispatch System v2.1
**Stack:** Angular 19 · .NET Core 8 · SignalR · Leaflet · SQLite · GitHub Actions
**Author:** Swati Mittal

---

## Overview

The project is split into 4 phases. Each phase ends with a runnable deliverable you can demo or commit.
No phase depends on the next — you can pause after any phase and have something working.

```
Phase 1A → Backend Foundation   (Session 1, ~2h)   Toolchain + .NET scaffold + JWT + Swagger
Phase 1B → Angular Auth         (Session 2, ~2h)   Angular scaffold + login page + auth guard
Phase 2  → Real-Time Core       (Session 3–4, ~4h) SignalR + Simulator + Live map
Phase 3  → Polish & Detail      (Session 5–6, ~4h) Full UI, detail page, dark theme
Phase 4  → Ship It              (Session 7, ~2h)   Tests, Docker, CI/CD, GitHub push
```

> **Why split Phase 1?** Cursor works best in focused 2–3 hour sessions on one layer at a time.
> Backend and frontend are independent stacks — mixing them bloats context and increases drift.
> Commit between sessions so Cursor's context stays clean and each session opens with a stable baseline.

---

## Phase 1A — Backend Foundation

**Session:** 1 · Duration: ~2 hours · Context: backend only
**Goal:** Get a working .NET API with JWT auth, seeded SQLite DB, and Swagger UI.
**Deliverable:** `POST /api/auth/login` in Swagger returns a real JWT. No frontend yet.

> Phase 1A is divided into 6 steps. Complete each step and hit its checkpoint before opening the next one in Cursor. This keeps context focused and makes errors easy to isolate.

---

### Step 1 — Repo & Project Shell (~20 min)

- [ ] `git init` in `/Users/mittalswati/Repos/LiveDeliveryTracker`
- [ ] Create `.gitignore` — covers Node, Angular, .NET, explicitly ignores `appsettings.Development.json`
- [ ] Create `.cursorrules` at repo root:
  ```
  Project: Live Delivery Tracker
  Stack: Angular 21 standalone + .NET Core 8 Web API + SignalR + Leaflet + SQLite
  Frontend root: client/src/app/
  Backend root: server/DeliveryTracker.API/
  Auth: JWT stored in localStorage (portfolio tradeoff, intentional)
  Naming: PascalCase for C# files, camelCase for TS files, kebab-case for Angular component folders
  Branding: Trackr only — never CalPortland
  Password: Trackr2025!
  ```
- [ ] `gh repo create LiveDeliveryTracker --public` + `git push -u origin main`
- [ ] Scaffold `README.md` with Trackr branding and badge placeholders
- [ ] `dotnet new webapi -n DeliveryTracker.API -o server/DeliveryTracker.API`
- [ ] Add NuGet packages:
  - `Microsoft.EntityFrameworkCore.Sqlite`
  - `Microsoft.EntityFrameworkCore.Design`
  - `Microsoft.AspNetCore.Authentication.JwtBearer`
  - `BCrypt.Net-Next`
- [ ] Delete template files: `WeatherForecast.cs` and `Controllers/WeatherForecastController.cs`

**Step 1 checkpoint:** `dotnet build` passes with zero errors. Nothing else.

---

### Step 2 — Models & Enums (~20 min)

- [ ] `Models/Enums/DeliveryStatus.cs` — `Pickup, InTransit, Nearby, Delivered, Delayed`
- [ ] `Models/Enums/PriorityLevel.cs` — `Low, Normal, High`
- [ ] `Models/Waypoint.cs` — `public record Waypoint(double Lat, double Lon);`
- [ ] `Models/Entities/Delivery.cs` — all fields including `CurrentWaypointIndex`, `CurrentLatitude`, `CurrentLongitude`, `DispatchedAt`, `PriorityLevel Priority`, `RouteWaypoints`
- [ ] `Models/Entities/Location.cs`
- [ ] `Models/Entities/AppUser.cs`
- [ ] `Models/DTOs/LoginRequestDto.cs`, `LoginResponseDto.cs`
- [ ] `Models/DTOs/DeliveryDto.cs` — includes `CurrentWaypointIndex`, `TotalWaypoints`, `DispatchedAt`, `string Priority`
- [ ] `Models/DTOs/LocationDto.cs` — includes `DeliveryNumber` and `Status`

**Step 2 checkpoint:** `dotnet build` passes. No runtime code yet — only type definitions.

---

### Step 3 — Database & Seed (~25 min)

- [ ] `Data/AppDbContext.cs` — DbSets for `Deliveries`, `Locations`, `AppUsers`; `HasConversion<string>()` for `DeliveryStatus` and `PriorityLevel`; unique index on `DeliveryNumber`
- [ ] `Data/SeedData.cs` — **5 deliveries** (DLV-2837 through DLV-2841), each with:
  - 10 waypoints in object format `{"lat":...,"lon":...}` (30s of simulator movement)
  - `CurrentLatitude` and `CurrentLongitude` set to waypoint 0
  - Mix of statuses: 2 `InTransit`, 1 `Nearby`, 1 `Pickup`, 1 `Delayed`
  - Dispatcher user: `dispatcher@trackr.io` / BCrypt hash of `Trackr2025!` / DisplayName "SM"
- [ ] Wire only `AddDbContext` in `Program.cs` (connection string only — nothing else yet)
- [ ] Run: `dotnet ef migrations add InitialCreate`
- [ ] Run: `dotnet ef database update`

**Step 3 checkpoint:** `trackr.db` exists on disk. Open with a SQLite viewer — `Deliveries` table has 5 rows, each row has `RouteWaypoints` populated with 10 waypoint objects.

---

### Step 4 — Auth Service & Controller (~25 min)

- [ ] `Services/IAuthService.cs` — `ValidateUser()` + `GenerateToken()` interface
- [ ] `Services/AuthService.cs` — BCrypt verify + `JwtSecurityToken` with claims: `email`, `role`, `displayName`, `sub`; expiry = 8 hours
- [ ] `Controllers/AuthController.cs` — `POST /api/auth/login` returns `LoginResponseDto`; 401 on bad credentials
- [ ] `appsettings.json` — add `Jwt` (issuer, audience, expiryHours), `Cors:AllowedOrigins`, `Kestrel:Endpoints:Http` sections (no secret)
- [ ] `appsettings.Development.json` — `Jwt:Secret` only (already gitignored)
- [ ] Register `IAuthService → AuthService` as scoped in `Program.cs`

**Step 4 checkpoint:** `dotnet build` passes. Auth logic exists but `dotnet run` may fail — `Program.cs` is not fully wired until Step 5.

---

### Step 5 — Program.cs & Middleware (~20 min)

- [ ] `Middleware/ExceptionHandlerMiddleware.cs` — catches unhandled exceptions, returns `{ message }` JSON
- [ ] Complete `Program.cs` using the authoritative starter code from `DESIGN-PHASE1.md`:
  - JWT bearer with `OnMessageReceived` stub (reads `access_token` from query string for SignalR — Phase 2 ready)
  - CORS reads `AllowedOrigins` from `appsettings.json`, includes `AllowCredentials()`
  - Swagger with Bearer security definition
  - `SeedData.InitializeAsync` called on startup
  - Middleware order: `ExceptionHandler` → `Swagger` → `UseCors` → `UseAuthentication` → `UseAuthorization` → `MapControllers`

**Step 5 checkpoint:** `dotnet run` starts on `http://localhost:5001` with no errors in the terminal. Swagger UI loads at `http://localhost:5001/swagger`.

---

### Step 6 — Verify & Commit (~10 min)

- [ ] Open `http://localhost:5001/swagger`
- [ ] `POST /api/auth/login` with `{ "email": "dispatcher@trackr.io", "password": "Trackr2025!" }` → 200 + JWT token
- [ ] Same endpoint with wrong password → 401
- [ ] Run `git status` — confirm `appsettings.Development.json` is NOT listed
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "feat(backend): .NET 8 scaffold, JWT auth, EF Core SQLite, 5 seeded deliveries"
  git push
  ```

**Step 6 checkpoint:** Green push on GitHub. Phase 1A complete.

---

### Phase 1A Step Summary

| Step | Job | Time | Checkpoint |
|---|---|---|---|
| 1 | Repo + project shell + NuGet | 20 min | `dotnet build` green |
| 2 | Models + enums + DTOs | 20 min | `dotnet build` green, types only |
| 3 | DB + seed + migrations | 25 min | `trackr.db` has 5 rows with waypoints |
| 4 | Auth service + controller | 25 min | `dotnet build` green |
| 5 | Program.cs + middleware | 20 min | `dotnet run` starts at `http://localhost:5001` |
| 6 | Verify + commit | 10 min | 200 from Swagger + green GitHub push |

---

## Phase 1B — Angular Auth

**Session:** 2 · Duration: ~2 hours · Context: frontend only
**Goal:** Angular app that calls the real Phase 1A API, logs in, and guards routes.
**Deliverable:** Login page (matching dark mock) authenticates against the live API. Unauth visits redirect to `/login`.

### Frontend Scaffold

- [ ] `ng new client --standalone --routing --style=scss --skip-git --no-ssr`
- [ ] Add packages: `leaflet`, `@types/leaflet`, `@microsoft/signalr`, `@angular/material`
- [ ] Populate `src/environments/environment.ts` immediately — never leave it as the empty scaffold (gap #3):
  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'https://localhost:5001',
    hubUrl: 'https://localhost:5001/hubs/location'
  };
  ```
- [ ] Add matching `environment.production.ts` with Azure URLs as placeholders
- [ ] Add `tsconfig.json` config required for Leaflet — set `"skipLibCheck": true` and add `"types": ["leaflet"]` under `compilerOptions` (gap #8)

### Core Layer

- [ ] Create `core/models/` — `delivery.model.ts`, `location.model.ts`, `user.model.ts`
  (match the DTOs from Phase 1A exactly)
- [ ] Create `core/services/auth.service.ts`
  - `login(email, password)` — calls `POST /api/auth/login`, stores JWT in `localStorage`
  - `logout()` — clears `localStorage`, navigates to `/login`
  - `currentUser` — Angular signal, derived from decoded JWT payload
  - `isAuthenticated()` — checks token exists and is not expired
- [ ] Create `core/guards/auth.guard.ts` — redirects to `/login` if `!isAuthenticated()`
- [ ] Create `core/interceptors/jwt.interceptor.ts` — attaches `Authorization: Bearer <token>` to every outgoing HTTP request

### Login Feature

- [ ] Create `features/auth/login/login.component.ts` — standalone component
- [ ] `login.component.html` — dark theme form matching the mock:
  - TRACKR logo + "DISPATCH SYSTEM v2.1" header
  - "Dispatcher Login" title
  - Email field (pre-filled: `dispatcher@trackr.io`)
  - Password field
  - "SIGN IN" button with arrow icon
  - "SECURED WITH JWT · SESSION EXPIRES IN 8H" footer
- [ ] `login.component.scss` — dark theme, green accent button, monospaced labels
- [ ] On submit: calls `AuthService.login()`, shows spinner, navigates to `/dashboard` on success, shows error on failure

### Routing & Dashboard Placeholder

- [ ] Create placeholder `features/dashboard/dashboard.component.ts` — minimal shell, "Phase 2 coming" message
- [ ] Wire `app.routes.ts`:
  - `/login` → `LoginComponent`
  - `/dashboard` → `DashboardComponent` with `authGuard`
  - `''` redirects to `/dashboard`
- [ ] Apply base dark theme variables in `styles.scss`

### Phase 1B Done When
- `ng serve` starts on `http://localhost:4200`
- Visiting `http://localhost:4200` redirects to `/login`
- Login with `dispatcher@trackr.io` / `trackr123` → JWT stored in `localStorage` → redirected to `/dashboard`
- Visiting `/dashboard` without a token redirects back to `/login`
- Wrong credentials show an inline error message

### End-of-Session Commit
```bash
git add .
git commit -m "feat(frontend): Angular 19 scaffold, JWT auth service, login page, route guard"
git push
```

---

## Phase 2 — Real-Time Core

**Session:** 3–4 · Duration: ~4 hours (split across two sessions if needed) · Context: backend SignalR first, then frontend map
**Goal:** The headline feature — live moving markers on a map driven by SignalR.
**Deliverable:** Open the dashboard, watch 12 delivery markers move on a Leaflet map in real time.

### End-of-Phase Commit
```bash
git commit -m "feat: SignalR hub, location simulator, live Leaflet map on dashboard"
git push
```

### Backend

- [ ] Create `Controllers/DeliveryController.cs`
  - `GET /api/deliveries` — returns all with current status
  - `GET /api/deliveries/{id}` — returns single with last known location
  - `PUT /api/deliveries/{id}/status` — updates `DeliveryStatus` (gap #5): needed for the detail page "Mark as Delivered" flow and status filter to reflect real changes
- [ ] Create `Controllers/LocationController.cs`
  - `GET /api/locations/{deliveryId}` — returns full location history from SQLite
- [ ] Create `Services/DeliveryService.cs` + `IDeliveryService.cs`
- [ ] Configure `JwtBearer` to also read token from SignalR query string (gap #2):
  ```csharp
  options.Events = new JwtBearerEvents {
      OnMessageReceived = ctx => {
          var token = ctx.Request.Query["access_token"];
          if (!string.IsNullOrEmpty(token) &&
              ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
              ctx.Token = token;
          return Task.CompletedTask;
      }
  };
  ```
- [ ] Create `Hubs/LocationHub.cs`
  - `[Authorize]` attribute
  - Dashboard clients join a `"all-deliveries"` broadcast group — **not** per-delivery groups (gap #6): the simulator broadcasts to `"all-deliveries"` so every connected dispatcher sees all markers move without needing to call `JoinGroup` per delivery
  - `OnConnectedAsync` → `AddToGroupAsync(Context.ConnectionId, "all-deliveries")`
  - `OnDisconnectedAsync` → `RemoveFromGroupAsync`
- [ ] Create `Services/LocationSimulatorService.cs` — `BackgroundService` that every 3 seconds:
  1. Loads only `InTransit` / `Nearby` deliveries from DB
  2. Increments each delivery's lat/lon along a pre-defined Bellevue WA route
  3. Saves a new `Location` row to SQLite (so history endpoint has real data)
  4. Broadcasts via `IHubContext<LocationHub>` to the delivery's SignalR group
- [ ] Register `LocationSimulatorService` as `AddHostedService` in `Program.cs`
- [ ] Map SignalR hub route: `app.MapHub<LocationHub>("/hubs/location")`

### Frontend

- [ ] Create `core/services/delivery.service.ts` — `getDeliveries()`, `getDelivery(id)` via HTTP
- [ ] Create `core/services/signalr.service.ts`
  - Reads hub URL from `environment.hubUrl` — never hardcoded (gap #3)
  - Appends JWT to query string: `?access_token=<token>` (gap #2)
  - `.withAutomaticReconnect()` enabled
  - Exposes `locationUpdates$` as RxJS `Subject<LocationDto>`
  - On connect: calls `hub.invoke("JoinGroup", "all-deliveries")` — **explicitly required**, Angular does not auto-join (gap #7)
  - Starts on login, stops on logout
- [ ] Build `shared/components/map/map.component.ts`
  - Leaflet wrapper, dark tile layer (`CartoDB.DarkMatter`)
  - Accepts `[deliveries]` input, renders one marker per delivery
  - Emits `(deliverySelected)` on marker click
  - Updates marker position when `locationUpdates$` fires
- [ ] Build dashboard layout
  - Top stat bar: Active / Nearby / Delivered / Delayed counts
  - Left sidebar: scrollable delivery list (placeholder cards for now)
  - Right panel: `MapComponent`
  - Subscribes to `SignalRService.locationUpdates$` → updates markers in real time

### Phase 2 Done When
- Dashboard loads 12 deliveries from the real API
- All 12 markers appear on the Leaflet map
- Markers visibly move every 3 seconds without any page refresh
- SignalR reconnects automatically if the backend restarts

---

## Phase 3 — Polish & Detail View

**Session:** 5–6 · Duration: ~4 hours · Context: frontend only
**Goal:** Match the UI mocks pixel-close and build the delivery detail page.
**Deliverable:** Full app navigable across all three screens, data-driven, dark theme applied.

### End-of-Phase Commit
```bash
git commit -m "feat(frontend): delivery detail page, shared components, full dark theme"
git push
```

### Shared Components

- [ ] `shared/components/status-badge/status-badge.component.ts`
  - Color-coded by `DeliveryStatus`: green (Nearby), blue (InTransit), orange (Pickup), grey (Delivered), red (Delayed)
- [ ] `shared/components/delivery-card/delivery-card.component.ts`
  - Address, driver ID, ETA, distance, status badge
  - Highlighted border when selected
- [ ] `shared/components/spinner/spinner.component.ts` — full-screen loading overlay
- [ ] `shared/pipes/eta.pipe.ts` — formats minutes: `4 min`, `1h 12 min`
- [ ] Wire `SpinnerComponent` to actual loading states (gap #9) — spinner must show during:
  - Initial `getDeliveries()` HTTP call on dashboard load
  - `getDelivery(id)` call on detail page load
  - Login form submission
  Use a `loading` signal in each component, set `true` before the call and `false` in `finalize()` operator

### Dashboard Completion

- [ ] Replace placeholder cards with `DeliveryCardComponent`
- [ ] Add filter tabs: All / Transit / Nearby / Delayed — filters sidebar list
- [ ] Click delivery card → map centers on marker + info popup appears
- [ ] Click map marker → sidebar highlights matching card + popup shown
- [ ] "LIVE" indicator in top bar pulses green when SignalR is connected

### Delivery Detail Page

- [ ] Route: `/deliveries/:id`
- [ ] Breadcrumb: Dashboard → Deliveries → #DLV-XXXX
- [ ] Three stat cards: ETA (with arrival time), Distance Remaining, Route Progress (% bar)
- [ ] Event timeline — reads `Location` history from `GET /api/locations/{id}`:
  - Order Dispatched
  - Package Picked Up
  - En Route
  - Checkpoint Passed
  - Approaching Destination ← current step (amber)
  - Delivered (pending)
- [ ] Mini Leaflet map showing route line + current position
- [ ] Delivery Info panel: From, To, Recipient, Package weight, Priority
- [ ] Driver Info panel: Name, Driver ID, Vehicle

### Theme

- [ ] Full dark theme in `styles.scss` matching all three mocks:
  ```scss
  :root {
    --bg-primary:    #0d1117;
    --bg-surface:    #161b22;
    --bg-elevated:   #1c2128;
    --accent-green:  #00ff88;
    --accent-orange: #ff8c00;
    --accent-amber:  #f0b429;
    --accent-blue:   #58a6ff;
    --text-primary:  #e6edf3;
    --text-muted:    #8b949e;
    --border:        #30363d;
  }
  ```
- [ ] Monospaced font (`JetBrains Mono` or `Fira Code`) for delivery IDs and coordinates
- [ ] Auth guard covers `/dashboard` and `/deliveries/:id`
- [ ] 401 response from API redirects to `/login` and clears localStorage

### Phase 3 Done When
- All three screens (Login, Dashboard, Delivery Detail) look like the provided mocks
- Clicking any delivery navigates to its detail page with live timeline data
- Filter tabs work on the sidebar
- No hardcoded strings — everything comes from the API or `DeliveryStatus` enum

---

## Phase 4 — Ship It

**Session:** 7 · Duration: ~2 hours · Context: devops / repo hygiene
**Goal:** Tests, Docker, CI/CD pipeline, and a public GitHub repo with a green CI badge.
**Deliverable:** `git push` triggers a passing GitHub Actions workflow. Repo looks professional.

### Tests

- [ ] `dotnet new xunit -n DeliveryTracker.Tests -o server/DeliveryTracker.Tests`
- [ ] Add project reference to `DeliveryTracker.API`
- [ ] `AuthControllerTests.cs` — valid credentials return 200 + non-empty token
- [ ] `DeliveryControllerTests.cs` — GET returns seeded list with correct count (12)
- [ ] Run `dotnet test` locally — must be green before proceeding

### Docker

- [ ] `server/DeliveryTracker.API/Dockerfile` — multi-stage .NET 8 build
- [ ] `client/Dockerfile` — `ng build` stage + nginx serve stage
- [ ] `docker-compose.yml` at repo root:
  - `api` service — .NET API on port 5001
  - `client` service — nginx on port 80
  - Named volume `sqlite-data` mounted at `/app/data` — SQLite connection string in `appsettings.json` must use this path: `Data Source=/app/data/trackr.db` (gap #4). Mismatched path = DB recreated on every restart
  - Shared `trackr-network`

### GitHub Actions

- [ ] `.github/workflows/ci.yml`
  ```yaml
  on: [push, pull_request]
  jobs:
    build-api:
      - dotnet restore
      - dotnet build --no-restore
      - dotnet test --no-build
    build-client:
      - npm ci
      - ng build --configuration=production
  ```
- [ ] Placeholder `deploy-api` and `deploy-client` jobs (commented out, activated when Azure secrets added)

### README Completion

- [ ] CI badge at top: `![CI](https://github.com/swatimittal/LiveDeliveryTracker/actions/workflows/ci.yml/badge.svg)`
- [ ] Screenshot GIF placeholder (add after recording a demo)
- [ ] Tech stack badges (Angular, .NET, SignalR, Leaflet, SQLite, GitHub Actions)
- [ ] Architecture diagram (mermaid)
- [ ] Local run section:
  ```bash
  # Option A: Docker
  docker-compose up

  # Option B: Two terminals
  cd server/DeliveryTracker.API && dotnet run
  cd client && ng serve
  ```
- [ ] Key Design Decisions section including localStorage tradeoff note
- [ ] "What I'd add next" section (shows product thinking to interviewers)

### Final Push

- [ ] `git add .`
- [ ] `git commit -m "feat: initial scaffold — Angular 19 + .NET 8 + SignalR + Leaflet"`
- [ ] `git push -u origin main`
- [ ] Verify GitHub Actions workflow runs and passes

### Phase 4 Done When
- Public GitHub repo at `github.com/[username]/LiveDeliveryTracker`
- CI badge shows green on the README
- `docker-compose up` starts the full app with no extra steps
- README looks like a real open-source project

---

## All Gap Fixes Incorporated

| # | Gap | Severity | Phase | Fix |
|---|---|---|---|---|
| 1 | `AllowCredentials()` missing from CORS | Critical | 1A | `WithOrigins` + `.AllowCredentials()` in `Program.cs` |
| 2 | JWT query-string handler missing for SignalR | Critical | 2 | `OnMessageReceived` reads `access_token` from query string |
| 3 | Angular `environment.ts` never populated | Critical | 1B | Populated immediately with `apiUrl` + `hubUrl` |
| 4 | SQLite path wrong in Docker volume | Critical | 4 | `Data Source=/app/data/trackr.db` matches volume mount |
| 5 | No PUT status update endpoint | Missing | 2 | `PUT /api/deliveries/{id}/status` added to DeliveryController |
| 6 | SignalR group strategy wrong for dashboard | Missing | 2 | Single `"all-deliveries"` group, not per-delivery groups |
| 7 | Angular never calls `JoinGroup` on hub | Missing | 2 | `hub.invoke("JoinGroup", "all-deliveries")` after connect |
| 8 | Leaflet TypeScript config missing | Missing | 1B | `"skipLibCheck": true` + `"types": ["leaflet"]` in `tsconfig.json` |
| 9 | Spinner never wired to loading states | Missing | 3 | `loading` signal + `finalize()` in all async component calls |
| 10 | Seed data has no route waypoints | Missing | 1A | `RouteWaypoints` JSON array on every seeded delivery |
| 11 | No `.cursorrules` file | Cursor | 1A | `.cursorrules` at repo root with stack + conventions |
| — | JWT secret committed to repo | High | 1A | `appsettings.Development.json` gitignored |
| — | Location history never persisted | High | 2 | Simulator writes `Location` row to SQLite on every tick |
| — | No `DeliveryStatus` enum | Medium | 1A | `Models/Enums/DeliveryStatus.cs` created first |
| — | CI runs `dotnet test` with no test project | Medium | 4 | `DeliveryTracker.Tests` xUnit project with 2 smoke tests |

**JWT in `localStorage`** — kept intentionally, documented in README as a portfolio tradeoff.
**No CalPortland references** — all branding uses Trackr (`dispatcher@trackr.io`, "Trackr Warehouse").

---

## Resume Bullet (ready to copy once shipped)

> **Live Delivery Tracker** — Full-stack real-time web app built with Angular 19, .NET Core 8, and SignalR WebSockets. Features a live dispatcher dashboard with Leaflet map, JWT auth, background GPS simulation, and EF Core + SQLite persistence. Deployed via GitHub Actions CI/CD.
