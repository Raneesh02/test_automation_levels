// UNIT TEST — Pure function, zero I/O, zero infrastructure.
// What this level catches: formula bugs, edge cases, invalid inputs.
// What this level misses: DB errors, HTTP failures, wiring between services.
//
// ❌ ANTI-PATTERN: Do NOT test pricing via API or E2E.
// If calculatePrice() has a bug, an API test will also fail but will tell you
// nothing about WHERE it failed. Unit test isolates the formula directly.
// E2E test for this = 30 seconds to find a 2-line bug.

import { calculatePrice } from "../../src/domain/pricing";

describe("calculatePrice", () => {
  describe("base rate calculation", () => {
    it("charges 2.00 per km", () => {
      const result = calculatePrice(1, 10, "standard");
      expect(result.baseRate).toBe(20);
    });

    it("charges 0.50 per kg", () => {
      const result = calculatePrice(10, 1, "standard");
      expect(result.weightSurcharge).toBe(5);
    });

    it("calculates correct total for standard priority", () => {
      // 10km * 2.00 = 20.00 base + 5kg * 0.50 = 2.50 weight = 22.50 total
      const result = calculatePrice(5, 10, "standard");
      expect(result.total).toBe(22.5);
    });
  });

  describe("priority multipliers", () => {
    it("applies 1x multiplier for standard", () => {
      const result = calculatePrice(5, 10, "standard");
      expect(result.priorityMultiplier).toBe(1.0);
    });

    it("applies 1.5x multiplier for express", () => {
      const result = calculatePrice(5, 10, "express");
      expect(result.total).toBe(33.75);
    });

    it("applies 2x multiplier for overnight", () => {
      const result = calculatePrice(5, 10, "overnight");
      expect(result.total).toBe(45);
    });
  });

  describe("oversize surcharge", () => {
    it("does not apply oversize surcharge for packages at or below 20kg", () => {
      const result = calculatePrice(20, 10, "standard");
      expect(result.oversizeSurcharge).toBe(0);
    });

    it("applies 15% oversize surcharge for packages above 20kg", () => {
      // base=20, weight=10.50, subtotal=30.50, oversize=30.50*0.15=4.575, total=35.08
      const result = calculatePrice(21, 10, "standard");
      expect(result.oversizeSurcharge).toBeGreaterThan(0);
      expect(result.total).toBe(35.08);
    });

    it("applies oversize surcharge before priority multiplier", () => {
      // subtotal=30.50, oversize=4.575, pre-priority=35.075, express(1.5x)=52.6125 → 52.61
      const result = calculatePrice(21, 10, "express");
      expect(result.total).toBe(52.61);
    });
  });

  describe("input validation", () => {
    it("throws if weight is zero", () => {
      expect(() => calculatePrice(0, 10, "standard")).toThrow(
        "Weight must be greater than 0"
      );
    });

    it("throws if weight is negative", () => {
      expect(() => calculatePrice(-5, 10, "standard")).toThrow(
        "Weight must be greater than 0"
      );
    });

    it("throws if distance is zero", () => {
      expect(() => calculatePrice(5, 0, "standard")).toThrow(
        "Distance must be greater than 0"
      );
    });

    it("throws if distance is negative", () => {
      expect(() => calculatePrice(5, -10, "standard")).toThrow(
        "Distance must be greater than 0"
      );
    });
  });

  describe("price breakdown shape", () => {
    it("returns all breakdown fields", () => {
      const result = calculatePrice(5, 10, "express");
      expect(result).toMatchObject({
        baseRate: expect.any(Number),
        weightSurcharge: expect.any(Number),
        oversizeSurcharge: expect.any(Number),
        priorityMultiplier: expect.any(Number),
        total: expect.any(Number),
      });
    });
  });
});
