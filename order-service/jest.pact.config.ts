import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/pact"],
  testMatch: ["**/*.pact.ts"],
  testTimeout: 30000,
  forceExit: true,
};

export default config;
