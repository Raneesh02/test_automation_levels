export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function transition(from: OrderStatus, to: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid transition: ${from} → ${to}. Allowed: [${allowed.join(", ") || "none"}]`
    );
  }
}

export function isTerminal(status: OrderStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

export function getAllowedTransitions(status: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[status];
}
