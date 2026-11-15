// src/db/queries/prescription-composer.queries.ts
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Patient context
// ─────────────────────────────────────────────────────────────────────────────

export interface ComposerPatientContext {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  sex: "male" | "female";
  dateOfBirth: string;
  allergies: string | null;
  weightKg: number | null;
}

/**
 * Everything the composer's patient card needs:
 *   - name, MRN, sex, DOB from `patients`
 *   - allergies from `patients`
 *   - weight: from `patients.weightKg` if set, else from the latest
 *     weight-for-age measurement (fallback for older records where
 *     `weightKg` hasn't been backfilled).
 *
 * Returns `null` if the patient doesn't exist — the caller distinguishes
 * that from "found but incomplete."
 */
export async function getComposerPatientContext(
  patientId: string,
): Promise<ComposerPatientContext | null> {
  const [row] = await db
    .select({
      id: patients.id,
      mrn: patients.mrn,
      firstName: patients.firstName,
      lastName: patients.lastName,
      sex: patients.sex,
      dateOfBirth: patients.dateOfBirth,
      allergies: patients.allergies,
      storedWeightKg: patients.weightKg,
    })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!row) return null;

  // Prefer the stored weight. Fall back to the latest measurement only
  // when the column is empty.
  let weightKg = row.storedWeightKg;
  if (weightKg == null) {
    const latest = await db.query.measurements.findFirst({
      where: {
        patientId,
        indicator: "weight-for-age",
      },
      orderBy: { measuredAt: "desc" },
      columns: { value: true },
    });
    weightKg = latest?.value ?? null;
  }

  return {
    id: row.id,
    mrn: row.mrn,
    firstName: row.firstName,
    lastName: row.lastName,
    sex: row.sex as "male" | "female",
    dateOfBirth: row.dateOfBirth,
    allergies: row.allergies,
    weightKg,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Active medications (for the interaction check)
// ─────────────────────────────────────────────────────────────────────────────

export interface ComposerActiveMed {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  prescribedAt: Date;
  status: "active" | "completed" | "cancelled";
}

/**
 * All of a patient's prescriptions, ordered newest-first. Used by the
 * composer's safety rail to detect:
 *   - duplicate therapy (same drug already active)
 *   - prior courses of the same drug (for "already on this")
 *
 * Returns every status; the caller filters by `status === "active"`
 * where appropriate, because the safety rail also wants to show
 * "recently discontinued" as context.
 */
export async function listComposerActiveMeds(patientId: string): Promise<ComposerActiveMed[]> {
  const rows = await db
    .select({
      id: prescriptions.id,
      medicationName: prescriptions.medicationName,
      dosage: prescriptions.dosage,
      frequency: prescriptions.frequency,
      durationDays: prescriptions.durationDays,
      prescribedAt: prescriptions.prescribedAt,
      status: prescriptions.status,
    })
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.prescribedAt));

  return rows.map((r) => ({
    ...r,
    status: r.status as ComposerActiveMed["status"],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────────────────────────────────────

export interface SaveComposerPrescriptionInput {
  /** When present, the row is updated; otherwise a new row is created. */
  prescriptionId?: string;
  patientId: string;
  visitId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
}

/**
 * Create or update a prescription from composer values.
 *
 * `prescribedAt` is always set to now — the composer never backdates.
 * If you need backdating, extend this input.
 */
export async function saveComposerPrescription(input: SaveComposerPrescriptionInput) {
  const patch = {
    patientId: input.patientId,
    visitId: input.visitId,
    medicationName: input.medicationName,
    dosage: input.dosage,
    frequency: input.frequency,
    durationDays: input.durationDays,
    instructions: input.instructions,
    prescribedAt: new Date(),
  };

  if (input.prescriptionId) {
    const [row] = await db
      .update(prescriptions)
      .set(patch)
      .where(eq(prescriptions.id, input.prescriptionId))
      .returning();
    return row ?? null;
  }

  const [row] = await db.insert(prescriptions).values(patch).returning();
  return row ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Discontinue
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a prescription as cancelled. Returns the updated row, or `null`
 * if the id doesn't exist (so the caller can 404 rather than silently
 * assume success).
 */
export async function discontinueComposerPrescription(prescriptionId: string) {
  const [row] = await db
    .update(prescriptions)
    .set({ status: "cancelled", statusChangedAt: new Date() })
    .where(eq(prescriptions.id, prescriptionId))
    .returning();
  return row ?? null;
}
