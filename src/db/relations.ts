// src/db/relations.ts
import { defineRelations } from "drizzle-orm";

import * as schema from "@/db/schema";
export const relations = defineRelations(schema, (r) => ({
  // Auth relations are merged separately; see db/index.ts
  // Domain relations:
  clinics: {
    patients: r.many.patients({ from: r.clinics.id, to: r.patients.clinicId }),
    appointments: r.many.appointments({ from: r.clinics.id, to: r.appointments.clinicId }),
    visits: r.many.visits({ from: r.clinics.id, to: r.visits.clinicId }),
  },
  patients: {
    clinic: r.one.clinics({ from: r.patients.clinicId, to: r.clinics.id }),
    provider: r.one.user({ from: r.patients.providerId, to: r.user.id }),
    appointments: r.many.appointments({ from: r.patients.id, to: r.appointments.patientId }),
    visits: r.many.visits({ from: r.patients.id, to: r.visits.patientId }),
    measurements: r.many.measurements({ from: r.patients.id, to: r.measurements.patientId }),
    medicalNotes: r.many.medicalNotes({ from: r.patients.id, to: r.medicalNotes.patientId }),
    guardianLinks: r.many.guardianLinks({ from: r.patients.id, to: r.guardianLinks.patientId }),
  },
  appointments: {
    patient: r.one.patients({ from: r.appointments.patientId, to: r.patients.id }),
    clinic: r.one.clinics({ from: r.appointments.clinicId, to: r.clinics.id }),
    doctor: r.one.user({ from: r.appointments.doctorId, to: r.user.id }),
    visit: r.one.visits({ from: r.appointments.id, to: r.visits.appointmentId }),
  },
  visits: {
    patient: r.one.patients({ from: r.visits.patientId, to: r.patients.id }),
    clinic: r.one.clinics({ from: r.visits.clinicId, to: r.clinics.id }),
    appointment: r.one.appointments({ from: r.visits.appointmentId, to: r.appointments.id }),
    doctor: r.one.user({ from: r.visits.doctorId, to: r.user.id }),
    measurements: r.many.measurements({ from: r.visits.id, to: r.measurements.visitId }),
    diagnoses: r.many.diagnoses({ from: r.visits.id, to: r.diagnoses.visitId }),
    prescriptions: r.many.prescriptions({ from: r.visits.id, to: r.prescriptions.visitId }),
  },
  measurements: {
    visit: r.one.visits({ from: r.measurements.visitId, to: r.visits.id }),
    patient: r.one.patients({ from: r.measurements.patientId, to: r.patients.id }),
  },
  diagnoses: {
    visit: r.one.visits({ from: r.diagnoses.visitId, to: r.visits.id }),
  },
  prescriptions: {
    visit: r.one.visits({ from: r.prescriptions.visitId, to: r.visits.id }),
    patient: r.one.patients({ from: r.prescriptions.patientId, to: r.patients.id }),
    prescribedBy: r.one.user({ from: r.prescriptions.prescribedById, to: r.user.id }),
  },
  medicalNotes: {
    patient: r.one.patients({ from: r.medicalNotes.patientId, to: r.patients.id }),
    visit: r.one.visits({ from: r.medicalNotes.visitId, to: r.visits.id }),
    author: r.one.user({ from: r.medicalNotes.authorId, to: r.user.id }),
  },
  vaccinations: {
    patient: r.one.patients({ from: r.vaccinations.patientId, to: r.patients.id }),
    visit: r.one.visits({ from: r.vaccinations.visitId, to: r.visits.id }),
    vaccine: r.one.vaccineCatalog({ from: r.vaccinations.vaccineId, to: r.vaccineCatalog.id }),
  },
  immunizations: {
    patient: r.one.patients({ from: r.immunizations.patientId, to: r.patients.id }),
    visit: r.one.visits({ from: r.immunizations.visitId, to: r.visits.id }),
  },
  milestones: {
    patient: r.one.patients({ from: r.milestones.patientId, to: r.patients.id }),
    milestone: r.one.milestoneCatalog({
      from: r.milestones.milestoneId,
      to: r.milestoneCatalog.id,
    }),
  },
  certificates: {
    patient: r.one.patients({ from: r.certificates.patientId, to: r.patients.id }),
  },
  guardianLinks: {
    user: r.one.user({ from: r.guardianLinks.userId, to: r.user.id }),
    patient: r.one.patients({ from: r.guardianLinks.patientId, to: r.patients.id }),
  },
}));
