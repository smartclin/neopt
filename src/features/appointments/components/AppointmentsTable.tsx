import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CalendarClockIcon, CircleAlertIcon, SearchXIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import { IconTile } from "@/components/blocks/icon-tile";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { type PageSize, TablePagination } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// ── read ───────────────────────────────────────────────────────────────
import { formatStatusLabel, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { todayAppointmentsQuery } from "../queries";
import { AppointmentRow } from "../types";

const features = tableFeatures({ rowPaginationFeature });

const column = createColumnHelper<typeof features, AppointmentRow>();

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

const COLUMN_LAYOUT = [
  { width: "w-24" },
  {},
  { width: "w-40", hideOnMobile: true },
  { width: "w-24" },
  { width: "w-28" },
  { width: "w-48", hideOnMobile: true },
] as const;

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

  const allAppointments = initialAppointments ?? query.data ?? [];

  const table = useTable({
    data: allAppointments,
    columns,
    features,
    getRowId: (row) => row.id,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
  });

  if (query.isError) {
    return (
      <SectionState
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            variant="outline"
          >
            {query.isFetching ? "Retrying…" : "Try Again"}
          </Button>
        }
        description={
          query.error instanceof Error ? query.error.message : "An unexpected error occurred."
        }
        icon={CircleAlertIcon}
        title="Failed to Load Appointments"
      />
    );
  }

  const pageCount = table.getPageCount();

  if (query.data && page > pageCount && pageCount > 0) {
    const backToFirst = () => {
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
      <SectionState
        action={
          <Button className={cn("w-full sm:w-auto")} nativeButton onClick={backToFirst}>
            Back To First Page
          </Button>
        }
        description={`There are only ${pageCount.toLocaleString("en-US")} pages.`}
        icon={SearchXIcon}
        title="Page Not Found"
      />
    );
  }

  const leafColumnCount = table.getAllLeafColumns().length;
  const isEmpty = table.getRowModel().rows.length === 0 && !query.isFetching;

  return (
    <div className="flex flex-col gap-2">
      <Table aria-busy={query.isFetching} aria-label="Appointments" layout="fixed">
        <TableColGroup columns={COLUMN_LAYOUT} />
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  hideOnMobile={header.column.columnDef.meta?.hideOnMobile}
                  key={header.id}
                >
                  <table.FlexRender header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={leafColumnCount}>
                <p className=" py-8 text-center text-sm">No appointments scheduled for today.</p>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell hideOnMobile={cell.column.columnDef.meta?.hideOnMobile} key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
          {query.isFetching &&
            Array.from({ length: size }, (_, row) => `loading-${row}`).map((key) => (
              <TableRow key={key}>
                <TableCell colSpan={leafColumnCount}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        ariaLabel="Appointment Pages"
        page={page}
        pageCount={pageCount}
        route={route}
        size={size}
      />
    </div>
  );
}
