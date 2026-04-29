// COMPONENT TEST — TrackingPage
//
// What this level catches:
//   - Loading state shown while fetch is in-flight
//   - Status timeline rendered from mocked API response
//   - Error message shown when tracking not found (404)
//
// msw intercepts fetch() in jsdom — no real network, no real server.
// Tests are deterministic and run in <100ms.
//
// ❌ ANTI-PATTERN: Do NOT test loading/error states via E2E.
//    Playwright would need artificial delays (cy.intercept / route) to test loading state.
//    Component test controls the mock directly — instant and reliable.

import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import TrackingPage from "../../pages/TrackingPage";
import { server } from "../mswServer";

describe("TrackingPage", () => {
  it("shows loading state initially", () => {
    render(<TrackingPage orderId="order-abc-123" />);
    expect(screen.getByLabelText("loading")).toBeInTheDocument();
  });

  it("renders status timeline after data loads", async () => {
    render(<TrackingPage orderId="order-abc-123" />);

    await waitFor(() =>
      expect(screen.queryByLabelText("loading")).not.toBeInTheDocument()
    );

    const records = screen.getAllByTestId("tracking-record");
    expect(records).toHaveLength(2);
    expect(screen.getAllByTestId("tracking-status")[0]).toHaveTextContent("PENDING");
    expect(screen.getAllByTestId("tracking-status")[1]).toHaveTextContent("PICKED_UP");
  });

  it("shows error when order not found", async () => {
    server.use(
      http.get("/api/tracking/:orderId", () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 })
      )
    );

    render(<TrackingPage orderId="unknown" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No tracking found for order: unknown");
  });
});
