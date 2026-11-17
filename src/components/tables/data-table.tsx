import type { AnyRoute } from "@tanstack/react-router";
import type { ReactTable, RowData, TableFeatures } from "@tanstack/react-table";
import type * as React from "react";

import { CircleAlertIcon, SearchXIcon } from "lucide-react";

import { SectionState } from "@/components/blocks/state-view";
import { type ColumnLayout, TableColGroup } from "@/components/blocks/table-columns";
import { type PageSize, TablePagination } from "@/components/tables/table-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table as TablePrimitive,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Minimal shape of the `useQuery` result we need — keeps the shell query-library agnostic. */
interface QueryLike {
  isError: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => unknown;
}

function getHideOnMobile(meta: unknown): boolean {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "hideOnMobile" in meta &&
    meta.hideOnMobile === true
  );
}

function getColumnLayout(meta: unknown): ColumnLayout {
  if (typeof meta !== "object" || meta === null) return {};
  return {
    width: "width" in meta && typeof meta.width === "string" ? meta.width : undefined,
    hideOnMobile: getHideOnMobile(meta),
  };
}

/**
 * The table instance owns rendering and column metadata; the shell owns the
 * shared loading, error, empty, and optional route-pagination presentation.
 */
export interface DataTableProps<TFeatures extends TableFeatures, TData extends RowData> {
  table: ReactTable<TFeatures, TData>;
  query?: QueryLike;
  ariaLabel: string;
  emptyMessage: React.ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  /** Rows of skeleton to render while fetching with no data. Default 3. */
  skeletonRowCount?: number;
  /** Out-of-range guard. Omit to disable (e.g. manual pagination with `pageCount: -1`). */
  outOfRange?: {
    backTo: () => React.ReactElement;
  };
  /** URL pagination. Omit for tables that render all rows without page controls. */
  pagination?: {
    page: number;
    pageCount: number;
    size: PageSize;
    route?: AnyRoute;
  };
}

export function DataTable<TFeatures extends TableFeatures, TData extends RowData>({
  table,
  query,
  ariaLabel,
  emptyMessage,
  errorTitle = "Could Not Load Data",
  errorDescription,
  skeletonRowCount = 3,
  outOfRange,
  pagination,
}: DataTableProps<TFeatures, TData>) {
  if (query?.isError) {
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
          errorDescription ??
          (query.error instanceof Error ? query.error.message : "An unexpected error occurred.")
        }
        icon={CircleAlertIcon}
        title={errorTitle}
      />
    );
  }

  const isFetching = query?.isFetching ?? false;

  // v9: `pageCount` may be `-1` for cursor pagination; only guard when finite.
  if (
    outOfRange &&
    pagination &&
    pagination.pageCount > 0 &&
    pagination.page > pagination.pageCount
  ) {
    return (
      <SectionState
        action={outOfRange.backTo()}
        description={`There are only ${pagination.pageCount.toLocaleString("en-US")} pages.`}
        icon={SearchXIcon}
        title="Page Not Found"
      />
    );
  }

  const columnLayout = table
    .getAllLeafColumns()
    .map((column) => getColumnLayout(column.columnDef.meta));
  const leafColumnCount = columnLayout.length;
  const rows = table.getRowModel().rows;
  const showEmpty = rows.length === 0 && !isFetching;

  return (
    <div className="flex flex-col gap-2">
      <TablePrimitive aria-busy={isFetching} aria-label={ariaLabel} layout="fixed">
        <TableColGroup columns={columnLayout} />
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  hideOnMobile={getHideOnMobile(header.column.columnDef.meta)}
                  key={header.id}
                >
                  <table.FlexRender header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {showEmpty && (
            <TableRow>
              <TableCell colSpan={leafColumnCount}>
                <div className="py-8 text-center text-sm">{emptyMessage}</div>
              </TableCell>
            </TableRow>
          )}
          {!showEmpty &&
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    hideOnMobile={getHideOnMobile(cell.column.columnDef.meta)}
                    key={cell.id}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {isFetching &&
            Array.from({ length: skeletonRowCount }, (_, i) => (
              <TableRow aria-hidden="true" key={`loading-${i}`}>
                <TableCell colSpan={leafColumnCount}>
                  <Skeleton className="h-7 w-full" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </TablePrimitive>

      {pagination && (
        <TablePagination
          ariaLabel={`${ariaLabel} Pages`}
          page={pagination.page}
          pageCount={pagination.pageCount === 0 ? 1 : pagination.pageCount}
          route={pagination.route}
          size={pagination.size}
        />
      )}
    </div>
  );
}
