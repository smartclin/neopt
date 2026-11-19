import { expect, test } from "@playwright/test";

import { firstPatientName } from "./steps.test-support.ts";

test("keeps the selected patient tab in the route and across reloads", async ({ page }) => {
  await firstPatientName(page);
  const patientLink = page.getByRole("table", { name: "Patients" }).getByRole("link").first();
  await patientLink.click();

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Visits" }).click();
  await expect(page).toHaveURL(/\/app\/patients\/[^/]+\?tab=visits$/);
  await expect(page.getByRole("tab", { name: "Visits" })).toHaveAttribute("aria-selected", "true");

  await page.reload();
  await expect(page.getByRole("tab", { name: "Visits" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Visit history" })).toBeVisible();
});
