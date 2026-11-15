import { z } from "zod";
import type { Role } from "@/lib/auth/role";

export const SYMPTOM_CHIPS = [
  "fever",
  "cough",
  "rash",
  "vomiting",
  "diarrhea",
  "wheezing",
  "earache",
  "poor feeding",
] as const;

export const TEMPLATE_NAMES = ["well-child", "URI", "gastro"] as const;

export const measurementRowSchema = z.object({
  draftId: z.string(),
  indicator: z.enum([
    "weight-for-age",
    "length-for-age",
    "weight-for-length",
    "bmi-for-age",
    "head-circumference-for-age",
  ]),
  value: z.number().positive(),
  lengthCm: z.number().positive().nullable().optional(),
});

export const diagnosisRowSchema = z.object({
  draftId: z.string(),
  icdCode: z.string().regex(/^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/),
  description: z.string().min(1).max(500),
  type: z.enum(["primary", "secondary"]),
});

export const prescriptionRowSchema = z.object({
  draftId: z.string(),
  medicationName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(80),
  frequency: z.string().min(1).max(80),
  durationDays: z.number().int().min(1).max(365).nullable(),
  instructions: z.string().max(2000),
});

export const visitComposerSchema = z.object({
  patientId: z.uuid(),
  clinicId: z.uuid(),
  doctorId: z.uuid().nullable(),
  visitedAt: z.coerce.date(),
  chiefComplaint: z.string().max(500),
  symptoms: z.array(z.enum(SYMPTOM_CHIPS)).default([]),
  examFindings: z.string().max(10_000),
  template: z.enum(TEMPLATE_NAMES).nullable(),
  measurements: z.array(measurementRowSchema).default([]),
  diagnoses: z.array(diagnosisRowSchema).default([]),
  prescriptions: z.array(prescriptionRowSchema).default([]),
  plan: z.string().max(10_000),
  followUpWeeks: z.number().int().min(0).max(52).nullable(),
});
export type VisitComposerValues = z.infer<typeof visitComposerSchema>;

export const VISIT_COMPOSER_DEFAULTS: Omit<
  VisitComposerValues,
  "patientId" | "clinicId" | "doctorId"
> = {
  visitedAt: new Date(),
  chiefComplaint: "",
  symptoms: [],
  examFindings: "",
  template: null,
  measurements: [],
  diagnoses: [],
  prescriptions: [],
  plan: "",
  followUpWeeks: 4,
};
export const SaveVisitComposerSchema = visitComposerSchema.extend({
  visitId: z.uuid().optional(),
  doctorId: z.uuid().nullable().optional(),
});

export type AuthUser = {
  id: string;
  role: Role | undefined;
  clinicId: string | null;
};

export type SaveVisitInput = z.infer<typeof SaveVisitComposerSchema>;
export type SaveVisitResult = { visitId: string };
