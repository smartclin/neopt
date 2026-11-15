// features/visits/composer/functions.ts
//
// Server functions for the visit composer. One level of indirection
// above `queries.ts`: everything here is safe to import from a
// `createServerFn` client because it doesn't pull in `#/db`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  fetchActiveMedications,
  fetchPatientSnapshot,
  saveVisit,
} from "@/db/queries/visit-composer.queries";
import { authMiddleware } from "@/lib/auth/middleware";
import { type SaveVisitResult, visitComposerSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

const patientIdInput = z.object({ patientId: z.string().min(1) });

export const getVisitSnapshot = createServerFn({ method: "GET" })
  .validator(patientIdInput)
  .handler(async ({ data }) => fetchPatientSnapshot(data.patientId));

export const listActiveMedicationsForVisit = createServerFn({ method: "GET" })
  .validator(patientIdInput)
  .handler(async ({ data }) => fetchActiveMedications(data.patientId));

// ─────────────────────────────────────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────────────────────────────────────

const SaveVisitComposerSchema = visitComposerSchema.extend({
  visitId: z.uuid().optional(),
  doctorId: z.uuid().nullable().optional(),
});

export const saveVisitComposer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(SaveVisitComposerSchema)
  .handler(async ({ data, context }): Promise<SaveVisitResult> =>
    saveVisit(data, {
      id: context.user.id,
      role: context.user.role,
      clinicId: context.user.clinicId ?? null,
    }),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Derived types — reuse these in query-options.ts so the component layer
// never touches `#/db`.
// ─────────────────────────────────────────────────────────────────────────────

export type VisitSnapshot = Awaited<ReturnType<typeof getVisitSnapshot>>;
export type ActiveMedication = Awaited<ReturnType<typeof listActiveMedicationsForVisit>>[number];
