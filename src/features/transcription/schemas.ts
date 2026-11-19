// src/features/transcription/schemas.ts
import { z } from "zod";

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB — OpenAI cap
export const MAX_AUDIO_SECONDS = 10 * 60;

export const languageSchema = z.enum(["es", "ar", "en", "auto"]).default("auto");

export const transcribeInputSchema = z.object({
  audio: z.instanceof(File).refine((f) => f.size > 0 && f.size <= MAX_AUDIO_BYTES, {
    message: "Audio must be non-empty and ≤25MB",
  }),
  seconds: z.number().positive().max(MAX_AUDIO_SECONDS),
  visitId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  language: languageSchema,
  idempotencyKey: z.string().uuid(),
  save: z.boolean().default(true), // save transcript to the visit record?
});

export type TranscribeInput = z.infer<typeof transcribeInputSchema>;

export const transcriptSchema = z.object({
  text: z.string(),
  provider: z.enum(["gpt-4o-mini", "whisper-local"]),
  costUsd: z.number().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  needsReview: z.boolean(), // always true when persisted to a clinical record
});
