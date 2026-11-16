// src/features/shared/invalidations.queries.ts
//
// Post-mutation invalidation helpers. Centralised so the Drizzle query
// layer's semantics (a measurement write touches series + band + flagged)
// live in exactly one place. Components call these from mutation
// `onSuccess` instead of hand-writing key prefixes.

import type { QueryClient } from "@tanstack/react-query";

import type { Indicator } from "../growth/types/types";

import { qk } from "./queryKeys.queries";

// ---------------------------------------------------------------------------
// Patient invalidations
// ---------------------------------------------------------------------------

export function invalidateAfterPatientCreate(qc: QueryClient, clinicId: string): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.patients() }),
    qc.invalidateQueries({ queryKey: ["clinic", clinicId] }),
  ]);
}

export function invalidateAfterPatientUpdate(
  qc: QueryClient,
  patientId: string,
  clinicId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.patient(patientId) }),
    qc.invalidateQueries({ queryKey: qk.patients() }),
    qc.invalidateQueries({ queryKey: ["clinic", clinicId] }),
  ]);
}

export function invalidateAfterPatientDelete(
  qc: QueryClient,
  patientId: string,
  clinicId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.patients() }),
    qc.invalidateQueries({ queryKey: ["clinic", clinicId] }),
    qc.invalidateQueries({ queryKey: qk.patientHistory(patientId) }),
  ]);
}

// ---------------------------------------------------------------------------
// Visit invalidations
// ---------------------------------------------------------------------------

export function invalidateAfterVisitCreate(qc: QueryClient, patientId: string): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.patientHistory(patientId) }),
    qc.invalidateQueries({ queryKey: ["series", patientId] }),
    qc.invalidateQueries({ queryKey: ["latest", patientId] }),
  ]);
}

export function invalidateAfterVisitUpdate(
  qc: QueryClient,
  patientId: string,
  visitId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.patientHistory(patientId) }),
    qc.invalidateQueries({ queryKey: ["visit", visitId] }),
    qc.invalidateQueries({ queryKey: ["series", patientId] }),
  ]);
}

export function invalidateAfterVisitDelete(
  qc: QueryClient,
  patientId: string,
  visitId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.patientHistory(patientId) }),
    qc.invalidateQueries({ queryKey: ["visit", visitId] }),
    qc.invalidateQueries({ queryKey: ["series", patientId] }),
  ]);
}

// ---------------------------------------------------------------------------
// Measurement invalidations
// ---------------------------------------------------------------------------

export function invalidateAfterMeasurementCreate(
  qc: QueryClient,
  patientId: string,
  indicator: Indicator,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.series(patientId, indicator) }),
    qc.invalidateQueries({ queryKey: ["flagged", patientId] }),
    qc.invalidateQueries({ queryKey: ["latest", patientId] }),
    qc.invalidateQueries({ queryKey: ["band"] }),
  ]);
}

export function invalidateAfterMeasurementUpdate(
  qc: QueryClient,
  patientId: string,
  indicator: Indicator,
  measurementId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.series(patientId, indicator) }),
    qc.invalidateQueries({ queryKey: ["measurement", measurementId] }),
    qc.invalidateQueries({ queryKey: ["flagged", patientId] }),
    qc.invalidateQueries({ queryKey: ["latest", patientId] }),
  ]);
}

export function invalidateAfterMeasurementDelete(
  qc: QueryClient,
  patientId: string,
  indicator: Indicator,
  measurementId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.series(patientId, indicator) }),
    qc.invalidateQueries({ queryKey: ["measurement", measurementId] }),
    qc.invalidateQueries({ queryKey: ["flagged", patientId] }),
    qc.invalidateQueries({ queryKey: ["latest", patientId] }),
  ]);
}

// ---------------------------------------------------------------------------
// Appointment invalidations
// ---------------------------------------------------------------------------

export function invalidateAfterAppointmentCreate(
  qc: QueryClient,
  patientId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["appointments", patientId] }),
    qc.invalidateQueries({ queryKey: qk.patient(patientId) }),
  ]);
}

export function invalidateAfterAppointmentUpdate(
  qc: QueryClient,
  patientId: string,
  appointmentId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["appointments", patientId] }),
    qc.invalidateQueries({ queryKey: ["appointment", appointmentId] }),
  ]);
}

export function invalidateAfterAppointmentDelete(
  qc: QueryClient,
  patientId: string,
  appointmentId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["appointments", patientId] }),
    qc.invalidateQueries({ queryKey: ["appointment", appointmentId] }),
  ]);
}

// ---------------------------------------------------------------------------
// Prescription invalidations
// ---------------------------------------------------------------------------

export function invalidateAfterPrescriptionCreate(
  qc: QueryClient,
  patientId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["prescriptions", patientId] }),
    qc.invalidateQueries({ queryKey: qk.patientHistory(patientId) }),
  ]);
}

export function invalidateAfterPrescriptionUpdate(
  qc: QueryClient,
  patientId: string,
  prescriptionId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["prescriptions", patientId] }),
    qc.invalidateQueries({ queryKey: ["prescription", prescriptionId] }),
  ]);
}

export function invalidateAfterPrescriptionDelete(
  qc: QueryClient,
  patientId: string,
  prescriptionId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["prescriptions", patientId] }),
    qc.invalidateQueries({ queryKey: ["prescription", prescriptionId] }),
  ]);
}

// ---------------------------------------------------------------------------
// Diagnosis invalidations
// ---------------------------------------------------------------------------

export function invalidateAfterDiagnosisCreate(
  qc: QueryClient,
  patientId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["diagnoses", patientId] }),
    qc.invalidateQueries({ queryKey: qk.patientHistory(patientId) }),
  ]);
}

export function invalidateAfterDiagnosisUpdate(
  qc: QueryClient,
  patientId: string,
  diagnosisId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["diagnoses", patientId] }),
    qc.invalidateQueries({ queryKey: ["diagnosis", diagnosisId] }),
  ]);
}

export function invalidateAfterDiagnosisDelete(
  qc: QueryClient,
  patientId: string,
  diagnosisId: string,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["diagnoses", patientId] }),
    qc.invalidateQueries({ queryKey: ["diagnosis", diagnosisId] }),
  ]);
}
