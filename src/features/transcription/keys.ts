// src/features/transcription/keys.ts

export const transcriptionKeys = {
  all: ["transcriptions"] as const,
  lists: () => [...transcriptionKeys.all, "list"] as const,
  forPatient: (patientId: string) => [...transcriptionKeys.lists(), "patient", patientId] as const,
  forVisit: (visitId: string) => [...transcriptionKeys.lists(), "visit", visitId] as const,
};
