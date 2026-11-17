import { Link } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowRight, Calendar, Stethoscope } from "lucide-react";
import * as React from "react";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";

import type { Visit } from "../schema";

type VisitRow = Visit & {
  measurements?: Array<{ id: string; indicator: string; value: number }>;
  diagnoses?: Array<{ id: string; description: string; icdCode: string }>;
  prescriptions?: Array<{ id: string; medicationName: string }>;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  } | null;
};

interface VisitsTableProps {
  visits: VisitRow[];
  showPatientColumn?: boolean;
}

const features = tableFeatures({});
const column = createColumnHelper<typeof features, VisitRow>();

export function VisitsTable({ visits, showPatientColumn = false }: VisitsTableProps) {
  const columns = React.useMemo(
    () =>
      column.columns([
        column.accessor((row) => row.visitedAt, {
          id: "visitedAt",
          header: "Visit Date",
          meta: { width: "w-40" },
          cell: ({ row }) => {
            const dateStr = row.original.visitedAt
              ? formatDateTime(new Date(row.original.visitedAt))
              : "—";
            return (
              <div className="flex items-center gap-1.5">
                <Calendar aria-hidden="true" className="size-3.5" />
                <span>{dateStr}</span>
              </div>
            );
          },
        }),
        ...(showPatientColumn
          ? [
              column.accessor((row) => row.patient?.lastName ?? "", {
                id: "patient",
                header: "Patient",
                cell: ({ row }) =>
                  row.original.patient ? (
                    <Link
                      className="font-medium hover:underline"
                      params={{ patientId: row.original.patient.id }}
                      search={{ tab: "overview" }}
                      to="/app/patients/$patientId"
                    >
                      {row.original.patient.firstName} {row.original.patient.lastName}{" "}
                      <span className="text-xs">({row.original.patient.mrn})</span>
                    </Link>
                  ) : (
                    "—"
                  ),
              }),
            ]
          : []),
        column.accessor((row) => row.ageMonths, {
          id: "ageAtVisit",
          header: "Age at Visit",
          meta: { width: "w-28" },
          cell: ({ row }) => {
            const ageDisplay =
              row.original.ageYears != null && row.original.ageYears > 0
                ? `${row.original.ageYears}y ${row.original.ageMonthsRemainder ?? 0}m`
                : `${row.original.ageMonths.toFixed(1)}m`;
            return <Badge variant="outline">{ageDisplay}</Badge>;
          },
        }),
        column.accessor((row) => row.measurements?.length ?? 0, {
          id: "measurements",
          header: "Vitals / Anthropometrics",
          meta: { width: "w-44" },
          cell: (info) => <span className="text-xs">{info.getValue()} recorded</span>,
        }),
        column.accessor((row) => row.diagnoses?.map((diagnosis) => diagnosis.icdCode) ?? [], {
          id: "diagnoses",
          header: "Diagnoses",
          meta: { width: "w-36", hideOnMobile: true },
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
              {row.original.diagnoses?.length ? (
                row.original.diagnoses.slice(0, 2).map((diagnosis) => (
                  <Badge key={diagnosis.id} variant="secondary">
                    {diagnosis.icdCode}
                  </Badge>
                ))
              ) : (
                <span className="text-xs">—</span>
              )}
            </div>
          ),
        }),
        column.accessor((row) => row.prescriptions?.length ?? 0, {
          id: "prescriptions",
          header: "Prescriptions",
          meta: { width: "w-36", hideOnMobile: true },
          cell: (info) => <span className="text-xs">{info.getValue()} medications</span>,
        }),
        column.display({
          id: "actions",
          header: "Actions",
          meta: { width: "w-28" },
          cell: ({ row }) => (
            <Link
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              params={{ patientId: row.original.patientId }}
              search={{ tab: "visits" }}
              to="/app/patients/$patientId"
            >
              Open <ArrowRight aria-hidden="true" className="ml-1 size-3" />
            </Link>
          ),
        }),
      ]),
    [showPatientColumn],
  );
  const table = useTable({
    features,
    columns,
    data: visits,
    getRowId: (visit) => visit.id,
  });

  return (
    <div className="rounded-md border">
      <DataTable
        ariaLabel="Visits"
        emptyMessage={
          <div className="flex flex-col items-center justify-center">
            <Stethoscope aria-hidden="true" className="size-8" />
            <p className="mt-2 text-sm font-medium">No visits recorded yet</p>
            <p className="text-xs">
              Record a new clinical encounter to begin tracking patient progress.
            </p>
          </div>
        }
        table={table}
      />
    </div>
  );
}
