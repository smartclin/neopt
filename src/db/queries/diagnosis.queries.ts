// src/db/queries/diagnoses.ts

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { diagnoses } from "@/db/schema";

// --- Create ---

export async function createDiagnosis(input: {
  visitId: string;
  icdCode: string;
  description: string;
  type?: "primary" | "secondary";
}) {
  const [row] = await db.insert(diagnoses).values(input).returning();
  return row;
}

export async function createDiagnoses(
  rows: Array<{
    visitId: string;
    icdCode: string;
    description: string;
    type?: "primary" | "secondary";
  }>,
) {
  if (rows.length === 0) return [];
  return db.insert(diagnoses).values(rows).returning();
}

// --- Read ---

export async function getDiagnosisById(id: string) {
  return db.query.diagnoses.findFirst({
    where: { id },
    with: {
      visit: {
        with: {
          patient: true,
        },
      },
    },
  });
}

export async function listDiagnosesForVisit(visitId: string) {
  return db.query.diagnoses.findMany({
    where: { visitId },
    orderBy: (t, { asc }) => [asc(t.type), asc(t.icdCode)],
    columns: {
      id: true,
      icdCode: true,
      description: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Full diagnosis history for a patient, newest first.
 */
export async function listDiagnosesForPatient(patientId: string) {
  return db.query.diagnoses.findMany({
    where: {
      visit: { patientId },
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      visit: {
        columns: { visitedAt: true, ageMonths: true },
      },
    },
  });
}

/**
 * Search diagnoses by ICD code or description within a clinic — for
 * "how many asthma cases this year" type questions.
 */
export async function searchDiagnosesByClinic(clinicId: string, query: string) {
  const needle = `%${query.toLowerCase()}%`;
  return db.query.diagnoses.findMany({
    where: {
      visit: { clinicId },
      OR: [{ icdCode: { like: `%${query.toUpperCase()}%` } }, { description: { like: needle } }],
    },
    with: {
      visit: {
        columns: { visitedAt: true },
        with: {
          patient: {
            columns: { id: true, mrn: true, firstName: true, lastName: true },
          },
        },
      },
    },
    limit: 100,
  });
}

// --- Update / delete ---

export async function updateDiagnosis(
  id: string,
  patch: Partial<{
    icdCode: string;
    description: string;
    type: "primary" | "secondary";
  }>,
) {
  const [row] = await db.update(diagnoses).set(patch).where(eq(diagnoses.id, id)).returning();
  return row;
}

export async function deleteDiagnosis(id: string) {
  await db.delete(diagnoses).where(eq(diagnoses.id, id));
}

// --- Aggregates ---

/**
 * Top ICD codes by frequency within a clinic — a "what are we treating" report.
 */
export async function topDiagnosesForClinic(clinicId: string, limit = 20) {
  return db
    .select({
      icdCode: diagnoses.icdCode,
      description: diagnoses.description,
      count: sql<number>`COUNT(*)`,
    })
    .from(diagnoses)
    .innerJoin(sql`visits`, sql`visits.id = ${diagnoses.visitId}`)
    .where(sql`visits.clinic_id = ${clinicId}`)
    .groupBy(diagnoses.icdCode, diagnoses.description)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);
}
