// src/features/growth/queries.ts
import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod";

import {
  fetchChildMeasurementsFn,
  fetchGrowthChartBand,
  fetchGrowthChartCurves,
  fetchGrowthChartCurvesMany,
  fetchGrowthStandardsFn,
  fetchIndicatorSeries,
  fetchLatestPanel,
} from "./functions";
import type { GrowthChartRequestSchema } from "./schema";
import type { ChartBand, ChartCurves, Indicator, IndicatorSeriesRow, Sex } from "./types";
import type { RangeFor } from "./types/sheets";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SeriesRow = IndicatorSeriesRow;

type Range = { xAxis: "age" | "length"; min: number; max: number };

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
//
// Every key starts with a stable prefix:
//   - "curves", "band", "curves-many", "growth-standards"  → reference data
//   - "series", "latest"                                   → patient-scoped
//
// `band` and `curves` keys include the full range so two charts at different
// ranges don't share cache. `band` additionally rounds `x` to 0.1 so hovering
// 12.0 → 12.04 does not trigger a refetch.
// ─────────────────────────────────────────────────────────────────────────────

export const growthKeys = {
  // ── Reference data ─────────────────────────────────────────────────────
  standards: (metric: "lhfa" | "wfa", gender: "boys" | "girls") =>
    ["growth-standards", metric, gender] as const,

  curves: (indicator: Indicator, sex: Sex, r: Range) =>
    ["curves", indicator, sex, r.xAxis, r.min, r.max] as const,

  curvesMany: (keyedRequests: ReadonlyArray<string>) => ["curves-many", keyedRequests] as const,

  /**
   * Band at a specific x. `x` is rounded to one decimal so small hover
   * jitter doesn't invalidate the cache. `null` produces a `"disabled"`
   * segment that can never collide with a real (numeric) x.
   */
  band: (indicator: Indicator, sex: Sex, r: Range, x: number | null) =>
    x == null
      ? (["band", "disabled", indicator, sex, r.xAxis] as const)
      : (["band", indicator, sex, r.xAxis, r.min, r.max, Math.round(x * 10) / 10] as const),

  // ── Patient-scoped ─────────────────────────────────────────────────────
  series: (patientId: string, indicator: Indicator) => ["series", patientId, indicator] as const,

  seriesRoot: (patientId: string) => ["series", patientId] as const,

  latestPanel: (patientId: string) => ["latest", patientId] as const,

  childMeasurements: (patientId: string, metric: "lhfa" | "wfa") =>
    ["child-measurements", patientId, metric] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Chart request helper
// ─────────────────────────────────────────────────────────────────────────────

function toChartRequest<I extends Indicator>(
  indicator: I,
  sex: Sex,
  range: RangeFor<I>,
): z.infer<typeof GrowthChartRequestSchema> {
  if (indicator === "weight-for-length") {
    return {
      indicator: "weight-for-length",
      sex,
      range: range as { xAxis: "length"; min: number; max: number },
    } satisfies z.infer<typeof GrowthChartRequestSchema>;
  }
  return {
    indicator: indicator as Exclude<Indicator, "weight-for-length">,
    sex,
    range: range as { xAxis: "age"; min: number; max: number },
  } satisfies z.infer<typeof GrowthChartRequestSchema>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference data query options
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WHO reference tables for one metric+gender. Seed data — never changes
 * between deploys, so it lives in cache indefinitely.
 */
export function growthStandardsQuery(metric: "lhfa" | "wfa", gender: "boys" | "girls") {
  return queryOptions({
    queryKey: growthKeys.standards(metric, gender),
    queryFn: () => fetchGrowthStandardsFn({ data: { metric, gender } }),
    staleTime: 30 * 1000,
  });
}

export function getGrowthChartCurvesQuery<I extends Indicator>(
  indicator: I,
  sex: Sex,
  range: RangeFor<I>,
) {
  return queryOptions<ChartCurves>({
    queryKey: growthKeys.curves(indicator, sex, range),
    queryFn: async (): Promise<ChartCurves> => {
      return fetchGrowthChartCurves({
        data: toChartRequest(indicator, sex, range),
      });
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch several curves in parallel. The key is sorted by request identity
 * so callers can pass `requests` in any order and still hit cache.
 */
export function manyCurvesQuery(requests: ReadonlyArray<z.infer<typeof GrowthChartRequestSchema>>) {
  const keyedRequests = requests
    .map((r) => ({
      indicator: r.indicator,
      sex: r.sex,
      xAxis: r.range.xAxis,
      min: r.range.min,
      max: r.range.max,
    }))
    .toSorted((a, b) => {
      const k = (v: typeof a) => `${v.indicator}|${v.sex}|${v.xAxis}|${v.min}|${v.max}`;
      return k(a).localeCompare(k(b));
    });

  return queryOptions({
    queryKey: growthKeys.curvesMany(keyedRequests.map((r) => JSON.stringify(r))),
    queryFn: async (): Promise<ChartCurves[]> => {
      return fetchGrowthChartCurvesMany({ data: { requests } });
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Band for the current marker on a chart.
 *
 * Two branches, distinguished by whether `x` is known:
 *   - `x == null`: disabled query. The key includes a literal `"disabled"`
 *     segment so it can never collide with a real band key. The queryFn
 *     returns `null` so the caller gets a well-typed `data: null` while
 *     disabled.
 *   - `x != null`: the real band query, keyed on the rounded x.
 */
export function bandQuery<I extends Indicator>(
  indicator: I,
  sex: Sex,
  range: RangeFor<I>,
  x: number | null,
) {
  if (x == null) {
    return queryOptions<ChartBand | null>({
      queryKey: growthKeys.band(indicator, sex, range, null),
      queryFn: async () => null,
      enabled: false as const,
      staleTime: 30 * 1000,
    });
  }
  return queryOptions<ChartBand | null>({
    queryKey: growthKeys.band(indicator, sex, range, x),
    queryFn: async (): Promise<ChartBand | null> => {
      return fetchGrowthChartBand({
        data: { ...toChartRequest(indicator, sex, range), x },
      });
    },
    staleTime: 30 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient-scoped query options
// ─────────────────────────────────────────────────────────────────────────────

export function seriesQuery(patientId: string, indicator: Indicator) {
  return queryOptions({
    queryKey: growthKeys.series(patientId, indicator),
    queryFn: (): Promise<IndicatorSeriesRow[]> =>
      fetchIndicatorSeries({
        data: { patientId, indicator },
      }),
    staleTime: 30 * 1000,
  });
}

export const getGrowthSeriesQuery = seriesQuery;

export function latestPanelQuery(patientId: string) {
  return queryOptions({
    queryKey: growthKeys.latestPanel(patientId),
    queryFn: () => fetchLatestPanel({ data: { patientId } }),
    staleTime: 30 * 1000,
  });
}

export function childMeasurementsQuery(patientId: string, metric: "lhfa" | "wfa") {
  return queryOptions({
    queryKey: growthKeys.childMeasurements(patientId, metric),
    queryFn: () => fetchChildMeasurementsFn({ data: { patientId, metric } }),
    staleTime: 30 * 1000,
  });
}
