import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { patients, prescriptions, user, visits } from "@/db/schema";

export async function createPrescription(input: {
  visitId: string;
  patientId: string;
  prescribedById?: string | null;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays?: number | null;
  instructions?: string | null;
  prescribedAt?: Date;
}) {
  const [row] = await db.insert(prescriptions).values(input).returning();
  return row;
}

export async function createPrescriptions(rows: Array<Parameters<typeof createPrescription>[0]>) {
  if (rows.length === 0) return [];
  return db.insert(prescriptions).values(rows).returning();
}

// --- Read ---

export async function getPrescriptionById(id: string) {
  return db.query.prescriptions.findFirst({
    where: { id },
    with: {
      visit: true,
      patient: true,
      prescribedBy: { columns: { id: true, name: true } },
    },
  });
}

export async function listPrescriptionsForVisit(visitId: string) {
  return db.query.prescriptions.findMany({
    where: { visitId },
    orderBy: (t, { asc }) => [asc(t.prescribedAt)],
    with: {
      visit: { columns: { visitedAt: true, ageMonths: true } },
      prescribedBy: { columns: { id: true, name: true } },
    },
  });
}

/**
 * Full medication history for a patient — what the next prescriber needs to see.
 */
export async function listPrescriptionsForPatient(patientId: string) {
  return db.query.prescriptions.findMany({
    where: { patientId },
    orderBy: (t, { desc }) => [desc(t.prescribedAt)],
    with: {
      prescribedBy: { columns: { id: true, name: true } },
      visit: { columns: { visitedAt: true, ageMonths: true } },
    },
  });
}

/**
 * Active prescriptions (still within their duration window).
 */

export async function listActivePrescriptionsForPatient(patientId: string) {
  const now = Math.floor(Date.now() / 1000);

  return db.query.prescriptions.findMany({
    where: {
      patientId,
      OR: [
        { durationDays: { isNull: true } },
        {
          RAW: (table) => sql`
            (strftime('%s', ${table.prescribedAt}) + ${table.durationDays} * 86400) >= ${now}
          `,
        },
      ],
    },
    orderBy: (t, { desc }) => [desc(t.prescribedAt)],
  });
}

/**
 * A doctor's prescribing history.
 */
export async function listPrescriptionsByPrescriber(userId: string, limit = 100) {
  return db.query.prescriptions.findMany({
    where: { prescribedById: userId },
    orderBy: (t, { desc }) => [desc(t.prescribedAt)],
    limit,
    with: {
      patient: { columns: { mrn: true, firstName: true, lastName: true } },
    },
  });
}

// --- Update / delete ---

export async function updatePrescription(
  id: string,
  patch: Partial<{
    medicationName: string;
    dosage: string;
    frequency: string;
    durationDays: number | null;
    instructions: string | null;
  }>,
) {
  const [row] = await db
    .update(prescriptions)
    .set(patch)
    .where(eq(prescriptions.id, id))
    .returning();
  return row;
}

export async function deletePrescription(id: string) {
  await db.delete(prescriptions).where(eq(prescriptions.id, id));
}

// --- Aggregates ---

/**
 * Most-prescribed medications in a clinic.
 */
export async function topMedicationsForClinic(clinicId: string, limit = 20) {
  return db
    .select({
      medicationName: prescriptions.medicationName,
      count: sql<number>`COUNT(*)`,
    })
    .from(prescriptions)
    .innerJoin(sql`visits`, sql`visits.id = ${prescriptions.visitId}`)
    .where(sql`visits.clinic_id = ${clinicId}`)
    .groupBy(prescriptions.medicationName)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);
}

export async function countPrescriptionsForPatient(patientId: string) {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId));
  return row?.count ?? 0;
}

/** Find a formulary drug by its generic or brand name. */
export async function findFormularyDrug(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return undefined;

  return db.get(sql`
		SELECT *
		FROM formulary_drugs
		WHERE lower(medication_name) = lower(${normalizedName})
		   OR lower(brand_name) = lower(${normalizedName})
		LIMIT 1
	`);
}
// src/features/prescriptions/queries.ts — append

export interface PrescriptionRegisterRow {
  id: string;
  medicationName: string;
  brandName: string | null;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  status: "active" | "completed" | "cancelled";
  prescribedAt: Date;
  prescriber: { id: string; name: string } | null;
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
  } | null;
  flagsInteraction: boolean;
}

export async function listPrescriptionRegister(
  clinicId: string,
  search: {
    q?: string;
    medication?: string;
    prescriberId?: string;
    status: "all" | "active" | "completed" | "cancelled";
    from?: string;
    to?: string;
    page: number;
    size: number;
  },
): Promise<{ rows: PrescriptionRegisterRow[]; total: number }> {
  const conditions = [eq(visits.clinicId, clinicId)];
  if (search.status !== "all") {
    conditions.push(eq(prescriptions.status, search.status));
  }
  if (search.prescriberId) {
    conditions.push(eq(prescriptions.prescribedById, search.prescriberId));
  }
  if (search.medication) {
    conditions.push(ilike(prescriptions.medicationName, `%${search.medication}%`));
  }
  if (search.from) {
    conditions.push(gte(prescriptions.prescribedAt, new Date(`${search.from}T00:00:00Z`)));
  }
  if (search.to) {
    conditions.push(lte(prescriptions.prescribedAt, new Date(`${search.to}T23:59:59Z`)));
  }

  const where = and(...conditions);
  const offset = (search.page - 1) * search.size;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: prescriptions.id,
        medicationName: prescriptions.medicationName,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        durationDays: prescriptions.durationDays,
        status: prescriptions.status,
        prescribedAt: prescriptions.prescribedAt,
        prescriber: { id: user.id, name: user.name },
        patient: {
          id: patients.id,
          mrn: patients.mrn,
          firstName: patients.firstName,
          lastName: patients.lastName,
        },
      })
      .from(prescriptions)
      .innerJoin(visits, eq(visits.id, prescriptions.visitId))
      .innerJoin(patients, eq(patients.id, prescriptions.patientId))
      .leftJoin(user, eq(user.id, prescriptions.prescribedById))
      .where(where)
      .orderBy(desc(prescriptions.prescribedAt))
      .limit(search.size)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(prescriptions)
      .innerJoin(visits, eq(visits.id, prescriptions.visitId))
      .where(where),
  ]);

  return {
    total: count,
    rows: rows.map((r) => ({
      ...r,
      status: r.status as PrescriptionRegisterRow["status"],
      brandName: null,
      flagsInteraction: false, // computed client-side by the row from a formulary lookup
    })),
  };
}
// src/features/prescriptions/queries.ts — append
export async function renewPrescription(id: string, prescribedById?: string | null) {
  const [original] = await db.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
  if (!original) throw new Error("Prescription not found");

  const [row] = await db
    .insert(prescriptions)
    .values({
      visitId: original.visitId,
      patientId: original.patientId,
      prescribedById: prescribedById ?? original.prescribedById,
      medicationName: original.medicationName,
      dosage: original.dosage,
      frequency: original.frequency,
      durationDays: original.durationDays,
      instructions: original.instructions,
      prescribedAt: new Date(),
    })
    .returning();
  return row;
}
// src/features/prescriptions/queries.ts — append

/**
 * Fetch a single prescription with everything the detail view needs:
 * patient (with age-worthy fields), visit summary, prescriber, and the
 * previous 3 prescriptions for the same patient (for the mini-timeline).
 */
export async function getPrescriptionWithContext(id: string) {
  const prescription = await db.query.prescriptions.findFirst({
    where: { id },
    with: {
      patient: {
        columns: {
          id: true,
          mrn: true,
          firstName: true,
          lastName: true,
          sex: true,
          dateOfBirth: true,
          allergies: true,
          weightKg: true, // will be added to schema
        },
      },
      visit: {
        columns: { id: true, visitedAt: true, ageMonths: true },
      },
      prescribedBy: { columns: { id: true, name: true, role: true } },
    },
  });

  if (!prescription) return null;

  const previous = await db.query.prescriptions.findMany({
    where: {
      patientId: prescription.patientId,
      id: { ne: id },
    },
    orderBy: (t, { desc }) => [desc(t.prescribedAt)],
    limit: 3,
    columns: {
      id: true,
      medicationName: true,
      dosage: true,
      frequency: true,
      prescribedAt: true,
      status: true,
    },
  });

  return { ...prescription, previousPrescriptions: previous };
}

/**
 * Active prescriptions for a patient, excluding one id — the safety rail
 * uses this to detect duplicate therapy.
 */
export async function listOtherActivePrescriptions(patientId: string, excludeId?: string) {
  return db.query.prescriptions.findMany({
    where: {
      patientId,
      status: "active",
      ...(excludeId ? { id: { ne: excludeId } } : {}),
    },
    columns: {
      id: true,
      medicationName: true,
      dosage: true,
      frequency: true,
    },
    orderBy: (t, { desc }) => [desc(t.prescribedAt)],
  });
}

/**
 * Patient with the fields that drive the composer: weight, allergies,
 * sex, DOB. Cheaper than fetchPatientWithHistory — no visit tree.
 */
export async function getPatientForComposer(patientId: string) {
  return db.query.patients.findFirst({
    where: { id: patientId },
    columns: {
      id: true,
      mrn: true,
      firstName: true,
      lastName: true,
      sex: true,
      dateOfBirth: true,
      allergies: true,
      weightKg: true,
    },
  });
}

/** Patch weight — the composer writes here on every change. */
export async function updatePatientWeight(patientId: string, weightKg: number) {
  const [row] = await db
    .update(patients)
    .set({ weightKg })
    .where(eq(patients.id, patientId))
    .returning({ weightKg: patients.weightKg });
  return row ?? null;
}
