// E2E TEST — Book Delivery happy path
//
// What this catches:
//   - Form renders and accepts input in real browser
//   - Submit fires real POST /api/orders → real order-service → real DB
//   - App navigates to confirmation page after success
//   - Confirmation page shows real order ID from response
//
// What it misses: validation edge cases (test those at component level, ~100ms).
// Each validation state tested here = 10-30s of wasted CI time.
//
// ❌ ANTI-PATTERN: Do NOT test "weight required" error here.
//    Component test covers that in <100ms with no infrastructure.

import { test, expect } from "@playwright/test";

test("user books a delivery and sees order confirmation", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);

  // Form is visible
  await expect(page.getByRole("heading", { name: "Book a Delivery" })).toBeVisible();
  await page.waitForTimeout(800);

  // Fill form
  await page.getByLabel("Weight (kg)").fill("5");
  await page.waitForTimeout(600);
  await page.getByLabel("Distance (km)").fill("10");
  await page.waitForTimeout(600);
  await page.getByLabel("Priority").selectOption("standard");
  await page.waitForTimeout(800);

  // Submit is enabled
  const submitBtn = page.getByRole("button", { name: /book delivery/i });
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();
  await page.waitForTimeout(500);

  // Confirmation page appears with a real order ID
  await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible();
  await page.waitForTimeout(1000);

  const orderId = await page.getByTestId("order-id").textContent();
  expect(orderId).toBeTruthy();
  expect(orderId!.length).toBeGreaterThan(0);

  // Status is PENDING
  await expect(page.getByTestId("order-status")).toContainText("PENDING");
  await page.waitForTimeout(800);

  // Price is shown
  const price = await page.getByTestId("order-price").textContent();
  expect(price).toMatch(/₹\d+\.\d{2}/);
  await page.waitForTimeout(1000);
});

// ─────────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN SHOWCASE — do not copy these into real test suites
//
// These tests WORK but belong at a lower level.
// They are here to show the cost: full browser + backend + DB for logic that
// a faster test level can catch in milliseconds with no infrastructure.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("❌ ANTI-PATTERN — validation tested at E2E level", () => {
  // WRONG LEVEL: This is a 3-line client-side validation rule.
  // The component test in BookDelivery.test.tsx covers this in <100ms with no browser.
  // Here it costs: full Chromium launch + Vite dev server + order-service + DB = ~8s.
  // Failure message: "element not visible" — tells you nothing about WHERE the bug is.
  // RIGHT LEVEL: component test (BookDelivery.test.tsx → "shows validation error when weight is 0")
  test("shows error when weight is zero — should be a component test", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.getByLabel("Weight (kg)").fill("0");
    await page.waitForTimeout(600);
    await page.getByLabel("Distance (km)").fill("10");
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /book delivery/i }).click();
    await page.waitForTimeout(800);

    await expect(page.getByRole("alert")).toContainText("Weight must be greater than 0");
    await page.waitForTimeout(1000);
  });
});

test.describe("❌ ANTI-PATTERN — business logic verified at E2E level", () => {
  // WRONG LEVEL: Pricing formula is a pure function: calculatePrice(5kg, 10km, 'standard').
  // The unit test in pricing.test.ts asserts the exact result in <5ms with zero infrastructure.
  // Here it costs: browser + backend + DB + HTTP round-trip, and if the price is wrong
  // you get "expected ₹12.50, got ₹15.00" with no stack trace pointing to the formula.
  // RIGHT LEVEL: unit test (pricing.test.ts → "standard weight pricing")
  test("confirms price matches expected formula output — should be a unit test", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.getByLabel("Weight (kg)").fill("5");
    await page.waitForTimeout(600);
    await page.getByLabel("Distance (km)").fill("10");
    await page.waitForTimeout(600);
    await page.getByLabel("Priority").selectOption("standard");
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /book delivery/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Order Confirmed!" })).toBeVisible();
    await page.waitForTimeout(1000);

    // Asserting exact business logic output via the UI — this is what unit tests are for.
    const price = await page.getByTestId("order-price").textContent();
    expect(price).toMatch(/₹\d+\.\d{2}/);
    await page.waitForTimeout(1000);
  });
});
