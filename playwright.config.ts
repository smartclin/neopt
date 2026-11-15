import { defineConfig, devices } from "@playwright/test";

import { ADMIN_STORAGE_STATE } from "./e2e/support/constants";

/**
 * Base URL of the app under test. Matches `BETTER_AUTH_URL` / `VITE_BASE_URL`
 * in `.env`. Override with `E2E_BASE_URL` when running against a deployment.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * The suite is split into four projects:
 *
 *  - `setup` — signs in once as the seeded admin and writes
 *    `e2e/.auth/admin.json`. No test project asserts anything by itself.
 *  - `guest` — the signed-out marketing / auth pages (`/`, `/login`, …).
 *  - `guard` — proves the `_auth` layout bounces anonymous visitors to /login.
 *  - `app`   — the clinical modules, reusing the storage state from `setup`.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "guest",
      testMatch: "**/specs/guest/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "guard",
      testMatch: "**/specs/auth/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "app",
      testMatch: "**/specs/app/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ADMIN_STORAGE_STATE,
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "bun run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
