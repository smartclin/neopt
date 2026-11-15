import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import { diagnoses } from "@/db/schema";

import { diagnosisTypeSchema, requiredText, uuidSchema } from "../shared";

export const diagnosisSelectSchema = createSelectSchema(diagnoses);
export const diagnosisInsertSchema = createInsertSchema(diagnoses, {
  icdCode: (s) =>
    s
      .min(3)
      .max(10)
      .regex(/^[A-Z]\d{2}(\.\d{1,4})?$/, "Expected ICD-10 code like A00 or E44.0"),
  description: (s) => s.min(1).max(500),
  type: z.enum(["primary", "secondary"]).optional(),
});

export const TypeSchema = z.enum(["primary", "secondary"]);

export const UpdateDiagnosisSchema = z.object({
  diagnosisId: z.uuid(),
  patch: z.object({
    icdCode: z.string().min(3).max(10).optional(),
    description: z.string().min(1).max(500).optional(),
    type: TypeSchema.optional(),
  }),
});

/** ICD-10 code shape: letter + 2 digits, optional dot + up to 4 alnum. */
const icd10Schema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/, "Invalid ICD-10 code");

export const diagnosisInputSchema = z.object({
  visitId: uuidSchema,
  icdCode: icd10Schema,
  description: requiredText(500),
  type: diagnosisTypeSchema.default("primary"),
});

export const diagnosisUpdateSchema = diagnosisInputSchema.omit({ visitId: true }).partial();

export type DiagnosisInput = z.infer<typeof diagnosisInputSchema>;
