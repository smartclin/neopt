import { expect, test } from "@playwright/test";

import { ROUTES } from "../../support/constants";

test.describe("Sign up", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.signup);
  });

  test("renders the registration form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.locator("#signup-name")).toBeVisible();
    await expect(page.locator("#signup-email")).toBeVisible();
    await expect(page.locator("#signup-password")).toBeVisible();
    await expect(page.locator("#signup-confirm")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("requires a name, a valid email and an 8 character password", async ({ page }) => {
    await page.locator("#signup-email").fill("nope");
    await page.locator("#signup-password").fill("abc");
    await page.locator("#signup-confirm").fill("abc");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("flags mismatched password confirmation", async ({ page }) => {
    await page.locator("#signup-name").fill("Test Clinician");
    await page.locator("#signup-email").fill("test.clinician@example.com");
    await page.locator("#signup-password").fill("supersecret1");
    await page.locator("#signup-confirm").fill("supersecret2");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("links back to the sign-in form", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", ROUTES.login);
  });
});
