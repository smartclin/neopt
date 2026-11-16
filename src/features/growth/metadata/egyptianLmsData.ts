import "@tanstack/react-start/server-only";
import type { GrowthMetric, Indicator } from "#/features/growth/types/types.ts";

import { LMS_SEED } from "@/features/growth/types/lms-seed";
import { valueAtZScore } from "@/features/measurements/lib/lms";

export interface LmsPoint {
  /** Age in months or length/height in cm. */
  x: number;
  l: number;
  m: number;
  s: number;
  /** LHFA exposes absolute SD; the other metrics use a coefficient of variation. */
  sUnit: "sd" | "cv";
  sd3neg: number;
  sd2neg: number;
  sd1neg: number;
  sd0: number;
  sd1pos: number;
  sd2pos: number;
  sd3pos: number;
}

export type Gender = "boy" | "girl";

export interface GrowthStandardMetadata {
  id: GrowthMetric;
  name: string;
  unit: string;
  xLabel: string;
  xUnit: string;
  minX: number;
  maxX: number;
  description: string;
}

export const GROWTH_METRIC_METADATA: Record<GrowthMetric, GrowthStandardMetadata> = {
  wfa: {
    id: "wfa",
    name: "Weight-for-age",
    unit: "kg",
    xLabel: "Age",
    xUnit: "months",
    minX: 0,
    maxX: 120,
    description: "Egyptian 2021 weight-for-age standards from birth to 10 years",
  },
  lhfa: {
    id: "lhfa",
    name: "Length/height-for-age",
    unit: "cm",
    xLabel: "Age",
    xUnit: "months",
    minX: 0,
    maxX: 228,
    description: "Egyptian 2021 length/height-for-age standards from birth to 19 years",
  },
  wfl: {
    id: "wfl",
    name: "Weight-for-length/height",
    unit: "kg",
    xLabel: "Length/height",
    xUnit: "cm",
    minX: 45,
    maxX: 120,
    description: "Egyptian 2021 weight-for-length/height standards from 45 to 120 cm",
  },
  bmifa: {
    id: "bmifa",
    name: "BMI-for-age",
    unit: "kg/m²",
    xLabel: "Age",
    xUnit: "months",
    minX: 0,
    maxX: 228,
    description: "Egyptian 2021 BMI-for-age standards from birth to 19 years",
  },
};

type EgyptianLmsIndicator = Exclude<Indicator, "head-circumference-for-age">;

const METRIC_BY_INDICATOR: Record<EgyptianLmsIndicator, GrowthMetric> = {
  "weight-for-age": "wfa",
  "length-for-age": "lhfa",
  "weight-for-length": "wfl",
  "bmi-for-age": "bmifa",
};

function emptyMetrics(): Record<Gender, Record<GrowthMetric, LmsPoint[]>> {
  const metrics = (): Record<GrowthMetric, LmsPoint[]> => ({
    wfa: [],
    lhfa: [],
    wfl: [],
    bmifa: [],
  });
  return { boy: metrics(), girl: metrics() };
}

function buildEgyptianLmsData(): Record<Gender, Record<GrowthMetric, LmsPoint[]>> {
  const data = emptyMetrics();

  for (const row of LMS_SEED) {
    if (row.indicator === "head-circumference-for-age") {
      throw new Error("The Egyptian LMS seed does not contain head circumference references.");
    }
    const metric = METRIC_BY_INDICATOR[row.indicator];
    const gender: Gender = row.sex === "male" ? "boy" : "girl";
    const isLengthForAge = row.indicator === "length-for-age";
    data[gender][metric].push({
      x: row.xValue,
      l: row.l,
      m: row.m,
      s: isLengthForAge ? row.s * row.m : row.s,
      sUnit: isLengthForAge ? "sd" : "cv",
      sd3neg: valueAtZScore(row, -3),
      sd2neg: valueAtZScore(row, -2),
      sd1neg: valueAtZScore(row, -1),
      sd0: valueAtZScore(row, 0),
      sd1pos: valueAtZScore(row, 1),
      sd2pos: valueAtZScore(row, 2),
      sd3pos: valueAtZScore(row, 3),
    });
  }

  return data;
}

export const EGYPTIAN_LMS_DATA = buildEgyptianLmsData();
