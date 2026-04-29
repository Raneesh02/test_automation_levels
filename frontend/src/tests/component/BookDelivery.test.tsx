// COMPONENT TEST — BookDelivery form
//
// What this level catches:
//   - Form fields render correctly
//   - Submit button disabled when required fields are empty
//   - Inline validation error shown before any network call
//   - Correct JSON payload sent to POST /api/orders
//
// What it misses: page navigation after submit, real API latency, browser autofill behaviour.
//
// ❌ ANTI-PATTERN: Do NOT test this via E2E (Playwright).
//    A "weight required" error is a 3-line validation rule.
//    E2E = full browser + backend stack for a <100ms test.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import BookDelivery from "../../pages/BookDelivery";
import { server } from "../mswServer";

describe("BookDelivery", () => {
  it("renders all form fields", () => {
    render(<BookDelivery onOrderCreated={vi.fn()} />);
    expect(screen.getByLabelText("Weight (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText("Distance (km)")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
  });

  it("submit button is disabled when fields are empty", () => {
    render(<BookDelivery onOrderCreated={vi.fn()} />);
    expect(screen.getByRole("button", { name: /book delivery/i })).toBeDisabled();
  });

  it("shows validation error when weight is 0", async () => {
    const user = userEvent.setup();
    render(<BookDelivery onOrderCreated={vi.fn()} />);

    await user.type(screen.getByLabelText("Weight (kg)"), "0");
    await user.type(screen.getByLabelText("Distance (km)"), "10");
    await user.click(screen.getByRole("button", { name: /book delivery/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Weight must be greater than 0");
  });

  it("calls POST /api/orders with correct payload and invokes onOrderCreated", async () => {
    const user = userEvent.setup();
    let capturedBody: unknown;

    server.use(
      http.post("/api/orders", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { id: "order-abc-123", status: "PENDING", totalPrice: 12.5 },
          { status: 201 }
        );
      })
    );

    const onOrderCreated = vi.fn();
    render(<BookDelivery onOrderCreated={onOrderCreated} />);

    await user.type(screen.getByLabelText("Weight (kg)"), "5");
    await user.type(screen.getByLabelText("Distance (km)"), "10");
    await user.click(screen.getByRole("button", { name: /book delivery/i }));

    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledOnce());

    expect(capturedBody).toEqual({ weightKg: 5, distanceKm: 10, priority: "standard" });
    expect(onOrderCreated).toHaveBeenCalledWith({
      id: "order-abc-123",
      status: "PENDING",
      totalPrice: 12.5,
    });
  });
});
