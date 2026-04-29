# Unit Tests

## What they are

Unit tests verify pure functions in complete isolation — no database, no HTTP, no filesystem. Input goes in, output comes out. No side effects, no dependencies.

## Why this level exists

Pure logic bugs are fastest and cheapest to catch here. A pricing formula error or an illegal state machine transition takes milliseconds to reproduce in a unit test. The same bug found via an API test requires a running server and a DB, and the failure message will point at the HTTP layer, not the line with the bug.

**What they catch:**
- Formula and calculation errors
- Invalid state transitions
- Edge cases and boundary values
- Input validation rules

**What they miss:**
- Whether the DB actually stores computed values
- Whether the HTTP layer passes data correctly
- Cross-service wiring

## Folders

```
order-service/tests/unit/
  orderStateMachine.test.ts   — state transition rules, terminal states, allowed transitions
  pricing.test.ts             — base rate, weight surcharge, oversize surcharge, priority multipliers

tracking-service/tests/unit/
  etaCalculator.test.ts       — ETA calculation logic
```
