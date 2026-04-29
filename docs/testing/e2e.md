# End-to-End Tests

## What they are

E2E tests run user journeys through a real browser (Playwright + Chromium) against the fully running stack: Vite dev server, order-service, tracking-service, and both databases. No mocks. No shortcuts.

## Why this level exists

All other test levels verify pieces in isolation. E2E tests verify that those pieces work together as a user actually experiences them — clicking a form, submitting it, seeing the confirmation page, navigating to tracking. This is the only level that catches bugs in the glue between frontend and backend, such as a broken proxy route or a missing CORS header.

**What they catch:**
- Full user journeys across the entire stack
- Frontend-to-backend wiring (proxy config, real HTTP)
- Navigation and page transitions after successful actions
- Real data flowing end-to-end (order ID from backend appearing in the UI)

**What they miss:**
- Validation edge cases — these belong in component tests (~100ms, no infrastructure)
- Business logic correctness — these belong in unit tests (~5ms, no infrastructure)
- Error states and loading states — these belong in component tests (MSW controls timing)

## Anti-pattern warning

E2E tests are the most expensive level: full browser + full stack + real DBs. A validation rule that takes 3ms in a component test takes 8–30 seconds here, with a less useful failure message. Only test complete user journeys at this level.

## Folders

```
frontend/src/tests/e2e/
  bookDelivery.spec.ts    — user fills form → submits → sees confirmation with real order ID
  trackOrder.spec.ts      — user books order → navigates to tracking → sees PENDING status
```

## Config

```
frontend/playwright.config.ts
```
