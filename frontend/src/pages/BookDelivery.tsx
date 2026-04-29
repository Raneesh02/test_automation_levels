// UI COMPONENT TESTS — what this level catches:
// - Form render (fields visible)
// - Submit disabled when required fields empty
// - Validation errors shown inline (no network call needed)
// - Correct HTTP payload sent on submit
// - Live price estimate shown as user types (client-side, no API call)
//
// What it misses: real API responses, navigation after submit, browser-specific rendering.
// API is mocked with msw — we're testing the component, not the network.

import { useState, type FormEvent } from "react";

export interface Order {
  id: string;
  status: string;
  totalPrice: number;
  courierId?: string | null;
}

type Priority = "standard" | "express" | "overnight";

const RATE_PER_KM = 2.0;
const RATE_PER_KG = 0.5;
const OVERSIZE_THRESHOLD_KG = 20;
const OVERSIZE_SURCHARGE_RATE = 0.15;
const PRIORITY_MULTIPLIERS: Record<Priority, number> = {
  standard: 1.0,
  express: 1.5,
  overnight: 2.0,
};

function estimatePrice(weightKg: number, distanceKm: number, priority: Priority): number {
  const baseRate = distanceKm * RATE_PER_KM;
  const weightSurcharge = weightKg * RATE_PER_KG;
  const subtotal = baseRate + weightSurcharge;
  const oversizeSurcharge = weightKg > OVERSIZE_THRESHOLD_KG ? subtotal * OVERSIZE_SURCHARGE_RATE : 0;
  return Math.round((subtotal + oversizeSurcharge) * PRIORITY_MULTIPLIERS[priority] * 100) / 100;
}

interface Props {
  onOrderCreated: (order: Order) => void;
}

export default function BookDelivery({ onOrderCreated }: Props) {
  const [weightKg, setWeightKg] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [priority, setPriority] = useState<Priority>("standard");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEmpty = !weightKg || !distanceKm;
  const w = Number(weightKg);
  const d = Number(distanceKm);
  const estimate = w > 0 && d > 0 ? estimatePrice(w, d, priority) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const weight = Number(weightKg);
    if (weight <= 0) {
      setError("Weight must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: weight,
          distanceKm: Number(distanceKm),
          priority,
        }),
      });
      const order: Order = await res.json();
      onOrderCreated(order);
    } catch {
      setError("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Book delivery form" className="card">
      <div className="card-header">
        <div className="card-header-icon">📦</div>
        <h1>Book a Delivery</h1>
        <p>Fill in the details to get an instant quote</p>
      </div>

      <div className="card-body">
        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <div className="input-wrapper">
            <span className="input-icon">⚖️</span>
            <input
              id="weight"
              type="number"
              aria-label="Weight (kg)"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 2.5"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="distance">Distance (km)</label>
          <div className="input-wrapper">
            <span className="input-icon">📍</span>
            <input
              id="distance"
              type="number"
              aria-label="Distance (km)"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="e.g. 15"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <div className="input-wrapper">
            <span className="input-icon">🚀</span>
            <select
              aria-label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>
        </div>

        {estimate !== null && (
          <div className="price-estimate" data-testid="price-estimate">
            <span className="estimate-label">Estimated price</span>
            <span className="estimate-value" data-testid="estimate-value">₹{estimate.toFixed(2)}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <p role="alert">{error}</p>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={isEmpty || submitting}>
          {submitting ? (
            <>⏳ Booking...</>
          ) : (
            <>🚚 Book Delivery</>
          )}
        </button>
      </div>
    </form>
  );
}
