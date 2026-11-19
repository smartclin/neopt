import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { CalendarClockIcon } from "lucide-react";

import { IconTile } from "@/components/blocks/icon-tile";
import { formatTime } from "@/lib/dates";

import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type { AppointmentRow } from "../types";

export const appointmentTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const column = createColumnHelper<typeof appointmentTableFeatures, AppointmentRow>();

export const appointmentColumns = column.columns([
  column.accessor("scheduledAt", {
    header: "Time",
    meta: { width: "w-24" },
    cell: (info) => {
      // TanStack Start serializes Date values across the wire.
      const date = new Date(info.getValue());
      const isValid = !Number.isNaN(date.getTime());
      return (
        <span className="block truncate font-mono text-xs font-medium tabular-nums">
          {isValid ? formatTime(date) : "—"}
        </span>
      );
    },
  }),
  column.accessor((row) => row.patient?.lastName ?? "", {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const patient = row.original.patient;
      if (!patient) return <span>—</span>;

      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <IconTile>
            <CalendarClockIcon aria-hidden="true" />
          </IconTile>
          <div className="flex min-w-0 flex-col">
            <Link
              className="truncate font-medium underline-offset-4 hover:underline"
              params={{ patientId: patient.id }}
              search={{ tab: "overview" }}
              to="/app/patients/$patientId"
            >
              {patient.firstName} {patient.lastName}
            </Link>
            <span className="truncate font-mono text-xs">{patient.mrn}</span>
          </div>
        </div>
      );
    },
  }),
  column.accessor((row) => row.doctor?.name ?? "", {
    id: "doctor",
    header: "Doctor",
    meta: { width: "w-40", hideOnMobile: true },
    cell: ({ row }) => <span className="block truncate">{row.original.doctor?.name ?? "—"}</span>,
  }),
  column.accessor("durationMinutes", {
    header: "Duration",
    meta: { width: "w-24" },
    cell: (info) => (
      <span className="block text-right font-mono text-xs tabular-nums">{info.getValue()}m</span>
    ),
  }),
  column.accessor("status", {
    header: "Status",
    meta: { width: "w-28" },
    cell: (info) => <AppointmentStatusBadge status={info.getValue()} />,
  }),
  column.accessor("reason", {
    header: "Reason",
    meta: { width: "w-48", hideOnMobile: true },
    cell: (info) => (
      <span className="block truncate" title={info.getValue() ?? undefined}>
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
]);
