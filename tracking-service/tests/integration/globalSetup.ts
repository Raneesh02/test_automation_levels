import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  const env = {
    ...process.env,
    DATABASE_URL:
      "postgresql://tracking_user:tracking_pass@localhost:5435/tracking_test_db",
  };

  execSync("npx prisma db push --accept-data-loss", {
    cwd: path.resolve(__dirname, "../../"),
    env,
    stdio: "inherit",
  });
}
