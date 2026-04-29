// UI COMPONENT TESTS — what this level catches:
// - Loading state while fetch is in-flight
// - Order rows rendered from mocked GET /api/orders response
// - Empty state shown when no orders exist
// - Error state shown when fetch fails
//
// API mocked with msw — no real server needed.

import { useState, useEffect } from "react";

interface HistoryOrder {
  id: string;
  status: string;
  priority: string;
  weightKg: number;
  distanceKm: number;
  totalPrice: number;
  courierId: string | null;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        const data: HistoryOrder[] = await res.json();
        setOrders(data);
      })
      .catch(() => setError("Failed to load order history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card history-card">
        <div className="card-header">
          <div className="card-header-icon">📋</div>
          <h1>Order History</h1>
          <p>All past deliveries</p>
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p aria-label="loading">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card history-card">
        <div className="card-header">
          <div className="card-header-icon">📋</div>
          <h1>Order History</h1>
        </div>
        <div className="card-body">
          <div className="alert alert-error">
            <span>⚠️</span>
            <p role="alert">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-label="Order history" className="card history-card">
      <div className="card-header">
        <div className="card-header-icon">📋</div>
        <h1>Order History</h1>
        <p>{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 32px" }}>
            No orders yet. Book your first delivery!
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Weight</th>
                  <th>Distance</th>
                  <th>Price</th>
                  <th>Courier</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} data-testid="order-row">
                    <td data-testid="row-id" className="mono">{o.id}</td>
                    <td><span className="status-badge">🕐 {o.status}</span></td>
                    <td>{o.priority}</td>
                    <td>{o.weightKg} kg</td>
                    <td>{o.distanceKm} km</td>
                    <td className="price-value">₹{o.totalPrice.toFixed(2)}</td>
                    <td>{o.courierId ?? <span className="text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
