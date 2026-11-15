// features/visits/composer/query-options.ts
//
// The single import surface for the composer's React Query hooks.
// `use-visit-composer.ts` imports `useSaveVisitComposerMutation` from
// here and nothing else from the server layer.

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getVisitSnapshot,
  listActiveMedicationsForVisit,
  saveVisitComposer,
  type VisitSnapshot,
} from "./functions";
import type { VisitComposerValues } from "./schema";

export type { VisitSnapshot } from "./functions";

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────

export const visitComposerKeys = {
  all: () => ["visit", "composer"] as const,

  snapshot: (patientId: string) => ["visit", "composer", "snapshot", patientId] as const,

  activeMeds: (patientId: string) => ["visit", "composer", "active-meds", patientId] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Snapshot feeds the patient card and the weight sparkline. */
  SNAPSHOT: 60_000,
  /** Active meds change whenever another prescriber writes — short TTL. */
  ACTIVE_MEDS: 15_000,
} as const;

export function visitSnapshotQuery(patientId: string) {
  return queryOptions<VisitSnapshot>({
    queryKey: visitComposerKeys.snapshot(patientId),
    queryFn: () => getVisitSnapshot({ data: { patientId } }),
    staleTime: STALE_TIMES.SNAPSHOT,
  });
}

export function visitActiveMedsQuery(patientId: string) {
  return queryOptions({
    queryKey: visitComposerKeys.activeMeds(patientId),
    queryFn: () => listActiveMedicationsForVisit({ data: { patientId } }),
    staleTime: STALE_TIMES.ACTIVE_MEDS,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Everything a successful save touches. Kept private to this module so
 * callers can't accidentally forget one of the keys.
 */
function invalidateAfterSave(
  queryClient: ReturnType<typeof useQueryClient>,
  args: { visitId: string; patientId: string },
): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["visit", args.visitId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["visit", args.visitId, "details"],
    }),
    queryClient.invalidateQueries({ queryKey: ["visits"] }),
    queryClient.invalidateQueries({
      queryKey: ["patient", args.patientId],
    }),
    // Measurement writes move the growth charts.
    queryClient.invalidateQueries({
      queryKey: ["series", args.patientId],
    }),
    // The composer's own snapshot cache should reflect the new state.
    queryClient.invalidateQueries({
      queryKey: visitComposerKeys.snapshot(args.patientId),
    }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save the composer. Callers pass `{ ...values, visitId }` — one object,
 * one mutation, one consistent invalidation list. `onSuccess` is the
 * caller's hook into the result; the hook here only handles the caches.
 */
export function useSaveVisitComposerMutation(options?: {
  onSuccess?: (data: { visitId: string }, values: VisitComposerValues) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const saveFn = useServerFn(saveVisitComposer);

  return useMutation<{ visitId: string }, unknown, VisitComposerValues & { visitId?: string }>({
    mutationFn: (values: VisitComposerValues & { visitId?: string }) => saveFn({ data: values }),
    onSuccess: (data, values) => {
      void invalidateAfterSave(queryClient, {
        visitId: data.visitId,
        patientId: values.patientId,
      });
      options?.onSuccess?.(data, values);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
