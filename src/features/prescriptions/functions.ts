// src/features/prescriptions/api.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { and, db, eq } from "#/db/index.ts";
import { auditLog, idempotency, prescriptions } from "#/db/schema.ts";
import {
  countPrescriptionsForPatient,
  createPrescription,
  createPrescriptions,
  deletePrescription,
  getPrescriptionById,
  listActivePrescriptionsForPatient,
  listPrescriptionsByPrescriber,
  listPrescriptionsForPatient,
  listPrescriptionsForVisit,
  topMedicationsForClinic,
  updatePrescription,
} from "@/db/queries/prescriptions.queries";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { authMiddleware, freshAuthMiddleware } from "@/lib/auth/middleware";
import { COMPOSER_DRUGS, type ComposerDrug, findComposerDrug } from "./composer/formulary";
import { type ComposerUnit, composerUnitSchema } from "./composer/types";
import {
  CreatePrescriptionSchema,
  prescriptionRegisterSearchSchema,
  UpdatePrescriptionSchema,
} from "./schema";

export const fetchPrescriptionById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ prescriptionId: z.uuid() }))
  .handler(async ({ data }) => getPrescriptionById(data.prescriptionId));

export const fetchPrescriptionsForVisit = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ visitId: z.uuid() }))
  .handler(async ({ data }) => listPrescriptionsForVisit(data.visitId));

export const fetchPrescriptionsForPatient = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => listPrescriptionsForPatient(data.patientId));

export const fetchActivePrescriptions = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => listActivePrescriptionsForPatient(data.patientId));

export const fetchPrescriptionsByPrescriber = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      userId: z.uuid(),
      limit: z.number().int().min(1).max(500).optional().default(100),
    }),
  )
  .handler(async ({ data, context }) => {
    // Users can only view their own prescribing history unless they are an admin.
    if (context.user.role !== "admin" && context.user.id !== data.userId) {
      throw new Error("Forbidden: you can only view your own prescriptions.");
    }
    return listPrescriptionsByPrescriber(data.userId, data.limit);
  });

export const fetchTopMedications = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  )
  .handler(async ({ data }) => topMedicationsForClinic(data.clinicId, data.limit));

export const fetchPatientPrescriptionCount = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => ({
    count: await countPrescriptionsForPatient(data.patientId),
  }));

export const fetchPrescriptionRegister = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid(), search: prescriptionRegisterSearchSchema }))
  .handler(async ({ data }) => {
    const { listPrescriptionRegister } = await import("../../db/queries/prescriptions.queries");
    return listPrescriptionRegister(data.clinicId, data.search);
  });

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Create
// ─────────────────────────────────────────────────────────────────────────────

export const createPrescriptionFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(CreatePrescriptionSchema)
  .handler(async ({ data }) =>
    createPrescription({
      ...data,
      prescribedAt: data.prescribedAt ? new Date(data.prescribedAt) : undefined,
    }),
  );

export const createPrescriptionsFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ rows: z.array(CreatePrescriptionSchema).min(1) }))
  .handler(async ({ data }) =>
    createPrescriptions(
      data.rows.map((r) => ({
        ...r,
        prescribedAt: r.prescribedAt ? new Date(r.prescribedAt) : undefined,
      })),
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Update / delete / renew
// ─────────────────────────────────────────────────────────────────────────────

export const updatePrescriptionFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(UpdatePrescriptionSchema)
  .handler(async ({ data }) => updatePrescription(data.prescriptionId, data.patch));

export const deletePrescriptionFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ prescriptionId: z.uuid() }))
  .handler(async ({ data }) => {
    await deletePrescription(data.prescriptionId);
    return { ok: true } as const;
  });

export const renewPrescriptionFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      prescriptionId: z.uuid(),
      prescribedById: z.uuid().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { renewPrescription } = await import("../../db/queries/prescriptions.queries");
    return renewPrescription(data.prescriptionId, data.prescribedById);
  });

const SavePrescriptionInput = z.object({
  prescriptionId: z.uuid().optional(),
  patientId: z.uuid(),
  visitId: z.uuid(),
  clinicId: z.uuid(),
  drugKey: z.string().optional(),
  medicationName: z.string().min(1),
  brandName: z.string().nullable(),
  strength: z.number().positive(),
  unit: composerUnitSchema,
  frequency: z.string().min(1),
  durationDays: z.number().int().positive().nullable(),
  instructions: z.string().nullable(),
  weightKg: z.number().positive().nullable(),
  mgPerKgPerDay: z.number().positive().nullable(),
  dosesPerDay: z.number().int().positive().nullable(),
  concentrationLabel: z.string().nullable(),
  baseVersion: z.string().datetime().optional(),
  expectedDoseCheck: z
    .object({
      formularyKey: z.string(),
      withinRange: z.boolean(),
    })
    .optional(),
});

export const savePrescriptionFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(SavePrescriptionInput)
  .handler(async ({ data, context }) => {
    // ── 1. Pull idempotency key + hash the *exact* request ────────────
    //
    // The hash includes userId so two different doctors who happen to
    // generate the same key can't collide. It includes the full payload
    // so a reused key with different data is a hard 409 (matching
    // recordImmunizationFn's contract).
    const idempotencyKey = getRequest().headers.get("Idempotency-Key");
    const requestHash = idempotencyKey
      ? await hashIdempotentRequest({
          key: idempotencyKey,
          userId: context.user.id,
          data,
        })
      : null;

    // ── 2. Authorise + dose-check OUTSIDE the transaction ────────────
    //
    // The formulary check is pure — no DB reads, no side effects. Doing
    // it before opening a transaction keeps the transaction short.
    // If it fails, we never even touch the idempotency table, so a
    // retry with the same key after the clinician fixes the dose is
    // allowed to succeed.
    if (context.user.role !== "admin" && data.clinicId !== context.user.clinicId) {
      throw forbidden();
    }

    const patient = await db.query.patients.findFirst({
      where: {
        id: data.patientId,
        clinicId: data.clinicId,
      },
      columns: { id: true, weightKg: true, allergies: true },
    });
    if (!patient) throw forbidden();
    const visit = await db.query.visits.findFirst({
      where: {
        id: data.visitId,
        patientId: data.patientId,
        clinicId: data.clinicId,
      },
      columns: { id: true },
    });
    if (!visit) throw forbidden();

    const medicationName = data.medicationName.trim().toLocaleLowerCase();
    const keyedFormulary = data.drugKey ? findComposerDrug(data.drugKey) : undefined;
    if (data.drugKey && !keyedFormulary) {
      setResponseStatus(422);
      throw new Error("Selected medication is not in the current formulary.");
    }
    const formulary =
      keyedFormulary ??
      COMPOSER_DRUGS.find(
        (drug) =>
          drug.genericName.toLocaleLowerCase() === medicationName ||
          drug.brandNames.some((brand) => brand.toLocaleLowerCase() === medicationName),
      );
    if (formulary) {
      const doseCheck = verifyDose(formulary, {
        weightKg: data.weightKg ?? patient.weightKg ?? 0,
        strength: data.strength,
        unit: data.unit,
        dosesPerDay: data.dosesPerDay ?? 1,
        mgPerKgPerDay: data.mgPerKgPerDay,
      });
      if (!doseCheck.ok) {
        // 422 — flusher marks `failed`, clinician must fix the dose.
        setResponseStatus(422);
        throw new Error(
          `Dose could not be verified for ${formulary.genericName}: ${doseCheck.reason}`,
        );
      }
      const allergyHit = checkAllergies(formulary, patient.allergies);
      if (allergyHit) {
        setResponseStatus(422);
        throw new Error(
          `Allergy conflict: recorded allergy "${allergyHit}" matches this medication.`,
        );
      }
    }

    // ── 3. Single transaction: idempotency check + create/update ─────
    //
    // Mirrors `recordImmunizationFn`. All reads and writes happen on
    // `tx`, so the idempotency-cache lookup, the version check, the
    // row write, and the audit log either all commit or all roll back.
    return db.transaction((tx) => {
      // 3a. Idempotency cache hit?
      if (idempotencyKey && requestHash) {
        const previous = tx
          .select()
          .from(idempotency)
          .where(eq(idempotency.key, idempotencyKey))
          .get();

        if (previous) {
          if (previous.requestHash !== requestHash) {
            // Same key, different payload — client bug. 409.
            setResponseStatus(409);
            throw new Error("Conflict (409): Idempotency key was reused with a different request.");
          }

          const previousResult: unknown = previous.result;
          const previousId =
            typeof previousResult === "object" &&
            previousResult !== null &&
            "prescriptionId" in previousResult &&
            typeof previousResult.prescriptionId === "string"
              ? previousResult.prescriptionId
              : null;

          if (!previousId) {
            throw new Error("Stored idempotency result is invalid.");
          }

          const previousRow = tx
            .select()
            .from(prescriptions)
            .where(eq(prescriptions.id, previousId))
            .get();

          if (!previousRow) {
            throw new Error("The previously saved prescription is missing.");
          }
          return previousRow;
        }
      }

      // 3b. CREATE path.
      if (!data.prescriptionId) {
        const row = tx
          .insert(prescriptions)
          .values({
            patientId: data.patientId,
            visitId: data.visitId,
            medicationName: data.medicationName,
            dosage: `${data.strength} ${data.unit}`,
            frequency: data.frequency,
            durationDays: data.durationDays,
            instructions: data.instructions,
            prescribedById: context.user.id,
            prescribedAt: new Date(),
            status: "active",
          })
          .returning()
          .get();

        if (!row) throw new Error("Failed to save prescription.");

        tx.insert(auditLog)
          .values({
            actorId: context.user.id,
            action: "create",
            entity: "Prescription",
            entityId: row.id,
            metadata: {
              patientId: row.patientId,
              visitId: row.visitId,
              medicationName: row.medicationName,
            },
          })
          .run();

        if (idempotencyKey && requestHash) {
          tx.insert(idempotency)
            .values({
              id: crypto.randomUUID(),
              key: idempotencyKey,
              requestHash,
              result: { prescriptionId: row.id },
            })
            .run();
        }

        return row;
      }

      // 3c. UPDATE path.
      const current = tx
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, data.prescriptionId))
        .get();

      if (!current) {
        setResponseStatus(404);
        throw new Error("Prescription not found.");
      }
      if (current.patientId !== data.patientId || current.visitId !== data.visitId) {
        setResponseStatus(403);
        throw new Error("Forbidden.");
      }

      // Optimistic concurrency — the client sends the version it
      // last saw. If the server moved on, return the current row so
      // the flusher can surface a conflict.
      if (data.baseVersion && current.updatedAt.toISOString() !== data.baseVersion) {
        setResponseStatus(409);
        throw Object.assign(new Error("Version conflict (409)."), {
          serverSnapshot: current,
        });
      }

      const row = tx
        .update(prescriptions)
        .set({
          medicationName: data.medicationName,
          dosage: `${data.strength} ${data.unit}`,
          frequency: data.frequency,
          durationDays: data.durationDays,
          instructions: data.instructions,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(prescriptions.id, data.prescriptionId),
            eq(prescriptions.patientId, data.patientId),
            eq(prescriptions.visitId, data.visitId),
          ),
        )
        .returning()
        .get();

      if (!row) throw new Error("Failed to update prescription.");

      tx.insert(auditLog)
        .values({
          actorId: context.user.id,
          action: "update",
          entity: "Prescription",
          entityId: row.id,
          metadata: {
            patientId: row.patientId,
            changes: {
              medicationName: {
                from: current.medicationName,
                to: row.medicationName,
              },
              dosage: { from: current.dosage, to: row.dosage },
              frequency: { from: current.frequency, to: row.frequency },
            },
          },
        })
        .run();

      if (idempotencyKey && requestHash) {
        tx.insert(idempotency)
          .values({
            id: crypto.randomUUID(),
            key: idempotencyKey,
            requestHash,
            result: { prescriptionId: row.id },
          })
          .run();
      }

      return row;
    });
  });

// ─── Helpers (module-scope, all defined) ──────────────────────────────────

async function hashIdempotentRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function verifyDose(
  drug: ComposerDrug,
  params: {
    weightKg: number;
    strength: number;
    unit: ComposerUnit;
    dosesPerDay: number;
    mgPerKgPerDay: number | null;
  },
): { ok: true } | { ok: false; reason: string } {
  if (params.weightKg <= 0) {
    return { ok: false, reason: "patient weight is required" };
  }

  let mgPerKg: number;
  let singleDoseMg: number;
  let dailyDoseMg: number;
  if (params.mgPerKgPerDay != null) {
    mgPerKg = params.mgPerKgPerDay;
    dailyDoseMg = mgPerKg * params.weightKg;
    singleDoseMg = dailyDoseMg / params.dosesPerDay;
  } else {
    const unitFactor =
      params.unit === "mg"
        ? 1
        : params.unit === "mcg"
          ? 0.001
          : params.unit === "g"
            ? 1000
            : undefined;
    if (unitFactor == null) {
      return {
        ok: false,
        reason: "dose units require a verified concentration before saving",
      };
    }
    singleDoseMg = params.strength * unitFactor;
    dailyDoseMg = singleDoseMg * params.dosesPerDay;
    mgPerKg = dailyDoseMg / params.weightKg;
  }

  const maximum = drug.dosing.maxMgPerKgPerDay;
  if (maximum != null && mgPerKg > maximum) {
    return {
      ok: false,
      reason: `${mgPerKg.toFixed(2)} mg/kg/day exceeds ${maximum} mg/kg/day`,
    };
  }
  if (drug.dosing.maxSingleDoseMg != null && singleDoseMg > drug.dosing.maxSingleDoseMg) {
    return {
      ok: false,
      reason: `single dose ${singleDoseMg.toFixed(2)} mg exceeds ${drug.dosing.maxSingleDoseMg} mg`,
    };
  }
  if (drug.dosing.maxDailyDoseMg != null && dailyDoseMg > drug.dosing.maxDailyDoseMg) {
    return {
      ok: false,
      reason: `daily dose ${dailyDoseMg.toFixed(2)} mg exceeds ${drug.dosing.maxDailyDoseMg} mg`,
    };
  }
  return { ok: true };
}

function checkAllergies(drug: ComposerDrug, allergies: string | null): string | null {
  if (!allergies) return null;
  const allergyList = allergies
    .split(",")
    .map((allergy) => allergy.trim().toLowerCase())
    .filter(Boolean);
  for (const contraindication of drug.contraindications) {
    const lowerContraindication = contraindication.toLowerCase();
    const matchedAllergy = allergyList.find((allergy) => lowerContraindication.includes(allergy));
    if (matchedAllergy) return matchedAllergy;
  }
  const crossReactiveAllergy = drug.crossReactivities.find((allergen) =>
    allergyList.some((allergy) => allergy.includes(allergen)),
  );
  if (crossReactiveAllergy) return crossReactiveAllergy;
  return (
    [drug.genericName, ...drug.brandNames].find((name) =>
      allergyList.some((allergy) => allergy.includes(name.toLowerCase())),
    ) ?? null
  );
}

function forbidden(): Error {
  setResponseStatus(403);
  return new Error("Forbidden.");
}
