import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { ThemeProvider } from "#/lib/shadcn/theme.tsx";
import { AppShell } from "@/components/blocks/app-shell-1";
import { NAV_ITEMS } from "@/lib/shadcn/navigation";
import { createTestQueryClient, mockPhoneViewport, openCommandMenu } from "@/lib/test-utils";

// ─── Helpers ────────────────────────────────────────────────────────

const isDark = () => document.documentElement.classList.contains("dark");

/**
 * Render the real `AppShell` inside a minimal router tree.
 *
 * `await router.load()` is load-bearing: TanStack Router 1.170.x stores
 * its initial match set on `router._rendered` and `<Matches>` reads
 * `router._rendered[0]` inside a `useLayoutEffect`. Without an explicit
 * `load()`, the first `useLayoutEffect` runs against `undefined` and
 * throws `TypeError: undefined is not an object (evaluating
 * 'acknowledgement[0]')`. Populating `_rendered` before mounting the
 * provider avoids that.
 */
async function renderAppShell(initialPath = "/") {
  document.documentElement.classList.remove("dark");
  localStorage.clear();

  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
  });

  const pages = NAV_ITEMS.map((item) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: item.to === "/" ? "/" : item.to.slice(1),
      component: () => <h1>{item.label}</h1>,
    }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren(pages),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  return router;
}

/**
 * Assert a callback becomes true, retrying briefly.
 *
 * Bun's `userEvent` does not wrap event dispatch in `act`, so a state
 * update scheduled by a click is still pending when `await user.click()`
 * resolves. Any assertion that depends on an effect having run must be
 * wrapped in `waitFor`. Keeping it behind a named helper keeps the tests
 * readable and makes the "why" discoverable.
 */
function eventually(assertion: () => void | Promise<void>) {
  return waitFor(assertion);
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("AppShell", () => {
  describe("sidebar", () => {
    it("navigates and marks the current page", async () => {
      const user = userEvent.setup();
      const router = await renderAppShell();

      await user.click(await screen.findByRole("link", { name: "Patients" }));

      expect(
        await screen.findByRole("heading", { level: 1, name: "Patients" }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/patients");
      expect(screen.getByRole("link", { name: "Patients" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
    });

    it("switches the theme from the footer", async () => {
      const user = userEvent.setup();
      await renderAppShell();

      await user.click(await screen.findByRole("button", { name: /Dark Mode/ }));

      await eventually(() => expect(isDark()).toBe(true));
      expect(screen.getByRole("button", { name: /Light Mode/ })).toBeInTheDocument();
    });

    it("links a clinical reference in a new tab", async () => {
      await renderAppShell();

      const link = await screen.findByRole("link", {
        name: "WHO Growth Standards",
      });
      expect(link).toHaveAttribute(
        "href",
        "https://www.who.int/tools/child-growth-standards/standards",
      );
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("keeps search on the collapsed rail", async () => {
      const user = userEvent.setup();
      await renderAppShell();

      await user.click(await screen.findByRole("button", { name: "Toggle Sidebar" }));
      await user.click(screen.getByRole("button", { name: "Search" }));

      expect(await screen.findByRole("dialog", {}, { timeout: 5000 })).toBeInTheDocument();
    });

    it("closes the mobile sheet after a page is picked", async () => {
      mockPhoneViewport();
      const user = userEvent.setup();
      await renderAppShell();

      await user.click((await screen.findAllByRole("button", { name: "Toggle Sidebar" }))[0]);
      const sheet = await screen.findByRole("dialog");
      await user.click(within(sheet).getByRole("link", { name: "Patients" }));

      expect(
        await screen.findByRole("heading", { level: 1, name: "Patients" }),
      ).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("command menu", () => {
    it("opens with Ctrl+K and navigates", async () => {
      const user = userEvent.setup();
      const router = await renderAppShell();

      const menu = await openCommandMenu(user);
      await user.click(within(menu).getByText("Patients"));

      expect(
        await screen.findByRole("heading", { level: 1, name: "Patients" }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/patients");
    });

    it("opens with Caps Lock on", async () => {
      const user = userEvent.setup();
      await renderAppShell();
      await screen.findByRole("heading", { level: 1 });

      await user.keyboard("{Control>}K{/Control}");

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("stays open while Ctrl+K is held down", async () => {
      const user = userEvent.setup();
      await renderAppShell();
      await screen.findByRole("heading", { level: 1 });

      await user.keyboard("{Control>}{k>2/}{/Control}");

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("opens from the sidebar search field", async () => {
      const user = userEvent.setup();
      await renderAppShell();

      await user.click(await screen.findByRole("button", { name: /^Search patients.+K$/ }));

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("toggles the theme and closes", async () => {
      const user = userEvent.setup();
      await renderAppShell();

      const menu = await openCommandMenu(user);
      await user.click(within(menu).getByText("Toggle Theme"));

      await eventually(() => expect(isDark()).toBe(true));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("opens a resource in a new tab", async () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const user = userEvent.setup();
      await renderAppShell();

      const menu = await openCommandMenu(user);
      await user.click(within(menu).getByText("WHO Growth Standards"));

      expect(open).toHaveBeenCalledWith(
        "https://www.who.int/tools/child-growth-standards/standards",
        "_blank",
        "noreferrer",
      );
    });

    it("says so when nothing matches", async () => {
      const user = userEvent.setup();
      await renderAppShell();

      const menu = await openCommandMenu(user);
      await user.type(within(menu).getByRole("combobox"), "no-such-page");

      expect(within(menu).getByText("No results found.")).toBeInTheDocument();
    });

    it("opens issue reporting in a new tab", async () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const user = userEvent.setup();
      await renderAppShell();

      const menu = await openCommandMenu(user);
      await user.click(within(menu).getByText("Report An Issue"));

      expect(open).toHaveBeenCalledWith(
        "https://github.com/7ovr/starter/issues/new",
        "_blank",
        "noreferrer",
      );
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
  });
});
