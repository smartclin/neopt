import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";

import { transcribeWithFallback } from "./providers";
import { saveTranscript } from "./queries";
import { transcribeInputSchema, transcriptSchema } from "./schemas";

export const transcribe = createServerFn({ method: "POST" })
  .validator((input) => transcribeInputSchema.parse(input))
  .middleware([clinicAccessMiddleware])
  .handler(async ({ data, context }) => {
    const result = await transcribeWithFallback(data.audio, data.seconds, data.language);
    const payload = transcriptSchema.parse({ ...result, needsReview: true });

    if (data.save) {
      try {
        await saveTranscript({
          clinicId: context.clinicId,
          patientId: data.patientId,
          visitId: data.visitId,
          transcript: payload.text,
          provider: payload.provider,
          costUsd: payload.costUsd,
          authorId: context.user.id,
          idempotencyKey: data.idempotencyKey,
        });
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Conflict (409):")) {
          setResponseStatus(409);
        }
        throw error;
      }
    }

    return payload;
  });
