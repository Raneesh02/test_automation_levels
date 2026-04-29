import { TrackingRecord } from "../generated/prisma";
import prisma from "../lib/prisma";

export interface CreateRecordInput {
  orderId: string;
  status: string;
  latitude?: number;
  longitude?: number;
  note?: string;
}

export async function createRecord(
  input: CreateRecordInput
): Promise<TrackingRecord> {
  return prisma.trackingRecord.create({ data: input });
}

export async function getHistoryByOrderId(
  orderId: string
): Promise<TrackingRecord[]> {
  return prisma.trackingRecord.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLatestByOrderId(
  orderId: string
): Promise<TrackingRecord | null> {
  return prisma.trackingRecord.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}
