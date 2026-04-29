import { calculatePrice } from "../domain/pricing";
import { transition, OrderStatus } from "../domain/orderStateMachine";
import * as orderRepository from "../repositories/orderRepository";
import * as trackingClient from "../clients/trackingClient";
import { Priority } from "../generated/prisma";

export interface CreateOrderInput {
  weightKg: number;
  distanceKm: number;
  priority: Priority;
}

export async function createOrder(input: CreateOrderInput) {
  const { total } = calculatePrice(
    input.weightKg,
    input.distanceKm,
    input.priority
  );

  const order = await orderRepository.createOrder({
    weightKg: input.weightKg,
    distanceKm: input.distanceKm,
    priority: input.priority,
    totalPrice: total,
  });

  await trackingClient.createTracking(order.id);

  return order;
}

export async function updateOrderStatus(id: string, newStatus: OrderStatus) {
  const order = await orderRepository.findOrderById(id);
  if (!order) throw new Error(`Order not found: ${id}`);

  transition(order.status as OrderStatus, newStatus);

  return orderRepository.updateOrderStatus(id, newStatus);
}

export async function assignCourier(id: string, courierId: string) {
  const order = await orderRepository.findOrderById(id);
  if (!order) throw new Error(`Order not found: ${id}`);

  return orderRepository.assignCourier(id, courierId);
}

export async function getOrder(id: string) {
  const order = await orderRepository.findOrderById(id);
  if (!order) throw new Error(`Order not found: ${id}`);
  return order;
}

export async function getAllOrders() {
  return orderRepository.findAllOrders();
}
