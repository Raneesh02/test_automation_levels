# ============================================================
#  Courier Test Levels — Command Reference
# ============================================================
#
#  INFRASTRUCTURE
#    make db.up          start dev databases (Postgres x2)
#    make db.down        stop dev databases
#    make db.test.up     start test databases (tmpfs, fast)
#    make db.test.down   stop test databases
#
#  RUN TESTS BY LEVEL (single service)
#    make unit           unit tests only         (~ms, no I/O)
#    make component      component tests only     (~100ms, mocked deps)
#    make integration    integration tests only   (~seconds, real DB)
#    make api            api tests only           (~seconds, running server)
#    make e2e            e2e tests only           (~minutes, full browser)
#
#  RUN ALL TESTS (trophy order — fastest first)
#    make test           run all levels in order
#
# ============================================================

.PHONY: db.up db.down db.test.up db.test.down \
        unit component integration api e2e test

# ── Infrastructure ────────────────────────────────────────────

db.up:
	docker compose up -d
	@echo "Dev DBs ready: orders=localhost:5432  tracking=localhost:5433"

db.down:
	docker compose down

db.test.up:
	docker compose -f docker-compose.test.yml up -d
	@echo "Test DBs ready: orders=localhost:5434  tracking=localhost:5435"

db.test.down:
	docker compose -f docker-compose.test.yml down

# ── Unit tests ───────────────────────────────────────────────
# Pure logic, no infrastructure needed.

unit:
	@echo "\n▶  Unit tests — order-service"
	cd order-service && npm run test:unit
	@echo "\n▶  Unit tests — tracking-service"
	cd tracking-service && npm run test:unit

# ── Component tests ──────────────────────────────────────────
# One service, all external deps mocked. No infrastructure needed.

component:
	@echo "\n▶  Component tests — order-service"
	cd order-service && npm run test:component
	@echo "\n▶  Component tests — tracking-service"
	cd tracking-service && npm run test:component
	@echo "\n▶  Component tests — frontend"
	cd frontend && npm run test:component

# ── Integration tests ────────────────────────────────────────
# Real Postgres required. Starts test DBs automatically.

integration: db.test.up
	@echo "\n▶  Integration tests — order-service"
	cd order-service && npm run test:integration
	@echo "\n▶  Integration tests — tracking-service"
	cd tracking-service && npm run test:integration

# ── API tests ────────────────────────────────────────────────
# Spins up services against test DBs and tests HTTP contracts.

api: db.test.up
	@echo "\n▶  API tests — order-service"
	cd order-service && npm run test:api
	@echo "\n▶  API tests — tracking-service"
	cd tracking-service && npm run test:api

# ── E2E tests ────────────────────────────────────────────────
# Full browser + full stack. Requires all services running.

e2e: db.up
	@echo "\n▶  E2E tests — Playwright"
	cd frontend && npm run test:e2e

# ── Full suite (trophy order) ─────────────────────────────────

test: unit component integration api e2e
	@echo "\n✅  All test levels complete"
