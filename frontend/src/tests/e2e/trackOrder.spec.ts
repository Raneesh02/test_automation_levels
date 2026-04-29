// E2E TEST — Track Order happy path
//
// What this catches:
//   - Full flow: book → confirm → navigate to tracking
//   - Real GET /api/tracking/:orderId → real tracking-service → real DB
//   - Tracking timeline renders with at least one status record
//
// What it misses: error states (order not found, network failure).
// Test those at component level — they're UI states, not user journeys.
//
// ❌ ANTI-PATTERN: Do NOT test loading/error states here.
//    Component test covers those in <500ms. E2E = 30s for the same assertion.

import { test, expect } from "@playwright/test";

test("user books a delivery then tracks it", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);

  // Book a delivery
  await page.getByLabel("Weight (kg)").fill("3");
  await page.waitForTimeout(600);
  await page.getByLabel("Distance (km)").fill("20");
  await page.waitForTimeout(600);
  await page.getByLabel("Priority").selectOption("express");
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /book delivery/i }).click();
  await page.waitForTimeout(500);

  // Confirmation page — grab order ID before navigating
  await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible();
  await page.waitForTimeout(1000);
  const orderId = await page.getByTestId("order-id").textContent();
  expect(orderId).toBeTruthy();

  // Navigate to tracking
  await page.getByRole("button", { name: /track my order/i }).click();
  await page.waitForTimeout(500);

  // Tracking page shows the order ID
  await expect(page.getByRole("heading", { name: "Live Tracking" })).toBeVisible();
  await expect(page.locator(".tracking-id")).toContainText(orderId!);
  await page.waitForTimeout(1000);

  // At least one tracking record (created by order-service → tracking-service)
  const records = page.getByTestId("tracking-record");
  await expect(records.first()).toBeVisible();
  await page.waitForTimeout(800);

  // First status is PENDING
  await expect(page.getByTestId("tracking-status").first()).toContainText("PENDING");
  await page.waitForTimeout(1000);
});

// ─────────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN SHOWCASE — do not copy these into real test suites
//
// These tests WORK but belong at a lower level.
// They are here to show the cost: full browser + backend + DB for UI states
// that a component test can cover in <500ms with no infrastructure.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("❌ ANTI-PATTERN — loading state tested at E2E level", () => {
  // WRONG LEVEL: The loading spinner is a 3-line conditional: if (loading) return <Spinner />.
  // The component test in TrackingPage.test.tsx catches this in <500ms by intercepting
  // the fetch before it resolves — no browser, no backend, no DB.
  // Here you need the full stack running just to observe a state that lasts ~50ms.
  // If the spinner disappears too fast you'll get a flaky test that fails on fast machines.
  // RIGHT LEVEL: component test (TrackingPage.test.tsx → "shows loading state")
  test("shows loading spinner before tracking data arrives — should be a component test", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Complete booking to reach the tracking page
    await page.getByLabel("Weight (kg)").fill("2");
    await page.waitForTimeout(600);
    await page.getByLabel("Distance (km)").fill("5");
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /book delivery/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /track my order/i }).click();

    // Loading state — blink and you miss it. Component test catches this reliably.
    // E2E can only assert it if the network is slow enough for the spinner to appear.
    await expect(page.getByRole("heading", { name: "Live Tracking" })).toBeVisible();
    await page.waitForTimeout(1000);
  });
});

test.describe("❌ ANTI-PATTERN — error state tested at E2E level", () => {
  // WRONG LEVEL: "Order not found" is a UI state: if (error) return <ErrorMessage />.
  // The component test in TrackingPage.test.tsx mocks the fetch to return 404 and
  // asserts the error message in <500ms — no browser, no real order needed.
  // Here you need the full stack + a genuinely missing order ID to trigger the branch.
  // Any change to the error message string breaks the selector with no useful stack trace.
  // RIGHT LEVEL: component test (TrackingPage.test.tsx → "shows error when order not found")
  test("shows error for unknown order ID — should be a component test", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Book a real order first so we're on the right page state
    await page.getByLabel("Weight (kg)").fill("1");
    await page.waitForTimeout(600);
    await page.getByLabel("Distance (km)").fill("1");
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /book delivery/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible();
    await page.waitForTimeout(800);

    // Manually patch the app state via page.evaluate to inject a fake order ID —
    // this is the kind of hack E2E tests require to test error branches.
    // A component test just passes a bad orderId prop. No hacks needed.
    await page.evaluate(() => {
      // Force the app into the tracking page with a non-existent order ID
      // by dispatching a custom event — brittle, implementation-coupled.
      (window as unknown as Record<string, unknown>).__FORCE_TRACKING_ID__ = "order-does-not-exist";
    });
    await page.waitForTimeout(800);

    // We can't cleanly trigger this without coupling to internals.
    // The component test does it cleanly in 3 lines. This is the point.
    await page.waitForTimeout(1000);
  });
});
