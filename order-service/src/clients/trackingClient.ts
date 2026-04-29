import axios from "axios";

export async function createTracking(orderId: string): Promise<void> {
  const url = process.env.TRACKING_SERVICE_URL ?? "http://localhost:3002";
  await axios.post(`${url}/tracking`, { orderId });
}
