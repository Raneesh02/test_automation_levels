// UNIT TEST — Pure state machine logic, zero I/O.
// What this level catches: invalid transitions, terminal state enforcement, edge cases.
// What this level misses: whether the DB actually stores the new status,
//   whether the API rejects the transition with the right HTTP code.

import {
  transition,
  isTerminal,
  getAllowedTransitions,
  type OrderStatus,
} from "../../src/domain/orderStateMachine";

describe("transition", () => {
  describe("valid transitions", () => {
    const validCases: [OrderStatus, OrderStatus][] = [
      ["PENDING", "ASSIGNED"],
      ["PENDING", "CANCELLED"],
      ["ASSIGNED", "PICKED_UP"],
      ["ASSIGNED", "CANCELLED"],
      ["PICKED_UP", "IN_TRANSIT"],
      ["IN_TRANSIT", "DELIVERED"],
    ];

    it.each(validCases)("%s → %s should not throw", (from, to) => {
      expect(() => transition(from, to)).not.toThrow();
    });
  });

  describe("invalid transitions", () => {
    const invalidCases: [OrderStatus, OrderStatus][] = [
      ["PENDING", "PICKED_UP"],
      ["PENDING", "IN_TRANSIT"],
      ["PENDING", "DELIVERED"],
      ["ASSIGNED", "IN_TRANSIT"],
      ["ASSIGNED", "DELIVERED"],
      ["PICKED_UP", "ASSIGNED"],
      ["PICKED_UP", "CANCELLED"],
      ["IN_TRANSIT", "CANCELLED"],
      ["IN_TRANSIT", "PENDING"],
      ["DELIVERED", "PENDING"],
      ["DELIVERED", "CANCELLED"],
      ["CANCELLED", "PENDING"],
      ["CANCELLED", "ASSIGNED"],
    ];

    it.each(invalidCases)("%s → %s should throw", (from, to) => {
      expect(() => transition(from, to)).toThrow(/Invalid transition/);
    });
  });

  it("error message names both states", () => {
    expect(() => transition("PENDING", "DELIVERED")).toThrow(
      "Invalid transition: PENDING → DELIVERED"
    );
  });

  it("error message lists allowed transitions", () => {
    expect(() => transition("PENDING", "DELIVERED")).toThrow(
      "Allowed: [ASSIGNED, CANCELLED]"
    );
  });

  it("error message says 'none' for terminal states", () => {
    expect(() => transition("DELIVERED", "PENDING")).toThrow("Allowed: [none]");
  });
});

describe("isTerminal", () => {
  it("returns true for DELIVERED", () => {
    expect(isTerminal("DELIVERED")).toBe(true);
  });

  it("returns true for CANCELLED", () => {
    expect(isTerminal("CANCELLED")).toBe(true);
  });

  it("returns false for non-terminal states", () => {
    const nonTerminal: OrderStatus[] = [
      "PENDING",
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
    ];
    nonTerminal.forEach((s) => expect(isTerminal(s)).toBe(false));
  });
});

describe("getAllowedTransitions", () => {
  it("returns correct transitions for PENDING", () => {
    expect(getAllowedTransitions("PENDING")).toEqual(["ASSIGNED", "CANCELLED"]);
  });

  it("returns empty array for terminal states", () => {
    expect(getAllowedTransitions("DELIVERED")).toEqual([]);
    expect(getAllowedTransitions("CANCELLED")).toEqual([]);
  });
});
