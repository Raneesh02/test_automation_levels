import { useState } from "react";
import "./App.css";
import BookDelivery, { type Order } from "./pages/BookDelivery";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackingPage from "./pages/TrackingPage";

type Page = "book" | "confirm" | "track";

export default function App() {
  const [page, setPage] = useState<Page>("book");
  const [order, setOrder] = useState<Order | null>(null);

  return (
    <>
      <header className="app-header">
        <div className="app-header-icon">🚚</div>
        <h2>CourierTrack</h2>
        <p>Delivery Management</p>
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
          />
        )}
        {page === "track" && order && (
          <TrackingPage orderId={order.id} />
        )}
      </main>
    </>
  );
}
