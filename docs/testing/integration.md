# Integration Tests

## What they are

Integration tests verify that application code works correctly against real infrastructure — specifically, real Postgres databases via Prisma. No HTTP server runs. Repository functions are called directly.

## Why this level exists

Mocking the database means you are testing that your mock works, not that your schema and queries work. Real databases catch things TypeScript cannot: a missing column whose generated Prisma types haven't refreshed, a wrong default value in the schema, or an ordering bug in a `findAll` query.

**What they catch:**
- DB constraint violations
- Prisma query bugs
- Schema mismatches between code and migrations
- Wrong default values
- Result ordering bugs

**What they miss:**
- HTTP contract shape and status codes (covered by API tests)
- Cross-service wiring (covered by integration flow tests and pact tests)
- UI regressions

## Folders

```
order-service/tests/integration/
  orderRepository.test.ts     — create, find, update, assign courier; real Postgres on :5434
  createOrderFlow.test.ts     — multi-step order flow through the full service layer

tracking-service/tests/integration/
  trackingRepository.test.ts  — create record, history ordering; real Postgres on :5435
```
