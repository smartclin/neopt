// src/features/shared/queryKeys.queries.ts
//
// Centralised query-key factory. Two rules:
//   1. Every key is built from this object — no ad-hoc string arrays in
//      components.
//   2. The `curves` key includes (indicator, sex, min, max, xAxis) as
//      *primitives*, so structurally-equal range objects dedupe (React
//      Query hashes plain objects by shape, but being explicit here means
//      refetches survive a caller that re-creates the range each render).

import type { Indicator, Sex } from "../growth/types";

type Range = { xAxis: "age" | "length"; min: number; max: number };

export const qk = {
  // Growth and measurement keys
  curves: (indicator: Indicator, sex: Sex, r: Range) =>
    ["curves", indicator, sex, r.xAxis, r.min, r.max] as const,

  series: (patientId: string, indicator: Indicator) => ["series", patientId, indicator] as const,

  // NOTE: band intentionally keyed on the *rounded* x (0.1 precision) so
  // hovering 12.0 → 12.04 doesn't refetch.
  band: (indicator: Indicator, sex: Sex, r: Range, x: number) =>
    ["band", indicator, sex, r.xAxis, r.min, r.max, Math.round(x * 10) / 10] as const,

  flagged: (patientId: string, threshold = 2) => ["flagged", patientId, threshold] as const,

  // Patient keys
  patient: (patientId: string) => ["patient", patientId] as const,
  patients: () => ["patients"] as const,
  patientHistory: (patientId: string) => ["patient", patientId, "history"] as const,

  // Clinic keys
  clinic: (clinicId: string) => ["clinic", clinicId] as const,
  clinics: () => ["clinics"] as const,

  // Visit keys
  visit: (visitId: string) => ["visit", visitId] as const,
  visits: (patientId: string) => ["visits", patientId] as const,

  // Appointment keys
  appointment: (appointmentId: string) => ["appointment", appointmentId] as const,
  appointments: (patientId: string) => ["appointments", patientId] as const,
  appointmentsToday: (clinicId: string) => ["appointments", "today", clinicId] as const,
  appointmentsRange: (clinicId: string, from: string, to: string) =>
    ["appointments", "range", clinicId, from, to] as const,
  appointmentStatusCounts: (clinicId: string, from: string, to: string) =>
    ["appointments", "status-counts", clinicId, from, to] as const,

  // Prescription keys
  prescription: (prescriptionId: string) => ["prescription", prescriptionId] as const,
  prescriptions: (patientId: string) => ["prescriptions", patientId] as const,

  // Diagnosis keys
  diagnosis: (diagnosisId: string) => ["diagnosis", diagnosisId] as const,
  diagnoses: (patientId: string) => ["diagnoses", patientId] as const,
} as const;

export type QueryKey = ReturnType<(typeof qk)[keyof typeof qk]>;
