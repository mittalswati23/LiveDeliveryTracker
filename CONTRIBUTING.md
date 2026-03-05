# Contributing to Trackr

Thanks for your interest in contributing. This guide will help you run the app locally, run tests, and open a pull request.

---

## Prerequisites

- **Node.js** 20+ and **npm**
- **.NET 8 SDK**
- **Angular CLI** (optional for local dev): `npm install -g @angular/cli@21`

Alternatively, use **Docker** and **Docker Compose** — no Node or .NET needed on the host.

---

## Running locally

### Option A — Two terminals (recommended for development)

**Terminal 1 — API**

```bash
cd server/DeliveryTracker.API
dotnet run
```

- API: http://localhost:5001  
- Swagger: http://localhost:5001/swagger  

**Terminal 2 — Angular client**

```bash
cd client
npm install
ng serve
```

- App: http://localhost:4200  

**Default login:** `dispatcher@trackr.io` / `Trackr2025!`

---

### Option B — Docker (all-in-one)

```bash
# 1. Create env file with a JWT secret (32+ characters)
cp .env.docker.example .env.docker
# Edit .env.docker and set Jwt__Secret=<your-secret>

# 2. Build and run
docker-compose up --build
```

- App: http://localhost  
- API: http://localhost:5001  

Database data is stored in the `sqlite-data` volume and persists across restarts.

---

## Running tests

**Backend (API) — required for CI**

```bash
cd server/DeliveryTracker.Tests
dotnet test --verbosity normal
```

Tests run against a temporary SQLite database; the location simulator is disabled so results are stable.

**Frontend (optional)**

```bash
cd client
npm ci
npm test
```

CI runs the API test suite and a production build of the client; frontend unit tests are not in the workflow yet.

---

## Opening a pull request

1. **Fork** the repo and clone your fork.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature
   # or fix/your-fix
   ```
3. **Make your changes.** Keep commits focused and messages clear (e.g. `feat: add push notification when delivery is nearby`).
4. **Run tests** (at least `dotnet test` in `server/DeliveryTracker.Tests`) and ensure the client builds:
   ```bash
   cd client && npx ng build --configuration=production
   ```
5. **Push** to your fork and open a **Pull Request** against `main` on this repo.
6. **CI** must pass (GitHub Actions runs API tests and client production build). Address any feedback, then maintainers can merge.

---

## Project conventions

- **Naming:** PascalCase for C#; camelCase for TypeScript; kebab-case for Angular component folders.
- **Branding:** Use “Trackr” only (no other product names).
- **Auth:** JWT in `localStorage` is an intentional portfolio tradeoff; don’t change auth storage in small PRs without discussion.
- **Status colors/labels:** Import from `client/src/app/shared/constants/status-colors.ts`; don’t redefine locally.

For more context, see the main [README](README.md) and the root [.cursorrules](.cursorrules) (if present).

---

## Questions?

Open an [Issue](https://github.com/mittalswati23/LiveDeliveryTracker/issues) for bugs or feature ideas. For small fixes (typos, docs), a direct PR is fine.
