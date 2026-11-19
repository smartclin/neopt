// src/routes/_auth/app/route.tsx
import {createFileRoute, Outlet} from "@tanstack/react-router";
import React from "react";

import {ClinicSessionSync} from "#/components/ClientOnly.tsx";
import {resetFilters} from "#/features/appointments/filters-store.ts";
import {installOutboxFlusher} from "#/features/outbox/flusher.ts";
import {ConnectionBanner} from "#/features/outbox/ui/connection-banner.tsx";
import {useActiveClinic} from "#/features/clinics/clinic-store";
import {AppShell} from "@/components/blocks/app-shell-1";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  const activeClinic = useActiveClinic();
  const activeClinicId = activeClinic?.id ?? null;

  // Outbox flusher — install once per shell mount.
  React.useEffect(() => {
    const cleanup = installOutboxFlusher();
    return cleanup;
  }, []);

  // Appointment filters are module-global state. If a user switches
  // clinics mid-session, filters from the previous clinic would leak
  // into the new one. Reset them whenever the active clinic changes.
  React.useEffect(() => {
    resetFilters();
  }, [activeClinicId]);

  return (
    <AppShell>
      <ClinicSessionSync />
      <ConnectionBanner />
      <Outlet />
    </AppShell>
  );
}
