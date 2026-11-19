import { expect, test } from "@playwright/test";

import { openAppointments, openNewAppointment } from "./steps.test-support.ts";

test("opens and closes the new appointment sheet without saving", async ({ page }) => {
  const sheet = await openNewAppointment(page);

  await expect(sheet.getByLabel("Date & Time")).toHaveAttribute("type", "datetime-local");
  await expect(sheet.getByPlaceholder("Search patient by name or MRN…")).toBeVisible();
  await expect(sheet.getByLabel("Reason (optional)")).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Schedule" })).toBeVisible();

  await sheet.getByRole("button", { name: "Cancel" }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/app\/appointments$/);
});

test("opens the appointment calendar from the schedule", async ({ page }) => {
  await openAppointments(page);
  await page.getByRole("link", { name: "Calendar" }).click();

  await expect(page).toHaveURL(/\/app\/appointments\/calendar$/);
  await expect(page.getByRole("heading", { level: 1, name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Week calendar" })).toBeVisible();
});
