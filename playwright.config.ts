import { defineConfig, devices } from "@playwright/test";

import { e2e } from "./tests/e2e/environment.ts";

const usesExternalServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: e2e.origin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "app",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: e2e.storageStatePath,
      },
    },
  ],
  ...(usesExternalServer
    ? {}
    : {
        webServer: {
          command: `bunx --bun vp dev --host 127.0.0.1 --port ${e2e.port}`,
          url: e2e.origin,
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: "pipe" as const,
          stderr: "pipe" as const,
          env: {
            PORT: String(e2e.port),
            DB_FILE_NAME: e2e.databaseFile,
            BETTER_AUTH_URL: e2e.origin,
            SERVER_URL: e2e.origin,
            VITE_BASE_URL: e2e.origin,
          },
        },
      }),
});
