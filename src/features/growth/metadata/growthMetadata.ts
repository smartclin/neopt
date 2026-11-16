import "@tanstack/react-start/server-only";
import { GrowthMetric, Indicator, TimeframeOption, XAxis } from "../types";

export interface MetricMeta {
  /** Human label shown in the tab bar and axis title. */
  name: string;
  /** Short label shown in the axis title in parentheses. */
  shortName: string;
  /** Y-axis unit ("kg", "cm", "kg/m²"). */
  unit: string;
  /** X-axis unit ("months", "cm"). */
  xUnit: string;
  /** X-axis label ("Age", "Length"). */
  xLabel: string;
  /** Which `Indicator` this metric maps to for LMS lookup. */
  indicator: Indicator;
  /** Which `XAxis` this metric is drawn against. */
  xAxis: XAxis;
  /** Upper bound of the reference domain when "All" is selected. */
  maxX: number;
  /** Lower bound of the reference domain. */
  minX: number;
  /** If true, the timeframe selector is hidden (WFL is length-based, not age). */
  fixedRange: boolean;
}

export const GROWTH_METRIC_METADATA: Record<GrowthMetric, MetricMeta> = {
  bmifa: {
    name: "BMI-for-age",
    shortName: "BMI-for-age",
    unit: "kg/m²",
    xUnit: "months",
    xLabel: "Age",
    indicator: "bmi-for-age",
    xAxis: "age",
    maxX: 228,
    minX: 0,
    fixedRange: false,
  },
  lhfa: {
    name: "Length/height-for-age",
    shortName: "Length/height-for-age",
    unit: "cm",
    xUnit: "months",
    xLabel: "Age",
    indicator: "length-for-age",
    xAxis: "age",
    maxX: 228,
    minX: 0,
    fixedRange: true,
  },
  wfa: {
    name: "Weight-for-age",
    shortName: "Weight-for-age",
    unit: "kg",
    xUnit: "months",
    xLabel: "Age",
    indicator: "weight-for-age",
    xAxis: "age",
    maxX: 120,
    minX: 0,
    fixedRange: true,
  },
  wfl: {
    name: "Weight-for-length/height",
    shortName: "Weight-for-length/height",
    unit: "kg",
    xUnit: "cm",
    xLabel: "Length/height",
    indicator: "weight-for-length",
    xAxis: "length",
    maxX: 120,
    minX: 45,
    fixedRange: true,
  },
};

export const TIMEFRAME_WINDOWS: Record<
  Exclude<TimeframeOption, "all">,
  { min: number; max: number }
> = {
  "0-19": { max: 228, min: 0 },
  "0-2": { max: 24, min: 0 },
  "0-5": { max: 60, min: 0 },
  "5-10": { max: 120, min: 60 },
};

export function filterLmsByTimeframe<T extends { x: number }>(
  rows: T[],
  metric: GrowthMetric,
  timeframe: TimeframeOption,
): T[] {
  const meta = GROWTH_METRIC_METADATA[metric];
  if (meta.fixedRange) {
    return rows.filter((r) => r.x >= meta.minX && r.x <= meta.maxX);
  }
  const window = TIMEFRAME_WINDOWS[timeframe === "all" ? "0-19" : timeframe];
  return rows.filter((r) => r.x >= window.min && r.x <= window.max);
}
