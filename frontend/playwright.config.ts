// E2E TESTS — what this level catches:
// - Full user journey through real browser
// - Cross-page navigation (book → confirm → track)
// - Real HTTP calls to real backend services
//
// What it misses: nothing above passes through here, but failures give
// least signal on WHERE it broke (component/unit tests isolate that).
//
// ❌ ANTI-PATTERN: Do NOT use E2E as primary coverage.
//    Ice cream cone = many E2E, few unit tests.
//    E2E = brittle, slow, poor failure signal. Use for happy-path only.
//
// Requires before running:
//   make db.up
//   cd order-service && npm run dev    (port 3001)
//   cd tracking-service && npm run dev (port 3002)

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
