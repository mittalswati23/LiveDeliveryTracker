# Live Delivery Tracker — Phase-Wise Build Plan

**Project:** Trackr Dispatch System v2.1
**Stack:** Angular 21 · .NET Core 8 · SignalR · Leaflet · SQLite · GitHub Actions
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

> Phase 1B is divided into 6 steps. Complete each step and hit its checkpoint before opening the next one in Cursor. Keep Phase 1A's backend running (`dotnet run` in a separate terminal) for end-to-end testing in Step 6.

---

### Step 1 — Angular Scaffold (~20 min)

- [ ] `ng new client --standalone --routing --style=scss --skip-git --no-ssr`
- [ ] Add npm packages:
  - `npm install @angular/material leaflet @microsoft/signalr`
  - `npm install --save-dev @types/leaflet`
- [ ] `src/environments/environment.ts` — use `http://` not `https://` (dev cert not trusted by default):
  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:5001',
    hubUrl: 'http://localhost:5001/hubs/location'
  };
  ```
- [ ] `src/environments/environment.production.ts`:
  ```typescript
  export const environment = {
    production: true,
    apiUrl: 'https://trackr-api.azurewebsites.net',
    hubUrl: 'https://trackr-api.azurewebsites.net/hubs/location'
  };
  ```
- [ ] `tsconfig.json` — add only `"skipLibCheck": true` under `compilerOptions`. Do **NOT** add a `"types"` array — it breaks Angular's own types.
- [ ] `angular.json` — add Leaflet CSS to the `styles` array:
  ```json
  "styles": ["src/styles.scss", "node_modules/leaflet/dist/leaflet.css"]
  ```

**Step 1 checkpoint:** `ng serve` compiles and the default Angular welcome page loads at `http://localhost:4200`. No errors in the terminal.

---

### Step 2 — Core Models (~10 min)

- [ ] `core/models/user.model.ts`:
  ```typescript
  export interface UserModel {
    email: string;
    role: string;
    displayName: string;
    exp: number;
  }
  export interface LoginResponse {
    token: string;
    email: string;
    displayName: string;
    role: string;
    expiresAt: string;
  }
  ```
- [ ] `core/models/delivery.model.ts` — matches `DeliveryDto` exactly:
  ```typescript
  export interface DeliveryModel {
    id: number;
    deliveryNumber: string;
    destinationAddress: string;
    recipientName: string;
    packageWeight: number;
    priority: string;
    status: string;
    driverId: string;
    driverName: string;
    estimatedMinutes: number;
    totalRouteDistanceMiles: number;
    currentLatitude: number;
    currentLongitude: number;
    currentWaypointIndex: number;
    totalWaypoints: number;
    dispatchedAt: string;
  }
  ```
- [ ] `core/models/location.model.ts` — matches `LocationDto` exactly:
  ```typescript
  export interface LocationModel {
    deliveryId: number;
    deliveryNumber: string;
    status: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    waypointIndex: number;
  }
  ```

**Step 2 checkpoint:** `ng build` passes with 0 errors. Types only — no services yet.

---

### Step 3 — Auth Service, Interceptor & Guard (~25 min)

- [ ] `core/services/auth.service.ts`:
  - `login(email, password)` — `POST /api/auth/login`, stores JWT in `localStorage['trackr_token']`
  - `logout()` — clears storage, navigates to `/login`
  - `getToken()` — returns raw token string or null
  - `currentUser` — Angular signal initialized from decoded token on page load
  - `isAuthenticated()` — checks token exists and `exp * 1000 > Date.now()`, wrapped in try/catch (malformed token returns false and clears storage)
- [ ] `core/interceptors/jwt.interceptor.ts` — functional `HttpInterceptorFn`:
  - Reads token via `AuthService.getToken()`
  - Clones request with `Authorization: Bearer <token>` header
  - On 401 response: calls `auth.logout()` (auto-logout on expiry)
- [ ] `core/guards/auth.guard.ts` — functional `CanActivateFn`:
  - Returns `true` if `isAuthenticated()`
  - Returns `router.createUrlTree(['/login'])` otherwise
- [ ] `app.config.ts` — register `HttpClient` with `jwtInterceptor`:
  ```typescript
  provideHttpClient(withInterceptors([jwtInterceptor]))
  ```

**Step 3 checkpoint:** `ng build` passes with 0 errors.

---

### Step 4 — Login Component (~25 min)

- [ ] `features/auth/login/login.component.ts` — standalone component:
  - Reactive form: `email` (pre-filled `dispatcher@trackr.io`) + `password`
  - `loading` signal — disables button and shows spinner during API call
  - `errorMessage` signal — shows inline error on 401
  - On success: navigate to `/dashboard`
  - On error: set `errorMessage` to `"Invalid email or password"`
- [ ] `login.component.html` — dark theme layout matching the mock:
  ```
  ┌─────────────────────────────────────┐
  │  [📦] TRACKR  DISPATCH SYSTEM v2.1 │
  │                                     │
  │  Dispatcher Login                   │
  │  Sign in to access the live         │
  │  tracking dashboard                 │
  │                                     │
  │  EMAIL ADDRESS                      │
  │  [dispatcher@trackr.io           ]  │
  │                                     │
  │  PASSWORD                           │
  │  [••••••••••                     ]  │
  │                                     │
  │  [→  SIGN IN                     ]  │
  │                                     │
  │  ● SECURED WITH JWT · EXPIRES 8H   │
  └─────────────────────────────────────┘
  ```
- [ ] `login.component.scss` — dark background (`#0f1117`), green accent (`#00ff88`), monospaced uppercase labels

**Step 4 checkpoint:** `ng build` passes. Login page renders at `/login` with correct styling.

---

### Step 5 — Routing, Dashboard Placeholder & Dark Theme (~15 min)

- [ ] `features/dashboard/dashboard.component.ts` — standalone, minimal placeholder:
  - Shows dispatcher's `displayName` from `authService.currentUser()` signal
  - "Phase 2 — Live Map Coming Soon" message
  - Logout button wired to `authService.logout()`
- [ ] `app.routes.ts`:
  ```typescript
  { path: '',          redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login',     loadComponent: () => import(...LoginComponent) },
  { path: 'dashboard', loadComponent: () => import(...DashboardComponent), canActivate: [authGuard] },
  { path: '**',        redirectTo: '/dashboard' }
  ```
- [ ] `styles.scss` — global dark theme CSS variables:
  ```scss
  :root {
    --bg-primary:   #0f1117;
    --bg-secondary: #1a1d27;
    --accent:       #00ff88;
    --text-primary: #e2e8f0;
    --text-muted:   #64748b;
  }
  body { background: var(--bg-primary); color: var(--text-primary); margin: 0; }
  ```

**Step 5 checkpoint:** `ng build` passes. All routes compile. `ng serve` → visiting `/` redirects to `/dashboard` → guard redirects to `/login` (no token yet).

---

### Step 6 — Verify & Commit (~10 min)

- [ ] Start backend: `dotnet run` in `server/DeliveryTracker.API`
- [ ] Start frontend: `ng serve` in `client`
- [ ] Open `http://localhost:4200` → redirects to `/login` ✓
- [ ] Open `http://localhost:4200/dashboard` directly → redirects to `/login` ✓
- [ ] Login with `dispatcher@trackr.io` / `Trackr2025!` → redirected to `/dashboard` ✓
- [ ] Open DevTools → Application → Local Storage → confirm `trackr_token` key exists ✓
- [ ] Wrong password → inline error message (no page crash) ✓
- [ ] Click Logout → back to `/login`, token cleared from localStorage ✓
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "feat(frontend): Angular 21 scaffold, JWT auth service, login page, route guard"
  git push
  ```

**Step 6 checkpoint:** Green push on GitHub. Phase 1B complete.

---

### Phase 1B Step Summary

| Step | Job | Time | Checkpoint |
|---|---|---|---|
| 1 | Angular scaffold + packages + env + tsconfig | 20 min | `ng serve` shows default page |
| 2 | Core models | 10 min | `ng build` green, types only |
| 3 | AuthService + interceptor + guard + app.config | 25 min | `ng build` green |
| 4 | Login component (HTML + SCSS + logic) | 25 min | Login page renders at `/login` |
| 5 | Routing + dashboard placeholder + dark theme | 15 min | All routes wired, `ng build` green |
| 6 | Verify + commit | 10 min | End-to-end login works + green push |

### Phase 1B Done When
- `ng serve` starts on `http://localhost:4200` with no errors
- Visiting `http://localhost:4200` redirects to `/login`
- Visiting `/dashboard` without a token redirects to `/login`
- Login with `dispatcher@trackr.io` / `Trackr2025!` → JWT in `localStorage` → redirected to `/dashboard`
- Wrong credentials show inline error message (no page crash)
- Malformed / expired token in `localStorage` → redirect to `/login` without crash
- `localStorage['trackr_token']` contains a valid JWT after login
- Dashboard shows placeholder with dispatcher name + logout button

### End-of-Session Commit
```bash
git add .
git commit -m "feat(frontend): Angular 21 scaffold, JWT auth service, login page, route guard"
git push
```

---

## Phase 2 — Real-Time Core

**Session:** 3–4 · Duration: ~4 hours (split across two sessions if needed) · Context: backend SignalR first, then frontend map
**Goal:** The headline feature — live moving markers on a map driven by SignalR.
**Deliverable:** Open the dashboard, watch 5 delivery markers move on a Leaflet map in real time.

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
- [x] SignalR JWT query-string handler (`OnMessageReceived`) already wired in Phase 1A `Program.cs` — verify it works with the hub during Step 6 testing
- [ ] Create `Hubs/LocationHub.cs`
  - `[Authorize]` attribute
  - Dashboard clients join a `"all-deliveries"` broadcast group — **not** per-delivery groups (gap #6): the simulator broadcasts to `"all-deliveries"` so every connected dispatcher sees all markers move without needing to call `JoinGroup` per delivery
  - `OnConnectedAsync` → `AddToGroupAsync(Context.ConnectionId, "all-deliveries")`
  - `OnDisconnectedAsync` → `RemoveFromGroupAsync`
- [ ] Create `Services/LocationSimulatorService.cs` — `BackgroundService` that every 3 seconds:
  1. Creates a fresh DI scope via `IServiceScopeFactory` — **required** because `DbContext` is scoped and `BackgroundService` is singleton; direct injection throws on startup
  2. Loads only `InTransit` / `Nearby` deliveries from DB
  3. Increments each delivery's lat/lon along its `RouteWaypoints` array
  4. Saves a new `Location` row to SQLite (so history endpoint has real data)
  5. Broadcasts via `IHubContext<LocationHub>` to the `"all-deliveries"` SignalR group
  6. When `CurrentWaypointIndex` reaches the last waypoint, resets to 0 and sets `Status` back to `InTransit` — keeps all markers moving indefinitely during the demo
- [ ] Register `LocationSimulatorService` as `AddHostedService` in `Program.cs`
- [ ] Map SignalR hub route: `app.MapHub<LocationHub>("/hubs/location")`

### Frontend

- [ ] Create `core/services/delivery.service.ts` — `getDeliveries()`, `getDelivery(id)` via HTTP
- [ ] Create `core/services/signalr.service.ts`
  - Reads hub URL from `environment.hubUrl` — never hardcoded (gap #3)
  - Appends JWT to query string: `?access_token=<token>` (gap #2)
  - `.withAutomaticReconnect()` enabled
  - Exposes `locationUpdates$` as RxJS `Subject<LocationDto>`
  - No client `JoinGroup` call needed — server auto-adds every connection to `"all-deliveries"` in `OnConnectedAsync` (gap #7)
  - Starts on login, stops on logout
- [ ] Build `shared/components/map/map.component.ts`
  - Leaflet wrapper, dark tile layer (`CartoDB.DarkMatter`)
  - Include required tile attribution: `© OpenStreetMap contributors © CARTO` (CartoDB terms of service)
  - Accepts `[deliveries]` input, renders one marker per delivery
  - Emits `(deliverySelected)` on marker click
  - Updates marker position when `locationUpdates$` fires — wrap Angular state changes in `NgZone.run(() => {...})` since Leaflet operates outside Angular's zone and won't trigger change detection on its own
- [ ] Build dashboard layout
  - Top stat bar: Active / Nearby / Delivered / Delayed counts
  - Left sidebar: scrollable delivery list (placeholder cards for now)
  - Right panel: `MapComponent`
  - Subscribes to `SignalRService.locationUpdates$` → updates markers in real time

### Phase 2 Done When
- Dashboard loads 5 deliveries from the real API
- All 5 markers appear on the Leaflet map
- Markers visibly move every 3 seconds without any page refresh
- SignalR reconnects automatically if the backend restarts

---

## Phase 3 — Polish & Detail View

**Session:** 5–6 · Duration: ~4 hours · Context: frontend only
**Goal:** Match the UI mocks pixel-close and build the delivery detail page.
**Deliverable:** Full app navigable across all three screens, data-driven, dark theme applied.

> Phase 3 is divided into 6 steps. Complete each step and hit its checkpoint before opening the next one in Cursor.

### End-of-Phase Commit
```bash
git commit -m "feat(frontend): delivery detail page, shared components, full dark theme"
git push
```

---

### Step 1 — Theme Foundation: CSS Variables + Font (~15 min)

- [ ] Expand `styles.scss` `:root` with the full token set:
  ```scss
  :root {
    --bg-primary:    #0d1117;
    --bg-surface:    #161b22;
    --bg-elevated:   #1c2128;
    --accent-green:  #00ff88;
    --accent-orange: #ff8c00;
    --accent-amber:  #f0b429;
    --accent-blue:   #58a6ff;
    --accent-red:    #f87171;
    --text-primary:  #e6edf3;
    --text-muted:    #8b949e;
    --border:        #30363d;
  }
  ```
- [ ] Add JetBrains Mono via Google Fonts in `index.html` `<head>`:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  ```
- [ ] Apply `font-family: 'JetBrains Mono', monospace` to delivery IDs (`DLV-XXXX`), coordinate values, and the top brand name across `dashboard.component.scss` and `login.component.scss`
- [ ] Replace all hardcoded hex values in existing SCSS files with the matching CSS variable — e.g. `#0d1117` → `var(--bg-primary)`, `#30363d` → `var(--border)`

**Step 1 checkpoint:** `ng serve` builds with no errors. The login and dashboard pages look identical to before but now use CSS variables. JetBrains Mono renders on delivery IDs.

---

### Step 2 — StatusBadge Component + EtaPipe (~20 min)

- [ ] Create `shared/components/status-badge/status-badge.component.ts`
  - Standalone, `ChangeDetectionStrategy.OnPush`
  - `@Input() status: string`
  - Derives color from the shared `STATUS_COLORS` record (move constant out of `dashboard.component.ts` into `shared/constants/status-colors.ts`)
  - Template: `<span class="badge" [style.color]="color" [style.border-color]="color">{{ label }}</span>`
  - Label mapping: `InTransit` → `IN TRANSIT`, `Nearby` → `NEARBY`, etc.
- [ ] Create `shared/pipes/eta.pipe.ts`
  - Input: `estimatedMinutes: number`
  - Output: `"4 min"` if < 60, `"1h 12 min"` if ≥ 60
- [ ] Replace the inline `<span class="status-badge">` in `dashboard.component.html` with `<app-status-badge [status]="d.status" />`
- [ ] Replace raw `{{ d.estimatedMinutes }} min` in the delivery card with `{{ d.estimatedMinutes | eta }}`
- [ ] Import `StatusBadgeComponent` and `EtaPipe` in `DashboardComponent` imports array

**Step 2 checkpoint:** Dashboard sidebar cards show `<app-status-badge>` instead of inline spans. ETA reads "4 min" or "1h 5 min". `ng build` is clean.

---

### Step 3 — DeliveryCard + Spinner + Filter Tabs (~30 min)

- [ ] Create `shared/components/delivery-card/delivery-card.component.ts`
  - Standalone, `ChangeDetectionStrategy.OnPush`
  - `@Input() delivery: DeliveryModel`
  - `@Input() selected = false`
  - `@Output() cardClicked = new EventEmitter<DeliveryModel>()`
  - Extracts the current card HTML from `dashboard.component.html` into its own template
  - `[class.selected]="selected"` on root element for highlighted border
- [ ] Create `shared/components/spinner/spinner.component.ts`
  - Full-screen dark overlay with a pulsing ring animation
  - `@Input() visible = false` — `@if (visible)` wraps the overlay
- [ ] Wire `SpinnerComponent` to loading states (gap #9):
  - Dashboard: `<app-spinner [visible]="loading()" />` — replaces inline `.sidebar-loading` div
  - Login: wrap submit button area with spinner while `loading()` is true
- [ ] Replace inline delivery card HTML in `dashboard.component.html` with `<app-delivery-card>`
- [ ] Add filter tabs to sidebar:
  - Tabs: **All** / **Transit** / **Nearby** / **Delayed**
  - `activeFilter = signal<string>('All')` in `DashboardComponent`
  - `filteredDeliveries = computed(() => ...)` — returns full list for All, or filters by status
  - Use `filteredDeliveries()` in `@for` loop instead of `deliveries()`
  - Stat bar counts continue using the full `deliveries()` signal (unfiltered)
- [ ] **Two distinct interaction handlers in `DashboardComponent` — do NOT merge them:**
  - **Card click** → `onCardClicked(d: DeliveryModel)` — calls `router.navigate(['/deliveries', d.id])` only. Does NOT call `focusDelivery`. Does NOT set `selected`.
  - **Marker click** → `onDeliverySelected(d: DeliveryModel)` — sets `selected.set(d)` and calls `mapComponent?.focusDelivery(d.id)`. Does NOT navigate.
  - `selected` signal (sidebar card highlight) is only driven by marker clicks, not card clicks
  - Wire `(cardClicked)="onCardClicked($event)"` on `<app-delivery-card>` and keep `(deliverySelected)="onDeliverySelected($event)"` on `<app-map>`

**Step 3 checkpoint:** Filter tabs switch the sidebar list. Spinner overlay appears while deliveries load. Delivery cards are rendered by `DeliveryCardComponent`. `ng build` clean.

---

### Step 4 — Delivery Detail Page: Layout + Info Panels (~30 min)

> **Pattern decision:** Uses `httpResource` (Angular 19+) instead of `forkJoin`. Signal-native, zero manual loading/error signals, interceptors (JWT) apply automatically since `httpResource` uses `HttpClient` internally.

- [ ] Add route to `app.routes.ts`:
  ```ts
  {
    path: 'deliveries/:id',
    loadComponent: () => import('./features/delivery-detail/delivery-detail.component').then(m => m.DeliveryDetailComponent),
    canActivate: [authGuard]
  }
  ```
- [ ] Create `features/delivery-detail/delivery-detail.component.ts`
  - Read `:id` from `ActivatedRoute` as a signal: `id = toSignal(inject(ActivatedRoute).params.pipe(map(p => p['id'])))`
  - Declare two `httpResource` instances (both fire in parallel automatically):
    ```ts
    import { httpResource } from '@angular/core/http';

    deliveryResource  = httpResource<DeliveryModel>(
      () => `${environment.apiUrl}/deliveries/${this.id()}`
    );
    locationsResource = httpResource<LocationModel[]>(
      () => `${environment.apiUrl}/locations/${this.id()}`
    );
    ```
  - Loading state: `isLoading = computed(() => this.deliveryResource.isLoading() || this.locationsResource.isLoading())`
  - Error state: `hasError = computed(() => !!this.deliveryResource.error())`
  - `<app-spinner [visible]="isLoading()" />`
  - No `ngOnInit`, no `subscribe()`, no manual `loading` signal — `httpResource` handles it all
- [ ] Template layout:
  - **Breadcrumb bar**: `← Dashboard  /  Deliveries  /  #DLV-XXXX` — clicking "Dashboard" navigates back via `routerLink="/dashboard"`
  - **Three stat cards** (top row): ETA (`estimatedMinutes | eta`), Distance Remaining (`totalRouteDistanceMiles | number:'1.1-1' mi`), Route Progress (`currentWaypointIndex / totalWaypoints * 100` % with a styled `<div class="progress-bar">`)
  - **Delivery Info panel** (left column): From (`originAddress`), To (`destinationAddress`), Recipient, Package weight, Priority, `<app-status-badge>`
  - **Driver Info panel** (right column): Driver Name, Driver ID (`driverId`)
- [ ] Style using CSS variables — dark card panels matching `--bg-surface` / `--bg-elevated`
- [ ] The `onCardClicked` handler (added in Step 3) already handles navigation — no extra wiring needed here

**Step 4 checkpoint:** Clicking a sidebar card navigates to `/deliveries/1`. Page loads delivery data via `httpResource`, shows breadcrumb, stat cards, Delivery Info, and Driver Info panels. Back link returns to dashboard. No `subscribe()` in the component.

---

### Step 5 — Detail Page: Timeline + Mini Map (~30 min)

- [ ] `locationsResource` declared in Step 4 already fires the location history call in parallel — no additional wiring needed
- [ ] Event timeline (left side of detail page):
  - Maps location history to ordered steps. Use the following label logic:
    - **If `status === 'Delayed'`** — override all waypoint math; show "Order Dispatched" + "Delayed" step highlighted in red, all subsequent steps greyed out. Do NOT use waypoint fraction for Delayed deliveries.
    - **If `status === 'Delivered'`** — all steps green, "Delivered" step complete.
    - **Otherwise** — derive from `currentWaypointIndex / totalWaypoints` fraction:
      - 0% → current step: "Order Dispatched"
      - > 0% → current step: "Package Picked Up"
      - > 25% → current step: "En Route"
      - > 50% → current step: "Checkpoint Passed"
      - > 75% → current step: "Approaching Destination" (amber)
  - Each step has a dot indicator: green = complete, amber = current, red = delayed, grey = pending
- [ ] Mini Leaflet map (right side, ~300px tall):
  - Separate `MiniMapComponent` in `shared/components/mini-map/` — keeps `DeliveryDetailComponent` clean
  - `@Input() delivery: DeliveryModel`
  - `@Input() locations: LocationModel[]`
  - Pass values from resources: `[delivery]="deliveryResource.value()" [locations]="locationsResource.value() ?? []"`
  - Draws a `L.polyline` through all `locations` in order (route trace)
  - Places a glowing dot marker (same style as dashboard) at the current lat/lon
  - Uses same CartoDB Positron tile layer as the main map
  - **Must use `NgZone.runOutsideAngular` for all Leaflet init and update calls** — same pattern as `MapComponent`; Leaflet operates outside Angular's zone and won't trigger `OnPush` change detection without it
- [ ] "Mark as Delivered" button — visible only when `status !== 'Delivered'`:
  - Calls `deliveryService.updateStatus(id, 'Delivered')` via `subscribe()`
  - On success: call `deliveryResource.reload()` — `httpResource` refetches automatically, no manual signal update needed

**Step 5 checkpoint:** Detail page shows timeline with correct step highlighted. Mini map renders the polyline route and current dot. "Mark as Delivered" button calls the API and updates status.

---

### Step 6 — Final Wiring + Integration Test + Commit (~20 min)

- [ ] Verify all navigation flows:
  - Login → Dashboard (sidebar + map load) → click card → Detail page → back to Dashboard
  - Unauthenticated `/deliveries/1` → redirects to `/login`
  - Dashboard filter tabs cycle through All / Transit / Nearby / Delayed
- [ ] Verify LIVE badge pulses correctly (green dot animation when `hubConnected()` is true)
- [ ] Verify map markers update in real time on the dashboard (no page refresh needed)
- [ ] Verify `<app-spinner>` shows briefly on both dashboard load and detail page load
- [ ] `ng build --configuration=production` — must complete with zero errors
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "feat(frontend): delivery detail page, shared components, full dark theme"
  git push
  ```

**Step 6 checkpoint:** Green `ng build`. All three screens navigable. Green push on GitHub.

---

### Phase 3 Step Summary

| Step | Job | Time | Checkpoint |
|---|---|---|---|
| 1 | CSS variables + JetBrains Mono font | 15 min | `ng serve` identical, CSS vars applied |
| 2 | StatusBadge component + EtaPipe | 20 min | Inline badges replaced, ETA formatted |
| 3 | DeliveryCard + Spinner + Filter tabs | 30 min | Filter tabs work, spinner on load |
| 4 | Detail page layout + info panels | 30 min | `/deliveries/:id` loads with stat cards |
| 5 | Detail timeline + mini map | 30 min | Timeline + route polyline visible |
| 6 | Final wiring + integration test + commit | 20 min | Green build + green GitHub push |

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
- [ ] `git commit -m "feat: initial scaffold — Angular 21 + .NET 8 + SignalR + Leaflet"`
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
| 7 | SignalR group join strategy | Missing | 2 | Server auto-joins connection to `"all-deliveries"` in `OnConnectedAsync` — no client invocation needed |
| 8 | Leaflet TypeScript config missing | Missing | 1B | `"skipLibCheck": true` only — no `"types"` array (adding it breaks Angular's own types) |
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

> **Live Delivery Tracker** — Full-stack real-time web app built with Angular 21, .NET Core 8, and SignalR WebSockets. Features a live dispatcher dashboard with Leaflet map, JWT auth, background GPS simulation, and EF Core + SQLite persistence. Deployed via GitHub Actions CI/CD.
