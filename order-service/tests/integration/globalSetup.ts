import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  execSync("npx prisma db push --accept-data-loss", {
    cwd: path.resolve(__dirname, "../../"),
    env: { ...process.env, DATABASE_URL: "postgresql://orders_user:orders_pass@localhost:5434/orders_test_db" },
    stdio: "inherit",
  });

  // also sync tracking schema — needed for createOrderFlow.test.ts cross-service test
  execSync("npx prisma db push --accept-data-loss", {
    cwd: path.resolve(__dirname, "../../../tracking-service"),
    env: { ...process.env, DATABASE_URL: "postgresql://tracking_user:tracking_pass@localhost:5435/tracking_test_db" },
    stdio: "inherit",
  });
}
