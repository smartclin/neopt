import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import { lmsReferences } from "@/db/schema";

export const lmsSelectSchema = createSelectSchema(lmsReferences);
export const lmsInsertSchema = createInsertSchema(lmsReferences, {
  xValue: (s) => s.min(0),
});

export const GrowthIndicatorSchema = z.enum([
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
  "head-circumference-for-age",
]);

export const SexSchema = z.enum(["male", "female"]);

export const ChartRangeSchema = z.discriminatedUnion("xAxis", [
  z.object({
    xAxis: z.literal("age"),
    min: z.number().min(0).max(228),
    max: z.number().min(0).max(228),
  }),
  z.object({
    xAxis: z.literal("length"),
    min: z.number().min(45).max(120),
    max: z.number().min(45).max(120),
  }),
]);

// Schema that ties indicator to the correct xAxis
const weightForLengthSchema = z.object({
  indicator: z.literal("weight-for-length"),
  sex: SexSchema,
  range: z.object({
    xAxis: z.literal("length"),
    min: z.number().min(45).max(120),
    max: z.number().min(45).max(120),
  }),
});

const ageBasedSchema = z.object({
  indicator: z.enum([
    "weight-for-age",
    "length-for-age",
    "bmi-for-age",
    "head-circumference-for-age",
  ]),
  sex: SexSchema,
  range: z.object({
    xAxis: z.literal("age"),
    min: z.number().min(0).max(228),
    max: z.number().min(0).max(228),
  }),
});

export const GrowthChartRequestSchema = z.discriminatedUnion("indicator", [
  weightForLengthSchema,
  ageBasedSchema,
]);

export const GrowthChartRequestWithXSchema = z.discriminatedUnion("indicator", [
  weightForLengthSchema.extend({ x: z.number().min(0) }),
  ageBasedSchema.extend({ x: z.number().min(0) }),
]);

export const fetchGrowthStandardsSchema = z.object({
  metric: z.enum(["lhfa", "wfa"]),
  gender: z.enum(["boys", "girls"]),
});
export const seriesRowSchema = z.object({
  id: z.string(),
  value: z.number(),
  zScore: z.number().nullable(),
  percentile: z.number().nullable(),
  classification: z.string().nullable(),
  lmsL: z.number().nullable(),
  lmsM: z.number().nullable(),
  lmsS: z.number().nullable(),
  lengthCm: z.number().nullable(),
  visit: z
    .object({
      ageMonths: z.number(),
      visitedAt: z.date(),
    })
    .nullable(),
});
