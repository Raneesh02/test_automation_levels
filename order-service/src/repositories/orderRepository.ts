import { Order, Priority, OrderStatus } from "../generated/prisma";
import prisma from "../lib/prisma";

export interface CreateOrderInput {
  weightKg: number;
  distanceKm: number;
  priority: Priority;
  totalPrice: number;
  courierId?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  return prisma.order.create({ data: input });
}

export async function findOrderById(id: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { id } });
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  return prisma.order.update({ where: { id }, data: { status } });
}

export async function assignCourier(
  id: string,
  courierId: string
): Promise<Order> {
  return prisma.order.update({ where: { id }, data: { courierId } });
}

export async function findAllOrders(): Promise<Order[]> {
  return prisma.order.findMany({ orderBy: { createdAt: "desc" } });
}
