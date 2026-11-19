import { expect, test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { storageStatePath } from "./world.test-support.ts";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

setup("sign in with the configured e2e account", async ({ page }) => {
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD to a seeded app account before running e2e.");
  }

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/app(?:\/|$)/);
  await expect(page.getByRole("navigation", { name: "Sidebar" })).toBeVisible();

  mkdirSync(dirname(storageStatePath), { recursive: true });
  await page.context().storageState({ path: storageStatePath });
});
