import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { authMiddleware, freshAuthMiddleware } from "@/lib/auth/middleware";

import {
  countClinics,
  createClinic,
  deleteClinic,
  getClinicById,
  getClinicWithRoster,
  getClinicWithStats,
  listClinics,
  updateClinic,
} from "../../db/queries/clinic.queries";
import { clinicInputSchema, clinicUpdateInputSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Read
// ─────────────────────────────────────────────────────────────────────────────

export const fetchClinics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // Only admins can browse the full clinic directory.
    if (context.user.role !== "admin") {
      throw new Error("Forbidden: admin access required.");
    }
    return listClinics();
  });

export const fetchClinicById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => getClinicById(data.clinicId));

export const fetchClinicWithStats = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => getClinicWithStats(data.clinicId));

export const fetchClinicWithRoster = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data, context }) => {
    // Roster includes every staff member's email and role; restrict to
    // admins and staff of the same clinic.
    if (context.user.role !== "admin" && context.user.clinicId !== data.clinicId) {
      throw new Error("Forbidden: cross-clinic access denied.");
    }
    return getClinicWithRoster(data.clinicId);
  });

export const fetchClinicCount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // Only admins see the global clinic count.
    if (context.user.role !== "admin") {
      throw new Error("Forbidden: admin access required.");
    }
    return { count: await countClinics() };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Create
// ─────────────────────────────────────────────────────────────────────────────

export const createClinicFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator(clinicInputSchema)
  .handler(async ({ data, context }) => {
    // Only admins can create clinics.
    if (context.user.role !== "admin") {
      throw new Error("Forbidden: admin access required.");
    }
    return createClinic(data);
  });

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Update / delete
// ─────────────────────────────────────────────────────────────────────────────

const UpdateClinicSchema = z.object({
  clinicId: z.uuid(),
  patch: clinicUpdateInputSchema,
});

export const updateClinicFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(UpdateClinicSchema)
  .handler(async ({ data, context }) => {
    // Only admins can edit clinics.
    if (context.user.role !== "admin") {
      throw new Error("Forbidden: admin access required.");
    }
    return updateClinic(data.clinicId, data.patch);
  });

export const deleteClinicFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data, context }) => {
    // Only admins can delete clinics.
    if (context.user.role !== "admin") {
      throw new Error("Forbidden: admin access required.");
    }
    await deleteClinic(data.clinicId);
    return { ok: true } as const;
  });
