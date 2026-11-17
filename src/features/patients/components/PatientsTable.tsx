import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { CircleAlertIcon, SearchXIcon, UserRoundIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import { buttonVariants } from "#/components/ui/button-variants";
// TODO: switch to `@/features/growth/math/lms` once that module exists.
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
import { decimalMonthsBetween } from "@/features/shared/helpers";

import type { Patient } from "../schema";

import { patientsByClinicQuery } from "../queries";

// ── Static module-scope config ──────────────────────────────────────────────

const features = tableFeatures({ rowPaginationFeature });

const column = createColumnHelper<typeof features, Patient>();

/** Format an age in fractional months as "3y 4m" / "11m". */
function formatAge(months: number): string {
  if (months < 0 || !Number.isFinite(months)) return "—";
  const years = Math.floor(months / 12);
  const rem = Math.round(months - years * 12);
  if (rem >= 12) return `${years + 1}y`;
  if (years === 0) return `${rem}m`;
  return rem === 0 ? `${years}y` : `${years}y ${rem}m`;
}

const MODULE_LOAD_MS = Date.now();

function ageMonthsFromDob(dateOfBirth: string): number | null {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  return decimalMonthsBetween(dob, new Date(MODULE_LOAD_MS));
}

const columns = column.columns([
  column.accessor("mrn", {
    header: "MRN",
    meta: { width: "w-32 max-sm:w-24" },
    cell: ({ row }) => (
      <span className="block truncate font-mono text-xs tabular-nums">{row.original.mrn}</span>
    ),
  }),
  column.accessor((p) => `${p.firstName} ${p.lastName}`, {
    id: "name",
    header: "Patient",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <IconTile tone="secondary">
          <UserRoundIcon aria-hidden="true" />
        </IconTile>
        <Link
          className="truncate font-medium underline-offset-4 hover:underline"
          params={{ patientId: row.original.id }}
          search={{ tab: "overview" }}
          to={"/app/patients/$patientId"}
        >
          {row.original.firstName} {row.original.lastName}
        </Link>
      </div>
    ),
  }),
  column.accessor("sex", {
    header: "Sex",
    meta: { width: "w-20", hideOnMobile: true },
    cell: (info) => <span className=" capitalize">{info.getValue()}</span>,
  }),
  column.accessor("dateOfBirth", {
    header: "Age",
    meta: { width: "w-24 max-sm:w-20" },
    cell: ({ row }) => {
      const ageMonths = ageMonthsFromDob(row.original.dateOfBirth);
      return (
        <span className="block text-right tabular-nums">
          {ageMonths === null ? "—" : formatAge(ageMonths)}
        </span>
      );
    },
  }),
  column.accessor("phone", {
    header: "Phone",
    meta: { width: "w-36", hideOnMobile: true },
    cell: (info) => (
      <span className=" block truncate" title={info.getValue() ?? undefined}>
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
]);

const COLUMN_LAYOUT = columns.map((definition) => definition.meta ?? {});

// ── Component ──────────────────────────────────────────────────────────────

export interface PatientsTableProps<TRoute extends AnyRoute = AnyRoute> {
  route?: TRoute;
  clinicId?: string;
  page?: number;
  size?: PageSize;
  initialData?: Patient[];
  patients?: Patient[];
}

export function PatientsTable<TRoute extends AnyRoute>({
  route,
  clinicId = "clinic-main",
  page = 1,
  size = 20,
  initialData,
  patients,
}: PatientsTableProps<TRoute>) {
  const query = useQuery({
    ...patientsByClinicQuery(clinicId),
    initialData,
    enabled: !patients,
  });

  const all = patients ?? query.data ?? [];
  const total = all.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const pageRows = all.slice((page - 1) * size, page * size);

  const table = useTable(
    {
      key: "patients-table",
      features,
      columns,
      data: pageRows,
      getRowId: (patient) => patient.id,
      manualPagination: true,
      rowCount: total,
      state: { pagination: { pageIndex: page - 1, pageSize: size } },
    },
    (state) => ({ pagination: state.pagination }),
  );

  if (query.isError) {
    return (
      <SectionState
        action={
          <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
            {query.isFetching ? "Retrying…" : "Try Again"}
          </Button>
        }
        description="The patient roster could not load. Check your connection and try again."
        icon={CircleAlertIcon}
        title="Something Went Wrong"
      />
    );
  }

  if (query.data && page > pageCount) {
    return (
      <SectionState
        action={
          <Link className={buttonVariants()} to={"/app/patients"}>
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
      <Table aria-busy={query.isFetching} aria-label="Patients" layout="fixed">
        <TableColGroup columns={COLUMN_LAYOUT} />
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
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
                <p className=" py-8 text-center text-sm">
                  No patients registered in this clinic yet.
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
                  <div className="bg-muted h-7 w-full animate-pulse rounded-md" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        ariaLabel="Patient Pages"
        page={page}
        pageCount={pageCount}
        route={route}
        size={size}
      />
    </div>
  );
}
