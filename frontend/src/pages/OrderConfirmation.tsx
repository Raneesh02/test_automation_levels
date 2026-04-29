// UI COMPONENT TESTS — what this level catches:
// - Order ID rendered correctly
// - Status displayed
// - Price formatted
//
// No API call here — order data passed as prop (already fetched by BookDelivery).
// Tests verify render logic only, not data fetching.

import type { Order } from "./BookDelivery";

interface Props {
  order: Order;
  onTrackOrder: () => void;
}

export default function OrderConfirmation({ order, onTrackOrder }: Props) {
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
        </div>

        <button className="btn btn-primary" onClick={onTrackOrder}>
          📍 Track my order
        </button>
      </div>
    </div>
  );
}
