import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  clinics: {
    patients: r.many.patients({
      from: r.clinics.id,
      to: r.patients.clinicId,
    }),
    appointments: r.many.appointments({
      from: r.clinics.id,
      to: r.appointments.clinicId,
    }),
    visits: r.many.visits({
      from: r.clinics.id,
      to: r.visits.clinicId,
    }),
    users: r.many.user({
      from: r.clinics.id,
      to: r.user.clinicId,
    }),
  },

  // ========================================================================
  // Patients
  // ========================================================================

  patients: {
    clinic: r.one.clinics({
      from: r.patients.clinicId,
      to: r.clinics.id,
    }),
    appointments: r.many.appointments({
      from: r.patients.id,
      to: r.appointments.patientId,
    }),
    visits: r.many.visits({
      from: r.patients.id,
      to: r.visits.patientId,
    }),
    prescriptions: r.many.prescriptions({
      from: r.patients.id,
      to: r.prescriptions.patientId,
    }),
    medicalNotes: r.many.medicalNotes({
      from: r.patients.id,
      to: r.medicalNotes.patientId,
    }),
    immunizations: r.many.immunizations({
      from: r.patients.id,
      to: r.immunizations.patientId,
    }),
  },

  // ========================================================================
  // Appointments
  // ========================================================================

  appointments: {
    patient: r.one.patients({
      from: r.appointments.patientId,
      to: r.patients.id,
    }),
    clinic: r.one.clinics({
      from: r.appointments.clinicId,
      to: r.clinics.id,
    }),
    doctor: r.one.user({
      from: r.appointments.doctorId,
      to: r.user.id,
    }),
    visits: r.many.visits({
      from: r.appointments.id,
      to: r.visits.appointmentId,
    }),
  },

  // ========================================================================
  // Visits
  // ========================================================================

  visits: {
    patient: r.one.patients({
      from: r.visits.patientId,
      to: r.patients.id,
    }),
    clinic: r.one.clinics({
      from: r.visits.clinicId,
      to: r.clinics.id,
    }),
    appointment: r.one.appointments({
      from: r.visits.appointmentId,
      to: r.appointments.id,
    }),
    doctor: r.one.user({
      from: r.visits.doctorId,
      to: r.user.id,
    }),
    measurements: r.many.measurements({
      from: r.visits.id,
      to: r.measurements.visitId,
    }),
    diagnoses: r.many.diagnoses({
      from: r.visits.id,
      to: r.diagnoses.visitId,
    }),
    prescriptions: r.many.prescriptions({
      from: r.visits.id,
      to: r.prescriptions.visitId,
    }),
    medicalNotes: r.many.medicalNotes({
      from: r.visits.id,
      to: r.medicalNotes.visitId,
    }),
  },

  // ========================================================================
  // Measurements
  // ========================================================================

  measurements: {
    visit: r.one.visits({
      from: r.measurements.visitId,
      to: r.visits.id,
    }),
  },

  // ========================================================================
  // Clinical records
  // ========================================================================

  diagnoses: {
    visit: r.one.visits({
      from: r.diagnoses.visitId,
      to: r.visits.id,
    }),
  },

  prescriptions: {
    visit: r.one.visits({
      from: r.prescriptions.visitId,
      to: r.visits.id,
    }),
    patient: r.one.patients({
      from: r.prescriptions.patientId,
      to: r.patients.id,
    }),
    prescribedBy: r.one.user({
      from: r.prescriptions.prescribedById,
      to: r.user.id,
    }),
  },

  medicalNotes: {
    patient: r.one.patients({
      from: r.medicalNotes.patientId,
      to: r.patients.id,
    }),
    visit: r.one.visits({
      from: r.medicalNotes.visitId,
      to: r.visits.id,
    }),
    author: r.one.user({
      from: r.medicalNotes.authorId,
      to: r.user.id,
    }),
  },

  immunizations: {
    patient: r.one.patients({
      from: r.immunizations.patientId,
      to: r.patients.id,
    }),
    visit: r.one.visits({
      from: r.immunizations.visitId,
      to: r.visits.id,
    }),
    administeredBy: r.one.user({
      from: r.immunizations.administeredById,
      to: r.user.id,
    }),
  },

  // ========================================================================
  // Auth / identity
  // ========================================================================

  user: {
    // clinic: r.one.clinics({
    //   from: r.user.clinicId,
    //   to: r.clinics.id,
    // }),

    // Clinical authorship
    appointments: r.many.appointments({
      from: r.user.id,
      to: r.appointments.doctorId,
    }),
    visits: r.many.visits({
      from: r.user.id,
      to: r.visits.doctorId,
    }),
    prescriptions: r.many.prescriptions({
      from: r.user.id,
      to: r.prescriptions.prescribedById,
    }),
    notes: r.many.medicalNotes({
      from: r.user.id,
      to: r.medicalNotes.authorId,
    }),
    auditLogs: r.many.auditLog({
      from: r.user.id,
      to: r.auditLog.actorId,
    }),
  },

  // ========================================================================
  // Audit
  // ========================================================================

  auditLog: {
    actor: r.one.user({
      from: r.auditLog.actorId,
      to: r.user.id,
    }),
  },
}));
