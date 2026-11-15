// src/features/development/api.ts
import { and, db, eq } from "#/db/index.ts";
import { auditLog, idempotency, milestones } from "#/db/schema.ts";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  bulkSetPatientMilestones,
  getPatientDevelopmentSnapshot,
  setPatientMilestone,
} from "../../db/queries/develop.queries";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

// `milestoneId` mirrors the catalog IDs in `types.ts` (e.g. "m-12m-lang").
// Kept as a bounded free string so seed-driven catalog changes don't break
// the validator at build time.
const MilestoneIdSchema = z.string().min(1).max(64);

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full snapshot for one patient's development page.
 * Returns `null` if the patient does not exist.
 *
 * `clinicAccessMiddleware` derives the patient's clinic and rejects callers
 * from a different clinic. The input carries only a `patientId`; the
 * clinicId is *not* trusted from the client.
 */
export const fetchPatientDevelopment = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => getPatientDevelopmentSnapshot(data.patientId));

// ─────────────────────────────────────────────────────────────────────────────
// Write — single milestone
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `freshAuthMiddleware` re-validates the session against the DB before the
 * write — so a revoked session cannot record a milestone. `clinicAccessMiddleware`
 * then enforces tenant isolation on the `patientId`.
 */
export const setMilestoneAchievedFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      milestoneId: MilestoneIdSchema,
      isAchieved: z.boolean(),
      achievedDate: IsoDateSchema.optional().nullable(),
      notes: z.string().trim().max(2000).optional().nullable(),
    }),
  )
  .handler(async ({ data }) => setPatientMilestone(data));

// ─────────────────────────────────────────────────────────────────────────────
// Write — bulk (checklist "save all" / import from paper form)
// ─────────────────────────────────────────────────────────────────────────────

const BulkItemSchema = z.object({
  milestoneId: MilestoneIdSchema,
  isAchieved: z.boolean(),
  achievedDate: IsoDateSchema.optional().nullable(),
});

export const bulkSetMilestonesFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      items: z.array(BulkItemSchema).min(1).max(200),
    }),
  )
  .handler(async ({ data }) => bulkSetPatientMilestones(data.patientId, data.items));

const SetMilestoneInput = z.object({
  patientId: z.uuid(),
  milestoneId: MilestoneIdSchema,
  isAchieved: z.boolean(),
  achievedDate: IsoDateSchema.optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  baseVersion: z.string().datetime().optional(),
});

export const setMilestoneFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(SetMilestoneInput)
  .handler(async ({ data, context }) => {
    const idempotencyKey = getRequest().headers.get("Idempotency-Key");
    const requestHash = idempotencyKey
      ? await hashIdempotentRequest({
          operation: "set-milestone",
          key: idempotencyKey,
          userId: context.user.id,
          data,
        })
      : null;

    const patient = await db.query.patients.findFirst({
      where: { id: data.patientId },
      columns: { clinicId: true },
    });
    if (!patient || (context.user.role !== "admin" && patient.clinicId !== context.user.clinicId)) {
      throw forbidden();
    }

    const catalogEntry = await db.query.milestoneCatalog.findFirst({
      where: { id: data.milestoneId },
      columns: { id: true },
    });
    if (!catalogEntry) {
      setResponseStatus(422);
      throw new Error("Milestone is not present in the current catalog.");
    }

    const result = db.transaction((tx) => {
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
              kind: "conflict" as const,
              serverSnapshot: previousResult.serverSnapshot,
            };
          }

          const milestoneId =
            typeof previousResult === "object" &&
            previousResult !== null &&
            "milestoneId" in previousResult &&
            typeof previousResult.milestoneId === "string"
              ? previousResult.milestoneId
              : null;
          if (!milestoneId) {
            throw new Error("Stored idempotency result is invalid.");
          }

          const previousRow = tx
            .select()
            .from(milestones)
            .where(eq(milestones.id, milestoneId))
            .get();
          if (!previousRow) {
            throw new Error("The previously saved milestone is missing.");
          }
          return { kind: "ok" as const, data: previousRow };
        }
      }

      const existing = tx
        .select()
        .from(milestones)
        .where(
          and(
            eq(milestones.patientId, data.patientId),
            eq(milestones.milestoneId, data.milestoneId),
          ),
        )
        .get();

      if (data.baseVersion && existing && existing.updatedAt.toISOString() !== data.baseVersion) {
        const serverSnapshot = existing;
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
        return { kind: "conflict" as const, serverSnapshot };
      }

      const achievedDate = data.isAchieved
        ? (data.achievedDate ?? new Date().toISOString().slice(0, 10))
        : null;
      const row = existing
        ? tx
            .update(milestones)
            .set({
              isAchieved: data.isAchieved,
              achievedDate,
              notes: data.notes ?? null,
              updatedBy: context.user.id,
              updatedAt: new Date(),
            })
            .where(eq(milestones.id, existing.id))
            .returning()
            .get()
        : tx
            .insert(milestones)
            .values({
              patientId: data.patientId,
              milestoneId: data.milestoneId,
              isAchieved: data.isAchieved,
              achievedDate,
              notes: data.notes ?? null,
              createdBy: context.user.id,
              updatedBy: context.user.id,
            })
            .returning()
            .get();

      if (!row) throw new Error("Failed to save milestone.");

      tx.insert(auditLog)
        .values({
          actorId: context.user.id,
          action: existing ? "update" : "create",
          entity: "Milestone",
          entityId: row.id,
          metadata: {
            patientId: row.patientId,
            milestoneId: row.milestoneId,
            isAchieved: row.isAchieved,
          },
        })
        .run();

      if (idempotencyKey && requestHash) {
        tx.insert(idempotency)
          .values({
            id: crypto.randomUUID(),
            key: idempotencyKey,
            requestHash,
            result: { milestoneId: row.id },
          })
          .run();
      }

      return { kind: "ok" as const, data: row };
    });

    if (result.kind === "conflict") {
      throw conflict(result.serverSnapshot);
    }
    return result.data;
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

function conflict(serverSnapshot: unknown): Error {
  setResponseStatus(409);
  return Object.assign(new Error("Conflict (409): milestone was updated elsewhere."), {
    serverSnapshot,
  });
}
