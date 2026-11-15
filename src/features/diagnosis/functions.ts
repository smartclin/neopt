// src/features/diagnosis/api.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";

import {
  createDiagnoses,
  createDiagnosis,
  deleteDiagnosis,
  getDiagnosisById,
  listDiagnosesForPatient,
  listDiagnosesForVisit,
  searchDiagnosesByClinic,
  topDiagnosesForClinic,
  updateDiagnosis,
} from "../../db/queries/diagnosis.queries";
import { diagnosisInsertSchema, UpdateDiagnosisSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Read
// ─────────────────────────────────────────────────────────────────────────────

export const fetchDiagnosisById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ diagnosisId: z.uuid() }))
  .handler(async ({ data }) => getDiagnosisById(data.diagnosisId));

export const fetchDiagnosesForVisit = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ visitId: z.uuid() }))
  .handler(async ({ data }) => listDiagnosesForVisit(data.visitId));

export const fetchDiagnosesForPatient = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => listDiagnosesForPatient(data.patientId));

export const searchDiagnosesFn = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      query: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => searchDiagnosesByClinic(data.clinicId, data.query));

export const fetchTopDiagnoses = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  )
  .handler(async ({ data }) => topDiagnosesForClinic(data.clinicId, data.limit));

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Create
// ─────────────────────────────────────────────────────────────────────────────

export const createDiagnosisFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(diagnosisInsertSchema.extend({ visitId: z.uuid() }))
  .handler(async ({ data }) => createDiagnosis(data));

export const createDiagnosesFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      rows: z.array(diagnosisInsertSchema.extend({ visitId: z.uuid() })).min(1),
    }),
  )
  .handler(async ({ data }) => createDiagnoses(data.rows));

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Update / delete
// ─────────────────────────────────────────────────────────────────────────────

export const updateDiagnosisFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(UpdateDiagnosisSchema)
  .handler(async ({ data }) => updateDiagnosis(data.diagnosisId, data.patch));

export const deleteDiagnosisFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ diagnosisId: z.uuid() }))
  .handler(async ({ data }) => {
    await deleteDiagnosis(data.diagnosisId);
    return { ok: true } as const;
  });
