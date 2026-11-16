// src/features/measurements/api.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";

import { and, db, eq } from "#/db/index.ts";
import { auditLog, idempotency, measurements, visits } from "#/db/schema.ts";
import {
  addMeasurementWithZScore,
  classificationCountsForClinic,
  createMeasurementsForVisit,
  deleteMeasurement,
  getLmsByAge,
  getLmsByLength,
  getMeasurementById,
  insertMeasurementsStandalone,
  listFlaggedMeasurements,
  listMeasurementsForVisit,
  severeCasesForClinic,
  updateMeasurement,
} from "@/db/queries/measurements.queries";
import { zScoreForValue } from "@/features/measurements/lib/lms";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";

import { indicatorTrend, latestPanelViaRelations } from "../../db/queries/growth.queries";
import {
  AddWithZSchema,
  IndicatorSchema,
  StandaloneSchema,
  UpdateMeasurementSchema,
  VisitRowsSchema,
} from "./schema";

export const createMeasurementsStandaloneFn = createServerFn({
  method: "POST",
})
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(StandaloneSchema)
  .handler(({ data }) => insertMeasurementsStandalone(data));

export const createMeasurementsFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(VisitRowsSchema)
  .handler(({ data }) => createMeasurementsForVisit(data));

export const addMeasurementWithZScoreFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(AddWithZSchema)
  .handler(async ({ data }) =>
    addMeasurementWithZScore(
      data.visitId,
      data.indicator,
      data.value,
      data.sex,
      data.ageMonths,
      data.lengthCm,
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Read
// ─────────────────────────────────────────────────────────────────────────────

export const fetchFlaggedMeasurements = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      zThreshold: z.number().min(1).max(5).optional().default(2),
    }),
  )
  .handler(async ({ data }) => {
    return listFlaggedMeasurements(data.patientId, data.zThreshold);
  });

export const fetchMeasurementById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ measurementId: z.uuid() }))
  .handler(async ({ data }) => getMeasurementById(data.measurementId));

export const fetchMeasurementsForVisit = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ visitId: z.uuid() }))
  .handler(async ({ data }) => listMeasurementsForVisit(data.visitId));

export const fetchLatestPanelViaRelations = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => latestPanelViaRelations(data.patientId));

export const fetchIndicatorTrend = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      indicator: IndicatorSchema,
    }),
  )
  .handler(async ({ data }) => indicatorTrend(data.patientId, data.indicator));

export const fetchClassificationCounts = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => classificationCountsForClinic(data.clinicId));

export const fetchSevereCases = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => severeCasesForClinic(data.clinicId));

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Update / delete
// ─────────────────────────────────────────────────────────────────────────────

export const updateMeasurementFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(UpdateMeasurementSchema)
  .handler(async ({ data }) => updateMeasurement(data.measurementId, data.patch));

export const deleteMeasurementFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ measurementId: z.uuid() }))
  .handler(async ({ data }) => {
    await deleteMeasurement(data.measurementId);
    return { ok: true } as const;
  });

const CreateMeasurementInput = z.object({
  patientId: z.uuid(),
  visitId: z.uuid().nullable().optional(),
  indicator: IndicatorSchema,
  value: z.number().positive(),
  measuredAt: z.coerce.date(),
  lengthCm: z.number().positive().nullable().optional(),
});

export const createMeasurementFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(CreateMeasurementInput)
  .handler(async ({ data, context }) => {
    const idempotencyKey = getRequest().headers.get("Idempotency-Key");
    const measuredAt = new Date(data.measuredAt);
    measuredAt.setSeconds(0, 0);
    const requestHash = idempotencyKey
      ? await hashIdempotentRequest({
          operation: "create-measurement",
          key: idempotencyKey,
          userId: context.user.id,
          data: { ...data, measuredAt },
        })
      : null;

    const patient = await db.query.patients.findFirst({
      where: { id: data.patientId },
      columns: {
        clinicId: true,
        sex: true,
        dateOfBirth: true,
      },
    });
    if (
      !patient?.clinicId ||
      (context.user.role !== "admin" && patient.clinicId !== context.user.clinicId)
    ) {
      throw forbidden();
    }
    const clinicId = patient.clinicId;

    const visitId = data.visitId ?? null;
    if (visitId) {
      const visit = await db.query.visits.findFirst({
        where: { id: visitId },
        columns: { patientId: true, clinicId: true },
      });
      if (!visit || visit.patientId !== data.patientId || visit.clinicId !== patient.clinicId) {
        throw forbidden();
      }
    }

    const lengthCm = data.lengthCm;
    const ageMonths =
      (measuredAt.getTime() - new Date(patient.dateOfBirth).getTime()) / (86_400_000 * 30.4375);
    if (ageMonths < 0) {
      setResponseStatus(422);
      throw new Error("Measurement date cannot be before the patient's birth.");
    }

    let lms = null;
    if (data.indicator === "weight-for-length") {
      if (lengthCm == null) {
        setResponseStatus(422);
        throw new Error("Length is required for a weight-for-length measurement.");
      }
      lms = await getLmsByLength(patient.sex, lengthCm);
    } else if (data.indicator !== "head-circumference-for-age") {
      lms = await getLmsByAge(data.indicator, patient.sex, ageMonths);
    }
    const growthData = lms
      ? {
          zScore: zScoreForValue(lms, data.value),
          lmsL: lms.l,
          lmsM: lms.m,
          lmsS: lms.s,
        }
      : {};

    const row = db.transaction((tx) => {
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
          const previousId =
            typeof previousResult === "object" &&
            previousResult !== null &&
            "measurementId" in previousResult &&
            typeof previousResult.measurementId === "string"
              ? previousResult.measurementId
              : null;
          if (!previousId) {
            throw new Error("Stored idempotency result is invalid.");
          }

          const previousRow = tx
            .select()
            .from(measurements)
            .where(eq(measurements.id, previousId))
            .get();
          if (!previousRow) {
            throw new Error("The previously saved measurement is missing.");
          }
          return previousRow;
        }
      }

      const existing = tx
        .select()
        .from(measurements)
        .where(
          and(
            eq(measurements.patientId, data.patientId),
            eq(measurements.indicator, data.indicator),
            eq(measurements.measuredAt, measuredAt),
          ),
        )
        .get();

      let row = existing;
      if (!row) {
        let resolvedVisitId = visitId;
        if (!resolvedVisitId) {
          const years = Math.floor(ageMonths / 12);
          const monthsRemainder = Math.round(ageMonths - years * 12);
          const visit = tx
            .insert(visits)
            .values({
              patientId: data.patientId,
              clinicId,
              visitedAt: measuredAt,
              ageMonths,
              ageYears: years,
              ageMonthsRemainder: monthsRemainder >= 12 ? 0 : monthsRemainder,
            })
            .returning({ id: visits.id })
            .get();
          if (!visit) throw new Error("Failed to create measurement visit.");
          resolvedVisitId = visit.id;
        }

        row = tx
          .insert(measurements)
          .values({
            visitId: resolvedVisitId,
            patientId: data.patientId,
            indicator: data.indicator,
            value: data.value,
            measuredAt,
            lengthCmAtMeasurement: data.indicator === "weight-for-length" ? data.lengthCm : null,
            ...growthData,
          })
          .returning()
          .get();
      }
      if (!row) throw new Error("Failed to save measurement.");

      if (!existing) {
        tx.insert(auditLog)
          .values({
            actorId: context.user.id,
            action: "create",
            entity: "Measurement",
            entityId: row.id,
            metadata: {
              patientId: row.patientId,
              visitId: row.visitId,
              indicator: row.indicator,
            },
          })
          .run();
      }

      if (idempotencyKey && requestHash) {
        tx.insert(idempotency)
          .values({
            id: crypto.randomUUID(),
            key: idempotencyKey,
            requestHash,
            result: { measurementId: row.id },
          })
          .run();
      }

      return row;
    });

    return row;
  });

async function hashIdempotentRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function forbidden(): Error {
  setResponseStatus(403);
  return new Error("Forbidden.");
}
