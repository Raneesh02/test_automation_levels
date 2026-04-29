// UNIT TEST — Pure function, zero I/O, zero infrastructure.
// What this catches: formula bugs, wrong delay values, edge cases.
// What this misses: DB, HTTP, wiring between services.

import { calculateETA } from "../../src/domain/etaCalculator";

describe("calculateETA", () => {
  it("returns travel time plus status delay for PICKED_UP", () => {
    // 30km at 30km/h = 60 min travel + 5 min PICKED_UP delay = 65 min
    expect(calculateETA(30, "PICKED_UP")).toBe(65);
  });
});
