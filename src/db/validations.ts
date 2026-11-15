// src/db/validation.ts

import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import * as schema from "./schema";

// ============================================================================
// Auth / identity
// ============================================================================

export const userSelectSchema = createSelectSchema(schema.user);
export const userInsertSchema = createInsertSchema(schema.user, {
  name: (s) => s.min(1).max(120),
  email: z.email().max(254),
  role: z.enum(["doctor", "staff", "patient", "admin"]).optional(),
  phone: (s) => s.min(7).max(20),
  address: (s) => s.max(500),
});
export const userUpdateSchema = createUpdateSchema(schema.user, {
  name: (s) => s.min(1).max(120),
  email: z.email().max(254),
  phone: (s) => s.min(8).max(14),
});

export const sessionSelectSchema = createSelectSchema(schema.session);
export const accountSelectSchema = createSelectSchema(schema.account);
export const verificationSelectSchema = createSelectSchema(schema.verification);

export const visitSelectSchema = createSelectSchema(schema.visits);
export const visitInsertSchema = createInsertSchema(schema.visits, {
  ageMonths: (s) => s.min(0).max(1200), // up to 100 years
  ageYears: (s) => s.int().min(0).max(100),
  ageMonthsRemainder: (s) => s.int().min(0).max(11),
});
export const visitUpdateSchema = createUpdateSchema(schema.visits, {
  ageMonths: (s) => s.min(0).max(1200),
});

// ============================================================================
// Measurements
// ============================================================================

// ============================================================================
// LMS references (seeding/imports only — not user-facing writes)
// ============================================================================

// ============================================================================
// Diagnoses
// ============================================================================

// ============================================================================
// Medical notes
// ============================================================================

export const medicalNoteSelectSchema = createSelectSchema(schema.medicalNotes);
export const medicalNoteInsertSchema = createInsertSchema(schema.medicalNotes, {
  title: (s) => s.min(1).max(255),
  body: (s) => s.max(10000),
});
export const medicalNoteUpdateSchema = createUpdateSchema(schema.medicalNotes, {
  title: (s) => s.min(1).max(255),
  body: (s) => s.max(10000),
});

// ============================================================================
// Audit log
// ============================================================================

export const auditLogSelectSchema = createSelectSchema(schema.auditLog);
export const auditLogInsertSchema = createInsertSchema(schema.auditLog, {
  entity: (s) => s.min(1).max(64),
  entityId: (s) => s.min(1).max(64),
  metadata: z
    .object({
      before: z.record(z.string(), z.unknown()).optional(),
      after: z.record(z.string(), z.unknown()).optional(),
    })
    .nullable()
    .optional(),
});

// ============================================================================
// Inferred input/output types
// ============================================================================

export type VisitInput = z.infer<typeof visitInsertSchema>;
export type VisitUpdateInput = z.infer<typeof visitUpdateSchema>;

export type MedicalNoteInput = z.infer<typeof medicalNoteInsertSchema>;
export type MedicalNoteUpdateInput = z.infer<typeof medicalNoteUpdateSchema>;

export type AuditLogInput = z.infer<typeof auditLogInsertSchema>;
