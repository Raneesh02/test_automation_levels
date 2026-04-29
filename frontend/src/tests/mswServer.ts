import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/orders", () =>
    HttpResponse.json(
      { id: "order-abc-123", status: "PENDING", totalPrice: 12.5 },
      { status: 201 }
    )
  ),
  http.get("/api/tracking/:orderId", ({ params }) => {
    if (params.orderId === "unknown") {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json([
      { id: "tr-1", orderId: params.orderId, status: "PENDING", createdAt: "2024-01-01T10:00:00Z" },
      { id: "tr-2", orderId: params.orderId, status: "PICKED_UP", createdAt: "2024-01-01T11:00:00Z" },
    ]);
  }),
];

export const server = setupServer(...handlers);
