import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import { measurements } from "@/db/schema";

export const measurementSelectSchema = createSelectSchema(measurements);
export const measurementInsertSchema = createInsertSchema(measurements, {
  value: (s) => s.positive("Measurement must be positive"),
  zScore: (s) => s.min(-10).max(10),
  percentile: (s) => s.min(0).max(100),
});
export const measurementUpdateSchema = createUpdateSchema(measurements, {
  value: (s) => s.positive(),
  zScore: (s) => s.min(-10).max(10),
  percentile: (s) => s.min(0).max(100),
});

export type MeasurementInput = z.infer<typeof measurementInsertSchema>;
export type MeasurementUpdateInput = z.infer<typeof measurementUpdateSchema>;

// --- Single indicator reference curves ---

export const IndicatorSchema = z.enum([
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
  "head-circumference-for-age",
]);

export const StandaloneSchema = z.object({
  patientId: z.uuid(),
  clinicId: z.uuid(),
  rows: z
    .array(
      z.object({
        indicator: IndicatorSchema,
        value: z.number().positive(),
        lengthCm: z.number().positive().nullable().optional(),
      }),
    )
    .min(1),
});

export const VisitRowsSchema = z.object({
  visitId: z.uuid(),
  rows: z
    .array(
      z.object({
        indicator: IndicatorSchema,
        value: z.number().positive(),
        zScore: z.number().optional(),
        percentile: z.number().min(0).max(100).optional(),
        classification: z.string().optional(),
        lmsL: z.number().optional(),
        lmsM: z.number().optional(),
        lmsS: z.number().optional(),
      }),
    )
    .min(1),
});

export const AddWithZSchema = z.object({
  visitId: z.uuid(),
  indicator: IndicatorSchema,
  value: z.number().positive(),
  sex: z.enum(["male", "female"]),
  ageMonths: z.number().min(0).max(1200),
  lengthCm: z.number().positive().optional(),
});

export const UpdateMeasurementSchema = z.object({
  measurementId: z.uuid(),
  patch: z.object({
    value: z.number().positive().optional(),
    zScore: z.number().min(-10).max(10).nullable().optional(),
    percentile: z.number().min(0).max(100).nullable().optional(),
    classification: z.string().nullable().optional(),
    lmsL: z.number().nullable().optional(),
    lmsM: z.number().nullable().optional(),
    lmsS: z.number().nullable().optional(),
  }),
});
