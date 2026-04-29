# API Tests

## What they are

API tests validate the HTTP contract of each service — status codes, request validation, and response shape — by firing real HTTP requests through the full Express stack against a real test database. Cross-service HTTP calls are mocked so only one service needs to run.

## Why this level exists

Unit and component tests verify logic. API tests verify the contract visible to consumers: does `POST /orders` return `201`? Does a missing field return `400` with an error body? Does `GET /orders/:id` return `404` for an unknown ID? These are the promises your service makes to every client, and they need to be verified at the HTTP level, not inferred from internal logic tests.

**What they catch:**
- Wrong HTTP status codes
- Missing or malformed response fields
- Missing request validation (required fields, invalid enum values)
- Route and middleware wiring bugs
- Contract regressions visible to any API consumer

**What they miss:**
- Internal implementation bugs (covered by unit and component tests)
- DB constraint details (covered by integration tests)
- UI flows (covered by e2e tests)

## Folders

```
order-service/tests/api/
  orders.api.test.ts          — POST /orders, GET /orders, GET /orders/:id,
                                PATCH /orders/:id/status, PATCH /orders/:id/courier
                                trackingClient mocked; real Postgres on :5434

tracking-service/tests/api/
  tracking.api.test.ts        — POST /tracking, GET /tracking/:orderId
                                real Postgres on :5435
```
