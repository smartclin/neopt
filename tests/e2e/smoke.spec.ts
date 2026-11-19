import { expect, test } from "@playwright/test";

test("opens the dashboard and navigates to the main clinic modules", async ({ page }) => {
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: /Welcome back|Clinic Dashboard/ }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sidebar" })).toBeVisible();

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.getByRole("link", { name: "Patients" }).click();
  await expect(page).toHaveURL(/\/app\/patients$/);
  await expect(page.getByRole("heading", { level: 1, name: "Patients" })).toBeVisible();

  await sidebar.getByRole("link", { name: "Appointments" }).click();
  await expect(page).toHaveURL(/\/app\/appointments$/);
  await expect(page.getByRole("heading", { level: 1, name: "Appointments" })).toBeVisible();
});
