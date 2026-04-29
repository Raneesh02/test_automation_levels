// COMPONENT TEST — OrderConfirmation
//
// What this level catches:
//   - Order ID rendered on screen
//   - Status displayed correctly
//   - Price formatted to 2 decimal places
//
// No API call in this component — data comes in as props.
// Tests are pure render assertions: no msw needed.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import OrderConfirmation from "../../pages/OrderConfirmation";

const order = { id: "order-abc-123", status: "PENDING", totalPrice: 12.5 };

describe("OrderConfirmation", () => {
  it("shows the order ID", () => {
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} />);
    expect(screen.getByTestId("order-id")).toHaveTextContent("order-abc-123");
  });

  it("shows the order status", () => {
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} />);
    expect(screen.getByTestId("order-status")).toHaveTextContent("PENDING");
  });

  it("shows price formatted to 2 decimal places", () => {
    render(<OrderConfirmation order={order} onTrackOrder={vi.fn()} />);
    expect(screen.getByTestId("order-price")).toHaveTextContent("£12.50");
  });

  it("calls onTrackOrder when track button clicked", async () => {
    const user = userEvent.setup();
    const onTrackOrder = vi.fn();
    render(<OrderConfirmation order={order} onTrackOrder={onTrackOrder} />);

    await user.click(screen.getByRole("button", { name: /track my order/i }));
    expect(onTrackOrder).toHaveBeenCalledOnce();
  });
});
