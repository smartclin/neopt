// features/visits/functions.ts
//
// Server-function adapters for visits. Nested offline visit writes are
// persisted transactionally here; TanStack Query stays in `query-options.ts`.

import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { db, eq } from "#/db/index.ts";
import {
  auditLog,
  diagnoses,
  idempotency,
  measurements,
  patients,
  prescriptions,
  visits,
} from "#/db/schema.ts";
import { IndicatorSchema } from "@/features/measurements/schema";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";

import {
  createVisit,
  deleteVisit,
  getVisitById,
  getVisitWithDetails,
  listRecentVisitsForClinic,
  listVisitsForClinic,
  listVisitsForPatient,
  updateVisit,
} from "../../db/queries/visits.queries";
import { visitInputSchema, visitSearchSchema } from "./schema";

const MeasurementDraft = z
  .object({
    id: z.string().optional(),
    indicator: IndicatorSchema,
    value: z.number().positive(),
    lengthCm: z.number().positive().nullable().optional(),
  })
  .superRefine((measurement, ctx) => {
    if (measurement.indicator === "weight-for-length" && measurement.lengthCm == null) {
      ctx.addIssue({
        code: "custom",
        message: "Length is required for a weight-for-length measurement.",
        path: ["lengthCm"],
      });
    }
  });

const DiagnosisDraft = z.object({
  id: z.string().optional(),
  icdCode: z.string(),
  description: z.string(),
  type: z.enum(["primary", "secondary"]),
});

const PrescriptionDraft = z.object({
  id: z.string().optional(),
  medicationName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  durationDays: z.number().int().nullable(),
  instructions: z.string().nullable(),
});

const SaveVisitInput = z.object({
  visitId: z.uuid().optional(), // undefined → create
  patientId: z.uuid(),
  clinicId: z.uuid(),
  doctorId: z.uuid().nullable(),
  visitedAt: z.coerce.date(),
  chiefComplaint: z.string().nullable(),
  symptoms: z.array(z.string()),
  examFindings: z.string().nullable(),
  plan: z.string().nullable(),
  followUpWeeks: z.number().int().nullable(),
  /** Client sends the version it last saw. Omit on create. */
  baseVersion: z.string().datetime().optional(),
  measurements: z.array(MeasurementDraft).superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      if (seen.has(row.indicator)) {
        ctx.addIssue({
          code: "custom",
          message: "A visit can only contain one measurement per indicator.",
          path: [index, "indicator"],
        });
      }
      seen.add(row.indicator);
    });
  }),
  diagnoses: z.array(DiagnosisDraft),
  prescriptions: z.array(PrescriptionDraft),
});

type SaveVisitValues = z.infer<typeof SaveVisitInput>;
type VisitTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SaveVisitOutcome =
  | { kind: "ok"; visitId: string }
  | { kind: "conflict"; serverSnapshot: unknown };

export const saveVisitFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(SaveVisitInput)
  .handler(async ({ data, context }) => {
    const idempotencyKey = getRequest().headers.get("Idempotency-Key");
    const requestHash = idempotencyKey
      ? await hashIdempotentRequest({
          operation: "save-visit",
          key: idempotencyKey,
          userId: context.user.id,
          data,
        })
      : null;

    const result = db.transaction<SaveVisitOutcome>((tx) => {
      if (idempotencyKey && requestHash) {
        const previous = tx
          .select()
          .from(idempotency)
          .where(eq(idempotency.key, idempotencyKey))
          .get();
        if (previous) {
          if (previous.requestHash !== requestHash) {
            setResponseStatus(409);
            throw new Error("Conflict (409): Idempotency key was reused with a different request.");
          }

          const previousResult: unknown = previous.result;
          if (
            typeof previousResult === "object" &&
            previousResult !== null &&
            "conflict" in previousResult &&
            previousResult.conflict === true &&
            "serverSnapshot" in previousResult
          ) {
            return {
              kind: "conflict",
              serverSnapshot: previousResult.serverSnapshot,
            };
          }

          const previousVisitId =
            typeof previousResult === "object" &&
            previousResult !== null &&
            "visitId" in previousResult &&
            typeof previousResult.visitId === "string"
              ? previousResult.visitId
              : null;
          if (!previousVisitId) {
            throw new Error("Stored idempotency result is invalid.");
          }
          return { kind: "ok", visitId: previousVisitId };
        }
      }

      const [patient] = tx
        .select({
          clinicId: patients.clinicId,
          dateOfBirth: patients.dateOfBirth,
        })
        .from(patients)
        .where(eq(patients.id, data.patientId))
        .limit(1)
        .all();
      if (!patient || patient.clinicId !== data.clinicId) {
        throw forbidden();
      }
      if (context.user.role !== "admin" && context.user.clinicId !== data.clinicId) {
        throw forbidden();
      }

      const dob = new Date(`${patient.dateOfBirth}T00:00:00Z`);
      if (!Number.isFinite(dob.getTime())) {
        throw new Error(`Patient ${data.patientId} has an invalid birth date.`);
      }
      const ageMonths = computeAgeMonths(data.visitedAt, dob);
      if (ageMonths < 0) {
        setResponseStatus(422);
        throw new Error("Visit date cannot be before the patient's birth.");
      }

      const current = data.visitId
        ? tx.select().from(visits).where(eq(visits.id, data.visitId)).get()
        : undefined;
      if (data.visitId && !current) throw notFound("Visit not found.");
      if (current && (current.patientId !== data.patientId || current.clinicId !== data.clinicId)) {
        throw forbidden();
      }

      if (current && data.baseVersion && current.updatedAt.toISOString() !== data.baseVersion) {
        const serverSnapshot = getVisitSnapshot(tx, current);
        if (idempotencyKey && requestHash) {
          tx.insert(idempotency)
            .values({
              id: crypto.randomUUID(),
              key: idempotencyKey,
              requestHash,
              result: { conflict: true, serverSnapshot },
            })
            .run();
        }
        return { kind: "conflict", serverSnapshot };
      }

      const now = new Date();
      const visitValues = {
        doctorId: data.doctorId,
        visitedAt: data.visitedAt,
        ageMonths,
        ageYears: Math.floor(ageMonths / 12),
        ageMonthsRemainder: Math.floor(ageMonths % 12),
        chiefComplaint: data.chiefComplaint,
        symptoms: data.symptoms.join(", "),
        physicalExam: data.examFindings,
        plan: data.plan,
        updatedAt: now,
      };
      const visit = current
        ? tx.update(visits).set(visitValues).where(eq(visits.id, current.id)).returning().get()
        : tx
            .insert(visits)
            .values({
              ...visitValues,
              patientId: data.patientId,
              clinicId: data.clinicId,
            })
            .returning()
            .get();
      if (!visit) throw new Error("Failed to save visit.");

      if (current) {
        syncMeasurements(tx, visit, data.measurements);
        syncDiagnoses(tx, visit.id, data.diagnoses);
        syncPrescriptions(tx, visit, data.prescriptions, context.user.id);
      } else {
        insertVisitChildren(tx, visit, data, context.user.id);
      }

      tx.insert(auditLog)
        .values({
          actorId: context.user.id,
          action: current ? "update" : "create",
          entity: "Visit",
          entityId: visit.id,
          metadata: {
            patientId: visit.patientId,
            clinicId: visit.clinicId,
            visitedAt: visit.visitedAt.toISOString(),
          },
        })
        .run();

      if (idempotencyKey && requestHash) {
        tx.insert(idempotency)
          .values({
            id: crypto.randomUUID(),
            key: idempotencyKey,
            requestHash,
            result: { visitId: visit.id },
          })
          .run();
      }

      return { kind: "ok", visitId: visit.id };
    });

    if (result.kind === "conflict") {
      throw conflict(result.serverSnapshot);
    }
    const savedVisit = await getVisitWithDetails(result.visitId);
    if (!savedVisit) throw notFound("Saved visit was not found.");
    return savedVisit;
  });

function insertVisitChildren(
  tx: VisitTransaction,
  visit: typeof visits.$inferSelect,
  data: SaveVisitValues,
  prescriberId: string,
): void {
  if (data.measurements.length > 0) {
    tx.insert(measurements)
      .values(
        data.measurements.map((measurement) => ({
          visitId: visit.id,
          patientId: visit.patientId,
          measuredAt: visit.visitedAt,
          indicator: measurement.indicator,
          value: measurement.value,
          lengthCmAtMeasurement:
            measurement.indicator === "weight-for-length" ? (measurement.lengthCm ?? null) : null,
        })),
      )
      .run();
  }
  if (data.diagnoses.length > 0) {
    tx.insert(diagnoses)
      .values(
        data.diagnoses.map((diagnosis) => ({
          visitId: visit.id,
          icdCode: diagnosis.icdCode,
          description: diagnosis.description,
          type: diagnosis.type,
        })),
      )
      .run();
  }
  if (data.prescriptions.length > 0) {
    tx.insert(prescriptions)
      .values(
        data.prescriptions.map((prescription) => ({
          visitId: visit.id,
          patientId: visit.patientId,
          prescribedById: prescriberId,
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          durationDays: prescription.durationDays,
          instructions: prescription.instructions,
          prescribedAt: visit.visitedAt,
        })),
      )
      .run();
  }
}

function syncMeasurements(
  tx: VisitTransaction,
  visit: typeof visits.$inferSelect,
  incoming: SaveVisitValues["measurements"],
): void {
  const existing = tx.select().from(measurements).where(eq(measurements.visitId, visit.id)).all();
  const byId = new Map(existing.map((row) => [row.id, row]));
  const matchFor = (measurement: SaveVisitValues["measurements"][number]) =>
    (measurement.id ? byId.get(measurement.id) : undefined) ??
    existing.find((row) => row.indicator === measurement.indicator);
  const retainedIds = new Set(
    incoming
      .map(matchFor)
      .filter((row): row is (typeof existing)[number] => row !== undefined)
      .map((row) => row.id),
  );

  for (const row of existing) {
    if (!retainedIds.has(row.id)) {
      tx.delete(measurements).where(eq(measurements.id, row.id)).run();
    }
  }
  for (const measurement of incoming) {
    const existingRow = matchFor(measurement);
    const values = {
      indicator: measurement.indicator,
      value: measurement.value,
      measuredAt: visit.visitedAt,
      lengthCmAtMeasurement:
        measurement.indicator === "weight-for-length" ? (measurement.lengthCm ?? null) : null,
      updatedAt: new Date(),
    };
    if (existingRow) {
      tx.update(measurements).set(values).where(eq(measurements.id, existingRow.id)).run();
    } else {
      tx.insert(measurements)
        .values({
          ...values,
          visitId: visit.id,
          patientId: visit.patientId,
        })
        .run();
    }
  }
}

function syncDiagnoses(
  tx: VisitTransaction,
  visitId: string,
  incoming: SaveVisitValues["diagnoses"],
): void {
  const existing = tx.select().from(diagnoses).where(eq(diagnoses.visitId, visitId)).all();
  const byId = new Map(existing.map((row) => [row.id, row]));
  const matchFor = (diagnosis: SaveVisitValues["diagnoses"][number]) =>
    (diagnosis.id ? byId.get(diagnosis.id) : undefined) ??
    existing.find((row) => row.icdCode === diagnosis.icdCode && row.type === diagnosis.type);
  const retainedIds = new Set(
    incoming
      .map(matchFor)
      .filter((row): row is (typeof existing)[number] => row !== undefined)
      .map((row) => row.id),
  );

  for (const row of existing) {
    if (!retainedIds.has(row.id)) {
      tx.delete(diagnoses).where(eq(diagnoses.id, row.id)).run();
    }
  }
  for (const diagnosis of incoming) {
    const existingRow = matchFor(diagnosis);
    const values = {
      icdCode: diagnosis.icdCode,
      description: diagnosis.description,
      type: diagnosis.type,
      updatedAt: new Date(),
    };
    if (existingRow) {
      tx.update(diagnoses).set(values).where(eq(diagnoses.id, existingRow.id)).run();
    } else {
      tx.insert(diagnoses)
        .values({ ...values, visitId })
        .run();
    }
  }
}

function syncPrescriptions(
  tx: VisitTransaction,
  visit: typeof visits.$inferSelect,
  incoming: SaveVisitValues["prescriptions"],
  prescriberId: string,
): void {
  const existing = tx.select().from(prescriptions).where(eq(prescriptions.visitId, visit.id)).all();
  const byId = new Map(existing.map((row) => [row.id, row]));
  const matchFor = (prescription: SaveVisitValues["prescriptions"][number]) =>
    (prescription.id ? byId.get(prescription.id) : undefined) ??
    existing.find(
      (row) =>
        row.medicationName === prescription.medicationName &&
        row.dosage === prescription.dosage &&
        row.frequency === prescription.frequency &&
        row.durationDays === prescription.durationDays,
    );
  const retainedIds = new Set(
    incoming
      .map(matchFor)
      .filter((row): row is (typeof existing)[number] => row !== undefined)
      .map((row) => row.id),
  );

  for (const row of existing) {
    if (row.status === "active" && !retainedIds.has(row.id)) {
      tx.update(prescriptions)
        .set({
          status: "cancelled",
          statusChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prescriptions.id, row.id))
        .run();
    }
  }
  for (const prescription of incoming) {
    const existingRow = matchFor(prescription);
    const values = {
      medicationName: prescription.medicationName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      durationDays: prescription.durationDays,
      instructions: prescription.instructions,
      updatedAt: new Date(),
    };
    if (existingRow) {
      tx.update(prescriptions).set(values).where(eq(prescriptions.id, existingRow.id)).run();
    } else {
      tx.insert(prescriptions)
        .values({
          ...values,
          visitId: visit.id,
          patientId: visit.patientId,
          prescribedById: prescriberId,
          prescribedAt: visit.visitedAt,
        })
        .run();
    }
  }
}

function getVisitSnapshot(tx: VisitTransaction, visit: typeof visits.$inferSelect) {
  return {
    ...visit,
    measurements: tx.select().from(measurements).where(eq(measurements.visitId, visit.id)).all(),
    diagnoses: tx.select().from(diagnoses).where(eq(diagnoses.visitId, visit.id)).all(),
    prescriptions: tx.select().from(prescriptions).where(eq(prescriptions.visitId, visit.id)).all(),
  };
}

function computeAgeMonths(at: Date, dob: Date): number {
  return (at.getTime() - dob.getTime()) / (86_400_000 * 30.4375);
}

async function hashIdempotentRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function forbidden(): Error {
  setResponseStatus(403);
  return new Error("Forbidden.");
}

function notFound(message: string): Error {
  setResponseStatus(404);
  return new Error(message);
}

function conflict(serverSnapshot: unknown): Error {
  setResponseStatus(409);
  return Object.assign(new Error("Conflict (409): visit was updated elsewhere."), {
    serverSnapshot,
  });
}
// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

export const fetchVisitById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ visitId: z.uuid() }))
  .handler(({ data }) => getVisitById(data.visitId));

export const fetchVisitWithDetails = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ visitId: z.uuid() }))
  .handler(({ data }) => getVisitWithDetails(data.visitId));

export const fetchVisitsForPatient = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(({ data }) => listVisitsForPatient(data.patientId));

export const fetchVisitsForClinic = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      search: visitSearchSchema.optional(),
    }),
  )
  .handler(({ data }) => listVisitsForClinic(data.clinicId, data.search));

// ─────────────────────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────────────────────

export const createVisitFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(visitInputSchema)
  .handler(({ data }) => createVisit(data));

export const updateVisitFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      visitId: z.uuid(),
      patch: visitInputSchema.partial(),
    }),
  )
  .handler(({ data }) => updateVisit(data.visitId, data.patch));

export const deleteVisitFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ visitId: z.uuid() }))
  .handler(({ data }) => deleteVisit(data.visitId));

export const fetchAllVisits = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(({ data }) => listRecentVisitsForClinic(data.clinicId));
