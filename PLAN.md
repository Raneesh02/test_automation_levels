# Courier Delivery Management System — Test Levels Learning Project

## Learning Goals

Understand where each test level fits in the **testing trophy** model, what each level catches, and what it misses. Every test file will include comment blocks explaining this explicitly.

---

## Testing Trophy Model (Kent C. Dodds)

```
        /\
       /UI\          ← few, slow, high confidence on user flows
      /----\
     / API  \        ← some, validates HTTP contracts
    /--------\
   /Integration\     ← MOST tests live here (best ROI in JS)
  /--------------\
 /   Unit Tests   \  ← targeted, pure logic only
/------------------\
     Static/Types    ← TypeScript catches this for free
```

**Key shift from classic pyramid:**
Integration tests give the best ROI in JS because they test real wiring without full browser overhead. Unit tests are reserved for complex pure logic only — not for every function.

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│    order-service     │  HTTP   │    tracking-service       │
│    :3001             │────────▶│    :3002                  │
│                      │         │                           │
│  - Create orders     │         │  - Create tracking record │
│  - Assign couriers   │         │  - Update location        │
│  - Pricing calc      │         │  - ETA calculation        │
│  - Status state mgmt │         │  - Status timeline        │
└──────────┬──────────┘         └────────────┬─────────────┘
           │                                  │
           ▼                                  ▼
     ┌──────────┐                      ┌──────────┐
     │ Postgres │                      │ Postgres │
     │ orders DB│                      │tracking  │
     └──────────┘                      │   DB     │
                                       └──────────┘
                          ▲
                          │  HTTP (REST)
               ┌──────────┴──────────┐
               │   React Frontend     │
               │   :5173              │
               │                      │
               │  - Book delivery     │
               │  - Order confirm     │
               │  - Live tracking     │
               └─────────────────────┘
```

**When order is created:**
`order-service` → `POST /tracking` → `tracking-service` creates a tracking record linked to the order.

---

## Monorepo Folder Structure

```
courier-test-levels/
│
├── order-service/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── pricing.ts              ← pure pricing logic
│   │   │   └── orderStateMachine.ts    ← valid status transitions
│   │   ├── services/
│   │   │   └── orderService.ts         ← orchestrates repo + tracking HTTP call
│   │   ├── repositories/
│   │   │   └── orderRepository.ts      ← Prisma DB calls
│   │   ├── routes/
│   │   │   └── orderRoutes.ts          ← Express route handlers
│   │   ├── clients/
│   │   │   └── trackingClient.ts       ← HTTP client for tracking-service
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── pricing.test.ts
│   │   │   └── orderStateMachine.test.ts
│   │   ├── component/
│   │   │   └── orderService.test.ts
│   │   ├── integration/
│   │   │   ├── orderRepository.test.ts
│   │   │   └── createOrderFlow.test.ts
│   │   └── api/
│   │       └── orders.api.test.ts
│   ├── prisma/schema.prisma
│   └── package.json
│
├── tracking-service/
│   ├── src/
│   │   ├── domain/
│   │   │   └── etaCalculator.ts        ← pure ETA logic
│   │   ├── services/
│   │   │   └── trackingService.ts
│   │   ├── repositories/
│   │   │   └── trackingRepository.ts
│   │   ├── routes/
│   │   │   └── trackingRoutes.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   └── etaCalculator.test.ts
│   │   ├── component/
│   │   │   └── trackingService.test.ts
│   │   ├── integration/
│   │   │   └── trackingRepository.test.ts
│   │   └── api/
│   │       └── tracking.api.test.ts
│   ├── prisma/schema.prisma
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BookDelivery.jsx
│   │   │   ├── OrderConfirmation.jsx
│   │   │   └── TrackingPage.jsx
│   │   └── App.jsx
│   ├── tests/
│   │   ├── component/
│   │   │   ├── BookDelivery.test.tsx    ← React Testing Library
│   │   │   ├── OrderConfirmation.test.tsx
│   │   │   └── TrackingPage.test.tsx
│   │   └── e2e/
│   │       ├── bookDelivery.spec.ts     ← Playwright
│   │       └── trackOrder.spec.ts      ← Playwright
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.test.yml
└── README.md
```

---

## Domain Breakdown

### order-service

| File | Responsibility |
|---|---|
| `pricing.js` | Calculate cost from weight, distance, priority (pure function) |
| `orderStateMachine.js` | Define valid status transitions: PENDING → ASSIGNED → PICKED_UP → DELIVERED |
| `orderService.js` | Create order: validate → save to DB → call tracking-service |
| `orderRepository.js` | Prisma CRUD for orders table |
| `trackingClient.js` | Axios HTTP client — `POST /tracking` on tracking-service |
| `orderRoutes.js` | Express handlers for `/orders` endpoints |

### tracking-service

| File | Responsibility |
|---|---|
| `etaCalculator.js` | Calculate ETA from distance + current status (pure function) |
| `trackingService.js` | Create/update tracking records |
| `trackingRepository.js` | Prisma CRUD for tracking table |
| `trackingRoutes.js` | Express handlers for `/tracking` endpoints |

---

## Test Level Map

### Unit Tests — Pure Logic Only

**What it catches:** Formula bugs, edge cases in business rules, invalid state transitions  
**What it misses:** Wiring bugs, DB schema issues, HTTP contract breaks, UI regressions  
**Speed:** < 5ms per test, no I/O  

| Test File | Tests | Key Assertion |
|---|---|---|
| `unit/pricing.test.ts` | Standard weight pricing, oversize surcharge, priority multiplier, zero weight edge case | `calculatePrice(5kg, 10km, 'standard') === 12.50` |
| `unit/orderStateMachine.test.ts` | Valid transitions pass, invalid transitions throw | `transition('PENDING', 'PICKED_UP')` throws |
| `unit/etaCalculator.test.ts` | ETA from distance + speed, status-based delays | `calculateETA(50km, 'PICKED_UP') === 90mins` |

**Anti-pattern to show inline:**
```js
// ❌ ANTI-PATTERN: Do NOT test pricing via API or E2E.
// If calculatePrice() has a bug, an API test will also fail but will tell you
// nothing about WHERE it failed. Unit test isolates the formula directly.
// E2E test for this = 30 seconds to find a 2-line bug.
```

---

### Component Tests — One Service, All Dependencies Mocked

**What it catches:** Wiring bugs inside a service (wrong method called, wrong args passed, missing orchestration step)  
**What it misses:** Real DB constraints, real HTTP failures, actual network behavior  
**Speed:** < 100ms per test  

| Test File | Tests | Mocks Used |
|---|---|---|
| `component/orderService.test.ts` | createOrder calls repo.save, createOrder calls trackingClient.create, createOrder throws if repo fails | `orderRepository` mocked, `trackingClient` mocked with nock |
| `component/trackingService.test.ts` | updateLocation saves to repo, getHistory returns sorted records | `trackingRepository` mocked |

**Anti-pattern to show inline:**
```js
// ❌ ANTI-PATTERN: Do NOT mock the DB in integration tests.
// Mocking Prisma here means you're testing that your mock works, not that
// your DB schema + queries work. A mocked unit test passed while a missing
// DB column was caught only in production. Use component tests for logic
// wiring, integration tests for real DB behavior.
```

---

### Integration Tests — Real DB, Real HTTP Between Services

**What it catches:** DB constraint violations, Prisma query bugs, cross-service contract bugs, transaction behavior  
**What it misses:** Full user flow, UI rendering bugs, network-level issues in production  
**Speed:** 500ms–3s per test (Docker Postgres)  

**These are the bulk of tests — highest ROI.**

| Test File | Tests | Real Deps |
|---|---|---|
| `integration/orderRepository.test.ts` | Save order persists all fields, unique constraint on orderId, status default is PENDING | Real Postgres (Docker) |
| `integration/createOrderFlow.test.ts` | Creating order saves to DB AND creates tracking record via HTTP | Real Postgres + tracking-service test instance |
| `integration/trackingRepository.test.ts` | Location update appends to history, get latest status returns correct record | Real Postgres |

**Anti-pattern to show inline:**
```js
// ❌ ANTI-PATTERN: Do NOT test the full order creation flow at UI level only.
// If tracking-service fails to create a record, a UI test might still "pass"
// because the UI shows a success screen from optimistic rendering.
// Integration test catches the cross-service contract break directly.
```

---

### API Tests — HTTP Contract Validation

**What it catches:** Breaking changes to request/response shape, HTTP status codes, validation errors, missing fields  
**What it misses:** Internal implementation bugs, DB-level issues, UI flows  
**Speed:** 200ms–1s per test (running server + DB)  

| Test File | Tests | Tool |
|---|---|---|
| `api/orders.api.test.ts` | POST /orders returns 201 with id, POST with missing fields returns 400, GET /orders/:id returns full schema, PATCH /orders/:id/status validates transition | Supertest |
| `api/tracking.api.test.ts` | GET /tracking/:orderId returns history array, POST /tracking creates record, GET with unknown orderId returns 404 | Supertest |

**Anti-pattern to show inline:**
```js
// ❌ ANTI-PATTERN: Do NOT use API tests to verify business logic.
// Testing that calculatePrice works correctly via POST /orders requires
// setting up a full HTTP server + DB for what is a 2ms unit test.
// API tests verify the HTTP contract — status codes, schemas, validation.
// They do not replace unit or integration tests.
```

---

### UI Component Tests — Single React Component, API Mocked

**What it catches:** Render logic bugs, conditional UI states, user interaction bugs (button clicks, form validation), loading/error states  
**What it misses:** Real API responses, cross-page navigation, browser-specific rendering  
**Speed:** < 500ms per test, no browser  

| Test File | Tests | Tool |
|---|---|---|
| `component/BookDelivery.test.tsx` | Form renders fields, submit disabled when empty, shows error on invalid weight, calls API with correct payload on submit | React Testing Library + msw |
| `component/OrderConfirmation.test.tsx` | Shows order ID, shows courier name, shows estimated delivery date | React Testing Library + msw |
| `component/TrackingPage.test.tsx` | Shows loading state, renders status timeline, shows error when order not found | React Testing Library + msw |

**Anti-pattern to show inline:**
```tsx
// ❌ ANTI-PATTERN: Do NOT use E2E tests to verify individual component states.
// Testing that the form shows a "weight required" error via Playwright means
// spinning up a full browser + backend stack to test a 3-line validation rule.
// Component test catches this in <100ms with no infrastructure.
// E2E should only verify the happy-path user journey, not every UI state.
```

---

### UI / E2E Tests — Full Browser, Full Stack

**What it catches:** User flow regressions, UI rendering bugs, browser-specific issues, full system integration  
**What it misses:** Nothing above passes through here, but failures give least signal on WHERE it broke  
**Speed:** 10s–60s per test  

| Test File | Tests | Tool |
|---|---|---|
| `e2e/bookDelivery.spec.js` | User fills form → submits → sees confirmation with order ID | Playwright |
| `e2e/trackOrder.spec.js` | User enters order ID → sees tracking status → status updates on page | Playwright |

**Anti-pattern to show inline:**
```js
// ❌ ANTI-PATTERN: Do NOT use E2E tests as your primary test coverage.
// "Ice cream cone" anti-pattern: many E2E, few unit tests.
// E2E tests are brittle (CSS change breaks selector), slow (60s per run),
// and give poor failure signal ("page showed error" vs "pricing formula returned NaN").
// E2E tests exist to verify the user journey works end-to-end — nothing else.
```

---

## Tech Stack

| Concern | Tool |
|---|---|
| Concern | Tool |
|---|---|
| Runtime | Node 20 |
| Language | TypeScript 5 |
| Framework | Express 4 + `@types/express` |
| ORM | Prisma |
| Database | Postgres 15 (Docker) |
| Unit/Component/Integration/API | Jest + ts-jest + Supertest |
| HTTP mocking | nock |
| UI Component Tests | React Testing Library + msw |
| E2E | Playwright |
| Frontend | React + Vite + TypeScript |
| Containerization | Docker Compose |
| TS config | `strict: true`, `esModuleInterop: true` |

---

## Implementation Order

Build in this order so each phase is runnable and testable:

1. **Docker Compose** — Postgres for both services
2. **order-service domain layer** — `pricing.js`, `orderStateMachine.js` + unit tests
3. **order-service repository + integration tests** — real DB tests first
4. **order-service service layer + component tests** — mocked deps
5. **order-service routes + API tests** — HTTP contract
6. **tracking-service** — same order as above (domain → repo → service → routes)
7. **Cross-service integration test** — `createOrderFlow.test.js` hits both services
8. **React frontend** — BookDelivery, Confirmation, Tracking pages
9. **Playwright E2E tests** — full flow

---

## Progress

| # | Task | Status |
|---|---|---|
| **Milestone 1 — Infrastructure** | | |
| 1 | Docker Compose — Postgres for both services | ✅ Done |
| **Milestone 2 — order-service + Unit Tests** | | |
| 2 | order-service: domain layer (`pricing.ts`, `orderStateMachine.ts`) | ✅ Done |
| 3 | order-service: unit tests for domain layer | ✅ Done |
| **Milestone 3 — order-service + Integration & Component Tests** | | |
| 4 | order-service: Prisma schema + `orderRepository.ts` | ✅ Done |
| 5 | order-service: integration tests for repository | ✅ Done |
| 6 | order-service: `orderService.ts` + component tests | ✅ Done |
| **Milestone 4 — order-service + API Tests** | | |
| 7 | order-service: `orderRoutes.ts` + API tests | ✅ Done |
| **Milestone 5 — tracking-service (all backend levels)** | | |
| 8 | tracking-service: domain layer (`etaCalculator.ts`) + unit tests | ✅ Done |
| 9 | tracking-service: Prisma schema + `trackingRepository.ts` + integration tests | ✅ Done |
| 10 | tracking-service: `trackingService.ts` + component tests | ✅ Done |
| 11 | tracking-service: `trackingRoutes.ts` + API tests | ✅ Done |
| **Milestone 6 — Cross-Service Integration** | | |
| 12 | Cross-service integration test (`createOrderFlow.test.ts`) | ✅ Done |
| **Milestone 6b — Contract Tests (Pact)** | | |
| 12b | Consumer pact — `order-service/tests/pact/trackingClient.pact.ts` | ✅ Done |
| 12c | Provider verification — `tracking-service/tests/pact/tracking.provider.ts` | ✅ Done |
| **Milestone 7 — Frontend + UI Component Tests** | | |
| 13 | React frontend — BookDelivery, Confirmation, Tracking pages | ✅ Done |
| 14 | React component tests (React Testing Library + msw) | ✅ Done |
| **Milestone 8 — E2E** | | |
| 15 | Playwright E2E tests | ✅ Done |
| **Milestone 9 — Frontend Enhancements** | | |
| 16 | Back/home button on confirmation and tracking pages | ✅ Done |
| 17 | Assign courier to an order (UI + `PATCH /orders/:id/courier`) | ✅ Done |
| 18 | Live price estimate preview as user types (client-side calc) | ✅ Done |
| 19 | Order history page — list all past orders via `GET /orders` | ✅ Done |

**Status key:** ⬜ Not Started · 🔄 In Progress · ✅ Done

---

## What Each Level Catches — Summary Table

| Bug Type | Unit | Component (BE) | Integration | API | Component (UI) | E2E |
|---|---|---|---|---|---|---|
| Formula wrong | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wrong method called in service | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DB constraint violation | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| HTTP response shape changed | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Form validation not shown | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Loading/error state missing | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Button disabled by CSS bug | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-service contract broken | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Invalid status transition | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

**Read this table as:** each level can only reliably catch bugs at its layer. Testing everything at UI level does not substitute for lower levels — it just makes failures slower and harder to diagnose.

---

## Commands

### Infrastructure
```bash
make db.up            # start dev databases (orders:5432, tracking:5433)
make db.down          # stop dev databases
make db.test.up       # start test databases (orders:5434, tracking:5435) — tmpfs, fast
make db.test.down     # stop test databases
```

### Run by test level
```bash
make unit             # unit tests only          — no infra, ~ms
make component        # component tests only     — no infra, ~100ms
make integration      # integration tests only   — auto-starts test DBs, ~seconds
make api              # api tests only           — auto-starts test DBs, ~seconds
make e2e              # e2e tests only           — auto-starts dev DBs, full browser
make test             # all levels in trophy order
```

### From root (npm workspaces)
```bash
npm run test:unit
npm run test:component
npm run test:integration
npm run test:api
npm run test:e2e
npm test              # all levels
```

### Single service
```bash
cd order-service && npm run test:unit
cd order-service && npm run test:component
cd order-service && npm run test:integration
cd order-service && npm run test:api
cd tracking-service && npm run test:unit
cd frontend && npm run test:component
cd frontend && npm run test:e2e
```

### Contract tests (Pact)
```bash
cd order-service && npm run test:pact       # consumer — generates pacts/order-service-tracking-service.json
cd tracking-service && npm run test:pact    # provider — verifies tracking-service satisfies the pact
```

### Frontend
```bash
cd frontend && npm run dev                  # start dev server :5173
cd frontend && npm run test:component       # Vitest component tests (React Testing Library + msw)
cd frontend && npm run test:e2e             # Playwright E2E tests (requires dev server running)
```
