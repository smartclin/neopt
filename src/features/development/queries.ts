// src/features/development/api.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { fetchPatientDevelopment, setMilestoneAchievedFn } from "./functions";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Per-patient development snapshot. Changes only when a milestone is
   *  recorded, so it can sit in cache a little longer than encounter lists. */
  SNAPSHOT: 60_000,
} as const;

export const developmentKeys = {
  all: () => ["development"] as const,

  /** Per-patient subtree — drops the snapshot for one child. */
  patient: (patientId: string) => ["development", "patient", patientId] as const,
} as const;

export function patientDevelopmentQuery(patientId: string) {
  return queryOptions({
    queryKey: developmentKeys.patient(patientId),
    queryFn: () => fetchPatientDevelopment({ data: { patientId } }),
    staleTime: STALE_TIMES.SNAPSHOT,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call this after a milestone write succeeds. Centralising the invalidation
 * keeps every caller in sync — if a future feature depends on the snapshot
 * (e.g. a growth page that renders development summaries), add its key here
 * rather than hunting down the mutation call sites.
 */
export function invalidateAfterMilestoneUpdate(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  patientId: string,
): Promise<unknown> {
  return queryClient.invalidateQueries({
    queryKey: developmentKeys.patient(patientId),
  }) as Promise<unknown>;
}
export function useSetMilestoneAchievedMutation(patientId: string) {
  const queryClient = useQueryClient();
  const setAchieved = useServerFn(setMilestoneAchievedFn);

  return useMutation({
    mutationFn: setAchieved,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: developmentKeys.patient(patientId),
      });
    },
  });
}
