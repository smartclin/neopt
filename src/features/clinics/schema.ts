import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { clinics } from "@/db/schema";
import { optionalText, requiredText } from "@/features/shared/helpers";

export const clinicSelectSchema = createSelectSchema(clinics);
export const clinicInsertSchema = createInsertSchema(clinics);
export const clinicUpdateSchema = createUpdateSchema(clinics);

export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;

export const clinicInputSchema = z.object({
  name: requiredText(200),
  address: optionalText(500),
  phone: optionalText(40),
  email: z
    .email("Invalid email")
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : (v ?? null))),
});

export const clinicUpdateInputSchema = clinicInputSchema.partial();

export const clinicSearchSchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

export type ClinicInput = z.infer<typeof clinicInputSchema>;
export type ClinicUpdateInput = z.infer<typeof clinicUpdateInputSchema>;
export type ClinicSearch = z.infer<typeof clinicSearchSchema>;
