import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { PageState } from "@/components/blocks/state-view";
import { Button } from "@/components/ui/button";

import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type RouteErrorKind = "network" | "permission" | "not-found" | "unknown";

interface RouteErrorProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  kind?: RouteErrorKind; // ← add this
}
// A route whose loader or render failed. Retrying reloads the route, which re-runs its loader.
export function RouteError({ title, message, onRetry, kind }: Readonly<RouteErrorProps>) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <Alert aria-live="assertive" role="alert" variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {onRetry && kind === "network" && (
          <button className="ml-2 underline" onClick={onRetry}>
            Retry
          </button>
        )}
        <div role="alert">
          <PageState
            action={<Button onClick={() => void router.invalidate()}>Try Again</Button>}
            description="This page could not load. Check your connection and try again."
            icon={TriangleAlertIcon}
            title="Something Went Wrong"
          />
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function RouteNotFound({ title }: { title: string }) {
  return (
    <div aria-live="polite" className="p-6 text-center" role="status">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground">This record does not exist.</p>
    </div>
  );
}
