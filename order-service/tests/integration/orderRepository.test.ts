// INTEGRATION TEST — Real Postgres, real Prisma queries.
// What this level catches: DB constraint violations, Prisma query bugs,
//   schema mismatches, default value behavior, ordering.
// What this level misses: HTTP contract bugs, UI regressions,
//   cross-service wiring (that's in createOrderFlow.test.ts).
//
// ❌ ANTI-PATTERN: Do NOT mock the DB in these tests.
// Mocking Prisma means you're testing that your mock works, not that
// your schema + queries work. Real DB catches things like:
//   - missing column that TypeScript didn't catch (generated types can lag)
//   - wrong default value in schema
//   - ordering bug in findAll
// Use component tests (orderService.test.ts) for mocked-dep wiring tests.

process.env.DATABASE_URL =
  "postgresql://orders_user:orders_pass@localhost:5434/orders_test_db";

import prisma from "../../src/lib/prisma";
import {
  createOrder,
  findOrderById,
  updateOrderStatus,
  assignCourier,
  findAllOrders,
} from "../../src/repositories/orderRepository";

const BASE_ORDER = {
  weightKg: 5,
  distanceKm: 10,
  priority: "standard" as const,
  totalPrice: 22.5,
};

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.order.deleteMany();
});

describe("createOrder", () => {
  it("persists all provided fields", async () => {
    // ACT — call the repository function directly (no HTTP, no service layer).
    // This executes: INSERT INTO orders (...) VALUES (...) RETURNING *
    // against the real test Postgres on :5434.
    // BASE_ORDER = { weightKg: 5, distanceKm: 10, priority: "standard", totalPrice: 22.5 }
    const order = await createOrder(BASE_ORDER);

    // ASSERT — Prisma returns the full persisted row immediately after INSERT.
    // We check each field individually so a failure tells us exactly which
    // column was wrong (e.g. weightKg stored as string instead of float).
    //
    // If the Prisma schema had a typo (e.g. "weight_kg" vs "weightKg"),
    // the query would throw here — caught at this level, not in production.
    expect(order.weightKg).toBe(5);       // stored as DECIMAL, returned as JS number
    expect(order.distanceKm).toBe(10);    // same — numeric precision check
    expect(order.priority).toBe("standard"); // stored as enum, returned as string
    expect(order.totalPrice).toBe(22.5);  // DECIMAL(10,2) — floating point safe here
  });

  it("assigns a uuid as id", async () => {
    const order = await createOrder(BASE_ORDER);
    expect(order.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("defaults status to PENDING", async () => {
    const order = await createOrder(BASE_ORDER);
    expect(order.status).toBe("PENDING");
  });

  it("defaults courierId to null", async () => {
    const order = await createOrder(BASE_ORDER);
    expect(order.courierId).toBeNull();
  });

  it("sets courierId when provided", async () => {
    const order = await createOrder({ ...BASE_ORDER, courierId: "courier-99" });
    expect(order.courierId).toBe("courier-99");
  });

  it("sets createdAt and updatedAt timestamps", async () => {
    const before = new Date();
    const order = await createOrder(BASE_ORDER);
    const after = new Date();

    expect(order.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(order.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(order.updatedAt).toBeDefined();
  });
});

describe("findOrderById", () => {
  it("returns the order when it exists", async () => {
    const created = await createOrder(BASE_ORDER);
    const found = await findOrderById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.totalPrice).toBe(22.5);
  });

  it("returns null for an unknown id", async () => {
    const found = await findOrderById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });
});

describe("updateOrderStatus", () => {
  it("updates status in the DB", async () => {
    const order = await createOrder(BASE_ORDER);
    const updated = await updateOrderStatus(order.id, "ASSIGNED");

    expect(updated.status).toBe("ASSIGNED");
  });

  it("updates updatedAt on status change", async () => {
    const order = await createOrder(BASE_ORDER);
    await new Promise((r) => setTimeout(r, 10));
    const updated = await updateOrderStatus(order.id, "ASSIGNED");

    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      order.updatedAt.getTime()
    );
  });

  it("persists the status change — findById reflects new status", async () => {
    const order = await createOrder(BASE_ORDER);
    await updateOrderStatus(order.id, "ASSIGNED");
    const fetched = await findOrderById(order.id);

    expect(fetched!.status).toBe("ASSIGNED");
  });
});

describe("assignCourier", () => {
  it("sets courierId on the order", async () => {
    const order = await createOrder(BASE_ORDER);
    const updated = await assignCourier(order.id, "courier-42");

    expect(updated.courierId).toBe("courier-42");
  });
});

describe("findAllOrders", () => {
  it("returns all orders", async () => {
    await createOrder(BASE_ORDER);
    await createOrder({ ...BASE_ORDER, weightKg: 10 });

    const orders = await findAllOrders();
    expect(orders).toHaveLength(2);
  });

  it("returns empty array when no orders exist", async () => {
    const orders = await findAllOrders();
    expect(orders).toHaveLength(0);
  });

  it("returns orders sorted by createdAt descending (newest first)", async () => {
    const first = await createOrder(BASE_ORDER);
    await new Promise((r) => setTimeout(r, 10));
    const second = await createOrder({ ...BASE_ORDER, weightKg: 10 });

    const orders = await findAllOrders();
    expect(orders[0].id).toBe(second.id);
    expect(orders[1].id).toBe(first.id);
  });
});
