import { expect, test } from "@playwright/test";

test("keeps the patient registration form within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/patients/new");

  await expect(page.getByRole("heading", { level: 1, name: "New Patient" })).toBeVisible();
  await expect(page.getByLabel("Child First Name")).toBeVisible();
  await expect(page.getByLabel("Last Name (Family Name)")).toBeVisible();
  await expect(page.getByLabel("Date of Birth")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Patient Record" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
