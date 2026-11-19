import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("redirects an unauthenticated visitor from a protected route to sign in", async ({ page }) => {
  await page.goto("/app/patients");

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await expect(page.getByRole("heading", { level: 2, name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});
