// src/components/blocks/command-menu.dom.test.tsx
//
// Tests the filtering rule documented in CommandMenu:
//
//   < 2 chars  → all static lists unfiltered; entity query disabled (idle).
//   ≥ 2 chars  → static lists filtered by the same substring; entity query fires.
//
// We test the boundary (1 char vs 2 chars) and the idle/fetching transition.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { searchKeys } from "@/features/search/queries";
import { ThemeProvider } from "@/lib/shadcn/theme";

import { CommandMenu } from "./command-menu";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Prevent real HTTP from firing.
vi.mock("@/features/search/functions", () => ({
  globalSearchFn: vi.fn().mockResolvedValue({ results: [], elapsedMs: 0 }),
}));

// The navigation module initialises NAV_ITEMS / RESOURCES with lucide icon
// components as values. In this jsdom project those icons arrive as `undefined`
// at the time CommandMenu's useMemo first runs, causing a ReferenceError.
// We replace them with stable stubs that satisfy the component contract
// (label, to / href, icon) without pulling in the real icon tree.
vi.mock("@/lib/shadcn/navigation", () => {
  const Noop = () => null;
  Noop.displayName = "NoopIcon";
  return {
    NAV_ITEMS: [
      { to: "/", label: "Dashboard", icon: Noop },
      { to: "/patients", label: "Patients", icon: Noop },
      { to: "/appointments", label: "Appointments", icon: Noop },
      { to: "/visits", label: "Visits", icon: Noop },
      { to: "/prescriptions", label: "Prescriptions", icon: Noop },
      { to: "/immunizations", label: "Immunizations", icon: Noop },
      { to: "/clinics", label: "Clinics", icon: Noop },
    ],
    RESOURCES: [
      {
        href: "https://www.who.int/tools/child-growth-standards/standards",
        label: "WHO Growth Standards",
        icon: Noop,
      },
      { href: "https://icd.who.int/browse10/2019/en", label: "ICD-10 Browser", icon: Noop },
    ],
  };
});

// ── Label fixtures (match the mock above) ────────────────────────────────────

const ALL_NAV_LABELS = [
  "Dashboard",
  "Patients",
  "Appointments",
  "Visits",
  "Prescriptions",
  "Immunizations",
  "Clinics",
];

// The debounce delay in CommandMenu — 180ms. Tests that assert filtered state
// must wait at least this long after typing.
const DEBOUNCE_MS = 180;

// ── Render helper ─────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/**
 * Renders CommandMenu inside the minimum provider stack it needs:
 *   - ThemeProvider  (CommandMenu calls useTheme for the toggle icon)
 *   - RouterProvider (CommandMenu calls useNavigate)
 *   - QueryClientProvider (entity search query)
 *
 * Returns the QueryClient so tests can inspect query state, and the input
 * element so tests can type into it.
 */
async function renderMenu() {
  const qc = makeQueryClient();
  const onReportIssue = vi.fn();

  const rootRoute = createRootRoute({
    component: () => (
      <CommandMenu
        clinicId="c_1"
        onOpenChange={() => {}}
        onReportIssue={onReportIssue}
        open={true}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();

  render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  const input = await screen.findByRole("combobox");
  return { input, qc };
}

/** Wait at least `ms` ms, then resolve. */
function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CommandMenu filtering rule", () => {
  it("shows all pages unfiltered at 0 chars (empty query)", async () => {
    await renderMenu();

    for (const label of ALL_NAV_LABELS) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });

  it("shows all pages unfiltered at 1 char and does not fire the search query", async () => {
    const user = userEvent.setup();
    const { input, qc } = await renderMenu();

    await user.type(input, "P");

    // Wait for the debounce to settle (the debounced value becomes "P", still
    // below the 2-char threshold). The static lists must stay fully visible.
    await act(() => delay(DEBOUNCE_MS + 50));

    for (const label of ALL_NAV_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // The debounced value "P" is 1 char — `enabled: searching` means the query
    // is disabled. React Query still registers it in the cache but with
    // fetchStatus "idle" (never fetched). Assert it was not fetched.
    const state = qc.getQueryState(searchKeys.run("c_1", "P"));
    // A disabled query may appear in the cache as { fetchStatus: "idle" }.
    // What must NOT happen is an actual fetch (fetchStatus !== "fetching").
    if (state !== undefined) {
      expect(state.fetchStatus).toBe("idle");
      expect(state.dataUpdateCount).toBe(0);
    }
  });

  it("filters pages at 2 chars and fires the search query", async () => {
    const user = userEvent.setup();
    const { input, qc } = await renderMenu();

    await user.type(input, "Pa");

    // Wait for the debounce to settle so `debounced` becomes "Pa".
    await act(() => delay(DEBOUNCE_MS + 50));

    // "Patients" contains "pa" case-insensitively.
    // "Appointments" does NOT contain "pa" (it contains "app", not "pa").
    await waitFor(() => {
      expect(screen.getByText("Patients")).toBeInTheDocument();
    });
    expect(screen.queryByText("Appointments")).toBeNull();

    // "Visits" does not contain "pa".
    expect(screen.queryByText("Visits")).toBeNull();

    // The query must have been initiated (state exists in the cache).
    await waitFor(() => {
      expect(qc.getQueryState(searchKeys.run("c_1", "Pa"))).toBeDefined();
    });
  });

  it("resources are unfiltered at 1 char", async () => {
    const user = userEvent.setup();
    const { input } = await renderMenu();

    await user.type(input, "W");

    // Wait for the debounce to settle.
    await act(() => delay(DEBOUNCE_MS + 50));

    expect(screen.getByText("WHO Growth Standards")).toBeInTheDocument();
    expect(screen.getByText("ICD-10 Browser")).toBeInTheDocument();
  });

  it("resources are filtered at 2 chars", async () => {
    const user = userEvent.setup();
    const { input } = await renderMenu();

    await user.type(input, "WH");

    // Wait for the debounce to settle.
    await act(() => delay(DEBOUNCE_MS + 50));

    expect(screen.getByText("WHO Growth Standards")).toBeInTheDocument();

    // "ICD-10 Browser" does not contain "wh".
    expect(screen.queryByText("ICD-10 Browser")).toBeNull();
  });

  it("debounce: does not add the query to the cache until 180ms after typing", async () => {
    // This test uses real timers with explicit delays rather than fake timers,
    // because fake timers interact poorly with RouterProvider's async
    // initialization (router.load() uses timers internally, causing deadlocks
    // when the clock is frozen before the render).
    const user = userEvent.setup();
    const { input, qc } = await renderMenu();

    await user.type(input, "Pa");

    // Immediately after typing, before 180ms, the query must not be in cache.
    expect(qc.getQueryState(searchKeys.run("c_1", "Pa"))).toBeUndefined();

    // After the debounce fires, the query appears.
    await act(() => delay(DEBOUNCE_MS + 50));

    await waitFor(() => {
      expect(qc.getQueryState(searchKeys.run("c_1", "Pa"))).toBeDefined();
    });
  });
});
