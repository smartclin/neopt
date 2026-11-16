import type { z } from "zod";

// src/features/patients/api.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { patientInsertSchema } from "./schema";

import {
  createPatientFn,
  fetchLapsedPatients,
  fetchPatientById,
  fetchPatientChart,
  fetchPatientForComposer,
  fetchPatientSummary,
  fetchPatientsByClinic,
  fetchPatientsSeenBetween,
  fetchPatientWithHistory,
  searchPatientsFn,
  updatePatientFn,
} from "./functions";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Single patient — name, DOB, contact details. Changes rarely. */
  DETAIL: 5 * 60_000,
  /** Patient for the composer — includes latest weight. Changes when a
   *  measurement is recorded, so slightly shorter. */
  COMPOSER: 60_000,
  /** Roster list. */
  LIST: 60_000,
  /** Full patient chart (visits, measurements, prescriptions). */
  CHART: 30_000,
  /** Summary snippet. */
  SUMMARY: 60_000,
  /** Search results — debounce the query on the client side. */
  SEARCH: 30_000,
  /** "Lost to follow-up" report — an aggregate, tolerate staleness. */
  REPORT: 120_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
//
// Every key starts with "patient". Invalidate the whole tree with
// `queryClient.invalidateQueries({ queryKey: patientKeys.all() })`, or a
// per-patient subtree with `patientKeys.detail(patientId)`.
// ─────────────────────────────────────────────────────────────────────────────

export const patientKeys = {
  all: () => ["patient"] as const,

  /** The roster list for a clinic. */
  list: (clinicId: string) => ["patient", "list", clinicId] as const,

  /** Search results within a clinic. */
  search: (clinicId: string, query: string) => ["patient", "search", clinicId, query] as const,

  /** Per-patient subtree — invalidating this drops composer + history +
   *  chart + summary at once. */
  detail: (patientId: string) => ["patient", "detail", patientId] as const,

  /** The composer needs name, DOB, allergies, latest weight. */
  composer: (patientId: string) => ["patient", "detail", patientId, "composer"] as const,

  /** Patient + visit tree. */
  history: (patientId: string) => ["patient", "detail", patientId, "history"] as const,

  /** Full chart: visits, measurements, prescriptions, notes. */
  chart: (patientId: string) => ["patient", "detail", patientId, "chart"] as const,

  /** Just the identity fields. */
  summary: (patientId: string) => ["patient", "detail", patientId, "summary"] as const,

  /** "Lost to follow-up" report. */
  lapsed: (clinicId: string, months: number) => ["patient", "lapsed", clinicId, months] as const,

  /** "Seen between" report. */
  seenBetween: (clinicId: string, from: string, to: string) =>
    ["patient", "seen-between", clinicId, from, to] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function getPatientQueryOptions(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => fetchPatientById({ data: { patientId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function getPatientForComposerQueryOptions(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.composer(patientId),
    queryFn: () => fetchPatientForComposer({ data: { patientId } }),
    staleTime: STALE_TIMES.COMPOSER,
  });
}

export function patientHistoryQuery(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.history(patientId),
    queryFn: () => fetchPatientWithHistory({ data: { patientId } }),
    staleTime: STALE_TIMES.CHART,
  });
}

export function patientChartQuery(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.chart(patientId),
    queryFn: () => fetchPatientChart({ data: { patientId } }),
    staleTime: STALE_TIMES.CHART,
  });
}

export function patientSummaryQuery(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.summary(patientId),
    queryFn: () => fetchPatientSummary({ data: { patientId } }),
    staleTime: STALE_TIMES.SUMMARY,
  });
}

export function patientsByClinicQuery(clinicId: string) {
  return queryOptions({
    queryKey: patientKeys.list(clinicId),
    queryFn: () => fetchPatientsByClinic({ data: { clinicId } }),
    staleTime: STALE_TIMES.LIST,
  });
}

/** Alias — `fetchPatients` is the same query as `fetchPatientsByClinic`. */
export const patientsListQuery = patientsByClinicQuery;

export function searchPatientsQuery(clinicId: string, query: string) {
  return queryOptions({
    queryKey: patientKeys.search(clinicId, query),
    queryFn: () => searchPatientsFn({ data: { clinicId, query } }),
    staleTime: STALE_TIMES.SEARCH,
    // Debounce `query` on the caller side. The server rejects an empty
    // query (`.min(1)`), so gate with `enabled`.
    enabled: query.trim().length > 0,
  });
}

export function lapsedPatientsQuery(clinicId: string, months = 6) {
  return queryOptions({
    queryKey: patientKeys.lapsed(clinicId, months),
    queryFn: () => fetchLapsedPatients({ data: { clinicId, months } }),
    staleTime: STALE_TIMES.REPORT,
  });
}

export function patientsSeenBetweenQuery(clinicId: string, from: string, to: string) {
  return queryOptions({
    queryKey: patientKeys.seenBetween(clinicId, from, to),
    queryFn: () => fetchPatientsSeenBetween({ data: { clinicId, from, to } }),
    staleTime: STALE_TIMES.REPORT,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call this after a patient mutation succeeds. Invalidates the roster for
 * the clinic and, for updates/deletes, the patient's own detail subtree
 * (which covers composer, history, chart, and summary).
 *
 * `createPatientFn` doesn't know the new patient's id yet, so pass only
 * `clinicId` — the roster and any list view will refetch.
 *
 * `updatePatientFn` and `deletePatientFn` should pass both.
 */
export function invalidateAfterPatientMutation(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  args: {
    clinicId: string;
    patientId?: string;
  },
): Promise<unknown> {
  const promises: Array<unknown> = [
    queryClient.invalidateQueries({
      queryKey: patientKeys.list(args.clinicId),
    }),
  ];

  if (args.patientId) {
    // `detail` is the parent of composer/history/chart/summary — one
    // invalidation drops all four.
    promises.push(
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(args.patientId),
      }),
    );
  }

  return Promise.all(promises);
}
// src/features/patients/queries.ts — append

/**
 * Update a patient.
 *
 * Invalidates:
 *   - the patient's detail subtree (composer, history, chart, summary)
 *   - the roster list for the patient's clinic
 *   - the patient search results (name changes invalidate the search)
 *
 * `patientId` is required; `clinicId` is optional because the mutation
 * input doesn't carry it — the caller usually has it from `useAuthSuspense`.
 */
export function useUpdatePatientMutation(args: { patientId: string; clinicId?: string }) {
  const queryClient = useQueryClient();
  const updatePatient = useServerFn(updatePatientFn);

  return useMutation({
    mutationFn: updatePatient,
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: patientKeys.detail(args.patientId),
        }),
        queryClient.invalidateQueries({ queryKey: patientKeys.all() }),
        ...(args.clinicId
          ? [
              queryClient.invalidateQueries({
                queryKey: patientKeys.list(args.clinicId),
              }),
            ]
          : []),
      ]);
    },
  });
}

type CreatePatientInput = z.infer<typeof patientInsertSchema>;

export function useCreatePatientMutation(args: { clinicId?: string }) {
  const queryClient = useQueryClient();
  const createPatient = useServerFn(createPatientFn);

  return useMutation({
    mutationKey: ["patient", "create", args.clinicId ?? ""],
    mutationFn: (input: CreatePatientInput) => createPatient({ data: input }),
    onSuccess: (_patient, variables) => {
      // Roster for this clinic + any search results are now stale.
      void invalidateAfterPatientMutation(queryClient, {
        clinicId: variables.clinicId,
      });
      void queryClient.invalidateQueries({ queryKey: patientKeys.all() });
    },
  });
}
