// features/visits/query-options.ts
//
// Everything React Query reads or writes about visits. Query keys,
// queryOptions factories, and the post-mutation invalidation helper.
//
// Rule of thumb: if it imports `queryOptions` or `useMutation`, it lives
// here. If it imports `createServerFn`, it lives in `./functions`. If it
// imports `#/db`, it lives in `../../db/queries/visits.queries`.

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import {
  createVisitFn,
  deleteVisitFn,
  fetchAllVisits,
  fetchVisitById,
  fetchVisitsForClinic,
  fetchVisitsForPatient,
  fetchVisitWithDetails,
} from "./functions";
import type { visitSearchSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Stale times
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Single visit row. */
  DETAIL: 60_000,
  /** Visit with measurements, diagnoses, prescriptions — heavier query. */
  WITH_DETAILS: 30_000,
  /** Patient's visit history. */
  PATIENT: 60_000,
  /** Clinic's visit list. */
  CLINIC: 60_000,
  /** Global "recent visits" list — used by the top-level visits page. */
  ALL: 60_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────────────────────

type VisitSearch = z.infer<typeof visitSearchSchema>;

export const visitKeys = {
  all: () => ["visit"] as const,

  /** Global "recent visits" list (clinic-scoped). */
  recent: (clinicId: string) => ["visit", "recent", clinicId] as const,

  /** A clinic's visit list with the search/filter applied. */
  list: (clinicId: string, search: VisitSearch | undefined) =>
    [
      "visit",
      "list",
      clinicId,
      search?.page ?? 1,
      search?.pageSize ?? 25,
      search?.sort ?? "visitedAt",
      search?.dir ?? "desc",
      search?.doctorId ?? "any",
      search?.patientId ?? "any",
    ] as const,

  /** Per-patient subtree. */
  patient: (patientId: string) => ["visit", "patient", patientId] as const,

  /** Single visit row. */
  detail: (visitId: string) => ["visit", "detail", visitId] as const,

  /** Visit + measurements + diagnoses + prescriptions. */
  withDetails: (visitId: string) => ["visit", "detail", visitId, "details"] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function visitQuery(visitId: string) {
  return queryOptions({
    queryKey: visitKeys.detail(visitId),
    queryFn: () => fetchVisitById({ data: { visitId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function visitWithDetailsQuery(visitId: string) {
  return queryOptions({
    queryKey: visitKeys.withDetails(visitId),
    queryFn: () => fetchVisitWithDetails({ data: { visitId } }),
    staleTime: STALE_TIMES.WITH_DETAILS,
  });
}

export function patientVisitsQuery(patientId: string) {
  return queryOptions({
    queryKey: visitKeys.patient(patientId),
    queryFn: () => fetchVisitsForPatient({ data: { patientId } }),
    staleTime: STALE_TIMES.PATIENT,
  });
}

export function clinicVisitsQuery(clinicId: string, search?: VisitSearch) {
  return queryOptions({
    queryKey: visitKeys.list(clinicId, search),
    queryFn: () => fetchVisitsForClinic({ data: { clinicId, search } }),
    staleTime: STALE_TIMES.CLINIC,
  });
}

export function recentVisitsQuery(clinicId: string) {
  return queryOptions({
    queryKey: visitKeys.recent(clinicId),
    queryFn: () => fetchAllVisits({ data: { clinicId } }),
    staleTime: STALE_TIMES.ALL,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call after a visit mutation succeeds.
 *
 * A visit write touches:
 *   1. The visit's own detail entries (`visitKeys.detail(visitId)`).
 *   2. The patient's visit history (`visitKeys.patient(patientId)`).
 *   3. The clinic's visit list and recent list.
 *   4. The patient's growth series — visits feed measurements, and a
 *      measurement is always attached to a visit.
 *
 * `createVisitFn` doesn't know the new visit's id yet, so callers may omit
 * `visitId` when invalidating after a create.
 */
export function invalidateAfterVisitMutation(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  args: {
    clinicId: string;
    patientId: string;
    visitId?: string;
  },
): Promise<unknown> {
  const promises: Array<unknown> = [
    queryClient.invalidateQueries({
      queryKey: visitKeys.patient(args.patientId),
    }),
    queryClient.invalidateQueries({
      queryKey: visitKeys.list(args.clinicId, undefined),
    }),
    queryClient.invalidateQueries({
      queryKey: visitKeys.recent(args.clinicId),
    }),
    // Visits create measurements, so growth caches need to refetch.
    queryClient.invalidateQueries({ queryKey: ["series", args.patientId] }),
    queryClient.invalidateQueries({ queryKey: ["latest", args.patientId] }),
  ];

  if (args.visitId) {
    // `detail` is the parent of `withDetails`, so one invalidation
    // drops both the row query and the composed query.
    promises.push(
      queryClient.invalidateQueries({
        queryKey: visitKeys.detail(args.visitId),
      }),
    );
  }

  return Promise.all(promises);
}

export function useCreateVisitMutation() {
  const queryClient = useQueryClient();
  const createVisit = useServerFn(createVisitFn);

  return useMutation({
    mutationKey: ["visit", "create"],
    mutationFn: (input: Parameters<typeof createVisit>[0]["data"]) => createVisit({ data: input }),
    onSuccess: async (visit, input) => {
      await invalidateAfterVisitMutation(queryClient, {
        clinicId: input.clinicId,
        patientId: input.patientId,
        visitId: visit.id,
      });
    },
  });
}

export function useDeleteVisitMutation() {
  const queryClient = useQueryClient();
  const deleteVisit = useServerFn(deleteVisitFn);

  return useMutation({
    mutationKey: ["visit", "delete"],
    mutationFn: (input: { visitId: string; clinicId: string; patientId: string }) =>
      deleteVisit({ data: { visitId: input.visitId } }),
    onSuccess: async (_result, input) => {
      await invalidateAfterVisitMutation(queryClient, input);
    },
  });
}
