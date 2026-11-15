// src/features/patients/api.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";

import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";

import {
  createPatient,
  deletePatient,
  getFullPatientChart,
  getPatientById,
  getPatientForComposer,
  getPatientSummary,
  getPatientWithHistory,
  listLapsedPatients,
  listPatientsByClinic,
  listPatientsSeenBetween,
  searchPatients,
  updatePatient,
} from "../../db/queries/patients.queries";
import { patientInsertSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Read
// ─────────────────────────────────────────────────────────────────────────────

export const fetchPatientById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(({ data }) => getPatientById(data.patientId));

export const fetchPatientForComposer = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(({ data }) => getPatientForComposer(data.patientId));

export const fetchPatientWithHistory = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(({ data }) => getPatientWithHistory(data.patientId));

export const fetchPatientSummary = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(({ data }) => getPatientSummary(data.patientId));

export const fetchPatientChart = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(({ data }) => getFullPatientChart(data.patientId));

export const fetchPatientsByClinic = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.string().min(1) }))
  .handler(({ data }) => listPatientsByClinic(data.clinicId));

export const fetchPatients = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.string() }))
  .handler(async ({ data }) => listPatientsByClinic(data.clinicId));

export const searchPatientsFn = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.string().min(1),
      query: z.string().min(1),
    }),
  )
  .handler(({ data }) => searchPatients(data.clinicId, data.query));

// --- Reports ----------------------------------------------------------------

export const fetchLapsedPatients = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      months: z.number().int().min(1).max(60).optional().default(6),
    }),
  )
  .handler(async ({ data }) => listLapsedPatients(data.clinicId, data.months));

export const fetchPatientsSeenBetween = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
    }),
  )
  .handler(async ({ data }) =>
    listPatientsSeenBetween(data.clinicId, new Date(data.from), new Date(data.to)),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Write
// ─────────────────────────────────────────────────────────────────────────────

export const createPatientFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(patientInsertSchema)
  .handler(({ data }) => createPatient(data));

export const updatePatientFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      patch: patientInsertSchema.partial().omit({ clinicId: true }),
      // Optimistic concurrency: the `updatedAt` ISO string the client saw.
      baseVersion: z.string().datetime().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const row = await updatePatient(data.patientId, data.patch, data.baseVersion);

    if (!row && data.baseVersion !== undefined) {
      // The compare-and-swap matched nothing — tell apart a concurrent
      // edit from a patient that no longer exists.
      const existing = await getPatientById(data.patientId);
      if (existing) {
        setResponseStatus(409);
        throw new Error("This patient was updated by someone else. Reload and try again.");
      }
    }

    if (!row) {
      setResponseStatus(404);
      throw new Error("Patient not found.");
    }

    return row;
  });

export const deletePatientFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => {
    await deletePatient(data.patientId);
    return { ok: true } as const;
  });
