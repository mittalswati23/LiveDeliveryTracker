# Trackr — Live Delivery Tracker

![Build](https://img.shields.io/github/actions/workflow/status/mittalswati/LiveDeliveryTracker/ci.yml?label=build)
![License](https://img.shields.io/badge/license-MIT-blue)

A real-time delivery tracking application built with **Angular 19** and **.NET Core 8**, featuring live map updates via SignalR and WebSockets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19 (standalone), Angular Material, Leaflet.js |
| Backend | .NET Core 8 Web API, SignalR, Entity Framework Core |
| Database | SQLite |
| Auth | JWT Bearer |
| CI/CD | GitHub Actions |
| Hosting | Azure Static Web Apps + Azure App Service |

---

## Project Structure

```
LiveDeliveryTracker/
├── client/          # Angular 19 frontend
├── server/          # .NET Core 8 backend
│   └── DeliveryTracker.API/
├── PHASES.md        # Build roadmap
└── DESIGN-PHASE1.md # Phase 1 design spec
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- .NET 8 SDK
- Angular CLI (`npm install -g @angular/cli`)

### Backend

```bash
cd server/DeliveryTracker.API
dotnet restore
dotnet run
# API: http://localhost:5001
# Swagger: http://localhost:5001/swagger
```

### Frontend

```bash
cd client
npm install
ng serve
# App: http://localhost:4200
```

---

## Features

- **Real-time map** — delivery location updates every 5 seconds via SignalR
- **JWT authentication** — dispatcher login with role-based access
- **Live status tracking** — Pickup → In Transit → Nearby → Delivered
- **5 seeded deliveries** — ready to run out of the box

---

## Development Phases

| Phase | Description | Status |
|---|---|---|
| 1A | Backend foundation (JWT, EF Core, SQLite) | 🔄 In Progress |
| 1B | Angular auth (login, guard, interceptor) | ⏳ Pending |
| 2 | Real-time map (SignalR, Leaflet) | ⏳ Pending |
| 3 | Polish + deployment | ⏳ Pending |

---

## License

MIT
