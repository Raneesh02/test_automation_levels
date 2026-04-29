// CROSS-SERVICE INTEGRATION TEST — order-service → tracking-service over real HTTP.
//
// What this catches: the HTTP contract between the two services.
//   If trackingClient sends the wrong payload, or the URL changes, or tracking-service
//   rejects the request — this test fails while every unit/component/API test still passes,
//   because those tests mock trackingClient.
//
// What this misses: UI flows, browser rendering, end-to-end user journeys.
//
// How it works:
//   1. tracking-service boots as a child process (its own env, its own DB connection)
//   2. order-service's createOrder() runs with NO mocks — real HTTP to the child process
//   3. We verify the order in orders DB (Prisma) and the tracking record via HTTP GET

process.env.DATABASE_URL =
  "postgresql://orders_user:orders_pass@localhost:5434/orders_test_db";

import { spawn, ChildProcess } from "child_process";
import path from "path";
import axios from "axios";
import prisma from "../../src/lib/prisma";
import { createOrder } from "../../src/services/orderService";

const TRACKING_PORT = 3099;
const TRACKING_URL = `http://localhost:${TRACKING_PORT}`;
let trackingServer: ChildProcess;

// Poll until tracking-service responds to any HTTP request.
// An HTTP response (even 4xx) means the server is up and routing requests.
async function waitForReady(maxMs = 20000): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      await axios.post(`${TRACKING_URL}/tracking`, { orderId: "__probe__" });
      return;
    } catch (err: any) {
      if (err.response) return; // got a response = server is listening
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`tracking-service did not start within ${maxMs}ms`);
}

beforeAll(async () => {
  // Resolve ts-node/register from the current node_modules tree so the child
  // process can execute TypeScript source without a separate compile step.
  const tsnodeRegister = require.resolve("ts-node/register");

  trackingServer = spawn(
    "node",
    ["-r", tsnodeRegister, "src/server.ts"],
    {
      cwd: path.resolve(__dirname, "../../../tracking-service"),
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://tracking_user:tracking_pass@localhost:5435/tracking_test_db",
        PORT: String(TRACKING_PORT),
        TS_NODE_PROJECT: path.resolve(
          __dirname,
          "../../../tracking-service/tsconfig.json"
        ),
        // suppress ts-node type-checking for faster startup
        TS_NODE_TRANSPILE_ONLY: "true",
      },
      stdio: "pipe", // silence child process output during tests
    }
  );

  // Expose the child process's URL to trackingClient (read at request time)
  process.env.TRACKING_SERVICE_URL = TRACKING_URL;

  await waitForReady();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
  trackingServer.kill();
});

beforeEach(async () => {
  await prisma.order.deleteMany();
});

describe("createOrder — cross-service flow", () => {
  it("persists order to orders DB and creates tracking record in tracking-service", async () => {
    // ACT — real service layer, real HTTP to real tracking-service child process.
    // trackingClient is NOT mocked here. If the HTTP call fails, createOrder throws.
    const order = await createOrder({
      weightKg: 5,
      distanceKm: 10,
      priority: "standard",
    });

    // ASSERT orders DB — order was saved by order-service
    expect(order.id).toBeDefined();
    expect(order.status).toBe("PENDING");
    expect(order.totalPrice).toBeGreaterThan(0);

    // ASSERT tracking-service — tracking record was created via the real HTTP call.
    // We verify through tracking-service's own HTTP API (black-box check).
    // This confirms: correct orderId forwarded, tracking-service accepted the payload,
    // and wrote a record to its own DB.
    const trackingRes = await axios.get(`${TRACKING_URL}/tracking/${order.id}`);
    expect(trackingRes.status).toBe(200);
    expect(trackingRes.data[0].orderId).toBe(order.id);
    expect(trackingRes.data[0].status).toBe("PENDING");
  });
});
