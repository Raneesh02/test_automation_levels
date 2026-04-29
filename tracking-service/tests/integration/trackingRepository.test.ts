// INTEGRATION TEST — Real Postgres, real Prisma queries.
// What this catches: schema mismatches, DB constraint bugs, ordering behavior.
// What this misses: HTTP contracts, service wiring, UI.

process.env.DATABASE_URL =
  "postgresql://tracking_user:tracking_pass@localhost:5435/tracking_test_db";

import prisma from "../../src/lib/prisma";
import { createRecord, getHistoryByOrderId } from "../../src/repositories/trackingRepository";

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => { await prisma.$disconnect(); });
beforeEach(async () => { await prisma.trackingRecord.deleteMany(); });

describe("createRecord", () => {
  it("persists orderId and status to the DB", async () => {
    // ACT — INSERT via Prisma against real test Postgres on :5435
    const record = await createRecord({ orderId: "order-1", status: "PENDING" });

    // ASSERT — row came back with correct fields
    // If schema had wrong column name, Prisma would throw here, not in prod
    expect(record.orderId).toBe("order-1");
    expect(record.status).toBe("PENDING");
    expect(record.id).toBeDefined();
  });
});

describe("getHistoryByOrderId", () => {
  it("returns records sorted oldest first", async () => {
    await createRecord({ orderId: "order-1", status: "PENDING" });
    await new Promise((r) => setTimeout(r, 10));
    await createRecord({ orderId: "order-1", status: "ASSIGNED" });

    const history = await getHistoryByOrderId("order-1");

    expect(history[0].status).toBe("PENDING");
    expect(history[1].status).toBe("ASSIGNED");
  });
});
