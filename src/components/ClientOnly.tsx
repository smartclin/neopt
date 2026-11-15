// src/components/ClientOnly.tsx
"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
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
 * `clinicActions.setActiveClinic` is expected to be idempotent — it
 * should bail (return `prev`) when the incoming clinic is structurally
 * equal to the current one. Without that, every `useAuth` re-render
 * pushes a new object into the store and invalidates every
 * clinic-scoped query downstream.
 */
export function ClinicSessionSync() {
  const { user, isPending } = useAuth();

  const id = user?.id ?? null;
  const clinicId = user?.clinicId ?? null;
  const name = user?.name ?? null;
  const email = user?.email ?? null;

  useEffect(() => {
    if (isPending) return;

    if (!id) {
      clinicActions.setActiveClinic(null);
      return;
    }

    clinicActions.setActiveClinic({
      email,
      id: clinicId ?? id,
      name: name ?? "My Clinic",
    });
  }, [isPending, id, clinicId, name, email]);

  return null;
}
