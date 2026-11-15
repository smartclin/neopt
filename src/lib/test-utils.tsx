import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { vi } from "vite-plus/test";

import { ThemeProvider } from "./shadcn/theme";

export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const testUser = {
    id: "u_test",
    name: "Dr. Hazem Ali",
    email: "drhazem@example.com",
    role: "admin" as const,
    clinicId: "c_test",
  };
  client.setQueryData(["auth"], testUser);
  client.setQueryData(["auth", "user"], {
    user: testUser,
    session: { id: "s_test", userId: "u_test", clinicId: "c_test" },
  });
  return client;
}

// Renders the real route tree at a path, the way the app boots in index.tsx.
export async function renderRoute(initialPath = "/app") {
  const queryClient = createTestQueryClient();
  const { getRouter } = await import("@/router");
  const router = getRouter();

  // Point the router at the requested path before loading.
  router.history.push(initialPath);
  try {
    await router.load();
  } catch {
    // ignore redirects or offline loaders
  }

  const view = render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );

  return { ...view, router, queryClient };
}

// A table's rows without its header row.
export const bodyRows = (table: HTMLElement) => within(table).getAllByRole("row").slice(1);

function hasLegacyMediaQueryListMethods(value: object): value is MediaQueryList {
  return "addListener" in value && "removeListener" in value;
}

// Makes every max-width media query match, so the app lays out as on a phone.
export function mockPhoneViewport() {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const list: Pick<
      MediaQueryList,
      | "matches"
      | "media"
      | "onchange"
      | "addEventListener"
      | "removeEventListener"
      | "dispatchEvent"
    > = {
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };

    Object.defineProperties(list, {
      addListener: { value: () => {} },
      removeListener: { value: () => {} },
    });

    if (!hasLegacyMediaQueryListMethods(list)) {
      throw new Error("Failed to construct MediaQueryList mock");
    }

    return list;
  });
}

export async function openCommandMenu(user: UserEvent) {
  await screen.findByRole("heading", { level: 1 });
  await user.keyboard("{Control>}k{/Control}");
  return await screen.findByRole("dialog", {}, { timeout: 5000 });
}

export async function openIssueDialog(user: UserEvent) {
  await user.click(await screen.findByRole("button", { name: "Report An Issue" }));
  return await screen.findByRole("dialog", { name: "Report An Issue" });
}
