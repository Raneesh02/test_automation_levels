// CONSUMER CONTRACT TEST — order-service defines what it expects from tracking-service.
//
// This test runs WITHOUT tracking-service running. Pact boots a mock server that
// records every interaction. Those interactions are written to a pact file.
//
// The tracking-service team then takes that pact file and runs provider verification
// (tracking.provider.ts) to prove their service satisfies all consumer expectations.
//
// What this catches: API shape changes that break consumers — renamed fields,
//   missing fields, wrong status codes — before the services are deployed together.
//
// What this misses: real DB behavior, network-level failures, full user flows.

import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import path from "path";
import { createTracking } from "../../src/clients/trackingClient";

const { like } = MatchersV3;

const provider = new PactV3({
  consumer: "order-service",
  provider: "tracking-service",
  // pact file written here — shared with tracking-service team (or via Pact Broker)
  dir: path.resolve(__dirname, "../../../pacts"),
});

describe("trackingClient — Pact consumer", () => {
  it("POST /tracking creates a record and returns id, orderId, status", () => {
    return provider
      .addInteraction({
        states: [{ description: "no existing tracking records" }],
        uponReceiving: "a request to create a tracking record for an order",
        withRequest: {
          method: "POST",
          path: "/tracking",
          headers: { "Content-Type": "application/json" },
          body: { orderId: "order-123" },
        },
        willRespondWith: {
          status: 201,
          // like() = "I care about structure, not exact value"
          // order-service only needs these three fields from the response
          body: {
            id: like("some-uuid"),        // must exist — order-service ignores the value
            orderId: like("order-123"),   // must exist and be a string
            status: like("PENDING"),      // must exist and be a string
          },
        },
      })
      .executeTest(async (mockServer) => {
        // Point trackingClient at Pact's mock server (not the real service)
        process.env.TRACKING_SERVICE_URL = mockServer.url;
        // createTracking makes a real HTTP POST — Pact intercepts and validates shape
        await createTracking("order-123");
      });
  });
});
