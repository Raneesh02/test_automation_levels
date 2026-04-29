// COMPONENT TEST — OrderConfirmation
//
// What this level catches:
//   - Order ID rendered on screen
//   - Status displayed correctly
//   - Price formatted to 2 decimal places
//   - Back button calls onBack
//   - Assign courier calls PATCH and shows success
//   - Assign courier shows error on failure
//
// No API call for display — data comes in as props.
// Assign courier uses fetch — mocked with msw.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import OrderConfirmation from "../../pages/OrderConfirmation";
import { server } from "../mswServer";

const order = { id: "order-abc-123", status: "PENDING", totalPrice: 12.5, courierId: null };

describe("OrderConfirmation", () => {
  it("shows the order ID", () => {
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId("order-id")).toHaveTextContent("order-abc-123");
  });

  it("shows the order status", () => {
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId("order-status")).toHaveTextContent("PENDING");
  });

  it("shows price formatted to 2 decimal places", () => {
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId("order-price")).toHaveTextContent("₹12.50");
  });

  it("calls onTrackOrder when track button clicked", async () => {
    const user = userEvent.setup();
    const onTrackOrder = vi.fn();
    render(<OrderConfirmation order={order} onTrackOrder={onTrackOrder} onBack={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /track my order/i }));
    expect(onTrackOrder).toHaveBeenCalledOnce();
  });

  it("calls onBack when back button clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: /back to home/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("assigns courier and shows success message", async () => {
    const user = userEvent.setup();
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} onBack={vi.fn()} />);

    await user.type(screen.getByLabelText("Courier ID"), "courier-001");
    await user.click(screen.getByRole("button", { name: /assign courier/i }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Courier assigned successfully")
    );
    expect(screen.getByTestId("courier-id")).toHaveTextContent("courier-001");
  });

  it("shows error when assign courier fails", async () => {
    server.use(
      http.patch("/api/orders/:id/courier", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} onBack={vi.fn()} />);

    await user.type(screen.getByLabelText("Courier ID"), "courier-bad");
    await user.click(screen.getByRole("button", { name: /assign courier/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to assign courier");
  });
});
