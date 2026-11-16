// src/features/prescriptions/composer/functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  discontinueComposerPrescription,
  saveComposerPrescription,
} from "@/db/queries/prescription-composer.queries";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { freshAuthMiddleware } from "@/lib/auth/middleware";

import { prescriptionComposerSchema } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Save (create or update)
// ─────────────────────────────────────────────────────────────────────────────
//
// The composer's save path is different from the register's `createPrescriptionFn`
// because it accepts `strength`/`unit` and composes `dosage` server-side,
// and it can both create and update depending on whether `prescriptionId`
// is provided. It's a distinct server function on purpose.

const SaveSchema = prescriptionComposerSchema.extend({
  prescriptionId: z.uuid().optional(),
});

export const savePrescription = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(SaveSchema)
  .handler(async ({ data }) => {
    const row = await saveComposerPrescription({
      prescriptionId: data.prescriptionId,
      patientId: data.patientId,
      visitId: data.visitId,
      medicationName: data.medicationName,
      dosage: `${data.strength} ${data.unit}`,
      frequency: data.frequency,
      durationDays: data.durationDays,
      instructions: data.instructions,
    });

    if (!row) {
      throw new Error("Failed to save prescription");
    }
    return row;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Discontinue
// ─────────────────────────────────────────────────────────────────────────────

export const discontinuePrescription = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ prescriptionId: z.uuid() }))
  .handler(async ({ data }) => {
    const row = await discontinueComposerPrescription(data.prescriptionId);
    // Distinguish "row doesn't exist" from "row updated to cancelled",
    // so the caller can show the right toast.
    if (!row) {
      throw new Error(`Prescription ${data.prescriptionId} not found`);
    }
    return row;
  });
