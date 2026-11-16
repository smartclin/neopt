import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Default 404 surface.
 *
 * Rendered by TanStack Router whenever a URL doesn't match any route in
 * the tree. Registered in two places:
 *   1. `router.tsx` → `defaultNotFoundComponent` (router-wide fallback)
 *   2. `routes/__root.tsx` → `notFoundComponent` (root-route override)
 *
 * Both registrations point at this component so behaviour is identical
 * no matter which path the router takes.
 */
export default function NotFound() {
  const router = useRouter();

  // `router.history.back()` is safe even with no history — it no-ops.
  // We only render the button when we *know* there's a previous entry.
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  return (
    <main className="page-wrap flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl">
          <Compass aria-hidden="true" className="size-7" />
        </div>

        <p className="mb-2">Error 404</p>
        <h1 className="display-title text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          We couldn't find that page.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
          The link may be broken, or the page may have moved. Check the address, or head somewhere
          useful below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link className="inline-flex items-center " to="/" />} size="lg">
            <Home aria-hidden="true" className="size-4" />
            Go to dashboard
          </Button>

          {canGoBack ? (
            <Button
              className="inline-flex items-center"
              onClick={() => {
                router.history.back();
              }}
              size="lg"
              type="button"
              variant="outline"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
          ) : null}
        </div>

        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="mb-3 text-xs tracking-wider text-[var(--sea-ink-soft)] uppercase">
            Try a shortcut
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {[
              { label: "Patients", to: "/patients" },
              { label: "Appointments", to: "/appointments" },
              { label: "Encounters", to: "/encounters" },
              { label: "Prescriptions", to: "/prescriptions" },
              { label: "Growth", to: "/growth" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  className="text-[var(--sea-ink-soft)] underline-offset-4 transition-colors hover:text-[var(--sea-ink)] hover:underline"
                  to={to}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
          <Search aria-hidden="true" className="size-3" />
          Or press{" "}
          <kbd className="rounded border border-[var(--line)] px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          to search
        </p>
      </div>
    </main>
  );
}
