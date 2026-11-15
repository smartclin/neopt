// src/features/prescriptions/api.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPrescriptionsFn,
  fetchActivePrescriptions,
  fetchPatientPrescriptionCount,
  fetchPrescriptionById,
  fetchPrescriptionRegister,
  fetchPrescriptionsByPrescriber,
  fetchPrescriptionsForPatient,
  fetchPrescriptionsForVisit,
  fetchTopMedications,
} from "./functions";
import type { PrescriptionRegisterSearch } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  DETAIL: 60_000,
  VISIT: 60_000,
  PATIENT: 60_000,
  ACTIVE: 15_000,
  PRESCRIBER: 60_000,
  CLINIC: 120_000,
  REGISTER: 30_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────────────────────

export const prescriptionKeys = {
  all: () => ["prescriptions"] as const,

  detail: (prescriptionId: string) => ["prescriptions", "detail", prescriptionId] as const,

  byVisit: (visitId: string) => ["prescriptions", "visit", visitId] as const,

  byPatient: (patientId: string) => ["prescriptions", "patient", patientId] as const,

  active: (patientId: string) => ["prescriptions", "patient", patientId, "active"] as const,

  byPrescriber: (userId: string, limit: number) =>
    ["prescriptions", "prescriber", userId, limit] as const,

  topForClinic: (clinicId: string, limit: number) =>
    ["prescriptions", "top", clinicId, limit] as const,

  patientCount: (patientId: string) => ["prescriptions", "count", patientId] as const,

  /** Register prefix — invalidate this to refresh every page/filter
   *  combination for one clinic. */
  registerRoot: (clinicId: string) => ["prescriptions", "register", clinicId] as const,

  /** One page of the register. `page` and `size` are part of the key
   *  so each page has its own cache entry; without them, page 2 would
   *  return page 1's rows until staleTime expires. */
  register: (clinicId: string, search: PrescriptionRegisterSearch) =>
    [
      "prescriptions",
      "register",
      clinicId,
      search.q ?? "",
      search.medication ?? "",
      search.prescriberId ?? "",
      search.status,
      search.from ?? "",
      search.to ?? "",
      search.page,
      search.size,
    ] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function prescriptionByIdQuery(prescriptionId: string) {
  return queryOptions({
    queryKey: prescriptionKeys.detail(prescriptionId),
    queryFn: () => fetchPrescriptionById({ data: { prescriptionId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function prescriptionsForVisitQuery(visitId: string) {
  return queryOptions({
    queryKey: prescriptionKeys.byVisit(visitId),
    queryFn: () => fetchPrescriptionsForVisit({ data: { visitId } }),
    staleTime: STALE_TIMES.VISIT,
  });
}

export function prescriptionsForPatientQuery(patientId: string) {
  return queryOptions({
    queryKey: prescriptionKeys.byPatient(patientId),
    queryFn: () => fetchPrescriptionsForPatient({ data: { patientId } }),
    staleTime: STALE_TIMES.PATIENT,
  });
}

export function activePrescriptionsQuery(patientId: string) {
  return queryOptions({
    queryKey: prescriptionKeys.active(patientId),
    queryFn: () => fetchActivePrescriptions({ data: { patientId } }),
    staleTime: STALE_TIMES.ACTIVE,
  });
}

export function prescriptionsByPrescriberQuery(userId: string, limit = 100) {
  return queryOptions({
    queryKey: prescriptionKeys.byPrescriber(userId, limit),
    queryFn: () => fetchPrescriptionsByPrescriber({ data: { userId, limit } }),
    staleTime: STALE_TIMES.PRESCRIBER,
  });
}

export function topMedicationsQuery(clinicId: string, limit = 20) {
  return queryOptions({
    queryKey: prescriptionKeys.topForClinic(clinicId, limit),
    queryFn: () => fetchTopMedications({ data: { clinicId, limit } }),
    staleTime: STALE_TIMES.CLINIC,
  });
}

export function patientPrescriptionCountQuery(patientId: string) {
  return queryOptions({
    queryKey: prescriptionKeys.patientCount(patientId),
    queryFn: () => fetchPatientPrescriptionCount({ data: { patientId } }),
    staleTime: STALE_TIMES.CLINIC,
  });
}

export function prescriptionRegisterQuery(clinicId: string, search: PrescriptionRegisterSearch) {
  return queryOptions({
    queryKey: prescriptionKeys.register(clinicId, search),
    queryFn: () => fetchPrescriptionRegister({ data: { clinicId, search } }),
    staleTime: STALE_TIMES.REGISTER,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation
// ─────────────────────────────────────────────────────────────────────────────

interface PrescriptionInvalidationArgs {
  clinicId: string;
  patientId?: string;
  /**
   * When `visitId` is provided, the visit's prescription list is
   * invalidated. When it is not, the visit list may remain stale —
   * pass it whenever it's available. It is NOT derivable from
   * `prescriptionId` without an extra read.
   */
  visitId?: string;
  prescriptionId?: string;
}

export function invalidateAfterPrescriptionChange(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  args: PrescriptionInvalidationArgs,
): Promise<unknown> {
  const promises: Array<unknown> = [
    // Prefix invalidation — matches every register page and filter
    // combination for this clinic.
    queryClient.invalidateQueries({
      queryKey: prescriptionKeys.registerRoot(args.clinicId),
    }),
  ];

  if (args.prescriptionId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: prescriptionKeys.detail(args.prescriptionId),
      }),
    );
  }

  if (args.visitId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: prescriptionKeys.byVisit(args.visitId),
      }),
    );
  }

  if (args.patientId) {
    // `byPatient` is the parent of `active` — one invalidation drops both.
    promises.push(
      queryClient.invalidateQueries({
        queryKey: prescriptionKeys.byPatient(args.patientId),
      }),
      queryClient.invalidateQueries({
        queryKey: prescriptionKeys.patientCount(args.patientId),
      }),
    );
  }

  return Promise.all(promises);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composer-facing queries
//
// TODO: move to `features/composer/queries.ts` so this file stays
// scoped to prescriptions. Until then, the re-exports live here so
// the composer route has one import path.
// ─────────────────────────────────────────────────────────────────────────────

export const getActivePrescriptionsQuery = activePrescriptionsQuery;

export { getPatientForComposerQueryOptions } from "@/features/patients/queries";

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create one or more prescriptions.
 *
 * `clinicId`, `patientId`, and `visitId` are supplied at hook
 * construction so `onSuccess` can invalidate the patient's cache
 * subtree and the visit's prescription list. If the caller doesn't
 * have these at construction time, they can still be passed via the
 * mutation variables and read from `variables` in `onSuccess` — but
 * the hook signature needs them to satisfy `invalidateAfterPrescriptionChange`.
 */
export function useCreatePrescriptionsMutation(args: {
  clinicId: string;
  patientId: string;
  visitId: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["prescriptions", "create", args.visitId],
    mutationFn: (variables: Parameters<typeof createPrescriptionsFn>[0]) =>
      createPrescriptionsFn(variables),
    onSuccess: () =>
      invalidateAfterPrescriptionChange(queryClient, {
        clinicId: args.clinicId,
        patientId: args.patientId,
        visitId: args.visitId,
      }),
  });
}
