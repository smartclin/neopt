import { expect, test } from "@playwright/test";

import { ROUTES } from "../../support/constants";

test.describe("Password reset", () => {
  test("the request form renders and validates the address", async ({ page }) => {
    await page.goto(ROUTES.forgotPassword);

    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", ROUTES.login);

    await page.locator("#forgot-email").fill("not-an-email");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("a token-less reset link shows the invalid state", async ({ page }) => {
    await page.goto(ROUTES.resetPassword);

    await expect(page.getByRole("heading", { name: "Reset link is invalid" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      ROUTES.forgotPassword,
    );
  });

  test("a reset link with a token shows the new-password form", async ({ page }) => {
    await page.goto(`${ROUTES.resetPassword}?token=e2e-placeholder-token`);

    await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
    await expect(page.locator("#reset-password")).toBeVisible();
    await expect(page.locator("#reset-confirm")).toBeVisible();
  });
});
