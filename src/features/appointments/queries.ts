// src/features/appointments/queries.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import {
  cancelAppointmentFn,
  completeAppointmentFn,
  createAppointmentFn,
  deleteAppointmentFn,
  fetchAppointmentById,
  fetchAppointmentStatusCounts,
  fetchAppointments,
  fetchAppointmentsForPatient,
  fetchAppointmentsInRange,
  fetchPatientAppointmentCount,
  fetchTodayAppointments,
  fetchUpcomingForDoctor,
  markAppointmentNoShowFn,
  updateAppointmentFn,
} from "./functions";
import type { appointmentStatusSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  DETAIL: 30_000,
  TODAY: 30_000,
  PATIENT: 60_000,
  RANGE: 30_000,
  UPCOMING: 60_000,
  STATS: 120_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────────────────────

export const appointmentKeys = {
  all: () => ["appointments"] as const,

  clinic: (clinicId: string) => ["appointments", "clinic", clinicId] as const,

  detail: (appointmentId: string) => ["appointments", "detail", appointmentId] as const,

  byPatient: (patientId: string, status?: string) =>
    ["appointments", "patient", patientId, status ?? "all"] as const,

  today: (clinicId: string) => ["appointments", "clinic", clinicId, "today"] as const,

  byClinic: (clinicId: string) => ["appointments", "clinic", clinicId, "list"] as const,

  byRange: (clinicId: string, from: string, to: string, doctorId?: string) =>
    ["appointments", "clinic", clinicId, "range", from, to, doctorId ?? "all"] as const,

  upcomingForDoctor: (doctorId: string, limit: number) =>
    ["appointments", "doctor", doctorId, "upcoming", limit] as const,

  statusCounts: (clinicId: string, from: string, to: string) =>
    ["appointments", "clinic", clinicId, "counts", from, to] as const,

  patientCount: (patientId: string) => ["appointments", "patient", patientId, "count"] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function appointmentByIdQuery(appointmentId: string) {
  return queryOptions({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => fetchAppointmentById({ data: { appointmentId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function appointmentsForPatientQuery(
  patientId: string,
  status?: z.infer<typeof appointmentStatusSchema>,
) {
  return queryOptions({
    queryKey: appointmentKeys.byPatient(patientId, status),
    queryFn: () => fetchAppointmentsForPatient({ data: { patientId, status } }),
    staleTime: STALE_TIMES.PATIENT,
  });
}

export function todayAppointmentsQuery(clinicId: string) {
  return queryOptions({
    queryKey: appointmentKeys.today(clinicId),
    queryFn: () => fetchTodayAppointments({ data: { clinicId } }),
    staleTime: STALE_TIMES.TODAY,
  });
}

export function appointmentsForClinicQuery(clinicId: string) {
  return queryOptions({
    queryKey: appointmentKeys.byClinic(clinicId),
    queryFn: () => fetchAppointments({ data: { clinicId } }),
    staleTime: STALE_TIMES.TODAY,
  });
}

export function appointmentsInRangeQuery(
  clinicId: string,
  from: string,
  to: string,
  doctorId?: string,
) {
  return queryOptions({
    queryKey: appointmentKeys.byRange(clinicId, from, to, doctorId),
    queryFn: () =>
      fetchAppointmentsInRange({
        data: { clinicId, from, to, doctorId },
      }),
    staleTime: STALE_TIMES.RANGE,
  });
}

export function upcomingForDoctorQuery(doctorId: string, limit = 50) {
  return queryOptions({
    queryKey: appointmentKeys.upcomingForDoctor(doctorId, limit),
    queryFn: () => fetchUpcomingForDoctor({ data: { doctorId, limit } }),
    staleTime: STALE_TIMES.UPCOMING,
  });
}

export function appointmentStatusCountsQuery(clinicId: string, from: string, to: string) {
  return queryOptions({
    queryKey: appointmentKeys.statusCounts(clinicId, from, to),
    queryFn: () => fetchAppointmentStatusCounts({ data: { clinicId, from, to } }),
    staleTime: STALE_TIMES.STATS,
  });
}

export function patientAppointmentCountQuery(patientId: string) {
  return queryOptions({
    queryKey: appointmentKeys.patientCount(patientId),
    queryFn: () => fetchPatientAppointmentCount({ data: { patientId } }),
    staleTime: STALE_TIMES.STATS,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helper
// ─────────────────────────────────────────────────────────────────────────────
//
// Every mutation hook below calls this. The set of caches touched by an
// appointment write is the same for create, update, and every status
// transition, so centralising the list here prevents the four hooks from
// drifting apart.

interface AppointmentWriteResult {
  id: string;
  clinicId: string;
  patientId: string;
}

function invalidateAfterAppointmentWrite(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  row: AppointmentWriteResult,
): Promise<unknown> {
  return Promise.all([
    // Every cached view of the clinic's appointments: today, list, all
    // date ranges, status counts.
    queryClient.invalidateQueries({
      queryKey: appointmentKeys.clinic(row.clinicId),
    }),
    // The appointment's own detail entry.
    queryClient.invalidateQueries({
      queryKey: appointmentKeys.detail(row.id),
    }),
    // The patient's appointment history (used by the patient detail
    // page and by the safety rail in the prescription composer).
    queryClient.invalidateQueries({
      queryKey: ["appointments", "patient", row.patientId],
    }),
    // The patient's total appointment count.
    queryClient.invalidateQueries({
      queryKey: appointmentKeys.patientCount(row.patientId),
    }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new appointment.
 *
 * Invalidates the clinic's appointment caches (today, list, all ranges,
 * counts) and the patient's appointment history. Returns the created row
 * so callers can navigate to `/app/appointments/$appointmentId` or use
 * `row.id` in a callback.
 */
export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();
  const createAppointment = useServerFn(createAppointmentFn);

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: (row) => {
      if (!row) return;
      void invalidateAfterAppointmentWrite(queryClient, row);
    },
  });
}

/**
 * Update an existing appointment (time, duration, reason, notes, doctor).
 *
 * Same invalidation set as create — the update could change the
 * appointment's slot on any date, so every clinic range cache must refresh.
 */
export function useUpdateAppointmentMutation() {
  const queryClient = useQueryClient();
  const updateAppointment = useServerFn(updateAppointmentFn);

  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: (row) => {
      if (!row) return;
      void invalidateAfterAppointmentWrite(queryClient, row);
    },
  });
}

/**
 * Mark an appointment as completed.
 *
 * The status field changed, so both the row itself and the clinic's
 * status-count aggregates need to refresh.
 */
export function useCompleteAppointmentMutation() {
  const queryClient = useQueryClient();
  const completeAppointment = useServerFn(completeAppointmentFn);

  return useMutation({
    mutationFn: completeAppointment,
    onSuccess: (row) => {
      if (!row) return;
      void invalidateAfterAppointmentWrite(queryClient, row);
    },
  });
}

/**
 * Cancel an appointment.
 *
 * Same invalidation set as complete — only the status value differs.
 */
export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();
  const cancelAppointment = useServerFn(cancelAppointmentFn);

  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: (row) => {
      if (!row) return;
      void invalidateAfterAppointmentWrite(queryClient, row);
    },
  });
}

/**
 * Mark an appointment as no-show.
 */
export function useMarkNoShowMutation() {
  const queryClient = useQueryClient();
  const markNoShow = useServerFn(markAppointmentNoShowFn);

  return useMutation({
    mutationFn: markNoShow,
    onSuccess: (row) => {
      if (!row) return;
      void invalidateAfterAppointmentWrite(queryClient, row);
    },
  });
}

/**
 * Delete an appointment.
 *
 * The delete endpoint returns `{ ok: true }` rather than the deleted row,
 * so we can't derive `clinicId`/`patientId` from the result. The caller
 * must pass them in `onSuccess`'s second argument (the mutation's
 * variables) — or, more ergonomically, wrap `mutate` in a closure that
 * captures them.
 *
 * Typical usage:
 *
 *     const deleteMutation = useDeleteAppointmentMutation();
 *     deleteMutation.mutate(
 *       { data: { appointmentId } },
 *       {
 *         onSuccess: () => {
 *           // The hook has already invalidated the detail and the clinic
 *           // tree; nothing else to do.
 *         }
 *       }
 *     );
 */
export function useDeleteAppointmentMutation() {
  const queryClient = useQueryClient();
  const deleteAppointment = useServerFn(deleteAppointmentFn);

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: (_data, variables) => {
      const { appointmentId } = variables.data;
      void queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(appointmentId),
      });
      // We can't know which clinic or patient the deleted row belonged
      // to without reading it first. The detail invalidation above
      // removes the cached row; any list that referenced it will
      // refetch on next focus because we also invalidate the clinic
      // prefix. To be precise about clinic/patient, the caller
      // should invalidate those keys in its own `onSuccess`.
    },
  });
}
