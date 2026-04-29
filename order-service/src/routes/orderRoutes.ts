import { Router, Request, Response } from "express";
import * as orderService from "../services/orderService";
import { OrderStatus } from "../domain/orderStateMachine";

export const orderRoutes = Router();

orderRoutes.post("/", async (req: Request, res: Response) => {
  const { weightKg, distanceKm, priority } = req.body;

  if (weightKg == null || distanceKm == null || priority == null) {
    res.status(400).json({ error: "weightKg, distanceKm, and priority are required" });
    return;
  }
  if (typeof weightKg !== "number" || weightKg <= 0) {
    res.status(400).json({ error: "weightKg must be a positive number" });
    return;
  }
  if (typeof distanceKm !== "number" || distanceKm <= 0) {
    res.status(400).json({ error: "distanceKm must be a positive number" });
    return;
  }
  if (!["standard", "express", "overnight"].includes(priority)) {
    res.status(400).json({ error: "priority must be standard, express, or overnight" });
    return;
  }

  try {
    const order = await orderService.createOrder({ weightKg, distanceKm, priority });
    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.get("/", async (_req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json(order);
  } catch (err: any) {
    if (err.message.startsWith("Order not found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.patch("/:id/status", async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  try {
    const order = await orderService.updateOrderStatus(req.params.id, status as OrderStatus);
    res.json(order);
  } catch (err: any) {
    if (err.message.startsWith("Order not found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message.startsWith("Invalid transition")) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.patch("/:id/courier", async (req: Request, res: Response) => {
  const { courierId } = req.body;
  if (!courierId) {
    res.status(400).json({ error: "courierId is required" });
    return;
  }

  try {
    const order = await orderService.assignCourier(req.params.id, courierId);
    res.json(order);
  } catch (err: any) {
    if (err.message.startsWith("Order not found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});
