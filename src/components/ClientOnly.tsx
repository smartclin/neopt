// src/components/ClientOnly.tsx
"use client";

import { type ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";

import { clinicActions } from "#/features/clinics/clinic-store.ts";
import { useAuth } from "#/lib/auth/hooks";

// ── ClientOnly ────────────────────────────────────────────────────────

const subscribeToMount = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );
  return <>{mounted ? children : fallback}</>;
}

// ── ClinicSessionSync ─────────────────────────────────────────────────

/**
 * Mirrors the Better Auth session into the clinic store.
 *
 * Reads from the shared `["auth"]` React Query entry (via `useAuth`), NOT
 * from `authClient.useSession()`, so we don't issue a second
 * `/api/auth/get-session` request on every mount.
 *
 * Two layers of protection against spurious store writes:
 *
 * 1. `useMemo` builds the clinic object from scalar deps, so the object
 *    reference is stable across re-renders where `useAuth` returns a new
 *    user object but with the same field values.
 *
 * 2. `clinicActions.setActiveClinic` does a structural comparison inside
 *    `setState` and returns `prev` unchanged when nothing has changed,
 *    so no TanStack Store subscriber is notified even if the object
 *    reference above somehow changes.
 *
 * The `clinicId ?? id` fallback lives here — at the call site — rather
 * than inside `ActiveClinic` or `setActiveClinic`. The store just stores
 * whatever id it receives; it doesn't need to know about the fallback
 * convention.
 */
export function ClinicSessionSync() {
  const { user, isPending } = useAuth();

  const id = user?.id ?? null;
  const clinicId = user?.clinicId ?? null;
  const name = user?.name ?? null;
  const email = user?.email ?? null;

  const clinic = useMemo(() => {
    if (!id) return null;
    return {
      id: clinicId ?? id,
      name: name ?? "My Clinic",
      email,
    };
  }, [id, clinicId, name, email]);

  useEffect(() => {
    if (isPending) return;
    clinicActions.setActiveClinic(clinic);
  }, [isPending, clinic]);

  return null;
}
