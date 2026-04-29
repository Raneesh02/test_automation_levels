// COMPONENT TEST — OrderHistory
//
// What this level catches:
//   - Loading state shown while fetch is in-flight
//   - Order rows rendered from mocked GET /api/orders response
//   - Empty state shown when no orders exist
//   - Error state shown when fetch fails
//
// msw intercepts fetch() — no real server needed.
// Each state tested directly without browser or real DB.

import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import OrderHistory from "../../pages/OrderHistory";
import { server } from "../mswServer";

describe("OrderHistory", () => {
  it("shows loading state initially", () => {
    render(<OrderHistory />);
    expect(screen.getByLabelText("loading")).toBeInTheDocument();
  });

  it("renders order rows after data loads", async () => {
    render(<OrderHistory />);

    await waitFor(() =>
      expect(screen.queryByLabelText("loading")).not.toBeInTheDocument()
    );

    const rows = screen.getAllByTestId("order-row");
    expect(rows).toHaveLength(2);
    expect(screen.getAllByTestId("row-id")[0]).toHaveTextContent("order-abc-123");
    expect(screen.getAllByTestId("row-id")[1]).toHaveTextContent("order-def-456");
  });

  it("shows empty state when no orders", async () => {
    server.use(
      http.get("/api/orders", () => HttpResponse.json([]))
    );

    render(<OrderHistory />);

    const empty = await screen.findByText(/no orders yet/i);
    expect(empty).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    server.use(
      http.get("/api/orders", () => HttpResponse.error())
    );

    render(<OrderHistory />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to load order history");
  });
});
