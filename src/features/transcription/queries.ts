// src/features/transcription/queries.ts
import "@tanstack/react-start/server-only";
import { withTransaction, eq } from "@/db";
import { auditLog, idempotency, medicalNotes, patients, visits } from "@/db/schema";

async function hashSaveRequest(args: {
  clinicId: string;
  patientId: string;
  visitId?: string;
  transcript: string;
  provider: string;
  costUsd: number;
  authorId: string;
  idempotencyKey: string;
}) {
  const bytes = new TextEncoder().encode(
    JSON.stringify({
      operation: "save-transcript",
      clinicId: args.clinicId,
      patientId: args.patientId,
      visitId: args.visitId ?? null,
      authorId: args.authorId,
      idempotencyKey: args.idempotencyKey,
    }),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function saveTranscript(args: {
  clinicId: string;
  patientId: string;
  visitId?: string;
  transcript: string;
  provider: string;
  costUsd: number;
  authorId: string;
  idempotencyKey: string;
}) {
  const requestHash = await hashSaveRequest(args);

  return withTransaction((tx) => {
    const previous = tx
      .select()
      .from(idempotency)
      .where(eq(idempotency.key, args.idempotencyKey))
      .get();

    if (previous) {
      if (previous.requestHash !== requestHash) {
        throw new Error("Conflict (409): Idempotency key was reused with a different request.");
      }

      const previousResult: unknown = previous.result;
      const previousNoteId =
        typeof previousResult === "object" &&
        previousResult !== null &&
        "medicalNoteId" in previousResult &&
        typeof previousResult.medicalNoteId === "string"
          ? previousResult.medicalNoteId
          : null;
      if (!previousNoteId) {
        throw new Error("Stored idempotency result is invalid.");
      }

      const existingNote = tx
        .select()
        .from(medicalNotes)
        .where(eq(medicalNotes.id, previousNoteId))
        .get();
      if (!existingNote) {
        throw new Error("The previously saved transcription is missing.");
      }
      return existingNote;
    }

    const patient = tx
      .select({ clinicId: patients.clinicId })
      .from(patients)
      .where(eq(patients.id, args.patientId))
      .get();
    if (!patient || patient.clinicId !== args.clinicId) {
      throw new Error("Patient not found or outside the requested clinic.");
    }

    if (args.visitId) {
      const visit = tx
        .select({ patientId: visits.patientId, clinicId: visits.clinicId })
        .from(visits)
        .where(eq(visits.id, args.visitId))
        .get();
      if (!visit || visit.patientId !== args.patientId || visit.clinicId !== args.clinicId) {
        throw new Error("Visit not found or does not belong to the patient and clinic.");
      }
    }

    const note = tx
      .insert(medicalNotes)
      .values({
        patientId: args.patientId,
        visitId: args.visitId ?? null,
        authorId: args.authorId,
        title: "Voice transcription",
        body: args.transcript,
      })
      .returning()
      .get();

    if (!note) {
      throw new Error("Failed to insert medical note from transcription.");
    }

    tx.insert(auditLog)
      .values({
        actorId: args.authorId,
        entity: "medical_note",
        entityId: note.id,
        action: "create",
        metadata: {
          source: "voice_transcription",
          provider: args.provider,
          costUsd: args.costUsd,
          needsReview: true,
          idempotencyKey: args.idempotencyKey,
        },
      })
      .run();

    tx.insert(idempotency)
      .values({
        id: crypto.randomUUID(),
        key: args.idempotencyKey,
        requestHash,
        result: { medicalNoteId: note.id },
      })
      .run();

    return note;
  });
}
