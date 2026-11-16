import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Building2Icon, CircleAlertIcon, SearchXIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import { buttonVariants } from "#/components/ui/button-variants";
import { IconTile } from "@/components/blocks/icon-tile";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { type PageSize, TablePagination } from "@/components/tables/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Clinic } from "../schema";

// ── read ───────────────────────────────────────────────────────────────
import { clinicsQuery } from "../queries";

const features = tableFeatures({ rowPaginationFeature });

const column = createColumnHelper<typeof features, Clinic>();

const columns = column.columns([
  column.accessor("name", {
    header: "Clinic",
    cell: (info) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <IconTile tone="secondary">
          <Building2Icon aria-hidden="true" />
        </IconTile>
        <Link
          className="truncate font-medium underline-offset-4 hover:underline"
          params={{ clinicId: info.row.original.id }}
          to={"/app/clinics/$clinicId"}
        >
          {info.getValue()}
        </Link>
      </div>
    ),
  }),
  column.accessor("address", {
    header: "Address",
    meta: { width: "w-72", hideOnMobile: true },
    cell: (info) => (
      <span className="text-muted-foreground block truncate">{info.getValue() ?? "—"}</span>
    ),
  }),
  column.accessor("phone", {
    header: "Phone",
    meta: { width: "w-36" },
    cell: (info) => (
      <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  column.accessor("email", {
    header: "Email",
    meta: { width: "w-56", hideOnMobile: true },
    cell: (info) => (
      <span className="text-muted-foreground block truncate">{info.getValue() ?? "—"}</span>
    ),
  }),
]);

const COLUMN_LAYOUT = [
  { heading: "Clinic" },
  { heading: "Address", width: "w-72", hideOnMobile: true },
  { heading: "Phone", width: "w-36" },
  { heading: "Email", width: "w-56", hideOnMobile: true },
];

export interface ClinicsTableProps<TRoute extends AnyRoute = AnyRoute> {
  route?: TRoute;
  page?: number;
  size?: PageSize;
  /**
   * Pre-fetched clinics (e.g. from a route loader). When provided, the
   * component renders these instead of firing its own query. The
   * underlying cache is still populated by `ensureQueryData` in the
   * loader, so invalidations from mutation hooks reach it.
   */
  clinics?: Clinic[];
}

export function ClinicsTable<TRoute extends AnyRoute>({
  route,
  page = 1,
  size = 20,
  clinics: initialClinics,
}: ClinicsTableProps<TRoute>) {
  // ── read via factory ──────────────────────────────────────────────
  const query = useQuery({
    ...clinicsQuery(),
    enabled: !initialClinics,
  });

  const allClinics = initialClinics ?? query.data ?? [];

  const table = useTable({
    data: allClinics,
    columns,
    features,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: size,
      },
    },
  });

  if (query.isError) {
    return (
      <SectionState
        action={
          <Button onClick={() => void query.refetch()} variant="outline">
            Try Again
          </Button>
        }
        description={query.error instanceof Error ? query.error.message : "An error occurred."}
        icon={CircleAlertIcon}
        title="Failed to Load Clinics"
      />
    );
  }

  const pageCount = table.getPageCount();

  if (query.data && page > pageCount && pageCount > 0) {
    return (
      <SectionState
        action={
          <Link className={buttonVariants()} to={"/app/clinics"}>
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
      <Table aria-busy={query.isFetching} aria-label="Clinics" layout="fixed">
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
                  No clinics registered yet.
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
            Array.from({ length: size }, (_, row) => `loading-${row}`).map((key) => (
              <TableRow key={key}>
                <TableCell colSpan={leafColumnCount}>
                  <div className="bg-muted/60 h-6 w-full animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        ariaLabel="Clinic Pages"
        page={page}
        pageCount={pageCount}
        route={route}
        size={size}
      />
    </div>
  );
}
