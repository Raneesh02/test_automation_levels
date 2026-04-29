import express from "express";
import { trackingRoutes } from "./routes/trackingRoutes";

const app = express();
app.use(express.json());
app.use("/tracking", trackingRoutes);

export default app;
