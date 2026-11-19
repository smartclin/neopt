import type { fetchAppointmentsInRange, fetchTodayAppointments } from "./functions";

/**
 * One row of the today queue / the appointments table.
 * Derived from the server function, so it stays in sync with the runtime.
 */
export type AppointmentRow = Awaited<ReturnType<typeof fetchTodayAppointments>>[number];

/** One appointment in a date range (calendar week/month). */
export type AppointmentInRange = Awaited<ReturnType<typeof fetchAppointmentsInRange>>[number];

/** A patient in the appointment sheet's search combobox. */
export interface PatientSearchResult {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string | null;
}
