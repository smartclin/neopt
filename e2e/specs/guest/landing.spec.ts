import { expect, test } from "@playwright/test";

import { LANDING_HERO, ROUTES } from "../../support/constants";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.landing);
  });

  test("renders the marketing hero for anonymous visitors", async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(LANDING_HERO);
    await expect(page.getByText("Built for pediatric teams")).toBeVisible();
  });

  test("exposes the primary calls to action", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      ROUTES.signup,
    );
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute(
      "href",
      ROUTES.login,
    );
  });

  test("navigates to the sign-up form", async ({ page }) => {
    await page.getByRole("link", { name: "Get started" }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  });

  test("navigates to the sign-in form", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
