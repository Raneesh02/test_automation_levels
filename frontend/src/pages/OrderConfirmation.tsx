// UI COMPONENT TESTS — what this level catches:
// - Order ID rendered correctly
// - Status displayed
// - Price formatted
// - Back button calls onBack
// - Assign courier calls PATCH /api/orders/:id/courier
// - Success/error feedback shown after assignment
//
// No API call for display — order data passed as prop.
// Assign courier uses fetch — mocked with msw in tests.

import { useState } from "react";
import type { Order } from "./BookDelivery";

interface Props {
  order: Order;
  onTrackOrder: () => void;
  onBack: () => void;
}

export default function OrderConfirmation({ order, onTrackOrder, onBack }: Props) {
  const [courierId, setCourierId] = useState("");
  const [assignState, setAssignState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [assignedCourierId, setAssignedCourierId] = useState(order.courierId ?? null);

  async function handleAssignCourier() {
    const id = courierId.trim();
    if (!id) return;
    setAssignState("loading");
    try {
      const res = await fetch(`/api/orders/${order.id}/courier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: Order = await res.json();
      setAssignedCourierId(updated.courierId ?? id);
      setAssignState("success");
      setCourierId("");
    } catch {
      setAssignState("error");
    }
  }

  return (
    <div aria-label="Order confirmation" className="card confirmation-card">
      <div className="card-header">
        <div className="confirmation-badge">✅</div>
        <h1>Order Confirmed!</h1>
        <p>Your delivery has been booked successfully</p>
      </div>

      <div className="card-body">
        <div className="order-details">
          <div className="order-detail-row">
            <span className="detail-label">Order ID</span>
            <span className="detail-value" data-testid="order-id">{order.id}</span>
          </div>
          <div className="order-detail-row">
            <span className="detail-label">Status</span>
            <span className="status-badge" data-testid="order-status">
              🕐 {order.status}
            </span>
          </div>
          <div className="order-detail-row">
            <span className="detail-label">Total Price</span>
            <span className="detail-value price-value" data-testid="order-price">
              ₹{order.totalPrice.toFixed(2)}
            </span>
          </div>
          {assignedCourierId && (
            <div className="order-detail-row">
              <span className="detail-label">Courier</span>
              <span className="detail-value" data-testid="courier-id">{assignedCourierId}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="courierId">Assign Courier</label>
          <div className="input-wrapper">
            <span className="input-icon">🚴</span>
            <input
              id="courierId"
              type="text"
              aria-label="Courier ID"
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              placeholder="e.g. courier-001"
            />
          </div>
        </div>

        {assignState === "success" && (
          <div className="alert alert-success" role="status" data-testid="assign-success">
            <span>✅</span>
            <p>Courier assigned successfully</p>
          </div>
        )}
        {assignState === "error" && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <p role="alert">Failed to assign courier</p>
          </div>
        )}

        <div className="btn-stack">
          <button
            className="btn btn-secondary"
            onClick={handleAssignCourier}
            disabled={!courierId.trim() || assignState === "loading"}
            aria-label="Assign courier"
          >
            {assignState === "loading" ? "⏳ Assigning..." : "🚴 Assign Courier"}
          </button>
          <button className="btn btn-primary" onClick={onTrackOrder}>
            📍 Track my order
          </button>
          <button className="btn btn-ghost" onClick={onBack} aria-label="Back to home">
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
