// src/features/appointments/api.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  AppointmentConflictError,
  countAppointmentsByStatus,
  countAppointmentsForPatient,
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointmentsForPatient,
  listAppointmentsInRange,
  listTodayAppointmentsForClinic,
  listUpcomingForDoctor,
  markCancelled,
  markCompleted,
  markNoShow,
  updateAppointment,
} from "@/db/queries/appointments.queries";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { authMiddleware, freshAuthMiddleware } from "@/lib/auth/middleware";

import {
  appointmentInsertSchema,
  appointmentStatusSchema,
  UpdateAppointmentSchema,
} from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Read
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAppointmentById = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ appointmentId: z.uuid() }))
  .handler(async ({ data }) => getAppointmentById(data.appointmentId));

export const fetchAppointmentsForPatient = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      patientId: z.uuid(),
      status: appointmentStatusSchema.optional(),
    }),
  )
  .handler(async ({ data }) => listAppointmentsForPatient(data.patientId, data.status));

export const fetchTodayAppointments = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => listTodayAppointmentsForClinic(data.clinicId));

export const fetchAppointments = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ clinicId: z.uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import("@/db");
    // The original function ignored the clinicId and returned all appointments.
    // We now scope the query to the user's clinic.
    return db.query.appointments.findMany({
      where: { clinicId: data.clinicId },
      orderBy: { scheduledAt: "desc" },
      with: {
        patient: true,
        doctor: true,
      },
    });
  });

export const fetchAppointmentsInRange = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
      doctorId: z.uuid().optional(),
    }),
  )
  .handler(async ({ data }) =>
    listAppointmentsInRange(data.clinicId, new Date(data.from), new Date(data.to), data.doctorId),
  );

export const fetchUpcomingForDoctor = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      doctorId: z.uuid(),
      limit: z.number().int().min(1).max(200).optional().default(50),
    }),
  )
  .handler(async ({ data, context }) => {
    // A doctor can view their own schedule; admins and staff can view any schedule within the clinic.
    if (
      context.user.role !== "admin" &&
      context.user.role !== "staff" &&
      context.user.id !== data.doctorId
    ) {
      throw new Error("Forbidden: you can only view your own appointments.");
    }
    return listUpcomingForDoctor(data.doctorId, data.limit);
  });

export const fetchAppointmentStatusCounts = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(
    z.object({
      clinicId: z.uuid(),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
    }),
  )
  .handler(async ({ data }) =>
    countAppointmentsByStatus(data.clinicId, new Date(data.from), new Date(data.to)),
  );

export const fetchPatientAppointmentCount = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => ({
    count: await countAppointmentsForPatient(data.patientId),
  }));

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Create
// ─────────────────────────────────────────────────────────────────────────────

export const createAppointmentFn = createServerFn({ method: "POST" })
  .middleware([clinicAccessMiddleware])
  .validator(appointmentInsertSchema)
  .handler(async ({ data }) => {
    try {
      return await createAppointment({
        ...data,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes ?? 30,
        status: "scheduled",
        reason: data.reason ?? null,
        notes: data.notes ?? null,
      });
    } catch (error) {
      if (error instanceof AppointmentConflictError) {
        setResponseStatus(409);
        throw new Error(error.message);
      }
      throw error;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Server functions — Update / status transitions
// ─────────────────────────────────────────────────────────────────────────────

export const updateAppointmentFn = createServerFn({ method: "POST" })
  .middleware([clinicAccessMiddleware])
  .validator(UpdateAppointmentSchema)
  .handler(async ({ data }) => {
    try {
      return await updateAppointment(data.appointmentId, data.patch);
    } catch (error) {
      if (error instanceof AppointmentConflictError) {
        setResponseStatus(409);
        throw new Error(error.message);
      }
      throw error;
    }
  });

export const completeAppointmentFn = createServerFn({ method: "POST" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ appointmentId: z.uuid() }))
  .handler(async ({ data }) => markCompleted(data.appointmentId));

export const cancelAppointmentFn = createServerFn({ method: "POST" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ appointmentId: z.uuid() }))
  .handler(async ({ data }) => markCancelled(data.appointmentId));

export const markAppointmentNoShowFn = createServerFn({ method: "POST" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ appointmentId: z.uuid() }))
  .handler(async ({ data }) => markNoShow(data.appointmentId));

export const deleteAppointmentFn = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware, clinicAccessMiddleware])
  .validator(z.object({ appointmentId: z.uuid() }))
  .handler(async ({ data }) => {
    await deleteAppointment(data.appointmentId);
    return { ok: true } as const;
  });
