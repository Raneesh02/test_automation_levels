import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/integration"],
  testMatch: ["**/*.test.ts"],
  globalSetup: "<rootDir>/tests/integration/globalSetup.ts",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // integration tests hit a real DB; createOrderFlow also boots a child process
  testTimeout: 30000,
  forceExit: true,
};

export default config;
