import { useQuery } from "@tanstack/react-query";
import { type AnyRoute, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { UserRoundIcon } from "lucide-react";
import { useMemo } from "react";

import { buttonVariants } from "#/components/ui/button-variants";
// TODO: switch to `@/features/growth/math/lms` once that module exists.
import { IconTile } from "@/components/blocks/icon-tile";
import { DataTable } from "@/components/tables/data-table";
import { type PageSize } from "@/components/tables/table-pagination";
import { decimalMonthsBetween } from "@/features/shared/helpers";

import type { Patient } from "../schema";

import { patientsByClinicQuery } from "../queries";

// ── Static module-scope config ──────────────────────────────────────────────

const features = tableFeatures({ rowPaginationFeature });

const column = createColumnHelper<typeof features, Patient>();
const EMPTY_PATIENTS: Patient[] = [];

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

  const all = patients ?? query.data ?? EMPTY_PATIENTS;
  const total = all.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const pageRows = useMemo(() => all.slice((page - 1) * size, page * size), [all, page, size]);

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

  return (
    <DataTable
      ariaLabel="Patients"
      emptyMessage="No patients registered in this clinic yet."
      errorDescription="The patient roster could not load. Check your connection and try again."
      errorTitle="Something Went Wrong"
      outOfRange={
        query.data && page > pageCount
          ? {
              backTo: () => (
                <Link className={buttonVariants()} to={"/app/patients"}>
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
