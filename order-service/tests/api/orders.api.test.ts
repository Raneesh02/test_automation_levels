// API TEST — HTTP contract validation against a running Express app + real DB.
// What this level catches: broken request/response shape, wrong HTTP status codes,
//   missing validation, contract regressions visible to API consumers.
// What this level misses: internal implementation bugs, DB-level constraint details,
//   UI flows. Those belong in unit/component/integration tests.
//
// ❌ ANTI-PATTERN: Do NOT use API tests to verify business logic.
// Testing that calculatePrice works correctly via POST /orders requires a full
// HTTP server + DB for what is a 2ms unit test. API tests verify the HTTP
// contract — status codes, schemas, validation — nothing else.
//
// trackingClient is mocked so no tracking-service is needed.
// DB is real (test Postgres on :5434).

process.env.DATABASE_URL =
  "postgresql://orders_user:orders_pass@localhost:5434/orders_test_db";

jest.mock("../../src/clients/trackingClient", () => ({
  createTracking: jest.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/lib/prisma";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.order.deleteMany();
});

// ─── POST /orders ────────────────────────────────────────────────────────────

describe("POST /orders", () => {
  it("returns 201 with the created order", async () => {
    // ACT — fire a real HTTP POST through the full Express stack.
    //
    // request(app)
    //   Supertest receives the Express app object and internally calls app.listen(0)
    //   on a random free port. No manual server startup needed. The port is torn
    //   down automatically after the test. This means tests never conflict on ports
    //   even if run in parallel.
    //
    // .post("/orders")
    //   Builds an HTTP POST request to /orders. Supertest resolves the full URL as
    //   http://127.0.0.1:<random-port>/orders and opens a real TCP socket.
    //   Express receives this like any real client request — middleware runs,
    //   body-parser parses JSON, router matches the path.
    //
    // .send({ weightKg: 5, distanceKm: 10, priority: "standard" })
    //   Serialises the object to JSON, sets Content-Type: application/json,
    //   and writes it as the request body. express.json() middleware in app.ts
    //   deserialises it back into req.body on the other side.
    //
    // Full call chain once the request hits the server:
    //   express.json()          → parses body into req.body
    //   orderRoutes (POST /)    → validates weightKg / distanceKm / priority
    //   orderService.createOrder → calls calculatePrice, then repo, then trackingClient
    //   orderRepository.createOrder → executes INSERT via Prisma against real Postgres :5434
    //   trackingClient.createTracking → MOCKED — returns undefined immediately,
    //                                   no network call to tracking-service
    //   orderRoutes             → sends res.status(201).json(order) back
    //
    // await resolves once the full response is received (status + headers + body).
    const res = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    // ASSERT — we are testing the HTTP CONTRACT, not the business logic.
    // 201 = resource was created (not 200). Wrong status code here would break
    // any client that checks for 201 before reading the body.
    expect(res.status).toBe(201);

    // id must exist — the client needs it to poll GET /orders/:id later.
    // We don't assert the exact value because it's a generated UUID.
    expect(res.body.id).toBeDefined();

    // status must be PENDING — the API consumer relies on this as the starting state.
    // If orderService forgot to set it, this catches the contract break immediately.
    expect(res.body.status).toBe("PENDING");

    // totalPrice is computed by calculatePrice inside orderService.
    // 5kg * 0.50 + 10km * 2.00 = 2.50 + 20.00 = 22.50 (standard multiplier = 1.0)
    // We verify the computed value survives the full route → service → DB → response round-trip.
    expect(res.body.totalPrice).toBe(22.5);
  });

  it("returns 400 when weightKg is missing", async () => {
    const res = await request(app).post("/orders").send({
      distanceKm: 10,
      priority: "standard",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when distanceKm is missing", async () => {
    const res = await request(app).post("/orders").send({
      weightKg: 5,
      priority: "standard",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when priority is missing", async () => {
    const res = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when priority is invalid", async () => {
    const res = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "same-day",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when weightKg is zero or negative", async () => {
    const res = await request(app).post("/orders").send({
      weightKg: -1,
      distanceKm: 10,
      priority: "standard",
    });

    expect(res.status).toBe(400);
  });
});

// ─── GET /orders/:id ─────────────────────────────────────────────────────────

describe("GET /orders/:id", () => {
  it("returns 200 with full order schema", async () => {
    const created = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "express",
    });

    const res = await request(app).get(`/orders/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.body.id,
      weightKg: 5,
      distanceKm: 10,
      priority: "express",
      status: "PENDING",
      courierId: null,
    });
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
    expect(res.body.totalPrice).toBeDefined();
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(app).get(
      "/orders/00000000-0000-0000-0000-000000000000"
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ─── GET /orders ─────────────────────────────────────────────────────────────

describe("GET /orders", () => {
  it("returns 200 with array of orders", async () => {
    await request(app).post("/orders").send({ weightKg: 5, distanceKm: 10, priority: "standard" });
    await request(app).post("/orders").send({ weightKg: 8, distanceKm: 20, priority: "express" });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("returns empty array when no orders exist", async () => {
    const res = await request(app).get("/orders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── PATCH /orders/:id/status ────────────────────────────────────────────────

describe("PATCH /orders/:id/status", () => {
  it("returns 200 and updated status for a valid transition", async () => {
    const created = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    const res = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: "ASSIGNED" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ASSIGNED");
  });

  it("returns 400 for an invalid transition", async () => {
    const created = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    // PENDING → PICKED_UP is not a valid transition
    const res = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: "PICKED_UP" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid transition/);
  });

  it("returns 400 when status is missing from body", async () => {
    const created = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    const res = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown order id", async () => {
    const res = await request(app)
      .patch("/orders/00000000-0000-0000-0000-000000000000/status")
      .send({ status: "ASSIGNED" });

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /orders/:id/courier ───────────────────────────────────────────────

describe("PATCH /orders/:id/courier", () => {
  it("returns 200 with courierId set", async () => {
    const created = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    const res = await request(app)
      .patch(`/orders/${created.body.id}/courier`)
      .send({ courierId: "courier-42" });

    expect(res.status).toBe(200);
    expect(res.body.courierId).toBe("courier-42");
  });

  it("returns 400 when courierId is missing", async () => {
    const created = await request(app).post("/orders").send({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    const res = await request(app)
      .patch(`/orders/${created.body.id}/courier`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown order id", async () => {
    const res = await request(app)
      .patch("/orders/00000000-0000-0000-0000-000000000000/courier")
      .send({ courierId: "courier-42" });

    expect(res.status).toBe(404);
  });
});
