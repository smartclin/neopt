// src/features/clinics/queries.ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  createClinicFn,
  fetchClinicById,
  fetchClinicCount,
  fetchClinics,
  fetchClinicWithRoster,
  fetchClinicWithStats,
  updateClinicFn,
} from "./functions";

/**
 * Create a new clinic.
 *
 * Invalidates the clinic list and count. The new clinic has no cached
 * `detail` or `stats` yet, so those don't need invalidation — the first
 * visit to `$clinicId` fetches fresh.
 *
 * Returns the created row so the caller can navigate to
 * `/app/clinics/$clinicId` or use `row.id` in a callback.
 */
export function useCreateClinicMutation() {
  const queryClient = useQueryClient();
  const createClinic = useServerFn(createClinicFn);

  return useMutation({
    mutationFn: createClinic,
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: clinicKeys.list() }),
        queryClient.invalidateQueries({ queryKey: clinicKeys.count() }),
      ]);
    },
  });
}
const STALE_TIMES = {
  /** Single clinic detail. */
  DETAIL: 60_000,
  /** Clinic list — changes only when admins add/remove clinics. */
  LIST: 120_000,
  /** Clinic with stats or roster — aggregations. */
  STATS: 60_000,
  /** Total clinic count. */
  COUNT: 120_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
//
// Every key starts with "clinics". Invalidate the whole tree with
// `queryClient.invalidateQueries({ queryKey: clinicKeys.all() })`, or a
// per-clinic subtree with `clinicKeys.detail(clinicId)` (which drops
// stats and roster at once).
// ─────────────────────────────────────────────────────────────────────────────

export const clinicKeys = {
  all: () => ["clinics"] as const,

  /** The full list of clinics (admin only). */
  list: () => ["clinics", "list"] as const,

  /** Total clinic count (admin only). */
  count: () => ["clinics", "count"] as const,

  /**
   * Per-clinic subtree. Invalidating this drops `stats` and `roster`
   * automatically, because they are nested under `detail`.
   */
  detail: (clinicId: string) => ["clinics", "detail", clinicId] as const,

  /** One clinic with aggregated stats (patient count, upcoming appointments). */
  stats: (clinicId: string) => ["clinics", "detail", clinicId, "stats"] as const,

  /** One clinic with its full staff roster. */
  roster: (clinicId: string) => ["clinics", "detail", clinicId, "roster"] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function clinicsQuery() {
  return queryOptions({
    queryKey: clinicKeys.list(),
    queryFn: () => fetchClinics(),
    staleTime: STALE_TIMES.LIST,
  });
}

export function clinicByIdQuery(clinicId: string) {
  return queryOptions({
    queryKey: clinicKeys.detail(clinicId),
    queryFn: () => fetchClinicById({ data: { clinicId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function clinicWithStatsQuery(clinicId: string) {
  return queryOptions({
    queryKey: clinicKeys.stats(clinicId),
    queryFn: () => fetchClinicWithStats({ data: { clinicId } }),
    staleTime: STALE_TIMES.STATS,
  });
}

export function clinicWithRosterQuery(clinicId: string) {
  return queryOptions({
    queryKey: clinicKeys.roster(clinicId),
    queryFn: () => fetchClinicWithRoster({ data: { clinicId } }),
    staleTime: STALE_TIMES.STATS,
  });
}

export function clinicCountQuery() {
  return queryOptions({
    queryKey: clinicKeys.count(),
    queryFn: () => fetchClinicCount(),
    staleTime: STALE_TIMES.COUNT,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call this after a clinic mutation succeeds.
 *
 * - **Create** — pass only `clinicId: undefined`; invalidates the list and count.
 * - **Update** — pass `clinicId`; invalidates the list, count, and the
 *   clinic's own subtree (`detail` → `stats` + `roster`).
 * - **Delete** — pass `clinicId`; same as update, plus the deleted clinic's
 *   subtree is safe to drop even though it 404s on next read.
 *
 * The count is invalidated on every mutation because creating or deleting
 * a clinic changes it. Updates do not — but invalidating an already-fresh
 * count is cheap, and branching on "was this a create or delete?" here
 * would push that knowledge into every call site.
 */
export function invalidateAfterClinicMutation(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  args: { clinicId?: string },
): Promise<unknown> {
  const promises: Array<unknown> = [
    queryClient.invalidateQueries({ queryKey: clinicKeys.list() }),
    queryClient.invalidateQueries({ queryKey: clinicKeys.count() }),
  ];

  if (args.clinicId) {
    // `detail` is the parent of `stats` and `roster` — one invalidation
    // drops all three.
    promises.push(
      queryClient.invalidateQueries({
        queryKey: clinicKeys.detail(args.clinicId),
      }),
    );
  }

  return Promise.all(promises);
}
export function useUpdateClinicMutation() {
  const queryClient = useQueryClient();
  const updateClinic = useServerFn(updateClinicFn);

  return useMutation({
    mutationFn: updateClinic,
    onSuccess: (row) => {
      if (!row) return;
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: clinicKeys.detail(row.id),
        }),
        queryClient.invalidateQueries({ queryKey: clinicKeys.list() }),
      ]);
    },
  });
}
