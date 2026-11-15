// src/types/growth/legacy.ts
//
// ⚠️  DEPRECATED — migrate to the functions in `./lms` and delete this file.
//
// These helpers predate the current `lms.ts` API. They work, but they
// duplicate concepts (z-score, percentile, classification, age) that have
// canonical implementations elsewhere. Every import from this module is a
// TODO. Grep for `from '~/types/growth/legacy'` to find them:
//
//   - `components/forms/VisitForm.tsx`              uses calculateExactAgeInMonths
//   - `components/tables/patients-table.tsx`        uses calculateExactAgeInMonths
//   - `db/seed.ts`                                   uses calculateExactAgeInMonths
//   - anything still using `calculateZScore` (it returns 0 on bad input,
//     unlike `zScoreForValue`, which throws — see the note below)
//
// Migration map:
//   calculateZScore(v, l, m, s)  → zScoreForValue({ l, m, s }, v)
//   zScoreToPercentile(z)         → percentileFromZ(z)
//   calculateExactAgeInMonths(d, a) → decimalMonthsBetween(d, a)
//   classifyZScore(ind, z)        → classify(indicatorFromLegacy(ind), z)
//
// `classifyZScore` takes the *legacy* indicator spellings (`weight_for_age`,
// `height_for_age`, `bmi_for_age`) — the canonical `Indicator` union uses
// kebab-case. Use `classify()` with the canonical spelling instead.

export interface LmsParameters {
  l: number;
  m: number;
  s: number;
}

export type ClinicalAlertSeverity = "critical" | "warning" | "normal";

export interface LegacyZScoreResult {
  zScore: number;
  percentile: number;
  classification: string;
  severity: ClinicalAlertSeverity;
}

/**
 * @deprecated Use `zScoreForValue` from `./lms`. That version throws on
 * invalid input (which surfaces data-integrity bugs at the call site);
 * this one returns `0` — silently misclassifying junk as "median".
 */
export function calculateZScore(value: number, l: number, m: number, s: number): number {
  if (value <= 0 || m <= 0 || s <= 0) return 0;

  let z: number;
  if (Math.abs(l) < 0.0001) {
    z = Math.log(value / m) / s;
  } else {
    z = ((value / m) ** l - 1) / (l * s);
  }
  return Number(z.toFixed(2));
}

/**
 * @deprecated Use `percentileFromZ` from `./lms`. That version uses the
 * same CDF but is documented against the Abramowitz & Stegun 26.2.17
 * coefficients this one is based on; the difference is that the canonical
 * one clamps to [0, 100] and this one returns raw `cdf * 100`.
 */
export function zScoreToPercentile(z: number): number {
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  const cdf = 0.5 * (1.0 + sign * erf);
  return Number((cdf * 100).toFixed(1));
}

/**
 * @deprecated Use `decimalMonthsBetween` from `./lms`. Same math, clearer
 * name. Kept only because three modules still import it by the old name;
 * migrate them and delete this.
 */
export function calculateExactAgeInMonths(dob: Date, atDate: Date): number {
  const diffMs = atDate.getTime() - dob.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  return Number((days / 30.4375).toFixed(2));
}

/**
 * @deprecated Use `classify` from `./lms` with a canonical `Indicator`
 * (`weight-for-age`, `length-for-age`, `bmi-for-age`). This version takes
 * the legacy spellings and returns a plain string rather than a
 * structured `Classification`.
 */
export function classifyZScore(
  indicator: "weight_for_age" | "height_for_age" | "bmi_for_age",
  z: number,
): { classification: string; severity: ClinicalAlertSeverity } {
  if (indicator === "height_for_age") {
    if (z < -3) return { classification: "Severe Stunting", severity: "critical" };
    if (z < -2) return { classification: "Stunting", severity: "warning" };
    if (z > 3) return { classification: "Tall Stature", severity: "warning" };
    return { classification: "Normal Height", severity: "normal" };
  }

  if (indicator === "bmi_for_age" || indicator === "weight_for_age") {
    if (z < -3) return { classification: "Severe Underweight", severity: "critical" };
    if (z < -2) return { classification: "Underweight / Wasting", severity: "warning" };
    if (z > 3) return { classification: "Severe Obesity", severity: "critical" };
    if (z > 2) return { classification: "Overweight / Obesity", severity: "warning" };
    if (z > 1)
      return {
        classification: "Possible Risk of Overweight",
        severity: "normal",
      };
    return { classification: "Normal / Healthy Weight", severity: "normal" };
  }

  return { classification: "Normal", severity: "normal" };
}
