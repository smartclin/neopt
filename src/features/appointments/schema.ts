import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { appointments } from "@/db/schema";

import {
  appointmentStatusSchema,
  optionalText,
  timestampSchema,
  uuidSchema,
} from "../shared/helpers";

export { appointmentStatusSchema };

export const appointmentSelectSchema = createSelectSchema(appointments);
export const appointmentInsertSchema = createInsertSchema(appointments, {
  durationMinutes: (s) => s.int().min(5).max(240),
  reason: (s) => s.max(1000),
  notes: (s) => s.max(5000),
});

export const appointmentUpdateSchema = createUpdateSchema(appointments, {
  durationMinutes: (s) => s.int().min(5).max(240),
  reason: (s) => s.max(1000),
  notes: (s) => s.max(5000),
});

export const UpdateAppointmentSchema = z.object({
  appointmentId: z.uuid(),
  patch: z
    .object({
      scheduledAt: z.coerce.date().optional(),
      durationMinutes: z.number().int().min(5).max(240).optional(),
      status: appointmentStatusSchema.optional(),
      reason: z.string().max(1000).nullable().optional(),
      notes: z.string().max(5000).nullable().optional(),
      doctorId: z.uuid().nullable().optional(),
    })
    .strict(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export const appointmentInputSchema = z.object({
  patientId: uuidSchema,
  clinicId: uuidSchema,
  doctorId: z.string().min(1).optional().nullable(),
  scheduledAt: timestampSchema,
  durationMinutes: z.coerce.number().int().min(5).max(240).default(15),
  status: appointmentStatusSchema.default("scheduled"),
  reason: optionalText(500),
  notes: optionalText(5000),
});

export const appointmentUpdateInputSchema = appointmentInputSchema
  .omit({ patientId: true, clinicId: true })
  .partial()
  .extend({
    status: appointmentStatusSchema.optional(),
  });

const appointmentSearchShape = z.object({
  clinicId: uuidSchema.optional(),
  patientId: uuidSchema.optional(),
  doctorId: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  from: timestampSchema.optional(),
  to: timestampSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sort: z.enum(["scheduledAt", "createdAt", "status"]).default("scheduledAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export const appointmentSearchSchema = appointmentSearchShape.refine(
  (v) => !v.from || !v.to || v.from <= v.to,
  {
    message: "`from` must be <= `to`",
    path: ["from"],
  },
);
export type Status = "scheduled" | "completed" | "cancelled" | "no-show";

export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type AppointmentUpdate = z.infer<typeof appointmentUpdateInputSchema>;
export type AppointmentSearch = z.infer<typeof appointmentSearchSchema>;
