# Component Tests

## What they are

Component tests verify the internal wiring of a single service or UI component with all external dependencies mocked. For backend services, the DB and HTTP clients are replaced with Jest mocks. For frontend components, network calls are intercepted by MSW (Mock Service Worker).

## Why this level exists

When a component test fails, the bug is in the component — not in Prisma, not in the network, not in another service. The mock boundary makes failures fast to diagnose. They also let you test error paths (DB down, HTTP timeout, invalid state) without needing real infrastructure to fail on demand.

**What they catch:**
- Wrong method called on a dependency
- Wrong arguments passed to a dependency
- Missing orchestration steps (e.g. tracking not called after order creation)
- Business rules enforced before writing to DB
- UI form validation and render logic
- Correct HTTP payload sent from a UI component

**What they miss:**
- Real DB constraint behavior (covered by integration tests)
- Real HTTP failures from actual network (covered by API tests)
- Cross-service contract breaks (covered by pact tests)

## Folders

```
order-service/tests/component/
  orderService.test.ts        — service wiring: repo + trackingClient mocked via Jest

tracking-service/tests/component/
  trackingService.test.ts     — service wiring: trackingRepository mocked via Jest

frontend/src/tests/component/
  BookDelivery.test.tsx       — form render, validation, POST payload; network mocked via MSW
  OrderConfirmation.test.tsx  — confirmation page renders correct order data
  TrackingPage.test.tsx       — loading state, error state, tracking timeline; network mocked via MSW
```
