// src/features/immunizations/api.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { and, db, eq } from "#/db/index.ts";
import { auditLog, idempotency, immunizationStatuses, immunizations } from "#/db/schema.ts";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";
import {
  getCoverage,
  getImmunizationMatrix,
  getPatientImmunizations,
  updateImmunization,
} from "../../db/queries/immunization.queries";
import { immunizationInputSchema, updateImmunizationInputSchema } from "./schema";

export const fetchPatientImmunizations = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      // Optional ISO string. When omitted, the server derives age from
      // `patients.dateOfBirth` — pass it only to skip that read.
      patientDob: z.iso.datetime().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const dob = data.patientDob ? new Date(data.patientDob) : undefined;
    return getPatientImmunizations(data.patientId, dob);
  });

export const fetchImmunizationCoverage = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => getCoverage(data.clinicId));

export const fetchImmunizationMatrix = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      filter: z
        .object({
          ageBracket: z.enum(["0-6", "6-12", "12-24", ">24"]).optional(),
          onlyOverdue: z.boolean().optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }) => getImmunizationMatrix(data.clinicId, data.filter ?? {}));

export const updateImmunizationFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      id: z.uuid(),
      patch: updateImmunizationInputSchema,
    }),
  )
  .handler(async ({ data }) => {
    const updated = await updateImmunization(data.id, data.patch);
    // Distinguish "row doesn't exist" from "row updated to empty", so the
    // caller can toast the right message.
    if (!updated) {
      throw new Error(`Immunization ${data.id} not found`);
    }
    return updated;
  });

export const RecordImmunizationInput = immunizationInputSchema
  .extend({
    status: z.enum(immunizationStatuses).default("given"),
    administeredDate: z.coerce.date().nullable().optional(),
    visitId: z.uuid().nullable().optional(),
  })
  .omit({ administeredById: true });

export type RecordImmunizationInput = z.infer<typeof RecordImmunizationInput>;

async function hashIdempotentRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const recordImmunizationFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(RecordImmunizationInput)
  .handler(async ({ data, context }) => {
    const idempotencyKey = getRequest().headers.get("Idempotency-Key");
    const administeredDate = data.status === "given" ? (data.administeredDate ?? new Date()) : null;
    const requestHash = idempotencyKey
      ? await hashIdempotentRequest({
          key: idempotencyKey,
          userId: context.user.id,
          data: { ...data, administeredDate },
        })
      : null;

    return db.transaction((tx) => {
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
            "immunizationId" in previousResult &&
            typeof previousResult.immunizationId === "string"
              ? previousResult.immunizationId
              : null;

          if (!previousId) {
            throw new Error("Stored idempotency result is invalid.");
          }

          const previousImmunization = tx
            .select()
            .from(immunizations)
            .where(eq(immunizations.id, previousId))
            .get();

          if (!previousImmunization) {
            throw new Error("The previously recorded immunization is missing.");
          }
          return previousImmunization;
        }
      }

      const existingDose = administeredDate
        ? tx
            .select()
            .from(immunizations)
            .where(
              and(
                eq(immunizations.patientId, data.patientId),
                eq(immunizations.vaccineKey, data.vaccineKey),
                eq(immunizations.doseNumber, data.doseNumber),
                eq(immunizations.administeredDate, administeredDate),
              ),
            )
            .get()
        : undefined;

      const row =
        existingDose ??
        tx
          .insert(immunizations)
          .values({
            patientId: data.patientId,
            visitId: data.visitId ?? null,
            vaccineKey: data.vaccineKey,
            vaccineName: data.vaccineName,
            doseNumber: data.doseNumber,
            targetAgeMonths: data.targetAgeMonths,
            status: data.status,
            administeredDate,
            lotNumber: data.lotNumber ?? null,
            site: data.site ?? null,
            administeredById: context.user.id,
            adverseEvents: data.adverseEvents ?? null,
            notes: data.notes ?? null,
          })
          .returning()
          .get();

      if (!row) {
        throw new Error("Failed to record immunization.");
      }

      if (!existingDose) {
        tx.insert(auditLog)
          .values({
            actorId: context.user.id,
            action: "create",
            entity: "Immunization",
            entityId: row.id,
            metadata: {
              patientId: row.patientId,
              vaccineKey: row.vaccineKey,
              doseNumber: row.doseNumber,
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
            result: { immunizationId: row.id },
          })
          .run();
      }

      return row;
    });
  });
