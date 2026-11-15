import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CircleAlertIcon, PillIcon, SearchXIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { buttonVariants } from "#/components/ui/button-variants";
import { IconTile } from "@/components/blocks/icon-tile";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { type PageSize, TablePagination } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { prescriptionsForPatientQuery, prescriptionsForVisitQuery } from "../queries";
import type { PrescriptionRow } from "../types";

// ── Static module-scope config ─────────────────────────────────────────────

const features = tableFeatures({ rowPaginationFeature });

const column = createColumnHelper<typeof features, PrescriptionRow>();

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
            <span className="text-muted-foreground truncate text-xs">
              {row.original.instructions}
            </span>
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
      <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
        {row.original.frequency}
      </span>
    ),
  }),
  column.accessor("durationDays", {
    header: "Duration",
    meta: { width: "w-28", hideOnMobile: true },
    cell: ({ row }) => {
      const { text, variant } = durationLabel(row.original.durationDays);
      return (
        <Badge className="tabular-nums" variant={variant}>
          {text}
        </Badge>
      );
    },
  }),
  column.accessor("prescribedBy", {
    header: "Prescribed By",
    meta: { width: "w-40", hideOnMobile: true },
    cell: ({ row }) => {
      const doctor = row.original.prescribedBy;
      return <span className="text-muted-foreground block truncate">{doctor?.name ?? "—"}</span>;
    },
  }),
  column.accessor("prescribedAt", {
    header: "Prescribed",
    meta: { width: "w-32 max-sm:w-24" },
    cell: ({ row }) => {
      const date = new Date(row.original.prescribedAt);
      return (
        <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
  }),
]);

const COLUMN_LAYOUT = [
  { heading: "Medication" },
  { heading: "Dosage", width: "w-28", hideOnMobile: false },
  { heading: "Frequency", width: "w-24", hideOnMobile: false },
  { heading: "Duration", width: "w-28", hideOnMobile: true },
  { heading: "Prescribed By", width: "w-40", hideOnMobile: true },
  { heading: "Prescribed", width: "w-32", hideOnMobile: true },
];

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

  const all = query.data ?? [];

  const table = useTable({
    data: all,
    columns,
    features,
    getRowId: (row) => row.id,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
  });

  if (query.isError) {
    return (
      <SectionState
        action={
          <Button onClick={() => void query.refetch()} variant="outline">
            {query.isFetching ? "Retrying…" : "Try Again"}
          </Button>
        }
        description={
          query.error instanceof Error ? query.error.message : "An unexpected error occurred."
        }
        icon={CircleAlertIcon}
        title="Could Not Load Prescriptions"
      />
    );
  }

  const pageCount = table.getPageCount();

  if (all.length > 0 && page > pageCount) {
    return (
      <SectionState
        action={
          <Link
            className={buttonVariants()}
            params={{ visitId } as never}
            to={route?.fullPath ?? ("/app/visits/$visitId" as never)}
          >
            Back To First Page
          </Link>
        }
        description={`There are only ${pageCount.toLocaleString("en-US")} pages.`}
        icon={SearchXIcon}
        title="Page Not Found"
      />
    );
  }

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    <div className="flex flex-col gap-2">
      <Table aria-busy={query.isFetching} aria-label="Prescriptions" layout="fixed">
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
          {table.getRowModel().rows.length === 0 && !query.isFetching ? (
            <TableRow>
              <TableCell colSpan={leafColumnCount}>
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No prescriptions recorded for this visit yet.
                </p>
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
            Array.from({ length: Math.min(size, 3) }, (_, i) => (
              <TableRow key={`loading-${i}`}>
                <TableCell colSpan={leafColumnCount}>
                  <div className="bg-muted h-7 w-full animate-pulse rounded-md" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        ariaLabel="Prescription Pages"
        page={page}
        pageCount={pageCount}
        route={route}
        size={size}
      />
    </div>
  );
}
