import {and, db, eq, gte, lte, sql} from "@/db";
import {appointments} from "@/db/schema";

import type {
    AppointmentInput,
    AppointmentUpdate,
    Status,
} from "../../features/appointments/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Double-booking guard
// ─────────────────────────────────────────────────────────────────────────────

/** Longest allowed appointment — widens the overlap scan window. */
const MAX_APPOINTMENT_MINUTES = 240;

/** Only these statuses occupy a slot; cancelled / no-show / completed don't. */
const BLOCKING_STATUSES: Status[] = ["scheduled"];

export class AppointmentConflictError extends Error {
  readonly conflictingAppointmentId: string;

  constructor(message: string, conflictingAppointmentId: string) {
    super(message);
    this.name = "AppointmentConflictError";
    this.conflictingAppointmentId = conflictingAppointmentId;
  }
}

/**
 * Find an active same-doctor appointment whose [start, end) window overlaps
 * the candidate slot, or `null` when the slot is free.
 */
async function findDoctorOverlap(args: {
  clinicId: string;
  doctorId: string;
  start: Date;
  durationMinutes: number;
  excludeAppointmentId?: string;
}) {
  const startMs = args.start.getTime();
  const endMs = startMs + args.durationMinutes * 60_000;
  // Widen the window by the longest possible appointment so a slot that
  // starts on a previous/next day can't slip past the range filter.
  const windowMs = MAX_APPOINTMENT_MINUTES * 60_000;
  const from = new Date(startMs - windowMs);
  const to = new Date(endMs + windowMs);

  const candidates = await db.query.appointments.findMany({
    where: {
      clinicId: args.clinicId,
      doctorId: args.doctorId,
      status: { in: BLOCKING_STATUSES },
      scheduledAt: { gte: from, lte: to },
    },
    columns: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
    },
  });

  return (
    candidates.find((row) => {
      if (row.id === args.excludeAppointmentId) return false;
      const rowStart = row.scheduledAt.getTime();
      const rowEnd = rowStart + row.durationMinutes * 60_000;
      return rowStart < endMs && rowEnd > startMs;
    }) ?? null
  );
}

// --- Create ---

export async function createAppointment(
  input: Omit<AppointmentInput, "durationMinutes" | "status"> & {
    durationMinutes?: number;
    status?: Status;
  },
) {
  const durationMinutes = input.durationMinutes ?? 15;
  const status = input.status ?? "scheduled";

  if (input.doctorId && status === "scheduled") {
    const overlap = await findDoctorOverlap({
      clinicId: input.clinicId,
      doctorId: input.doctorId,
      start: input.scheduledAt,
      durationMinutes,
    });
    if (overlap) {
      throw new AppointmentConflictError(
        "This doctor already has an appointment that overlaps this time.",
        overlap.id,
      );
    }
  }

  const [row] = await db
    .insert(appointments)
    .values({ ...input, durationMinutes, status })
    .returning();
  return row;
}

// --- Read ---

export async function getAppointmentById(id: string) {
  return db.query.appointments.findFirst({
    where: { id },
    with: {
      patient: true,
      clinic: true,
      doctor: { columns: { id: true, name: true, role: true } },
      visits: true,
    },
  });
}

/**
 * Appointments for a patient, optionally filtered by status. Newest first.
 */
export async function listAppointmentsForPatient(patientId: string, status?: Status) {
  return db.query.appointments.findMany({
    where: status ? { patientId, status } : { patientId },
    orderBy: (t, { desc }) => [desc(t.scheduledAt)],
    with: {
      patient: {
        columns: {
          id: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          allergies: true,
        },
      },
      doctor: { columns: { id: true, name: true } },
    },
  });
}

/**
 * Today's schedule for a clinic — the front-desk screen.
 */
export async function listTodayAppointmentsForClinic(clinicId: string, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return db.query.appointments.findMany({
    where: {
      clinicId,
      scheduledAt: { gte: start, lt: end },
    },
    orderBy: (t, { asc }) => [asc(t.scheduledAt)],
    with: {
      patient: {
        columns: { id: true, mrn: true, firstName: true, lastName: true, dateOfBirth:true, allergies:true },
      },
      doctor: { columns: { id: true, name: true } },
    },
  });
}

/**
 * Calendar window — e.g. week or month view.
 */
export async function listAppointmentsInRange(
  clinicId: string,
  from: Date,
  to: Date,
  doctorId?: string,
) {
  return db.query.appointments.findMany({
    where: {
      clinicId,
      scheduledAt: { gte: from, lte: to },
      ...(doctorId ? { doctorId } : {}),
    },
    orderBy: (t, { asc }) => [asc(t.scheduledAt)],
    with: {
      patient: { columns: { mrn: true, firstName: true, lastName: true } },
      doctor: { columns: { id: true, name: true } },
    },
  });
}

/**
 * A doctor's upcoming queue.
 */
export async function listUpcomingForDoctor(doctorId: string, limit = 50) {
  return db.query.appointments.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: new Date() },
      status: "scheduled",
    },
    orderBy: (t, { asc }) => [asc(t.scheduledAt)],
    limit,
    with: {
      patient: { columns: { mrn: true, firstName: true, lastName: true } },
    },
  });
}

// --- Update / status transitions ---

export async function updateAppointment(
  id: string,
  patch: Partial<AppointmentUpdate> & {
    scheduledAt?: Date;
    durationMinutes?: number;
    status?: Status;
    reason?: string | null;
    notes?: string | null;
    doctorId?: string | null;
  },
) {
  const [current] = await db
    .select({
      clinicId: appointments.clinicId,
      doctorId: appointments.doctorId,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      status: appointments.status,
    })
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);

  if (!current) return undefined;

  // Resolve the slot the row will have after the patch, then guard the
  // doctor's calendar only when that slot actually changes.
  const nextDoctorId = patch.doctorId === undefined ? current.doctorId : patch.doctorId;
  const nextScheduledAt = patch.scheduledAt ?? current.scheduledAt;
  const nextDuration = patch.durationMinutes ?? current.durationMinutes;
  const nextStatus = patch.status ?? current.status;

  const slotChanged =
    nextDoctorId !== current.doctorId ||
    nextScheduledAt.getTime() !== current.scheduledAt.getTime() ||
    nextDuration !== current.durationMinutes;

  if (nextDoctorId && nextStatus === "scheduled" && slotChanged) {
    const overlap = await findDoctorOverlap({
      clinicId: current.clinicId,
      doctorId: nextDoctorId,
      start: nextScheduledAt,
      durationMinutes: nextDuration,
      excludeAppointmentId: id,
    });
    if (overlap) {
      throw new AppointmentConflictError(
        "This doctor already has an appointment that overlaps this time.",
        overlap.id,
      );
    }
  }

  const [row] = await db.update(appointments).set(patch).where(eq(appointments.id, id)).returning();
  return row;
}

export async function markCompleted(id: string) {
  return updateAppointment(id, { status: "completed" });
}

export async function markCancelled(id: string) {
  return updateAppointment(id, { status: "cancelled" });
}

export async function markNoShow(id: string) {
  return updateAppointment(id, { status: "no-show" });
}

export async function deleteAppointment(id: string) {
  await db.delete(appointments).where(eq(appointments.id, id));
}

// --- Aggregates ---

export async function countAppointmentsByStatus(clinicId: string, from: Date, to: Date) {
  return db
    .select({
      status: appointments.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, clinicId),
        gte(appointments.scheduledAt, from),
        lte(appointments.scheduledAt, to),
      ),
    )
    .groupBy(appointments.status);
}

export async function countAppointmentsForPatient(patientId: string) {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(appointments)
    .where(eq(appointments.patientId, patientId));
  return row?.count ?? 0;
}
