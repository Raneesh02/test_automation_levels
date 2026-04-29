// API TEST — HTTP contract validation against real Express app + real DB.
// What this catches: wrong status codes, broken response shape, missing validation.
// What this misses: internal logic bugs, DB constraints (integration tests cover those).

process.env.DATABASE_URL =
  "postgresql://tracking_user:tracking_pass@localhost:5435/tracking_test_db";

import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/lib/prisma";

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => { await prisma.$disconnect(); });
beforeEach(async () => { await prisma.trackingRecord.deleteMany(); });

describe("POST /tracking", () => {
  it("returns 201 with the created tracking record", async () => {
    const res = await request(app).post("/tracking").send({ orderId: "order-abc" });

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBe("order-abc");
    expect(res.body.status).toBe("PENDING");
    expect(res.body.id).toBeDefined();
  });
});

describe("GET /tracking/:orderId", () => {
  it("returns 200 with history array when records exist", async () => {
    await request(app).post("/tracking").send({ orderId: "order-abc" });

    const res = await request(app).get("/tracking/order-abc");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].orderId).toBe("order-abc");
  });

  it("returns 404 when no records exist for orderId", async () => {
    const res = await request(app).get("/tracking/unknown-order");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
