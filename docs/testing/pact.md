# Pact Contract Tests

## What they are

Pact tests are consumer-driven contract tests that verify the API agreement between two services without requiring both to run simultaneously. The consumer records every interaction it expects into a pact file. The provider then replays those interactions against its real implementation to verify it satisfies them.

This project has one consumer-provider pair: **order-service** (consumer) → **tracking-service** (provider).

## Why this level exists

Integration tests and API tests verify each service in isolation. But they cannot catch a breaking change introduced by one team that silently breaks another service's expectations — for example, tracking-service renaming `orderId` to `order_id` in its response. Pact catches this before the services are deployed together, without needing a shared environment.

**What they catch:**
- API shape changes that break consumers (renamed fields, dropped fields, wrong status codes)
- Consumer/provider drift introduced by independent deployments
- Undocumented assumptions about response structure

**What they miss:**
- Real DB behavior (covered by integration tests)
- Full user flows (covered by e2e tests)
- Internal logic bugs (covered by unit and component tests)

## How it works

1. **Consumer test** — order-service runs its pact test against a Pact mock server (no real tracking-service needed). The mock records every HTTP interaction and writes a pact file.
2. **Provider verification** — tracking-service runs its verification test, which replays every interaction from the pact file against the real tracking-service and asserts that responses match.

## Folders

```
order-service/tests/pact/
  trackingClient.pact.ts      — consumer: defines POST /tracking interaction,
                                writes pact file to /pacts/

tracking-service/tests/pact/
  tracking.provider.ts        — provider: verifies real tracking-service satisfies
                                the pact file written by order-service

pacts/
  order-service-tracking-service.json   — generated pact file shared between services
```

## Config

```
order-service/jest.pact.config.ts
tracking-service/jest.pact.config.ts
```
