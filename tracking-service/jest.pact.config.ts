import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/pact"],
  testMatch: ["**/*.provider.ts"],
  globalSetup: "<rootDir>/tests/integration/globalSetup.ts",
  testTimeout: 30000,
  forceExit: true,
};

export default config;
