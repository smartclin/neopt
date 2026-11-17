// src/components/blocks/route-error.tsx
import { useRouter } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";

import { PageState } from "@/components/blocks/state-view";
import { Button } from "@/components/ui/button";

type RouteErrorKind = "network" | "permission" | "not-found" | "unknown";

interface RouteErrorProps {
  title: string;
  message?: string;
  kind?: RouteErrorKind;
  /**
   * Optional override for the retry action. When omitted, the surface owns
   * retry itself via `router.invalidate()` (see `PageState`'s default action).
   * Callers should only pass this when they need to do something *in
   * addition* to re-running the route's loader.
   */
  onRetry?: () => void;
}

/**
 * A route whose loader or render failed.
 *
 * Renders exactly one surface: the shared `PageState` empty/error view.
 * There is no outer `Alert` and no nested `role="alert"` wrapper — the
 * whole component is a single alert region (owned by `PageState` /
 * `Empty`), so assistive tech announces the failure once.
 *
 * Retry is delegated to `PageState`, which calls `router.invalidate()`
 * and re-runs the failing route's loader. `onRetry`, when provided,
 * replaces that default action — it is not stacked alongside it.
 */
export function RouteError({ title, message, onRetry }: Readonly<RouteErrorProps>) {
  const router = useRouter();

  const retry = onRetry ?? (() => void router.invalidate());

  return (
    <PageState
      action={
        <Button onClick={retry} type="button">
          Try Again
        </Button>
      }
      description={message ?? "This page could not load. Check your connection and try again."}
      icon={TriangleAlertIcon}
      title={title}
    />
  );
}

export function RouteNotFound({ title }: { title: string }) {
  return (
    <div aria-live="polite" className="p-6 text-center" role="status">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="">This record does not exist.</p>
    </div>
  );
}
