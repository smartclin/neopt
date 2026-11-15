import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckIcon, CircleAlertIcon, CircleIcon, SyringeIcon } from "lucide-react";

import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
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
import { immunizationMatrixQuery } from "../queries";
import type { MatrixRow, MatrixVaccine } from "../types";

interface ImmunizationMatrixProps {
  clinicId: string;
  ageBracket?: "0-6" | "6-12" | "12-24" | ">24";
  onlyOverdue?: boolean;
}

const STATUS_STYLES = {
  given: {
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Icon: CheckIcon,
    label: "Given",
  },
  due: {
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    Icon: CircleIcon,
    label: "Due",
  },
  overdue: {
    className: "bg-destructive/10 text-destructive ring-1 ring-destructive/40",
    Icon: CircleAlertIcon,
    label: "Overdue",
  },
  refused: {
    className: "bg-muted text-muted-foreground",
    Icon: CircleIcon,
    label: "Refused",
  },
} as const;

// ── Column widths ──────────────────────────────────────────────────────
//
// Tailwind needs static class names to generate CSS. `w-${12 + n * 3}`
// produces a string at runtime that Tailwind never generated, so those
// columns get no width and the table layout breaks. This map lists the
// widths we actually use, bucketed by dose count.

const DOSE_COLUMN_WIDTH: Record<number, string> = {
  0: "w-12",
  1: "w-14",
  2: "w-16",
  3: "w-18",
  4: "w-20",
  5: "w-24",
};

function doseColumnWidth(doses: number | undefined): string {
  return DOSE_COLUMN_WIDTH[doses ?? 0] ?? "w-24";
}

export function ImmunizationMatrix({ clinicId, ageBracket, onlyOverdue }: ImmunizationMatrixProps) {
  // ── read via factory ──────────────────────────────────────────────
  const query = useQuery(immunizationMatrixQuery(clinicId, { ageBracket, onlyOverdue }));

  if (query.isError) {
    return (
      <SectionState
        action={
          <button
            className="text-sm underline-offset-4 hover:underline"
            onClick={() => void query.refetch()}
            type="button"
          >
            Try again
          </button>
        }
        description={query.error instanceof Error ? query.error.message : "Failed to load."}
        icon={CircleAlertIcon}
        title="Could not load immunization matrix"
      />
    );
  }

  if (query.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  const { vaccines, rows } = query.data ?? { vaccines: [], rows: [] };
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed py-12 text-center text-sm">
        No patients match this filter.
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-md border">
      <Table aria-label="Immunization matrix" layout="fixed">
        <TableColGroup
          columns={[
            { width: "w-56" },
            ...vaccines.map((v) => ({
              width: doseColumnWidth(v.doses),
            })),
          ]}
        />
        <TableHeader>
          <TableRow>
            <TableHead className="bg-background sticky left-0 z-10">Patient</TableHead>
            {vaccines.map((v) => (
              <TableHead
                className="text-center tracking-wider uppercase"
                colSpan={v.doses ?? 0}
                key={v.vaccineKey}
              >
                <span className="inline-flex items-center gap-1">
                  <SyringeIcon aria-hidden="true" className="text-muted-foreground size-3" />
                  {v.vaccineKey.toUpperCase()}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <MatrixTableRow key={row.patientId} row={row} vaccines={vaccines} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MatrixTableRow({ row, vaccines }: { row: MatrixRow; vaccines: MatrixVaccine[] }) {
  return (
    <TableRow className="group hover:bg-muted/40 cursor-pointer">
      <TableCell className="bg-background group-hover:bg-muted/40 sticky left-0 z-10">
        <Link
          className="flex min-w-0 flex-col"
          params={{ patientId: row.patientId }}
          to="/app/immunizations/$patientId"
        >
          <span className="truncate font-medium">
            {row.firstName} {row.lastName}
          </span>
          <span className="text-muted-foreground font-mono text-xs tabular-nums">{row.mrn}</span>
        </Link>
      </TableCell>
      {vaccines.flatMap((v) =>
        Array.from({ length: v.doses ?? 0 }, (_, i) => {
          const key = `${v.vaccineKey}-${i + 1}`;
          const status = row.cells[key];
          return (
            <TableCell className="px-1 text-center" key={key}>
              {status ? (
                <StatusCell status={status} />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          );
        }),
      )}
    </TableRow>
  );
}

function StatusCell({ status }: { status: keyof typeof STATUS_STYLES }) {
  const { className, Icon, label } = STATUS_STYLES[status];
  return (
    <span aria-label={label} className={className} role="img" title={label}>
      <Icon aria-hidden="true" className="size-3.5" />
    </span>
  );
}
