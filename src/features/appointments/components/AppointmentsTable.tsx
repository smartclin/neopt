import {useQuery} from "@tanstack/react-query";
import { type AnyRoute, useNavigate } from "@tanstack/react-router";
import { useTable } from "@tanstack/react-table";

import { Button } from "#/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { type PageSize } from "@/components/tables/table-pagination";
// ── read ───────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";

import { todayAppointmentsQuery } from "../queries";
import { type AppointmentRow } from "../types";
import { appointmentColumns, appointmentTableFeatures } from "./columns";

const EMPTY_APPOINTMENTS: AppointmentRow[] = [];

// ── Component ──────────────────────────────────────────────────────────

export interface AppointmentsTableProps<TRoute extends AnyRoute = AnyRoute> {
  route?: TRoute;
  /**
   * The clinic whose today-queue to show. Required when the caller
   * doesn't supply `appointments` — the previous `"clinic-main"`
   * placeholder wasn't a valid UUID and would have produced an empty
   * query with no visible error.
   */
  clinicId?: string;
  page?: number;
  size?: PageSize;
  appointments?: AppointmentRow[];
}

export function AppointmentsTable<TRoute extends AnyRoute>({
  route,
  clinicId,
  page = 1,
  size = 20,
  appointments: initialAppointments,
}: AppointmentsTableProps<TRoute>) {
  const navigate = useNavigate();

  const query = useQuery({
    ...todayAppointmentsQuery(clinicId ?? ""),
    enabled: Boolean(clinicId) && !initialAppointments,
  });

  const allAppointments = initialAppointments ?? query.data ?? EMPTY_APPOINTMENTS;

  const table = useTable({
    data: allAppointments,
    columns: appointmentColumns,
    features: appointmentTableFeatures,
    getRowId: (row) => row.id,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
  });

  const pageCount = table.getPageCount();
  const backToFirstPage = () => {
    if (!route) {
      void navigate({ to: "/app/appointments", search: {} as never });
      return;
    }
   void navigate({
  to: route.fullPath,
  search: ((prev: Record<string, unknown>) => ({ ...prev, page: undefined })) as never,
});
  };

  if (!clinicId && !initialAppointments) {
    return (
      <div className="border-border rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">No clinic selected</p>
        <p className="text-muted-foreground text-xs">
          Pick a clinic to view today's appointments.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      ariaLabel="Appointments"
      emptyMessage="No appointments scheduled for today."
      errorDescription={
        query.error instanceof Error ? query.error.message : "An unexpected error occurred."
      }
      errorTitle="Failed to Load Appointments"
      outOfRange={
        query.data
          ? {
              backTo: () => (
                <Button className={cn("w-full sm:w-auto")} nativeButton onClick={backToFirstPage}>
                  Back To First Page
                </Button>
              ),
            }
          : undefined
      }
      pagination={{ page, pageCount, route, size }}
      query={query}
      skeletonRowCount={size}
      table={table}
    />
  );
}
