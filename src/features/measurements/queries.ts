// src/features/measurements/queries.ts
//
// Everything React Query reads or writes about measurements.
//
// Conventions in this file (matching `patients/queries.ts`,
// `appointments/queries.ts`, `prescriptions/queries.ts`):
//
//   1. Query keys come from `measurementKeys` — never raw arrays.
//   2. `queryOptions` factories live in this file. Components call
//      `useQuery(measurementByIdQuery(id))`, not inline fetchers.
//   3. Mutations are hooks (`useCreateMeasurementsMutation`, …) that
//      call `useServerFn` + `useMutation` and **own their invalidation**.
//      Callers do not pass `onSuccess` to invalidate — the hook does.
//   4. `invalidateAfterMeasurementWrite` is the single source of truth
//      for what a measurement write touches. If you change the cache
//      graph, change it there.
//
// Measurement writes touch three feature trees: `measurements`
// (this file), `series` (growth charts) and `latest` (dashboard).
// All three are invalidated by `invalidateAfterMeasurementWrite`.

import type { z } from "zod";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { IndicatorSchema } from "./schema";

import {
  addMeasurementWithZScoreFn,
  createMeasurementsFn,
  createMeasurementsStandaloneFn,
  deleteMeasurementFn,
  fetchClassificationCounts,
  fetchFlaggedMeasurements,
  fetchIndicatorTrend,
  fetchMeasurementById,
  fetchMeasurementsForVisit,
  fetchSevereCases,
  updateMeasurementFn,
} from "./functions";

type Indicator = z.infer<typeof IndicatorSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Single measurement row. */
  DETAIL: 60_000,
  /** Measurements attached to one visit. */
  VISIT: 60_000,
  /** One patient's trend for one indicator (growth chart data). */
  TREND: 30_000,
  /** Latest panel — feeds the dashboard card and the composer. */
  LATEST: 30_000,
  /** Flagged measurements feed the referral queue. Shorter because
   *  concurrent prescribers add rows at unpredictable times. */
  FLAGGED: 15_000,
  /** Clinic-wide aggregates (classification counts, severe cases). */
  CLINIC: 120_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
//
// Every key starts with "measurement". The growth feature's own keys
// (`series`, `band`) are separate trees by design — measurement writes
// invalidate both, but neither key lives here. That keeps the tree
// boundaries honest.
// ─────────────────────────────────────────────────────────────────────────────

export const measurementKeys = {
  all: () => ["measurement"] as const,

  /** One measurement row. */
  detail: (measurementId: string) => ["measurement", "detail", measurementId] as const,

  /** All measurements attached to one visit. */
  byVisit: (visitId: string) => ["measurement", "visit", visitId] as const,

  /** Flagged measurements for a patient, keyed by threshold so a
   *  "show >2 SD" and "show >3 SD" view don't collide. */
  flagged: (patientId: string, zThreshold: number) =>
    ["measurement", "flagged", patientId, zThreshold] as const,

  /** One indicator's time series for one patient. */
  trend: (patientId: string, indicator: Indicator) =>
    ["measurement", "trend", patientId, indicator] as const,

  /** Latest measurement per indicator, for one patient. */
  latestPanel: (patientId: string) => ["measurement", "latest-panel", patientId] as const,

  /** Clinic-wide classification distribution. */
  classificationCounts: (clinicId: string) =>
    ["measurement", "classification-counts", clinicId] as const,

  /** Clinic-wide severe-case queue (|z| ≥ 3). */
  severeCases: (clinicId: string) => ["measurement", "severe-cases", clinicId] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Query options
// ─────────────────────────────────────────────────────────────────────────────

export function measurementByIdQuery(measurementId: string) {
  return queryOptions({
    queryKey: measurementKeys.detail(measurementId),
    queryFn: () => fetchMeasurementById({ data: { measurementId } }),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function measurementsForVisitQuery(visitId: string) {
  return queryOptions({
    queryKey: measurementKeys.byVisit(visitId),
    queryFn: () => fetchMeasurementsForVisit({ data: { visitId } }),
    staleTime: STALE_TIMES.VISIT,
  });
}

export function flaggedMeasurementsQuery(patientId: string, zThreshold = 2) {
  return queryOptions({
    queryKey: measurementKeys.flagged(patientId, zThreshold),
    queryFn: () => fetchFlaggedMeasurements({ data: { patientId, zThreshold } }),
    staleTime: STALE_TIMES.FLAGGED,
  });
}

export function indicatorTrendQuery(patientId: string, indicator: Indicator) {
  return queryOptions({
    queryKey: measurementKeys.trend(patientId, indicator),
    queryFn: () => fetchIndicatorTrend({ data: { patientId, indicator } }),
    staleTime: STALE_TIMES.TREND,
  });
}

// export function latestPanelQuery(patientId: string) {
// 	return queryOptions({
// 		queryKey: measurementKeys.latestPanel(patientId),
// 		queryFn: () => fetchLatestPanelViaRelations({ data: { patientId } }),
// 		staleTime: STALE_TIMES.LATEST
// 	});
// }

export function classificationCountsQuery(clinicId: string) {
  return queryOptions({
    queryKey: measurementKeys.classificationCounts(clinicId),
    queryFn: () => fetchClassificationCounts({ data: { clinicId } }),
    staleTime: STALE_TIMES.CLINIC,
  });
}

export function severeCasesQuery(clinicId: string) {
  return queryOptions({
    queryKey: measurementKeys.severeCases(clinicId),
    queryFn: () => fetchSevereCases({ data: { clinicId } }),
    staleTime: STALE_TIMES.CLINIC,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation
// ─────────────────────────────────────────────────────────────────────────────
//
// One helper, one list. A measurement write touches:
//
//   1. The measurement's own subtrees (detail, visit, trend, latest panel,
//      flagged at every threshold the UI might have cached).
//   2. The growth feature's `series` tree — the chart reads from a
//      different server fn than `indicatorTrend`, and both must refresh.
//   3. The growth feature's `band` tree — the current marker band
//      depends on the chart's latest x.
//   4. The dashboard's `latest` tree (aliased separately in older code).
//
// The clinic-wide aggregates (classification counts, severe cases) are
// NOT invalidated by default. They're an admin-facing report, they're
// expensive, and a fresh report is a click away. If you add a live
// clinic dashboard, extend the helper — don't add per-call invalidation
// at the mutation site.

interface InvalidationTarget {
  patientId: string;
  indicator?: Indicator;
  measurementId?: string;
  visitId?: string;
}

export function invalidateAfterMeasurementWrite(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown;
  },
  args: InvalidationTarget,
): Promise<unknown> {
  const promises: Array<unknown> = [
    // The patient's growth series (chart) — keyed in the growth feature.
    queryClient.invalidateQueries({ queryKey: ["series", args.patientId] }),
    // The current band marker on the chart.
    queryClient.invalidateQueries({ queryKey: ["band"] }),
    // Latest-panel card on the dashboard.
    queryClient.invalidateQueries({
      queryKey: measurementKeys.latestPanel(args.patientId),
    }),
    // Flagged lists at both thresholds the UI actually renders
    // (filtered flagged list uses 2, referral queue uses 3).
    queryClient.invalidateQueries({
      queryKey: measurementKeys.flagged(args.patientId, 2),
    }),
    queryClient.invalidateQueries({
      queryKey: measurementKeys.flagged(args.patientId, 3),
    }),
  ];

  if (args.indicator) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: measurementKeys.trend(args.patientId, args.indicator),
      }),
    );
  }
  if (args.measurementId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: measurementKeys.detail(args.measurementId),
      }),
    );
  }
  if (args.visitId) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: measurementKeys.byVisit(args.visitId),
      }),
    );
  }

  return Promise.all(promises);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
//
// Each hook wraps `useServerFn` + `useMutation` and returns the standard
// React Query mutation object. `onSuccess` returns the invalidation
// promise so `isPending` stays `true` through the refetch — the submit
// button doesn't re-enable while stale data is still on screen.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create measurements against an existing visit.
 *
 * The caller passes the payload shape the server function accepts
 * (validated by `VisitRowsSchema`) plus the `patientId` so the hook
 * can invalidate the patient's growth caches.
 *
 * The `onSuccess` reads `variables.data.rows` to derive which
 * indicators to invalidate — the server function returns rows but
 * re-deriving from the request keeps the invalidation correct even if
 * the server drops some rows (e.g. dedupe).
 */
export function useCreateMeasurementsMutation(args: { patientId: string }) {
  const queryClient = useQueryClient();
  const createForVisit = useServerFn(createMeasurementsFn);

  return useMutation({
    mutationKey: ["measurement", "create-visit", args.patientId],
    mutationFn: (input: Parameters<typeof createForVisit>[0]) => createForVisit(input),
    onSuccess: async (_data, variables) => {
      const indicators = [...new Set(variables.data.rows.map((r) => r.indicator))] as Indicator[];

      await Promise.all(
        indicators.map((indicator) =>
          invalidateAfterMeasurementWrite(queryClient, {
            patientId: args.patientId,
            visitId: variables.data.visitId,
            indicator,
          }),
        ),
      );
    },
  });
}

/**
 * Create measurements standalone — the server creates a measurement-
 * only visit first, then inserts the rows.
 *
 * Because the server owns the new visit id, we cannot invalidate the
 * `byVisit` subtree here (no id to invalidate). We DO invalidate the
 * series, latest panel, and flagged lists — those are keyed by
 * patient, not visit.
 */
export function useCreateStandaloneMeasurementsMutation(args: { patientId: string }) {
  const queryClient = useQueryClient();
  const createStandalone = useServerFn(createMeasurementsStandaloneFn);

  return useMutation({
    mutationKey: ["measurement", "create-standalone", args.patientId],
    mutationFn: (input: Parameters<typeof createStandalone>[0]) => createStandalone(input),
    onSuccess: async (_data, variables) => {
      const indicators = [...new Set(variables.data.rows.map((r) => r.indicator))] as Indicator[];

      await Promise.all(
        indicators.map((indicator) =>
          invalidateAfterMeasurementWrite(queryClient, {
            patientId: args.patientId,
            indicator,
          }),
        ),
      );
    },
  });
}

/**
 * Add one measurement with a server-computed z-score.
 *
 * Used by the composer's vitals section, where the client doesn't have
 * LMS context and lets the server compute z, percentile, and
 * classification. The `indicator` is in the input, so the trend key
 * can be invalidated precisely.
 */
export function useAddMeasurementWithZScoreMutation(args: { patientId: string }) {
  const queryClient = useQueryClient();
  const addWithZ = useServerFn(addMeasurementWithZScoreFn);

  return useMutation({
    mutationKey: ["measurement", "add-with-z", args.patientId],
    mutationFn: (input: Parameters<typeof addWithZ>[0]) => addWithZ(input),
    onSuccess: async (row, variables) => {
      await invalidateAfterMeasurementWrite(queryClient, {
        patientId: args.patientId,
        visitId: variables.data.visitId,
        indicator: variables.data.indicator,
        // The server returns the new row — its id is safe to
        // invalidate even though the detail query probably
        // wasn't mounted.
        measurementId: row?.id,
      });
    },
  });
}

/**
 * Update one measurement (value, or the computed z/percentile/
 * classification columns).
 *
 * Update is rarer than create; the invalidation list is the same.
 * `indicator` is not in the input — the caller should pass it from
 * the row they're editing, or accept that only the coarse subtrees
 * (series, band, latest, flagged) refresh.
 */
export function useUpdateMeasurementMutation(args: { patientId: string; indicator?: Indicator }) {
  const queryClient = useQueryClient();
  const update = useServerFn(updateMeasurementFn);

  return useMutation({
    mutationKey: ["measurement", "update", args.patientId],
    mutationFn: (input: Parameters<typeof update>[0]) => update(input),
    onSuccess: async (_row, variables) => {
      await invalidateAfterMeasurementWrite(queryClient, {
        patientId: args.patientId,
        measurementId: variables.data.measurementId,
        indicator: args.indicator,
      });
    },
  });
}

/**
 * Delete one measurement.
 *
 * The server returns `{ ok: true }`, not the deleted row — so
 * `indicator` cannot be derived and must be passed by the caller
 * (they were rendering the row, they know it).
 */
export function useDeleteMeasurementMutation(args: {
  patientId: string;
  indicator?: Indicator;
  visitId?: string;
}) {
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteMeasurementFn);

  return useMutation({
    mutationKey: ["measurement", "delete", args.patientId],
    mutationFn: (input: Parameters<typeof remove>[0]) => remove(input),
    onSuccess: async (_result, variables) => {
      await invalidateAfterMeasurementWrite(queryClient, {
        patientId: args.patientId,
        measurementId: variables.data.measurementId,
        visitId: args.visitId,
        indicator: args.indicator,
      });
    },
  });
}
