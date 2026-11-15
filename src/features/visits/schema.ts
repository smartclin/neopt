import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { visits } from "@/db/schema";
import { timestampSchema, uuidSchema } from "@/features/shared/helpers";

export const visitSelectSchema = createSelectSchema(visits);
export const visitInsertSchema = createInsertSchema(visits, {
  ageMonths: (s) => s.min(0).max(1200),
  ageYears: (s) => s.int().min(0).max(100),
  ageMonthsRemainder: (s) => s.int().min(0).max(11),
});
export const visitUpdateSchema = createUpdateSchema(visits);

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

export const visitInputSchema = z.object({
  patientId: uuidSchema,
  clinicId: uuidSchema,
  appointmentId: uuidSchema.optional().nullable(),
  doctorId: z.string().optional().nullable(),
  visitedAt: timestampSchema.default(() => new Date()),
  ageMonths: z.coerce.number().min(0).max(1200),
  ageYears: z.coerce.number().int().min(0).max(100).optional().nullable(),
  ageMonthsRemainder: z.coerce.number().int().min(0).max(11).optional().nullable(),
});

export const visitSearchSchema = z.object({
  clinicId: uuidSchema.optional(),
  patientId: uuidSchema.optional(),
  doctorId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sort: z.enum(["visitedAt", "createdAt"]).default("visitedAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export type VisitInput = z.infer<typeof visitInputSchema>;
export type VisitSearch = z.infer<typeof visitSearchSchema>;
