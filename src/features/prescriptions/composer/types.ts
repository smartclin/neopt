import { z } from "zod";

export const composerUnitSchema = z.enum(["mg", "mcg", "g", "mL", "drops", "puffs", "units"]);
export type ComposerUnit = z.infer<typeof composerUnitSchema>;

export const composerFrequencySchema = z.enum([
  "OD",
  "BID",
  "TID",
  "QID",
  "q4-6h PRN",
  "q8h PRN",
  "PRN",
  "once",
]);
export type ComposerFrequency = z.infer<typeof composerFrequencySchema>;

export const prescriptionComposerSchema = z.object({
  patientId: z.uuid(),
  visitId: z.uuid(),
  drugKey: z.string().min(1, "Choose a medication"),
  medicationName: z.string().min(1, "Medication is required").max(200),
  brandName: z.string().max(120).optional().nullable(),
  strength: z.number().positive("Strength must be > 0"),
  unit: composerUnitSchema,
  frequency: z.string().min(1, "Frequency is required").max(80),
  durationDays: z.number().int().min(1).max(365).nullable(),
  instructions: z.string().max(2000).nullable(),
  // mg/kg block is optional and only used when the toggle is on
  mgPerKgPerDay: z.number().positive().nullable().optional(),
  dosesPerDay: z.number().int().min(1).max(12).nullable().optional(),
  weightKg: z.number().positive().max(300).nullable().optional(),
  concentrationLabel: z.string().max(120).nullable().optional(),
});
export type PrescriptionComposerValues = z.infer<typeof prescriptionComposerSchema>;

export type ComposerMode = "create" | "edit" | "view";
