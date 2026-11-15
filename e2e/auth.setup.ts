import { expect, test as setup } from "@playwright/test";

import { ADMIN, ADMIN_STORAGE_STATE, ROUTES } from "./support/constants";

/**
 * Runs once before the `app` project. Signs in through the real login form
 * (so the flow itself is covered) and persists the Better Auth session cookie
 * to `e2e/.auth/admin.json`.
 */
setup("authenticate as the seeded administrator", async ({ page }) => {
  await page.goto(ROUTES.login);

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.locator("#email").fill(ADMIN.email);
  await page.locator("#password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL("**/app");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Welcome back/i);

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
