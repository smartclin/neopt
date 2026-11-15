import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import { prescriptions } from "@/db/schema";

import { optionalText, requiredText, timestampSchema, uuidSchema } from "../shared";

export const prescriptionSelectSchema = createSelectSchema(prescriptions);
export const prescriptionInsertSchema = createInsertSchema(prescriptions, {
  medicationName: (s) => s.min(1).max(200),
  dosage: (s) => s.min(1).max(80),
  frequency: (s) => s.min(1).max(80),
  durationDays: (s) => s.int().min(1).max(365),
  instructions: (s) => s.max(2000),
});
export const prescriptionUpdateSchema = createUpdateSchema(prescriptions, {
  dosage: (s) => s.min(1).max(80),
  frequency: (s) => s.min(1).max(80),
  durationDays: (s) => s.int().min(1).max(365),
});

export type PrescriptionInput = z.infer<typeof prescriptionInsertSchema>;
export type PrescriptionUpdateInput = z.infer<typeof prescriptionUpdateSchema>;

export const prescriptionInputSchema = z.object({
  visitId: uuidSchema,
  patientId: uuidSchema,
  prescribedById: z.string().min(1).optional().nullable(),
  medicationName: requiredText(200),
  dosage: requiredText(100),
  frequency: requiredText(100),
  durationDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  instructions: optionalText(2000),
  prescribedAt: timestampSchema.default(() => new Date()),
});

export const CreatePrescriptionSchema = z.object({
  visitId: z.uuid(),
  patientId: z.uuid(),
  prescribedById: z.uuid().nullable().optional(),
  medicationName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(80),
  frequency: z.string().min(1).max(80),
  durationDays: z.number().int().min(1).max(365).nullable().optional(),
  instructions: z.string().max(2000).nullable().optional(),
  prescribedAt: z.iso.datetime().optional(),
});

export const UpdatePrescriptionSchema = z.object({
  prescriptionId: z.uuid(),
  patch: z.object({
    medicationName: z.string().min(1).max(200).optional(),
    dosage: z.string().min(1).max(80).optional(),
    frequency: z.string().min(1).max(80).optional(),
    durationDays: z.number().int().min(1).max(365).nullable().optional(),
    instructions: z.string().max(2000).nullable().optional(),
  }),
});

export const prescriptionRegisterSearchSchema = z.object({
  q: z.string().trim().optional(),
  medication: z.string().trim().optional(),
  prescriberId: z.uuid().optional(),
  status: z.enum(["all", "active", "completed", "cancelled"]).default("all"),
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
export type PrescriptionRegisterSearch = z.infer<typeof prescriptionRegisterSearchSchema>;
