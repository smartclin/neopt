import type { Indicator, Sex, XAxis } from "#/features/growth/types/types.ts";

/** A single measured point to overlay on the reference curves. */
export interface GrowthPoint {
  /** X value: age in months (age-based) or length in cm (weight-for-length). */
  x: number;
  /** Measured value (kg, cm, or BMI). */
  y: number;
  /** When the point was recorded, ISO string. */
  visitedAt?: string | Date;
  /** Pre-computed Z-score (or null when it couldn't be computed). */
  zScore?: number | null;
}

export const SERIES_COLORS = {
  sd3neg: "#ef4444",
  sd2neg: "#f97316",
  sd1neg: "#eab308",
  median: "#16a34a",
  sd1: "#22c55e",
  sd2: "#3b82f6",
  sd3: "#8b5cf6",
} as const;

export type BandKey = keyof typeof SERIES_COLORS;

/** Draw order: widest first, median last so it renders on top. */
export const BAND_DRAW_ORDER: readonly BandKey[] = [
  "sd3neg",
  "sd2neg",
  "sd1neg",
  "median",
  "sd1",
  "sd2",
  "sd3",
] as const;

/** Solid for −2/median/+2; dashed for the ±1 and ±3 bands. */
export const BAND_STROKE_DASHARRAY: Partial<Record<BandKey, string>> = {
  sd3neg: "4 3",
  sd1neg: "4 3",
  sd1: "4 3",
  sd3: "4 3",
};

export const BAND_LABELS = {
  sd3neg: "−3 SD",
  sd2neg: "−2 SD",
  sd1neg: "−1 SD",
  median: "Median",
  sd1: "+1 SD",
  sd2: "+2 SD",
  sd3: "+3 SD",
} as const;

export function axisLabel(xAxis: XAxis): string {
  return xAxis === "age" ? "Age (months)" : "Length (cm)";
}

export function valueLabel(indicator: Indicator): string {
  switch (indicator) {
    case "weight-for-age":
    case "weight-for-length":
      return "Weight (kg)";
    case "length-for-age":
      return "Length / height (cm)";
    case "bmi-for-age":
      return "BMI (kg/m²)";
    default:
      return "";
  }
}

export function defaultAriaLabel(indicator: Indicator, sex: Sex): string {
  const who = sex === "male" ? "boy" : "girl";
  return `Egyptian 2021 ${indicator} reference chart for a ${who}`;
}

/** 1-decimal formatting used by the tooltip and hidden table. */
export function formatValue(v: number): string {
  return v.toFixed(1);
}
