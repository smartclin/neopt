import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Building2Icon } from "lucide-react";

import { buttonVariants } from "#/components/ui/button-variants";
import { IconTile } from "@/components/blocks/icon-tile";
import { DataTable } from "@/components/tables/data-table";
import { type PageSize } from "@/components/tables/table-pagination";

import type { Clinic } from "../schema";

// ── read ───────────────────────────────────────────────────────────────
import { clinicsQuery } from "../queries";

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const column = createColumnHelper<typeof features, Clinic>();
const EMPTY_CLINICS: Clinic[] = [];

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
    cell: (info) => <span className=" block truncate">{info.getValue() ?? "—"}</span>,
  }),
  column.accessor("phone", {
    header: "Phone",
    meta: { width: "w-36" },
    cell: (info) => (
      <span className=" block truncate font-mono text-xs tabular-nums">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  column.accessor("email", {
    header: "Email",
    meta: { width: "w-56", hideOnMobile: true },
    cell: (info) => <span className=" block truncate">{info.getValue() ?? "—"}</span>,
  }),
]);

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

  const allClinics = initialClinics ?? query.data ?? EMPTY_CLINICS;

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

  const pageCount = table.getPageCount();

  return (
    <DataTable
      ariaLabel="Clinics"
      emptyMessage="No clinics registered yet."
      errorDescription={query.error instanceof Error ? query.error.message : "An error occurred."}
      errorTitle="Failed to Load Clinics"
      outOfRange={
        query.data && page > pageCount && pageCount > 0
          ? {
              backTo: () => (
                <Link className={buttonVariants()} to={"/app/clinics"}>
                  Back To First Page
                </Link>
              ),
            }
          : undefined
      }
      pagination={{ page, pageCount, route, size }}
      query={query}
      table={table}
    />
  );
}
