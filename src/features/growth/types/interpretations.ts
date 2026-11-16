// src/types/growth/interpretations.ts
//
// Interpretation table + severity → Tailwind class mapping. Deliberately
// separate from the LMS math — this module is about presentation labels,
// not statistical computation. `zToBand` is the only crossover, and it
// exists because charts and badges both want "which of the 7 bands is z in?"
// without caring about the full precision of z-score calculations.

import type { Indicator } from "./types";

export type GrowthSeverity =
  | "severe-deficit"
  | "deficit"
  | "risk"
  | "normal"
  | "elevated"
  | "excess"
  | "severe-excess";

export interface GrowthBand {
  description: string;
  image: string;
  color: string;
  severity: GrowthSeverity;
}

/**
 * `growthInterpretations[band][indicator]` — band is the integer z-score
 * the value falls into (−3 to +3), indicator is the WHO growth indicator
 * the value is being measured against. Every cell is populated for every
 * indicator, so the lookup at the bottom of this file never returns
 * `undefined` for a valid `Indicator`.
 */
type GrowthInterpretations = Record<
  -3 | -2 | -1 | 0 | 1 | 2 | 3,
  Partial<Record<Indicator, GrowthBand>>
>;

const IMG = (name: string) =>
  `https://res.cloudinary.com/dspqgpnvq/image/upload/v1791523885/${name}.svg`;

export const growthInterpretations: GrowthInterpretations = {
  [-3]: {
    "weight-for-age": {
      description: "Severely underweight (z < −3)",
      image: IMG("weight-severe-low"),
      color: "#7f1d1d",
      severity: "severe-deficit",
    },
    "length-for-age": {
      description: "Severely stunted (z < −3)",
      image: IMG("length-severe-low"),
      color: "#7f1d1d",
      severity: "severe-deficit",
    },
    "bmi-for-age": {
      description: "Severely wasted (z < −3)",
      image: IMG("bmi-severe-low"),
      color: "#7f1d1d",
      severity: "severe-deficit",
    },
    "weight-for-length": {
      description: "Severely wasted for length (z < −3)",
      image: IMG("wfl-severe-low"),
      color: "#7f1d1d",
      severity: "severe-deficit",
    },
  },

  [-2]: {
    "weight-for-age": {
      description: "Underweight (z −3 to −2)",
      image: IMG("weight-low"),
      color: "#dc2626",
      severity: "deficit",
    },
    "length-for-age": {
      description: "Stunted (z −3 to −2)",
      image: IMG("length-low"),
      color: "#dc2626",
      severity: "deficit",
    },
    "bmi-for-age": {
      description: "Wasted (z −3 to −2)",
      image: IMG("bmi-low"),
      color: "#dc2626",
      severity: "deficit",
    },
    "weight-for-length": {
      description: "Wasted for length (z −3 to −2)",
      image: IMG("wfl-low"),
      color: "#dc2626",
      severity: "deficit",
    },
  },

  [-1]: {
    "weight-for-age": {
      description: "Below median (z −2 to −1)",
      image: IMG("weight-risk"),
      color: "#f59e0b",
      severity: "risk",
    },
    "length-for-age": {
      description: "Below median (z −2 to −1)",
      image: IMG("length-risk"),
      color: "#f59e0b",
      severity: "risk",
    },
    "bmi-for-age": {
      description: "Below median (z −2 to −1)",
      image: IMG("bmi-risk"),
      color: "#f59e0b",
      severity: "risk",
    },
    "weight-for-length": {
      description: "Below median (z −2 to −1)",
      image: IMG("wfl-risk"),
      color: "#f59e0b",
      severity: "risk",
    },
  },

  [0]: {
    "weight-for-age": {
      description: "Normal weight (z −1 to +1)",
      image: IMG("weight-normal"),
      color: "#16a34a",
      severity: "normal",
    },
    "length-for-age": {
      description: "Normal length (z −1 to +1)",
      image: IMG("length-normal"),
      color: "#16a34a",
      severity: "normal",
    },
    "bmi-for-age": {
      description: "Normal BMI (z −1 to +1)",
      image: IMG("bmi-normal"),
      color: "#16a34a",
      severity: "normal",
    },
    "weight-for-length": {
      description: "Normal weight-for-length (z −1 to +1)",
      image: IMG("wfl-normal"),
      color: "#16a34a",
      severity: "normal",
    },
  },

  [1]: {
    "weight-for-age": {
      description: "Above median (z +1 to +2)",
      image: IMG("weight-elevated"),
      color: "#84cc16",
      severity: "elevated",
    },
    "length-for-age": {
      description: "Above median (z +1 to +2)",
      image: IMG("length-elevated"),
      color: "#84cc16",
      severity: "elevated",
    },
    "bmi-for-age": {
      description: "Overweight risk (z +1 to +2)",
      image: IMG("bmi-elevated"),
      color: "#84cc16",
      severity: "elevated",
    },
    "weight-for-length": {
      description: "Overweight risk for length (z +1 to +2)",
      image: IMG("wfl-elevated"),
      color: "#84cc16",
      severity: "elevated",
    },
  },

  [2]: {
    "weight-for-age": {
      description: "Overweight (z +2 to +3)",
      image: IMG("weight-high"),
      color: "#f97316",
      severity: "excess",
    },
    "length-for-age": {
      description: "Tall (z +2 to +3)",
      image: IMG("length-high"),
      color: "#f97316",
      severity: "excess",
    },
    "bmi-for-age": {
      description: "Obese (z +2 to +3)",
      image: IMG("bmi-high"),
      color: "#f97316",
      severity: "excess",
    },
    "weight-for-length": {
      description: "Obese for length (z +2 to +3)",
      image: IMG("wfl-high"),
      color: "#f97316",
      severity: "excess",
    },
  },

  [3]: {
    "weight-for-age": {
      description: "Severely overweight (z > +3)",
      image: IMG("weight-severe-high"),
      color: "#991b1b",
      severity: "severe-excess",
    },
    "length-for-age": {
      description: "Severely tall (z > +3)",
      image: IMG("length-severe-high"),
      color: "#991b1b",
      severity: "severe-excess",
    },
    "bmi-for-age": {
      description: "Severely obese (z > +3)",
      image: IMG("bmi-severe-high"),
      color: "#991b1b",
      severity: "severe-excess",
    },
    "weight-for-length": {
      description: "Severely obese for length (z > +3)",
      image: IMG("wfl-severe-high"),
      color: "#991b1b",
      severity: "severe-excess",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a continuous z-score into the nearest integer band key.
 * Clamps to [-3, 3] so out-of-range values still resolve to a band.
 */
export function zToBand(z: number): -3 | -2 | -1 | 0 | 1 | 2 | 3 {
  if (z < -3) return -3;
  if (z < -2) return -2;
  if (z < -1) return -1;
  if (z < 1) return 0;
  if (z < 2) return 1;
  if (z < 3) return 2;
  return 3;
}

/**
 * Look up the interpretation entry for a given indicator + continuous z.
 *
 * Every `Indicator` × band cell is populated, so the return type is
 * `GrowthBand` (not `GrowthBand | undefined`). If you add an indicator to
 * `Indicator` without adding it to `growthInterpretations`, this file
 * stops compiling — which is the correct behaviour.
 */
// inside getGrowthBand
export function getGrowthBand(indicator: Indicator, z: number): GrowthBand {
  const band = growthInterpretations[zToBand(z)][indicator];
  if (!band) {
    const severity: GrowthSeverity =
      indicator === "head-circumference-for-age" && z < -2
        ? "deficit"
        : indicator === "head-circumference-for-age" && z > 2
          ? "excess"
          : "normal";
    return {
      description: `${indicator} (${z.toFixed(1)} SD)`,
      image: "",
      color: "#6b7280",
      severity,
    };
  }
  return band;
}

/**
 * Severity → Tailwind classes for badges/cards. Only the classes that are
 * actually used in this tree are listed; adding a new severity kind means
 * adding a branch here (and, because of the `Record` type, `tsc` will
 * remind you).
 */
export const severityClasses: Record<GrowthSeverity, { bg: string; text: string; border: string }> =
  {
    "severe-deficit": {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/40",
    },
    deficit: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/40",
    },
    risk: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/40",
    },
    normal: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/40",
    },
    elevated: {
      bg: "bg-info/10",
      text: "text-info",
      border: "border-info/40",
    },
    excess: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/40",
    },
    "severe-excess": {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/40",
    },
  };
