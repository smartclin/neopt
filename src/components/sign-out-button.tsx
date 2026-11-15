// src/components/sign-out-button.tsx
import { useRouter } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { cn } from "#/lib/utils";

/** The sign-out action + pending state. Reusable anywhere. */
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const signOut = React.useCallback(async () => {
    setPending(true);
    try {
      await authClient.signOut();
      await router.invalidate();
    } finally {
      setPending(false);
    }
  }, [router]);

  return { pending, signOut };
}

/** Standalone destructive button. */
export function SignOutButton({
  className,
  label = "Sign out",
  pendingLabel = "Signing out…",
}: {
  className?: string;
  label?: string;
  pendingLabel?: string;
} = {}) {
  const { signOut, pending } = useSignOut();

  return (
    <Button
      className={cn("w-fit", className)}
      disabled={pending}
      onClick={() => void signOut()}
      size="sm"
      type="button"
      variant="destructive"
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
