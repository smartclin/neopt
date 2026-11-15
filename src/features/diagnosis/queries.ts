// src/features/diagnosis/api.ts
import { queryOptions } from "@tanstack/react-query";
import {
  fetchDiagnosesForPatient,
  fetchDiagnosesForVisit,
  fetchDiagnosisById,
  fetchTopDiagnoses,
  searchDiagnosesFn,
} from "./functions";

// src/features/diagnosis/queries.ts — append

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { createDiagnosesFn, createDiagnosisFn } from "./functions";

// ─────────────────────────────────────────────────────────────────────────────
// Mutation hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create one or more diagnoses for a visit.
 *
 * Both the single and bulk paths invalidate the same caches — the visit's
 * diagnosis list, the patient's diagnosis history, the visit detail, and
 * (indirectly) the patient page. The `bulk` choice is only about which
 * server function is called; the cache strategy is identical.
 */
export function useCreateDiagnosesMutation(args: { visitId: string; patientId?: string }) {
  const queryClient = useQueryClient();
  const createMany = useServerFn(createDiagnosesFn);
  const createOne = useServerFn(createDiagnosisFn);

  // Two mutations on the same hook — one per shape. React Query caches
  // mutations by `mutationKey`, so we tag them.
  const invalidate = () => {
    const promises: Array<unknown> = [
      queryClient.invalidateQueries({
        queryKey: diagnosisKeys.byVisit(args.visitId),
      }),
      queryClient.invalidateQueries({ queryKey: ["visit", args.visitId] }),
    ];
    if (args.patientId) {
      promises.push(
        queryClient.invalidateQueries({
          queryKey: diagnosisKeys.byPatient(args.patientId),
        }),
      );
    }
    return Promise.all(promises);
  };

  const bulk = useMutation({
    mutationKey: ["diagnoses", "bulk", args.visitId],
    mutationFn: (rows: Parameters<typeof createMany>[0]["data"]["rows"]) =>
      createMany({ data: { rows } }),
    onSuccess: () => {
      void invalidate();
    },
  });

  const single = useMutation({
    mutationKey: ["diagnoses", "single", args.visitId],
    mutationFn: (row: Parameters<typeof createOne>[0]["data"]) => createOne({ data: row }),
    onSuccess: () => {
      void invalidate();
    },
  });

  return { bulk, single };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Single diagnosis detail. */
  DETAIL: 60_000,
  /** Diagnoses attached to one visit — changes when the visit is edited. */
  VISIT: 60_000,
  /** A patient's full diagnosis history. */
  PATIENT: 60_000,
  /** Clinic-wide search and aggregates. */
  CLINIC: 120_000,
} as const;

export const diagnosisKeys = {
  all: () => ["diagnoses"] as const,

  /** One diagnosis detail. */
  detail: (diagnosisId: string) => ["diagnoses", "detail", diagnosisId] as const,

  /** Diagnoses attached to one visit. */
  byVisit: (visitId: string) => ["diagnoses", "visit", visitId] as const,

  /** A patient's full diagnosis history. */
  byPatient: (patientId: string) => ["diagnoses", "patient", patientId] as const,

  /** Free-text search results within a clinic. */
  search: (clinicId: string, query: string) => ["diagnoses", "search", clinicId, query] as const,

  /** Top-N ICD codes for a clinic. */
  topForClinic: (clinicId: string, limit: number) => ["diagnoses", "top", clinicId, limit] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function diagnosisByIdQuery(diagnosisId: string) {
  return queryOptions({
    queryKey: diagnosisKeys.detail(diagnosisId),
    queryFn: () => fetchDiagnosisById({ data: { diagnosisId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function diagnosesForVisitQuery(visitId: string) {
  return queryOptions({
    queryKey: diagnosisKeys.byVisit(visitId),
    queryFn: () => fetchDiagnosesForVisit({ data: { visitId } }),
    staleTime: STALE_TIMES.VISIT,
  });
}

export function diagnosesForPatientQuery(patientId: string) {
  return queryOptions({
    queryKey: diagnosisKeys.byPatient(patientId),
    queryFn: () => fetchDiagnosesForPatient({ data: { patientId } }),
    staleTime: STALE_TIMES.PATIENT,
  });
}

export function searchDiagnosesQuery(clinicId: string, query: string) {
  return queryOptions({
    queryKey: diagnosisKeys.search(clinicId, query),
    queryFn: () => searchDiagnosesFn({ data: { clinicId, query } }),
    staleTime: STALE_TIMES.CLINIC,
    // The caller should debounce `query`. When `query` is empty the server
    // rejects it (`.min(1)`), so callers must gate with `enabled: query.length > 0`.
    enabled: query.length > 0,
  });
}

export function topDiagnosesQuery(clinicId: string, limit = 20) {
  return queryOptions({
    queryKey: diagnosisKeys.topForClinic(clinicId, limit),
    queryFn: () => fetchTopDiagnoses({ data: { clinicId, limit } }),
    staleTime: STALE_TIMES.CLINIC,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call this after any diagnosis mutation succeeds. Invalidates the visit's
 * diagnoses list (which the diagnosis form saves into) and the patient's
 * history (which the patient page renders).
 *
 * The list of caches touched by a write is knowledge that belongs in one
 * place — not duplicated across every mutation's `onSuccess`.
 */
export function invalidateAfterDiagnosisChange(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  args: {
    visitId?: string;
    patientId?: string;
    diagnosisId?: string;
  },
): Promise<unknown> {
  const promises: Array<unknown> = [];

  if (args.diagnosisId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: diagnosisKeys.detail(args.diagnosisId),
      }),
    );
  }

  if (args.visitId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: diagnosisKeys.byVisit(args.visitId),
      }),
    );
  }

  if (args.patientId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: diagnosisKeys.byPatient(args.patientId),
      }),
    );
  }

  return Promise.all(promises);
}
