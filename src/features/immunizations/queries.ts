// src/features/immunizations/api.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  fetchImmunizationCoverage,
  fetchImmunizationMatrix,
  fetchPatientImmunizations,
  recordImmunizationFn,
} from "./functions";

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────────────────────

export const immunizationKeys = {
  all: () => ["immunizations"] as const,

  /** Per-patient subtree — invalidate when a dose is recorded. */
  patient: (patientId: string) => ["immunizations", "patient", patientId] as const,

  /** Per-clinic coverage stats. */
  coverage: (clinicId: string) => ["immunizations", "coverage", clinicId] as const,

  /** Clinic-wide matrix. The `filter` object is serialized into the key
   *  so different filter combinations are cached independently. */
  matrix: (clinicId: string, filter: { ageBracket?: string; onlyOverdue?: boolean } = {}) =>
    [
      "immunizations",
      "matrix",
      clinicId,
      filter.ageBracket ?? "all",
      filter.onlyOverdue ? "overdue" : "any",
    ] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function patientImmunizationsQuery(patientId: string, patientDob?: string) {
  return queryOptions({
    queryKey: immunizationKeys.patient(patientId),
    queryFn: () => fetchPatientImmunizations({ data: { patientId, patientDob } }),
    staleTime: 30 * 1000,
  });
}

export function immunizationCoverageQuery(clinicId: string) {
  return queryOptions({
    queryKey: immunizationKeys.coverage(clinicId),
    queryFn: () => fetchImmunizationCoverage({ data: { clinicId } }),
    staleTime: 30 * 1000,
  });
}

export function immunizationMatrixQuery(
  clinicId: string,
  filter: {
    ageBracket?: "0-6" | "6-12" | "12-24" | ">24";
    onlyOverdue?: boolean;
  } = {},
) {
  return queryOptions({
    queryKey: immunizationKeys.matrix(clinicId, filter),
    queryFn: () => fetchImmunizationMatrix({ data: { clinicId, filter } }),
    staleTime: 30 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Invalidate every cache that a dose change affects. Call from `onSuccess`
 * of the mutation (or wrap the mutation and do it there):
 *
 *     onSuccess: () => invalidateImmunizationCaches(queryClient, patientId, clinicId)
 *
 * Note: this helper fires all invalidations in parallel and returns a
 * Promise that resolves when all queries finish invalidating. Callers that
 * need to *wait* for the refetch before navigating should `await` it;
 * callers that just want the invalidation dispatched can `void` it (as the
 * original did).
 */
export function invalidateImmunizationCaches(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  patientId: string,
  clinicId: string,
): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: immunizationKeys.patient(patientId),
    }),
    queryClient.invalidateQueries({
      queryKey: immunizationKeys.coverage(clinicId),
    }),
    // Matches every matrix filter combination for this clinic.
    queryClient.invalidateQueries({
      queryKey: ["immunizations", "matrix", clinicId],
    }),
  ]);
}
export function useRecordImmunizationMutation() {
  const queryClient = useQueryClient();
  const record = useServerFn(recordImmunizationFn);

  return useMutation({
    mutationFn: record,
    onSuccess: async (_row, variables) => {
      const promises: Array<Promise<unknown>> = [
        queryClient.invalidateQueries({
          queryKey: immunizationKeys.patient(variables.data.patientId),
        }),
      ];

      // Coverage and matrix are clinic-scoped. The mutation input
      // doesn't carry clinicId, so invalidate by prefix — every
      // clinic's coverage/matrix cache will refetch, which is cheap
      // for typical clinic counts and safe if a user belongs to
      // multiple clinics.
      promises.push(
        queryClient.invalidateQueries({
          queryKey: ["immunizations", "coverage"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["immunizations", "matrix"],
        }),
      );

      await Promise.all(promises);
    },
  });
}
