import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { clinics } from "@/db/schema";

import type { ClinicInput } from "../../features/clinics/schema";

// --- Create ---

export async function createClinic(input: ClinicInput | typeof clinics.$inferInsert) {
  const [row] = await db.insert(clinics).values(input).returning();
  return row;
}

// --- Read ---

export async function getClinicById(id: string) {
  return db.query.clinics.findFirst({
    where: { id },
  });
}

export async function listClinics() {
  return db.query.clinics.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

/**
 * Clinic with counts — for admin dashboards.
 */
export async function getClinicWithStats(clinicId: string) {
  return db.query.clinics.findFirst({
    where: { id: clinicId },
    with: {
      patients: { columns: { id: true } },
      users: { columns: { id: true, name: true, role: true } },
      appointments: {
        columns: { id: true },
        where: {
          scheduledAt: { gte: new Date() },
        },
      },
    },
  });
}

/**
 * Clinic with full roster (use sparingly — unbounded).
 */
export async function getClinicWithRoster(clinicId: string) {
  return db.query.clinics.findFirst({
    where: { id: clinicId },
    with: {
      users: {
        columns: { id: true, name: true, role: true, email: true },
      },
      patients: {
        columns: { id: true, mrn: true, firstName: true, lastName: true },
        orderBy: (t, { asc }) => [asc(t.lastName), asc(t.firstName)],
      },
    },
  });
}

// --- Update / delete ---

export async function updateClinic(
  id: string,
  patch: Partial<Omit<typeof clinics.$inferInsert, "id">>,
) {
  const [row] = await db.update(clinics).set(patch).where(eq(clinics.id, id)).returning();
  return row;
}

export async function deleteClinic(id: string) {
  await db.delete(clinics).where(eq(clinics.id, id));
}

// --- Aggregates ---

export async function countClinics() {
  const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(clinics);
  return row?.count ?? 0;
}
