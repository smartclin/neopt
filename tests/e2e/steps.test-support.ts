import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export async function openAppointments(page: Page) {
  await page.goto("/app/appointments");
  await expect(page.getByRole("heading", { level: 1, name: "Appointments" })).toBeVisible();
}

export async function openNewAppointment(page: Page) {
  await openAppointments(page);
  await page.getByRole("button", { name: "New", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "New Appointment" })).toBeVisible();
  return sheet;
}

export async function firstPatientName(page: Page) {
  await page.goto("/app/patients");
  await expect(page.getByRole("heading", { level: 1, name: "Patients" })).toBeVisible();
  const firstPatient = page.getByRole("table", { name: "Patients" }).getByRole("link").first();
  await expect(firstPatient).toBeVisible();
  return (await firstPatient.innerText()).trim();
}
