import { eq } from "drizzle-orm";

import { db } from "@/db";
import { type NewVisit, type Visit, visits } from "@/db/schema";

import type { VisitInput, VisitSearch } from "../../features/visits/schema";

export async function createVisit(input: VisitInput): Promise<Visit> {
  const years = input.ageYears ?? Math.floor(input.ageMonths / 12);
  const monthsRemainder = input.ageMonthsRemainder ?? Math.round(input.ageMonths - years * 12);

  const [row] = await db
    .insert(visits)
    .values({
      ...input,
      ageYears: years,
      ageMonthsRemainder: monthsRemainder,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create visit");
  }
  return row;
}

export async function getVisitById(id: string): Promise<Visit | null> {
  const row = await db.query.visits.findFirst({
    where: { id },
  });
  return row ?? null;
}

export async function getVisitWithDetails(id: string) {
  return db.query.visits.findFirst({
    where: { id },
    with: {
      patient: true,
      measurements: true,
      diagnoses: true,
      prescriptions: true,
      medicalNotes: true,
      doctor: true,
      appointment: true,
    },
  });
}

export async function listVisitsForPatient(patientId: string) {
  return db.query.visits.findMany({
    where: { patientId },
    orderBy: { visitedAt: "desc" },
    with: {
      measurements: true,
      diagnoses: true,
      prescriptions: true,
    },
  });
}

export async function listVisitsForClinic(clinicId: string, search?: Partial<VisitSearch>) {
  const page = search?.page ?? 1;
  const pageSize = search?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  return db.query.visits.findMany({
    where: { clinicId },
    orderBy: { visitedAt: "desc" },
    limit: pageSize,
    offset,
    with: {
      patient: true,
      doctor: true,
      diagnoses: true,
      measurements: true,
    },
  });
}

export async function updateVisit(id: string, patch: Partial<NewVisit>): Promise<Visit | null> {
  const [row] = await db.update(visits).set(patch).where(eq(visits.id, id)).returning();
  return row ?? null;
}

export async function deleteVisit(id: string): Promise<boolean> {
  await db.delete(visits).where(eq(visits.id, id));
  return true;
}
// Add to db/queries/visits.queries.ts
export async function listRecentVisitsForClinic(clinicId: string, limit = 50) {
  return db.query.visits.findMany({
    where: { clinicId },
    orderBy: { visitedAt: "desc" },
    limit,
    with: {
      patient: true,
      measurements: true,
      diagnoses: true,
      prescriptions: true,
      doctor: true,
    },
  });
}
