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
  testTimeout: 15000,
  forceExit: true,
};

export default config;
