import { expect, type Page } from "@playwright/test";

/**
 * Small assertion helpers shared by every spec.
 *
 * The app runs in TanStack Start **SPA mode**: the server ships an empty shell
 * and the real UI mounts client-side. Every helper therefore waits for the
 * rendered DOM instead of the initial response.
 */

/** Assert the rendered page's `<h1>` matches `name`. */
export async function expectPageHeading(page: Page, name: string | RegExp) {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

/** The toast region rendered through the Base UI portal. */
export function toastRegion(page: Page) {
  return page.locator('[data-slot="toast"]');
}

/**
 * Assert a toast whose visible text matches `text` appears.
 *
 * Toasts are announced through `data-slot="toast"` / `toast-description`; the
 * title slot is optional, so match on the whole toast node.
 */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(toastRegion(page).filter({ hasText: text }).first()).toBeVisible();
}

/** Open a route and wait for the document to be interactive. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
}

/** True when the current viewport is narrower than the `md` breakpoint. */
export function isNarrowViewport(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 768;
}
