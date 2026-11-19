import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { StethoscopeIcon } from "lucide-react";

import { buttonVariants } from "#/components/ui/button-variants";
import { IconTile } from "@/components/blocks/icon-tile";
import { DataTable } from "@/components/tables/data-table";
import { type PageSize } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatStatusLabel } from "@/lib/dates";

// ── read ───────────────────────────────────────────────────────────────
import { diagnosesForPatientQuery, diagnosesForVisitQuery } from "../queries";

// ── row type — derived from the query factory's concrete queryFn ───────
//
// `ReturnType<typeof diagnosesForVisitQuery>["queryFn"]` is
//   `QueryFunction<TData, TKey, never> | undefined`
// — an *optional* union. Two problems:
//
//   1. `Awaited<QueryFunction<...>>` does NOT unwrap to `TData`; it stays
//      `QueryFunction<...>`, because `QueryFunction` is a function, not a
//      promise. So `[number]` fails (TS2537).
//
//   2. Because the union includes `undefined`, the whole expression
//      collapses, and every downstream `row.original.*` access loses its
//      type, which then trips TS7053 on `TYPE_VARIANT[type]`.
//
// The fix is to infer the data type from the queryFn's *return* type via
// `infer R` on the function signature — no `queryFn` generic, no
// importing the server function into the component.
type QueryFnData<TQueryOptions> = TQueryOptions extends {
  queryFn?: (...args: never[]) => infer R;
}
  ? Awaited<R>
  : never;

type DiagnosisRow = QueryFnData<ReturnType<typeof diagnosesForVisitQuery>>[number];

// ── Static module-scope config ─────────────────────────────────────────

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const column = createColumnHelper<typeof features, DiagnosisRow>();
const EMPTY_DIAGNOSES: DiagnosisRow[] = [];

const TYPE_VARIANT = {
  primary: "default",
  secondary: "secondary",
} as const satisfies Record<DiagnosisRow["type"], "default" | "secondary">;

const columns = column.columns([
  column.accessor("icdCode", {
    header: "ICD-10",
    meta: { width: "w-28 max-sm:w-24" },
    cell: ({ row }) => (
      <span className="block truncate font-mono text-xs font-medium tabular-nums">
        {row.original.icdCode}
      </span>
    ),
  }),
  column.accessor("description", {
    header: "Description",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5 py-1">
        <IconTile tone="secondary">
          <StethoscopeIcon aria-hidden="true" />
        </IconTile>
        <span className="truncate font-medium">{row.original.description}</span>
      </div>
    ),
  }),
  column.accessor("type", {
    header: "Type",
    meta: { width: "w-24" },
    cell: ({ row }) => {
      const type = row.original.type;
      return <Badge variant={TYPE_VARIANT[type]}>{formatStatusLabel(type)}</Badge>;
    },
  }),
  column.accessor("createdAt", {
    header: "Visited",
    meta: { width: "w-32 max-sm:w-24", hideOnMobile: true },
    cell: ({ row }) => {
      const visitedAt = row.original.createdAt;
      if (!visitedAt) return <span className="">—</span>;
      const date = new Date(visitedAt);
      return (
        <span className=" block truncate font-mono text-xs tabular-nums">{formatDate(date)}</span>
      );
    },
  }),
]);

// ── Component ──────────────────────────────────────────────────────────

type DiagnosisTableProps<TRoute extends AnyRoute> = {
  route?: TRoute;
  page?: number;
  size?: PageSize;
} & (
  | { visitId: string; patientId?: never }
  | { patientId: string; visitId?: never }
);

export function DiagnosisTable<TRoute extends AnyRoute>(props: DiagnosisTableProps<TRoute>) {
  const { route, page = 1, size = 20 } = props;
  const patientId = props.patientId;
  const visitId = props.visitId;
  const query = useQuery(
    patientId
      ? diagnosesForPatientQuery(patientId)
      : getVisitDiagnosisQuery(visitId),
  );

  const all = query.data ?? EMPTY_DIAGNOSES;

  const table = useTable({
    data: all,
    columns,
    features,
    getRowId: (row) => row.id,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: patientId ? Math.max(all.length, 1) : size,
      },
    },
  });

  const pageCount = table.getPageCount();

  return (
    <DataTable
      ariaLabel="Diagnoses"
      emptyMessage={
        patientId
          ? "No diagnoses recorded for this patient yet."
          : "No diagnoses recorded for this visit yet."
      }
      errorDescription={
        query.error instanceof Error ? query.error.message : "An unexpected error occurred."
      }
      errorTitle="Could Not Load Diagnoses"
      outOfRange={
        all.length > 0 && page > pageCount
          ? {
              backTo: () =>
                patientId ? (
                  <Link
                    className={buttonVariants()}
                    params={{ patientId }}
                    search={{ tab: "diagnoses" }}
                    to="/app/patients/$patientId"
                  >
                    Back To First Page
                  </Link>
                ) : visitId ? (
                  <Link
                    className={buttonVariants()}
                    params={{ visitId } as never}
                    to={route?.fullPath ?? ("/app/visits/$visitId" as never)}
                  >
                    Back To First Page
                  </Link>
                ) : null,
            }
          : undefined
      }
      pagination={patientId ? undefined : { page, pageCount, route, size }}
      query={query}
      skeletonRowCount={Math.min(size, 3)}
      table={table}
    />
  );
}

function getVisitDiagnosisQuery(visitId: string | undefined) {
  if (!visitId) throw new Error("A visit ID is required to load visit diagnoses.");
  return diagnosesForVisitQuery(visitId);
}
