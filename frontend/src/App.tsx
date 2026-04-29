import { useState } from "react";
import "./App.css";
import BookDelivery, { type Order } from "./pages/BookDelivery";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackingPage from "./pages/TrackingPage";
import OrderHistory from "./pages/OrderHistory";

type Page = "book" | "confirm" | "track" | "history";

export default function App() {
  const [page, setPage] = useState<Page>("book");
  const [order, setOrder] = useState<Order | null>(null);

  function goHome() {
    setPage("book");
    setOrder(null);
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-icon">🚚</div>
        <h2>CourierTrack</h2>
        <nav className="app-nav">
          <button
            className={`nav-btn ${page !== "history" ? "active" : ""}`}
            onClick={goHome}
          >
            Book Delivery
          </button>
          <button
            className={`nav-btn ${page === "history" ? "active" : ""}`}
            onClick={() => setPage("history")}
          >
            Order History
          </button>
        </nav>
      </header>

      <main className="app-main">
        {page === "book" && (
          <BookDelivery
            onOrderCreated={(o) => { setOrder(o); setPage("confirm"); }}
          />
        )}
        {page === "confirm" && order && (
          <OrderConfirmation
            order={order}
            onTrackOrder={() => setPage("track")}
            onBack={goHome}
          />
        )}
        {page === "track" && order && (
          <TrackingPage orderId={order.id} onBack={goHome} />
        )}
        {page === "history" && <OrderHistory />}
      </main>
    </>
  );
}
