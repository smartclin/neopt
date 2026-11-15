import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { immunizationStatuses, immunizations } from "@/db/schema";
import { optionalText, timestampSchema, uuidSchema } from "@/features/shared/helpers";

export const immunizationSelectSchema = createSelectSchema(immunizations);
export const immunizationInsertSchema = createInsertSchema(immunizations);
export const immunizationUpdateSchema = createUpdateSchema(immunizations);

export const immunizationInputSchema = z.object({
  patientId: uuidSchema,
  visitId: uuidSchema.optional().nullable(),
  vaccineKey: z.string().min(1).max(50),
  vaccineName: z.string().min(1).max(150),
  doseNumber: z.coerce.number().int().min(0).max(10).default(1),
  targetAgeMonths: z.coerce.number().min(0).max(240),
  status: z.enum(immunizationStatuses).default("due"),
  administeredDate: timestampSchema.optional().nullable(),
  lotNumber: optionalText(80),
  site: optionalText(80),
  administeredById: z.string().optional().nullable(),
  adverseEvents: optionalText(1000),
  notes: optionalText(1000),
});

export const updateImmunizationInputSchema = immunizationInputSchema
  .omit({ patientId: true, vaccineKey: true })
  .partial();

export type ImmunizationInput = z.infer<typeof immunizationInputSchema>;
export type UpdateImmunizationInput = z.infer<typeof updateImmunizationInputSchema>;
