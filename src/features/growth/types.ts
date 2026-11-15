export interface IndicatorSeriesRow {
  id: string;
  value: number;
  zScore: number | null;
  percentile: number | null;
  classification: string | null;
  lmsL: number | null;
  lmsM: number | null;
  lmsS: number | null;
  /** Length in cm at the same visit; only set for weight-for-length. */
  lengthCm: number | null;
  visit: {
    visitedAt: Date;
    ageMonths: number;
  } | null;
}

export const INDICATOR_AXIS: Record<Indicator, XAxis> = {
  "weight-for-age": "age",
  "length-for-age": "age",
  "weight-for-length": "length",
  "bmi-for-age": "age",
  "head-circumference-for-age": "age",
};

// ─────────────────────────────────────────────────────────────────────────────
// Core unions
// ─────────────────────────────────────────────────────────────────────────────

export type Indicator =
  | "weight-for-age"
  | "length-for-age"
  | "weight-for-length"
  | "bmi-for-age"
  | "head-circumference-for-age";

export type GrowthIndicator = Indicator;
export type Sex = "male" | "female";
export type XAxis = "age" | "length";
export type Gender = "boy" | "girl";
export type GrowthMetric = "wfa" | "lhfa" | "wfl" | "bmifa";
export type ClinicalSeverity = "normal" | "warning" | "alert";
export type TimeframeOption = "0-2" | "0-5" | "5-10" | "0-19" | "all";

// ─────────────────────────────────────────────────────────────────────────────
// Chart shapes
// ─────────────────────────────────────────────────────────────────────────────

/** The seven canonical reference values at one x (the median + 6 SD bands). */
export interface ChartPointValues {
  median: number;
  sd3neg: number;
  sd2neg: number;
  sd1neg: number;
  sd1: number;
  sd2: number;
  sd3: number;
}

export interface ChartPoint extends ChartPointValues {
  x: number;
}

export type ChartBand = ChartPoint;

export interface ChartCurves {
  indicator: Indicator;
  sex: Sex;
  xAxis: XAxis;
  points: ChartPoint[];
}

/** Inclusive domain for the requested chart. */
export interface ChartRange {
  xAxis: XAxis;
  min: number;
  max: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LMS row (what the parser produces)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seven raw numeric cells kept alongside L/M/S so a row can be re-verified
 * against the source spreadsheet without re-parsing it.
 *
 * Order matches the WHO Anthro export: age/length, L, M, S, P3, P50, P97.
 */
export type RawCheck = readonly [
  xValue: number,
  l: number,
  m: number,
  s: number,
  p3: number,
  p50: number,
  p97: number,
];

export interface LmsRow {
  indicator: Indicator;
  sex: Sex;
  xAxis: XAxis;
  xValue: number;
  l: number;
  m: number;
  s: number;
  /** Present on rows produced by the parser; absent on hand-authored seeds. */
  rawCheck?: RawCheck;
  page?: number;
  yMonths?: string;
}

export interface ParsedLine {
  xValue: number;
  l: number;
  m: number;
  s: number;
  rawCheck: [number, number, number, number, number, number, number];
}

/** The three LMS parameters alone — the only input the math needs. */
export interface LmsTriple {
  l: number;
  m: number;
  s: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when an input is outside the tabulated domain — NaN, non-positive
 * measurement, or a request outside the seed's coverage. The `context` bag
 * is designed to be `console.error`'d whole so the failure is debuggable
 * without a stack trace.
 */
export class LmsDomainError extends Error {
  readonly context: Record<string, unknown>;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = "LmsDomainError";
    this.context = context;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/** WHO severity, used for clinical highlighting (null = within normal range). */
export type Severity = "severe" | "moderate" | "mild" | null;

export type ClassificationCategory =
  | "normal"
  | "underweight"
  | "overweight"
  | "obese"
  | "stunted"
  | "wasted"
  | "thin"
  | "microcephaly"
  | "macrocephaly";

export interface Classification {
  category: ClassificationCategory;
  severity: Severity;
  label: string;
}

/** Result bundle from the query layer, kept for the chart tooltips. */
export interface BasicZScoreResult {
  zScore: number;
  percentile: number;
  classification: Classification;
}

export interface GrowthStandard {
  day: number;
  l: number;
  m: number;
  s: number;
  sd4neg: number;
  sd3neg: number;
  sd2neg: number;
  sd1neg: number;
  sd0: number;
  sd1: number;
  sd2: number;
  sd3: number;
  sd4: number;
}

export interface ChildMeasurement {
  day: number;
  value: number;
}

export interface GrowthMeasurementRow {
  id: string;
  value: number;
  zScore?: number | null;
  percentile?: number | null;
  classification?: string | null;
  visit?: {
    visitedAt?: string | Date | null;
    ageMonths?: number | null;
  } | null;
}

export type ClinicalClassification =
  | "Severe Underweight (< -3 SD)"
  | "Moderate Underweight (-3 to -2 SD)"
  | "Normal Weight (-2 to +2 SD)"
  | "High Weight (> +2 SD)"
  | "Obesity (> +3 SD)"
  | "Severe Stunting (< -3 SD)"
  | "Moderate Stunting (-3 to -2 SD)"
  | "Normal Stature (-2 to +2 SD)"
  | "Tall Stature (> +2 SD)"
  | "Severe Wasting (< -3 SD)"
  | "Moderate Wasting (-3 to -2 SD)"
  | "Normal Weight-for-Height (-2 to +1 SD)"
  | "Risk of Overweight (+1 to +2 SD)"
  | "Overweight (+2 to +3 SD)"
  | "Severe Thinness (< -3 SD)"
  | "Thinness (-3 to -2 SD)"
  | "Normal BMI (-2 to +1 SD)"
  | "BMI At Risk of Overweight (+1 to +2 SD)"
  | "BMI Obesity (+2 to +3 SD)"
  | "BMI Severe Obesity (> +3 SD)"
  | "Out of Reference Range";

export interface ZScoreResult {
  zScore: number;
  percentile: number;
  percentileBeyond: "<0.01%" | ">99.99%" | null;
  metric: GrowthMetric;
  measuredValue: number;
  xValue: number;
  clamped: boolean;
  l: number;
  m: number;
  s: number;
  sUnit: "sd" | "cv";
  classification: ClinicalClassification;
  severity: ClinicalSeverity;
}

export interface PatientGrowthSummary {
  patient: { id: string; gender: Gender; dob: string; name: string };
  measurements: Array<{ date: string; ageMonths: number }>;
  latestMeasurement?: { date: string; ageMonths: number };
  latestZScores?: {
    wfa?: ZScoreResult;
    lhfa?: ZScoreResult;
    wfl?: ZScoreResult;
    bmifa?: ZScoreResult;
    hcfa?: ZScoreResult;
  };
}
