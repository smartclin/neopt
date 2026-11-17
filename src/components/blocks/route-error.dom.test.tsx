// src/components/blocks/route-error.dom.test.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { RouteError } from "@/components/blocks/route-error";
import { createTestQueryClient } from "@/lib/test-utils";

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Mounts `ui` as the component of a single `/` route inside a throwaway
 * router. `RouteError` calls `useRouter()`, so it needs router context even
 * though the assertions below are about the rendered surface, not routing.
 */
function renderInRouter(ui: () => React.ReactNode) {
  const rootRoute = createRootRoute({ component: Outlet });
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: ui,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

// A one-route app whose loader fails once, then succeeds.
function renderFailingRoute() {
  const loader = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValue("Loaded");
  const rootRoute = createRootRoute({ component: Outlet });
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    loader,
    component: function Page() {
      return <p>{String(pageRoute.useLoaderData())}</p>;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultErrorComponent: () => <RouteError kind="unknown" title="Something Went Wrong" />,
  });
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { loader };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("RouteError", () => {
  it("shows the failure and re-runs the loader on Try Again", async () => {
    const user = userEvent.setup();
    const { loader } = renderFailingRoute();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Something Went Wrong",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try Again" }));

    expect(await screen.findByText("Loaded")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  describe.each([
    ["network", "Offline"],
    ["permission", "You do not have access to this resource."],
    ["not-found", "This record does not exist."],
    ["unknown", "An unexpected error occurred."],
  ] as const)("kind=%s", (kind, message) => {
    it("renders exactly one alert region", async () => {
      renderInRouter(() => <RouteError kind={kind} message={message} title="Broken" />);

      // Wait for the surface to mount (the heading is inside the alert).
      await screen.findByRole("heading", { level: 1, name: "Broken" });

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent("Broken");
      expect(alerts[0]).toHaveTextContent(message);
    });

    it("renders exactly one retry control", async () => {
      renderInRouter(() => <RouteError kind={kind} message={message} title="Broken" />);

      await screen.findByRole("heading", { level: 1, name: "Broken" });

      expect(screen.getAllByRole("button", { name: "Try Again" })).toHaveLength(1);
    });
  });

  it("uses onRetry instead of router.invalidate when provided", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderInRouter(() => (
      <RouteError kind="unknown" message="x" onRetry={onRetry} title="Broken" />
    ));

    await user.click(await screen.findByRole("button", { name: "Try Again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    // onRetry replaces the default action rather than stacking beside it.
    expect(screen.getAllByRole("button", { name: "Try Again" })).toHaveLength(1);
  });

  it("falls back to router.invalidate when onRetry is omitted", async () => {
    const user = userEvent.setup();
    const router = renderInRouter(() => <RouteError kind="unknown" message="x" title="Broken" />);
    const invalidate = vi.spyOn(router, "invalidate");

    await user.click(await screen.findByRole("button", { name: "Try Again" }));

    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
