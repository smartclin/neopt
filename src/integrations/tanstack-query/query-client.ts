// src/integrations/tanstack-query/query-client.ts
//
// Do NOT export a top-level `queryClient` constant alongside
// `getQueryClient()`. The constant would be a *different* instance from
// what `getQueryClient()` returns on the browser, which means:
//   - `queryClient.invalidateQueries(...)` against one instance does not
//     reach components subscribed to the other;
//   - SSR and the client see different caches.
// Only export the factory + the singleton accessor. If existing code
// imports `{ queryClient }`, replace it with:
//   - `useQueryClient()` inside components / hooks;
//   - `getQueryClient()` inside event handlers or non-component code.
// See: rg "from ['\"].*query-client['\"]" src/

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { toast } from "#/components/ui/toast.tsx";

/**
 * Report an error to the browser's global error reporter.
 *
 * `globalThis.reportError` (per the HTML spec) is `(error: any) => void`
 * and its argument should be an `Error` — not an arbitrary object. We
 * attach the metadata as an own property on the error so reporters that
 * forward `error.metadata` (Sentry, etc.) still get it.
 */
function reportQueryError(message: string, metadata: Record<string, unknown>) {
  const err = new Error(message);
  Object.assign(err, { metadata });

  if (typeof globalThis.reportError === "function") {
    globalThis.reportError(err);
    return;
  }

  console.warn(message, metadata);
}

/**
 * Minimum time (ms) between two global query-error toasts.
 *
 * Without this, a single network hiccup producing N failing queries
 * produces N identical toasts, and on flaky Wi-Fi the user sees a toast
 * storm while the page already renders its own `SectionState` error UI.
 * The window is arbitrary — 3s lets a genuinely new failure through
 * while coalescing bursts.
 */
const TOAST_WINDOW_MS = 3000;
let lastQueryErrorToastAt = 0;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnReconnect: true,
        refetchOnWindowFocus: false, // Clinic app: focus events are constant
        retry: (failureCount, error) => {
          const { status } = error as { status?: unknown };
          // Authentication/authorization failures won't recover by
          // retrying the same request with the same session.
          if (status === 401 || status === 403) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 30 * 1000, // 30 seconds
      },
    },

    mutationCache: new MutationCache({
      onError: (error, mutation) => {
        reportQueryError("[Mutation Error]", {
          error,
          mutationKey: (mutation as { options: { mutationKey?: unknown } }).options.mutationKey,
        });
      },
    }),

    queryCache: new QueryCache({
      onError: (error, _query) => {
        const { status } = error as { status?: unknown };
        if (status === 401 || status === 403) {
          return;
        }

        const now = Date.now();
        if (now - lastQueryErrorToastAt < TOAST_WINDOW_MS) return;
        lastQueryErrorToastAt = now;

        toast.add({
          description: error instanceof Error ? error.message : "Request failed",
          title: "Error",
          type: "error",
        });
      },
    }),
  });
}

/**
 * The QueryClient for the current environment.
 *
 * - **Server:** a fresh instance on every call, so concurrent SSR
 *   requests never leak cache entries into each other (per-request
 *   isolation — the same property `getClinicStore()` maintains).
 * - **Browser:** one lazily-created singleton, shared by every component,
 *   hook, and event handler. This is what makes `invalidateQueries`
 *   reach the mounted tree.
 */
let browserClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  browserClient ??= createQueryClient();
  return browserClient;
}
