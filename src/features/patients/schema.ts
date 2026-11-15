import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { patients } from "@/db/schema";

import { optionalText, requiredText, uuidSchema } from "../shared/helpers";
export const patientSelectSchema = createSelectSchema(patients);
export const patientInsertSchema = createInsertSchema(patients, {
  clinicId: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  sex: z.enum(["male", "female"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // NEW: optional at insert time — filled by the composer later
  weightKg: z.number().min(0.1).max(300).nullable().optional(),
}).omit({ mrn: true });
export const patientUpdateSchema = createUpdateSchema(patients, {
  mrn: (s) => s.min(1).max(32),
  firstName: (s) => s.min(1).max(80),
  lastName: (s) => s.min(1).max(80),
  weightKg: (s) => s.min(0.1).max(300), // NEW
});
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export const patientCreateInputSchema = z.object({
  clinicId: z.string().trim().min(1),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  sex: z.enum(["male", "female"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  parentName: z.string().nullable().optional(),
  gestationalAgeWeeks: z.number().min(22).max(44).nullable().optional(),
});

// `patientInputSchema` is a plain ZodObject; `.omit()` is safe here. If a
// cross-field refinement is ever added above, extract a plain `patientShape`
// first and follow the visit/measurement pattern.

export const patientSearchSchema = z.object({
  clinicId: uuidSchema.optional(),
  q: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sort: z.enum(["name", "createdAt", "dateOfBirth"]).default("name"),
  dir: z.enum(["asc", "desc"]).default("asc"),
});

export type PatientInput = z.infer<typeof patientCreateInputSchema>;
export type PatientUpdate = z.infer<typeof patientUpdateSchema>;
export type PatientSearch = z.infer<typeof patientSearchSchema>;

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Prescription
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Medical note
// ---------------------------------------------------------------------------

// Keep a reference to the plain shape — `.omit()` runs on this, not on the
// refined wrapper, because Zod 4 forbids `.omit()` on a schema that carries
// `.refine()`/`.superRefine()`.
const medicalNoteShape = z.object({
  patientId: uuidSchema,
  visitId: uuidSchema.optional().nullable(),
  authorId: z.string().min(1).optional().nullable(),
  title: requiredText(200),
  body: optionalText(50_000),
});

const noteContentRefinement = <T extends z.ZodType>(schema: T) =>
  schema.refine(
    (v: z.infer<T>) => {
      const anyV = v as { title?: string; body?: string | null };
      return (anyV.title ?? "").length > 0 || (anyV.body ?? "").length > 0;
    },
    {
      message: "Note must have a title or body",
      path: ["title"],
    },
  );

export const medicalNoteInputSchema = noteContentRefinement(medicalNoteShape);

// FIX: `.omit()` on the plain shape, then re-apply the refinement.
export const medicalNoteUpdateSchema = noteContentRefinement(
  medicalNoteShape.omit({ patientId: true }).partial(),
);

export type MedicalNoteInput = z.infer<typeof medicalNoteInputSchema>;
