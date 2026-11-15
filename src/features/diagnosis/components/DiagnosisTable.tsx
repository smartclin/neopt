import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CircleAlertIcon, SearchXIcon, StethoscopeIcon } from "lucide-react";
import { buttonVariants } from "#/components/ui/button-variants";
import { IconTile } from "@/components/blocks/icon-tile";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { type PageSize, TablePagination } from "@/components/tables/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── read ───────────────────────────────────────────────────────────────
import { diagnosesForVisitQuery } from "../queries";

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

const features = tableFeatures({ rowPaginationFeature });

const column = createColumnHelper<typeof features, DiagnosisRow>();

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
      return (
        <Badge className="capitalize" variant={TYPE_VARIANT[type]}>
          {type}
        </Badge>
      );
    },
  }),
  column.accessor("createdAt", {
    header: "Visited",
    meta: { width: "w-32 max-sm:w-24" },
    cell: ({ row }) => {
      const visitedAt = row.original.createdAt;
      if (!visitedAt) return <span className="text-muted-foreground">—</span>;
      const date = new Date(visitedAt);
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
  { heading: "ICD-10", width: "w-28", hideOnMobile: false },
  { heading: "Description" },
  { heading: "Type", width: "w-24", hideOnMobile: false },
  { heading: "Visited", width: "w-32", hideOnMobile: true },
];

// ── Component ──────────────────────────────────────────────────────────

interface DiagnosisTableProps<TRoute extends AnyRoute> {
  route?: TRoute;
  visitId: string;
  page?: number;
  size?: PageSize;
}

export function DiagnosisTable<TRoute extends AnyRoute>({
  route,
  visitId,
  page = 1,
  size = 20,
}: DiagnosisTableProps<TRoute>) {
  const query = useQuery({
    ...diagnosesForVisitQuery(visitId),
    enabled: Boolean(visitId),
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
        title="Could Not Load Diagnoses"
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
      <Table aria-busy={query.isFetching} aria-label="Diagnoses" layout="fixed">
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
                  No diagnoses recorded for this visit yet.
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
        ariaLabel="Diagnosis Pages"
        page={page}
        pageCount={pageCount}
        route={route}
        size={size}
      />
    </div>
  );
}
