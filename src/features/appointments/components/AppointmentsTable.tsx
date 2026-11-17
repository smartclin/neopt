import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CalendarClockIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import { IconTile } from "@/components/blocks/icon-tile";
import { DataTable } from "@/components/tables/data-table";
import { type PageSize } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
// ── read ───────────────────────────────────────────────────────────────
import { formatStatusLabel, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { todayAppointmentsQuery } from "../queries";
import { AppointmentRow } from "../types";

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const column = createColumnHelper<typeof features, AppointmentRow>();
const EMPTY_APPOINTMENTS: AppointmentRow[] = [];

// ── Column defs ────────────────────────────────────────────────────────

const columns = column.columns([
  column.accessor("scheduledAt", {
    header: "Time",
    meta: { width: "w-24" },
    cell: (info) => {
      // `scheduledAt` may arrive as a string from the server (TanStack
      // Start serialises `Date` to ISO across the wire). Coerce once,
      // here, so every consumer below sees a `Date`.
      const date = new Date(info.getValue());
      const isValid = !Number.isNaN(date.getTime());
      return (
        <span className="block truncate font-mono text-xs font-medium tabular-nums">
          {isValid ? formatTime(date) : "—"}
        </span>
      );
    },
  }),
  column.accessor((row) => row.patient?.lastName ?? "", {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = row.original.patient;
      if (!patient) {
        return <span className="">—</span>;
      }

      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <IconTile>
            <CalendarClockIcon aria-hidden="true" />
          </IconTile>
          <div className="flex min-w-0 flex-col">
            <Link
              className="truncate font-medium underline-offset-4 hover:underline"
              params={{ patientId: patient.id }}
              search={{ tab: "overview" }}
              to="/app/patients/$patientId"
            >
              {patient.firstName} {patient.lastName}
            </Link>
            <span className=" truncate font-mono text-xs">{patient.mrn}</span>
          </div>
        </div>
      );
    },
  }),
  column.accessor((row) => row.doctor?.name ?? "", {
    id: "doctor",
    header: "Doctor",
    meta: { width: "w-40", hideOnMobile: true },
    cell: ({ row }) => <span className=" block truncate">{row.original.doctor?.name ?? "—"}</span>,
  }),
  column.accessor("durationMinutes", {
    header: "Duration",
    meta: { width: "w-24" },
    cell: (info) => (
      <span className=" block text-right font-mono text-xs tabular-nums">{info.getValue()}m</span>
    ),
  }),
  column.accessor("status", {
    header: "Status",
    meta: { width: "w-28" },
    cell: (info) => {
      const status = info.getValue();
      return <Badge>{formatStatusLabel(status)}</Badge>;
    },
  }),
  column.accessor("reason", {
    header: "Reason",
    meta: { width: "w-48", hideOnMobile: true },
    cell: (info) => (
      <span className=" block truncate" title={info.getValue() ?? undefined}>
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
]);

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
    columns,
    features,
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
      search: { page: undefined } as never,
    });
  };

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
