export type TrackingStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED";

const SPEED_KMH = 30;

const STATUS_DELAY_MINUTES: Record<TrackingStatus, number> = {
  PENDING: 30,
  ASSIGNED: 15,
  PICKED_UP: 5,
  IN_TRANSIT: 0,
  DELIVERED: 0,
};

export function calculateETA(
  distanceKm: number,
  status: TrackingStatus
): number {
  if (status === "DELIVERED") return 0;
  const travelMinutes = (distanceKm / SPEED_KMH) * 60;
  return Math.round(travelMinutes + STATUS_DELAY_MINUTES[status]);
}
