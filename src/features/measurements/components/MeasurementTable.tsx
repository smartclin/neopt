import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CircleAlertIcon, RulerIcon, SearchXIcon } from "lucide-react";
import * as React from "react";

import { IconTile } from "@/components/blocks/icon-tile";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { type PageSize, TablePagination } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { seriesQuery } from "@/features/growth/queries";
import { formatDate } from "@/lib/dates";

import type { Indicator, IndicatorSeriesRow } from "../types";

type MeasurementRow = IndicatorSeriesRow;

const column = createColumnHelper<typeof features, MeasurementRow>();
/**
 * `meta` on the table carries the unit so the value cell can format itself
 * without prop-drilling. The type is declared here and consumed below.
 */
interface MeasurementsTableMeta {
  unit: string;
  indicator: Indicator;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INDICATOR_LABEL: Record<Indicator, string> = {
  "weight-for-age": "Weight / age",
  "length-for-age": "Length / age",
  "weight-for-length": "Weight / length",
  "bmi-for-age": "BMI / age",
  "head-circumference-for-age": "Head circ.",
};

const INDICATOR_UNIT: Record<Indicator, string> = {
  "weight-for-age": "kg",
  "length-for-age": "cm",
  "weight-for-length": "kg",
  "bmi-for-age": "kg/m²",
  "head-circumference-for-age": "cm",
};

const MONTH_LABEL = (months: number): string => {
  if (!Number.isFinite(months)) return "—";
  if (months < 24) return `${months.toFixed(1)} mo`;
  const years = Math.floor(months / 12);
  const rem = Math.round(months - years * 12);
  return rem === 0 ? `${years}y` : `${years}y ${rem}m`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function zVariant(z: number | null): "success" | "warning" | "destructive" | "subtle" {
  if (z === null) return "subtle";
  const abs = Math.abs(z);
  if (abs >= 3) return "destructive";
  if (abs >= 2) return "warning";
  if (abs <= 1) return "success";
  return "subtle";
}

function zSeverityLabel(z: number): string {
  const abs = Math.abs(z);
  if (abs >= 3) return "severe";
  if (abs >= 2) return "moderate";
  if (abs <= 1) return "normal";
  return "mild";
}

// ─────────────────────────────────────────────────────────────────────────────
// Table config
// ─────────────────────────────────────────────────────────────────────────────

const features = tableFeatures({ rowPaginationFeature });

const columns = column.columns([
  column.accessor((row) => row.visit?.visitedAt, {
    id: "visitedAt",
    header: "Visit",
    meta: { width: "w-32 max-sm:w-24" },
    cell: (info) => {
      const date = asDate(info.getValue());
      const ageMonths = info.row.original.visit?.ageMonths;
      if (!date) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-col gap-0.5 py-1">
          <span className="font-medium tabular-nums">{formatDate(date)}</span>
          {ageMonths != null && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {MONTH_LABEL(ageMonths)}
            </span>
          )}
        </div>
      );
    },
  }),

  column.accessor((row) => row.value, {
    id: "value",
    header: () => <span className="block text-right">Value</span>,
    meta: { width: "w-28 max-sm:w-24" },
    cell: (info) => {
      const value = asNumber(info.getValue());
      const meta = info.table.options.meta as MeasurementsTableMeta | undefined;
      const unit = meta?.unit ?? "";
      return (
        <div className="flex items-baseline justify-end gap-1 py-1 tabular-nums">
          <span className="font-medium">{value === null ? "—" : value.toFixed(2)}</span>
          {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
        </div>
      );
    },
  }),

  column.accessor((row) => row.zScore, {
    id: "zScore",
    header: () => <span className="block text-right">Z-Score</span>,
    meta: { width: "w-24 max-sm:w-20" },
    cell: (info) => {
      const z = asNumber(info.getValue());
      if (z === null) {
        return <span className="text-muted-foreground block text-right">—</span>;
      }
      const severity = zSeverityLabel(z);
      return (
        <div className="flex justify-end py-1">
          <Badge
            aria-label={`Z-score ${z.toFixed(2)}, ${severity}`}
            title={`${severity} (z ${z.toFixed(2)})`}
            variant={zVariant(z)}
          >
            <span className="tabular-nums">
              {z > 0 ? "+" : ""}
              {z.toFixed(2)}
            </span>
          </Badge>
        </div>
      );
    },
  }),

  column.accessor((row) => row.percentile, {
    id: "percentile",
    header: () => <span className="block text-right">Percentile</span>,
    meta: { width: "w-24", hideOnMobile: true },
    cell: (info) => {
      const p = asNumber(info.getValue());
      return (
        <span className="text-muted-foreground block text-right tabular-nums">
          {p === null ? "—" : `${p.toFixed(1)}%`}
        </span>
      );
    },
  }),

  column.accessor((row) => row.classification, {
    id: "classification",
    header: "Classification",
    meta: { width: "w-44", hideOnMobile: true },
    cell: (info) => {
      const v = info.getValue();
      if (v == null) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span className="text-muted-foreground block truncate capitalize" title={v}>
          {v}
        </span>
      );
    },
  }),
]);

const COLUMN_LAYOUT = [
  { width: "w-32 max-sm:w-24" },
  { width: "w-28 max-sm:w-24" },
  { width: "w-24 max-sm:w-20" },
  { width: "w-24", hideOnMobile: true },
  { width: "w-44", hideOnMobile: true },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface MeasurementsTableProps<TRoute extends AnyRoute> {
  patientId: string;
  indicator: Indicator;
  page: number;
  size: PageSize;
  route?: TRoute;
  initialData?: IndicatorSeriesRow[];
  initialDataUpdatedAt?: number;
}

export function MeasurementsTable<TRoute extends AnyRoute>({
  patientId,
  indicator,
  page,
  size,
  route,
  initialData,
  initialDataUpdatedAt,
}: MeasurementsTableProps<TRoute>) {
  // ── read via factory ──────────────────────────────────────────────
  const query = useQuery({
    ...seriesQuery(patientId, indicator),
    initialData,
    initialDataUpdatedAt,
  });

  const queryData = query.data;
  const all = queryData ?? [];
  const total = all.length;
  const pageCount = Math.max(1, Math.ceil(total / size));

  const pageRows = React.useMemo(
    () => (queryData ?? []).slice((page - 1) * size, page * size),
    [queryData, page, size],
  );

  const unit = INDICATOR_UNIT[indicator];
  const meta = React.useMemo<MeasurementsTableMeta>(() => ({ unit, indicator }), [unit, indicator]);

  const table = useTable({
    features,
    columns,
    data: pageRows,
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: total,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
    meta,
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
          query.error instanceof Error
            ? query.error.message
            : "Check your connection and try again."
        }
        icon={CircleAlertIcon}
        title="Could Not Load Measurements"
      />
    );
  }

  if (page > pageCount && total > 0) {
    return (
      <SectionState
        action={
          <Link
            className={buttonVariants()}
            params={{ patientId }}
            search={{ tab: "overview" }}
            to="/app/patients/$patientId"
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
  const showLoadingRows = query.isFetching && pageRows.length === 0;
  const showEmptyRow = pageRows.length === 0 && !query.isFetching;

  return (
    <div className="flex flex-col gap-2">
      <Table aria-busy={query.isFetching} aria-label="Measurements" layout="fixed">
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
          {showLoadingRows &&
            Array.from({ length: 3 }, (_, i) => (
              <TableRow aria-hidden="true" key={`skeleton-${i}`}>
                <TableCell colSpan={leafColumnCount}>
                  <Skeleton className="h-7 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {showEmptyRow && (
            <TableRow>
              <TableCell colSpan={leafColumnCount}>
                <div className="text-muted-foreground flex flex-col items-center gap-1 py-8 text-center text-sm">
                  <IconTile size="lg">
                    <RulerIcon aria-hidden="true" />
                  </IconTile>
                  <p>No {INDICATOR_LABEL[indicator].toLowerCase()} measurements recorded yet.</p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell hideOnMobile={cell.column.columnDef.meta?.hideOnMobile} key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        ariaLabel="Measurement Pages"
        page={page}
        pageCount={pageCount}
        route={route}
        size={size}
      />
    </div>
  );
}
