import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { PillIcon } from "lucide-react";

import { buttonVariants } from "#/components/ui/button-variants";
import { IconTile } from "@/components/blocks/icon-tile";
import { DataTable } from "@/components/tables/data-table";
import { type PageSize } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";

import type { PrescriptionRow } from "../types";

import { prescriptionsForPatientQuery, prescriptionsForVisitQuery } from "../queries";

// ── Static module-scope config ─────────────────────────────────────────────

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const column = createColumnHelper<typeof features, PrescriptionRow>();
const EMPTY_PRESCRIPTIONS: PrescriptionRow[] = [];

/**
 * `durationDays` is nullable: null means "ongoing" (no scheduled end).
 * We render three states — a numeric duration, an "ongoing" badge, or a
 * dash when the row has no duration *and* is not marked ongoing.
 */
function durationLabel(days: number | null): {
  text: string;
  variant: "default" | "secondary" | "outline";
} {
  if (days === null) return { text: "ongoing", variant: "outline" };
  if (days === 1) return { text: "1 day", variant: "secondary" };
  return { text: `${days} days`, variant: "secondary" };
}

const columns = column.columns([
  column.accessor("medicationName", {
    header: "Medication",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5 py-1">
        <IconTile tone="secondary">
          <PillIcon aria-hidden="true" />
        </IconTile>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.medicationName}</span>
          {row.original.instructions ? (
            <span className=" truncate text-xs">{row.original.instructions}</span>
          ) : null}
        </div>
      </div>
    ),
  }),
  column.accessor("dosage", {
    header: "Dosage",
    meta: { width: "w-28 max-sm:w-24" },
    cell: ({ row }) => (
      <span className="block truncate font-mono text-xs tabular-nums">{row.original.dosage}</span>
    ),
  }),
  column.accessor("frequency", {
    header: "Frequency",
    meta: { width: "w-24 max-sm:w-24" },
    cell: ({ row }) => (
      <span className=" block truncate font-mono text-xs tabular-nums">
        {row.original.frequency}
      </span>
    ),
  }),
  column.accessor("durationDays", {
    header: "Duration",
    meta: { width: "w-28", hideOnMobile: true },
    cell: ({ row }) => {
      const { text, variant } = durationLabel(row.original.durationDays);
      return <Badge variant={variant}>{text}</Badge>;
    },
  }),
  column.accessor("prescribedBy", {
    header: "Prescribed By",
    meta: { width: "w-40", hideOnMobile: true },
    cell: ({ row }) => {
      const doctor = row.original.prescribedBy;
      return <span className=" block truncate">{doctor?.name ?? "—"}</span>;
    },
  }),
  column.accessor("prescribedAt", {
    header: "Prescribed",
    meta: { width: "w-32 max-sm:w-24", hideOnMobile: true },
    cell: ({ row }) => {
      const date = new Date(row.original.prescribedAt);
      return (
        <span className=" block truncate font-mono text-xs tabular-nums">{formatDate(date)}</span>
      );
    },
  }),
]);

// ── Component ──────────────────────────────────────────────────────────────

interface PrescriptionTableProps<TRoute extends AnyRoute = AnyRoute> {
  route?: TRoute;
  visitId?: string;
  patientId?: string;
  page?: number;
  size?: PageSize;
}

export function PrescriptionTable<TRoute extends AnyRoute = AnyRoute>({
  route,
  visitId,
  patientId,
  page = 1,
  size = 20,
}: PrescriptionTableProps<TRoute>) {
  const queryOptions = (visitId
    ? prescriptionsForVisitQuery(visitId)
    : prescriptionsForPatientQuery(patientId ?? "")) as unknown as UseQueryOptions<
    PrescriptionRow[],
    Error
  >;
  const query = useQuery({
    ...queryOptions,
    enabled: Boolean(visitId || patientId),
  });

  const all = query.data ?? EMPTY_PRESCRIPTIONS;

  const table = useTable({
    data: all,
    columns,
    features,
    getRowId: (row) => row.id,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
  });

  const pageCount = table.getPageCount();

  return (
    <DataTable
      ariaLabel="Prescriptions"
      emptyMessage="No prescriptions recorded for this visit yet."
      errorDescription={
        query.error instanceof Error ? query.error.message : "An unexpected error occurred."
      }
      errorTitle="Could Not Load Prescriptions"
      outOfRange={
        all.length > 0 && page > pageCount
          ? {
              backTo: () => (
                <Link
                  className={buttonVariants()}
                  params={{ visitId } as never}
                  to={route?.fullPath ?? ("/app/visits/$visitId" as never)}
                >
                  Back To First Page
                </Link>
              ),
            }
          : undefined
      }
      pagination={{ page, pageCount, route, size }}
      query={query}
      skeletonRowCount={Math.min(size, 3)}
      table={table}
    />
  );
}
