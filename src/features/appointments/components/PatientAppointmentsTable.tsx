import { useQuery } from "@tanstack/react-query";
import { useTable } from "@tanstack/react-table";

import { DataTable } from "@/components/tables/data-table";

import { appointmentsForPatientQuery } from "../queries";
import type { AppointmentRow } from "../types";
import { appointmentColumns, appointmentTableFeatures } from "./columns";

const EMPTY_APPOINTMENTS: AppointmentRow[] = [];

interface PatientAppointmentsTableProps {
  patientId: string;
}

export function PatientAppointmentsTable({ patientId }: PatientAppointmentsTableProps) {
  const query = useQuery(appointmentsForPatientQuery(patientId));
  const appointments = query.data ?? EMPTY_APPOINTMENTS;

  const table = useTable({
    data: appointments,
    columns: appointmentColumns,
    features: appointmentTableFeatures,
    getRowId: (row) => row.id,
    state: { pagination: { pageIndex: 0, pageSize: Math.max(appointments.length, 1) } },
  });

  return (
    <DataTable
      ariaLabel="Patient appointments"
      emptyMessage="No appointments recorded for this patient."
      errorDescription={
        query.error instanceof Error ? query.error.message : "An unexpected error occurred."
      }
      errorTitle="Failed to Load Appointments"
      query={query}
      table={table}
    />
  );
}
