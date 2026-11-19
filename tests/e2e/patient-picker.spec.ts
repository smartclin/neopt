import { expect, test } from "@playwright/test";

import { firstPatientName, openNewAppointment } from "./steps.test-support.ts";

test("finds and selects a patient in the appointment sheet", async ({ page }) => {
  const patientName = await firstPatientName(page);
  const sheet = await openNewAppointment(page);
  const search = sheet.getByPlaceholder("Search patient by name or MRN…");

  await search.fill(patientName);
  const result = sheet.getByRole("option", { name: new RegExp(patientName) });
  await expect(result).toBeVisible();
  await result.click();

  await expect(sheet.getByText(patientName, { exact: true })).toBeVisible();
  await expect(search).toHaveValue(patientName);
});
