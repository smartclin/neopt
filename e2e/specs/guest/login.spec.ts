import { expect, test } from "@playwright/test";

import { ADMIN, APP_NAME, ROUTES } from "../../support/constants";
import { expectToast } from "../../support/helpers";

test.describe("Sign in", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.login);
  });

  test("renders the branded shell around the form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: APP_NAME })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Sign in to manage your clinic.")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("validates the email and password length client-side", async ({ page }) => {
    await page.locator("#email").fill("not-an-email");
    await page.locator("#password").fill("short");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("reports invalid credentials without leaving the page", async ({ page }) => {
    await page.locator("#email").fill(ADMIN.email);
    await page.locator("#password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expectToast(page, /invalid|password|credential/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("toggles password visibility", async ({ page }) => {
    const password = page.locator("#password");

    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("signs the seeded administrator in and lands on the dashboard", async ({ page }) => {
    await page.locator("#email").fill(ADMIN.email);
    await page.locator("#password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/app");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Welcome back/i);
  });

  test("links out to sign up and password reset", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      ROUTES.forgotPassword,
    );
    await expect(page.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      ROUTES.signup,
    );
  });
});
