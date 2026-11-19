// src/features/transcription/use-transcription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TranscribeInput } from "./schemas";

import { transcriptionKeys } from "./keys"; // add to features/shared invalidation helpers
import { transcribe } from "./transcribe.fn";

export function useTranscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TranscribeInput) => transcribe({ data: input }),
    onSuccess: (_res, input) => {
      // Invalidate the visit/patient record so the new draft note appears.
      if (input.visitId) {
        void qc.invalidateQueries({ queryKey: transcriptionKeys.forVisit(input.visitId) });
      }
      void qc.invalidateQueries({ queryKey: transcriptionKeys.forPatient(input.patientId) });
    },
  });
}
