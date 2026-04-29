// COMPONENT TEST — One service, all dependencies mocked.
// What this level catches: wiring bugs inside orderService —
//   wrong method called, wrong args passed, missing orchestration step,
//   state machine enforced before DB write.
// What this level misses: real DB constraints, real HTTP failures,
//   cross-service contract breaks (see integration/createOrderFlow.test.ts).
//
// ❌ ANTI-PATTERN: Do NOT hit a real DB or real HTTP here.
// Mocking lets us isolate orderService logic from infrastructure noise.
// If these tests fail, the bug is in orderService — not Prisma, not the network.
// Use integration tests for real DB behavior, API tests for HTTP contracts.

import * as orderRepository from "../../src/repositories/orderRepository";
import * as trackingClient from "../../src/clients/trackingClient";
import {
  createOrder,
  updateOrderStatus,
  assignCourier,
  getOrder,
} from "../../src/services/orderService";
import { Order } from "@prisma/client";

jest.mock("../../src/repositories/orderRepository");
jest.mock("../../src/clients/trackingClient");

const mockedRepo = jest.mocked(orderRepository);
const mockedTracking = jest.mocked(trackingClient);

const FAKE_ORDER: Order = {
  id: "order-uuid-1",
  weightKg: 5,
  distanceKm: 10,
  priority: "standard",
  totalPrice: 22.5,
  status: "PENDING",
  courierId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createOrder", () => {
  it("calls repo.createOrder with calculated price", async () => {
    mockedRepo.createOrder.mockResolvedValue(FAKE_ORDER);
    mockedTracking.createTracking.mockResolvedValue(undefined);

    await createOrder({ weightKg: 5, distanceKm: 10, priority: "standard" });

    // 5kg * 0.50 + 10km * 2.00 = 2.50 + 20.00 = 22.50
    expect(mockedRepo.createOrder).toHaveBeenCalledWith({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
      totalPrice: 22.5,
    });
  });

  it("calls trackingClient.createTracking with the new order id", async () => {
    mockedRepo.createOrder.mockResolvedValue(FAKE_ORDER);
    mockedTracking.createTracking.mockResolvedValue(undefined);

    await createOrder({ weightKg: 5, distanceKm: 10, priority: "standard" });

    expect(mockedTracking.createTracking).toHaveBeenCalledWith("order-uuid-1");
  });

  it("calls tracking AFTER repo — not before", async () => {
    const callOrder: string[] = [];
    mockedRepo.createOrder.mockImplementation(async () => {
      callOrder.push("repo");
      return FAKE_ORDER;
    });
    mockedTracking.createTracking.mockImplementation(async () => {
      callOrder.push("tracking");
    });

    await createOrder({ weightKg: 5, distanceKm: 10, priority: "standard" });

    expect(callOrder).toEqual(["repo", "tracking"]);
  });

  it("throws and skips tracking if repo.createOrder fails", async () => {
    mockedRepo.createOrder.mockRejectedValue(new Error("DB down"));

    await expect(
      createOrder({ weightKg: 5, distanceKm: 10, priority: "standard" })
    ).rejects.toThrow("DB down");

    expect(mockedTracking.createTracking).not.toHaveBeenCalled();
  });

  it("throws if trackingClient.createTracking fails", async () => {
    mockedRepo.createOrder.mockResolvedValue(FAKE_ORDER);
    mockedTracking.createTracking.mockRejectedValue(
      new Error("tracking-service unreachable")
    );

    await expect(
      createOrder({ weightKg: 5, distanceKm: 10, priority: "standard" })
    ).rejects.toThrow("tracking-service unreachable");
  });

  it("returns the order from repo", async () => {
    mockedRepo.createOrder.mockResolvedValue(FAKE_ORDER);
    mockedTracking.createTracking.mockResolvedValue(undefined);

    const result = await createOrder({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    expect(result).toBe(FAKE_ORDER);
  });
});

describe("updateOrderStatus", () => {
  it("validates the transition before writing to DB", async () => {
    mockedRepo.findOrderById.mockResolvedValue({
      ...FAKE_ORDER,
      status: "PENDING",
    });

    // PENDING → PICKED_UP is invalid (must go PENDING → ASSIGNED first)
    await expect(
      updateOrderStatus("order-uuid-1", "PICKED_UP")
    ).rejects.toThrow(/Invalid transition/);

    expect(mockedRepo.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("calls repo.updateOrderStatus for a valid transition", async () => {
    mockedRepo.findOrderById.mockResolvedValue({
      ...FAKE_ORDER,
      status: "PENDING",
    });
    mockedRepo.updateOrderStatus.mockResolvedValue({
      ...FAKE_ORDER,
      status: "ASSIGNED",
    });

    await updateOrderStatus("order-uuid-1", "ASSIGNED");

    expect(mockedRepo.updateOrderStatus).toHaveBeenCalledWith(
      "order-uuid-1",
      "ASSIGNED"
    );
  });

  it("throws if order does not exist", async () => {
    mockedRepo.findOrderById.mockResolvedValue(null);

    await expect(
      updateOrderStatus("does-not-exist", "ASSIGNED")
    ).rejects.toThrow("Order not found: does-not-exist");
  });
});

describe("assignCourier", () => {
  it("calls repo.assignCourier with correct args", async () => {
    mockedRepo.findOrderById.mockResolvedValue(FAKE_ORDER);
    mockedRepo.assignCourier.mockResolvedValue({
      ...FAKE_ORDER,
      courierId: "courier-7",
    });

    await assignCourier("order-uuid-1", "courier-7");

    expect(mockedRepo.assignCourier).toHaveBeenCalledWith(
      "order-uuid-1",
      "courier-7"
    );
  });

  it("throws if order does not exist", async () => {
    mockedRepo.findOrderById.mockResolvedValue(null);

    await expect(assignCourier("bad-id", "courier-7")).rejects.toThrow(
      "Order not found: bad-id"
    );
  });
});

describe("getOrder", () => {
  it("returns the order when found", async () => {
    mockedRepo.findOrderById.mockResolvedValue(FAKE_ORDER);

    const result = await getOrder("order-uuid-1");
    expect(result).toBe(FAKE_ORDER);
  });

  it("throws if order does not exist", async () => {
    mockedRepo.findOrderById.mockResolvedValue(null);

    await expect(getOrder("missing")).rejects.toThrow(
      "Order not found: missing"
    );
  });
});
