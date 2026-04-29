// UI COMPONENT TESTS — what this level catches:
// - Loading state shown while fetch is in-flight
// - Status timeline rendered from API response
// - Error state shown when order not found (404)
//
// API is mocked with msw — tests run without any real server.
// This level cannot catch: wrong API URL, real network failures, cross-page nav.

import { useState, useEffect } from "react";

interface TrackingRecord {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
}

interface Props {
  orderId: string;
}

export default function TrackingPage({ orderId }: Props) {
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tracking/${orderId}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(`No tracking found for order: ${orderId}`);
          return;
        }
        const data: TrackingRecord[] = await res.json();
        setRecords(data);
      })
      .catch(() => setError("Failed to load tracking"))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="card tracking-card">
        <div className="card-header">
          <div className="card-header-icon">📍</div>
          <h1>Live Tracking</h1>
          <div className="tracking-id">{orderId}</div>
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p aria-label="loading">Loading tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card tracking-card">
        <div className="card-header">
          <div className="card-header-icon">📍</div>
          <h1>Live Tracking</h1>
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
    <div aria-label="Tracking timeline" className="card tracking-card">
      <div className="card-header">
        <div className="card-header-icon">📍</div>
        <h1>Live Tracking</h1>
        <div className="tracking-id">{orderId}</div>
      </div>

      <div className="card-body">
        {records.length === 0 ? (
          <div className="empty-state">No tracking updates yet</div>
        ) : (
          <ul className="timeline" style={{ listStyle: "none", padding: 0 }}>
            {records.map((r) => (
              <li key={r.id} data-testid="tracking-record" className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-status" data-testid="tracking-status">{r.status}</div>
                <div className="timeline-time">{new Date(r.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
