import { CatchBoundary } from "@tanstack/react-router";
import { Suspense } from "react";

// Renders a React.lazy dialog once it has been used; if its chunk fails, only the dialog is lost.
export function LazyMount({
  used,
  onError,
  children,
}: {
  used: boolean;
  onError: () => void;
  children: React.ReactNode;
}) {
  if (!used) return null;
  return (
    <CatchBoundary errorComponent={() => null} getResetKey={() => 0} onCatch={onError}>
      <Suspense fallback={null}>{children}</Suspense>
    </CatchBoundary>
  );
}
