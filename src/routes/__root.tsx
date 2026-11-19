// src/routes/__root.tsx

import type { QueryClient } from "@tanstack/react-query";

import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { THEME_INIT_SCRIPT } from "#/lib/shadcn/theme-init.ts";
import { ThemeProvider } from "#/lib/shadcn/theme.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "../styles.css?url";

// ─── Router context ─────────────────────────────────────────────────
//
// The root route's context is what `beforeLoad` / `loader` receive
// under `context`. This interface is the *only* declaration of that
// shape on the routing side — `router.tsx`'s `Register` interface is
// the other half of the contract. If you add a field here, add it
// there too (and vice versa) until a compile-time link exists.

interface RouterContext {
  queryClient: QueryClient;
}

// ─── App metadata ──────────────────────────────────────────────────

const APP = {
  title: "Smart Clinic · Pediatrics",
  description:
    "Pediatric clinic management: patients, encounters, growth tracking, prescriptions, and appointments.",
  themeColor: {
    light: "#f4f6fa" as `#${string}`,
    dark: "#0e1524" as `#${string}`,
  },
} as const;

// ─── Devtools (dev only, lazy) ─────────────────────────────────────
//
// `components/Devtools.tsx` guards against SSR via
// `useSyncExternalStore`, so `lazy()` is safe. The DEV ternary drops
// the dynamic import from the prod bundle — the fallback component
// never renders because `DevtoolsDeferred` early-returns below.

const Devtools = import.meta.env.DEV ? lazy(() => import("#/components/Devtools")) : () => null;

// `requestIdleCallback` is *non-optional* on `Window` in lib.dom, so
// `"requestIdleCallback" in window` narrows the else-branch to `never`
// and `window.setTimeout` becomes "does not exist on type 'never'".
// Declaring the property optional on a widened view of `window` makes
// the feature-detect a real one.
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

function DevtoolsDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as WindowWithIdleCallback;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setReady(true));
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(id);
  }, []);

  if (!import.meta.env.DEV || !ready) return null;

  return (
    <Suspense fallback={null}>
      <Devtools />
    </Suspense>
  );
}

// ─── Root route ────────────────────────────────────────────────────

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP.title },
      { name: "description", content: APP.description },
      // Two declarative theme-color tags. The browser picks the one
      // matching `prefers-color-scheme` — first-paint correct with
      // no JS. If the user overrides their OS theme in-app, only
      // `<html style="color-scheme">` (set by the init script)
      // reflects that; browsers read it for scrollbar and form-
      // control tinting. To also correct the address-bar color on
      // user override, that logic belongs in `applyTheme` in
      // theme-utils.ts, not in the inline script.
      {
        name: "theme-color",
        content: APP.themeColor.light,
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: APP.themeColor.dark,
        media: "(prefers-color-scheme: dark)",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    // Executed synchronously inside <head> by `<HeadContent />`,
    // before the body paints. See theme-init.ts for the contract.
    scripts: [{ children: THEME_INIT_SCRIPT }],
  }),
  shellComponent: RootDocument,
});

// ─── Shell ─────────────────────────────────────────────────────────
//
// `suppressHydrationWarning` is on `<html>` because the `class`
// attribute legitimately differs between SSR and the first client
// render (init script vs. `matchMedia`). React has no per-attribute
// opt-out. The blast radius — also suppressing warnings for `lang`
// and `dir` — is accepted: those attributes are static today.
//
// `ThemeProvider` is mounted without `defaultTheme` (defaults to
// "system"). The first client render of any `useTheme()` consumer
// can disagree with SSR until `mounted` flips; the fix belongs in
// `lib/shadcn/theme.tsx` (gate `resolvedTheme` on `mounted`), not
// here. Do not paper over it with `defaultTheme="light"` — that
// breaks first paint for system-dark users.

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <DevtoolsDeferred />
        <Scripts />
      </body>
    </html>
  );
}
