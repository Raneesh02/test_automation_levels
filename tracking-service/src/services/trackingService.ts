import * as trackingRepository from "../repositories/trackingRepository";
import { TrackingRecord } from "../generated/prisma";

export async function createTracking(orderId: string): Promise<TrackingRecord> {
  return trackingRepository.createRecord({ orderId, status: "PENDING" });
}

export async function updateLocation(
  orderId: string,
  status: string,
  latitude?: number,
  longitude?: number
): Promise<TrackingRecord> {
  const existing = await trackingRepository.getLatestByOrderId(orderId);
  if (!existing) throw new Error(`No tracking record found for order: ${orderId}`);

  return trackingRepository.createRecord({ orderId, status, latitude, longitude });
}

export async function getHistory(orderId: string): Promise<TrackingRecord[]> {
  return trackingRepository.getHistoryByOrderId(orderId);
}
