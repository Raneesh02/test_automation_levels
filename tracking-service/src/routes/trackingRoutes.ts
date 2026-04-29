import { Router, Request, Response } from "express";
import * as trackingService from "../services/trackingService";

export const trackingRoutes = Router();

trackingRoutes.post("/", async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }
  try {
    const record = await trackingService.createTracking(orderId);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

trackingRoutes.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const history = await trackingService.getHistory(req.params.orderId);
    if (history.length === 0) {
      res.status(404).json({ error: `No tracking found for order: ${req.params.orderId}` });
      return;
    }
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

trackingRoutes.patch("/:orderId/location", async (req: Request, res: Response) => {
  const { status, latitude, longitude } = req.body;
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }
  try {
    const record = await trackingService.updateLocation(
      req.params.orderId,
      status,
      latitude,
      longitude
    );
    res.json(record);
  } catch (err: any) {
    if (err.message.startsWith("No tracking record found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});
