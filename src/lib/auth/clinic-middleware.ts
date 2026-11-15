import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

import { db, eq } from "@/db";
import { appointments, patients, visits } from "@/db/schema";

import { freshAuthMiddleware } from "./middleware";

/**
 * Extracts the clinic id from a payload. Server functions must pass a
 * `clinicId`, `patientId`, `visitId`, or `appointmentId`; this middleware
 * resolves all four down to a clinic id.
 */
async function resolveClinicId(data: unknown): Promise<string | null> {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (typeof d.clinicId === "string") return d.clinicId;

  if (typeof d.patientId === "string") {
    const [row] = await db
      .select({ clinicId: patients.clinicId })
      .from(patients)
      .where(eq(patients.id, d.patientId))
      .limit(1);
    return row?.clinicId ?? null;
  }

  if (typeof d.visitId === "string") {
    const [row] = await db
      .select({ clinicId: visits.clinicId })
      .from(visits)
      .where(eq(visits.id, d.visitId))
      .limit(1);
    return row?.clinicId ?? null;
  }

  if (typeof d.appointmentId === "string") {
    const [row] = await db
      .select({ clinicId: appointments.clinicId })
      .from(appointments)
      .where(eq(appointments.id, d.appointmentId))
      .limit(1);
    return row?.clinicId ?? null;
  }

  // Mutations that accept a `patch` or `rows` array recurse.
  if (d.patch) return resolveClinicId(d.patch);
  if (Array.isArray(d.rows)) {
    for (const row of d.rows) {
      const id = await resolveClinicId(row);
      if (id) return id;
    }
  }

  return null;
}

/**
 * Requires the caller to be authenticated AND to belong to the same clinic
 * as the entity they're touching. Admins bypass the clinic check.
 */
export const clinicAccessMiddleware = createMiddleware({ type: "function" }) // ← Add this
  .middleware([freshAuthMiddleware])
  .server(async ({ next, data, context }) => {
    const clinicId = await resolveClinicId(data);
    if (!clinicId) {
      setResponseStatus(400);
      throw new Error("Cannot resolve a clinic from the request payload");
    }
    if (context.user.role !== "admin" && context.user.clinicId !== clinicId) {
      setResponseStatus(403);
      throw new Error("Forbidden: cross-clinic access denied");
    }
    return next({ context: { clinicId } });
  });
