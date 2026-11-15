// src/features/shared/helpers.ts
//
// Shared validation schemas, date utilities, and helper functions.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const uuidSchema = z.uuid("Must be a valid UUID");

/** Postgres `date` in `YYYY-MM-DD` (matches `date({ mode: "string" })`). */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => {
    // Reject impossible dates like 2023-02-30
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "Invalid calendar date");

/** Timestamps (withTimezone, mode: date) accept Date or ISO string. */
export const timestampSchema = z.coerce.date();

/** Optional nullable text — normalizes "" to null for DB storage. */
export const optionalText = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : (v ?? null)));

export const requiredText = (max = 255, min = 1) => z.string().trim().min(min, "Required").max(max);

/** Optional positive-ish number used for LMS / scores. */
export const optionalFiniteNumber = z.number().optional().nullable();

// ---------------------------------------------------------------------------
// Enums (mirror pgEnum definitions exactly)
// ---------------------------------------------------------------------------

export const patientSexSchema = z.enum(["male", "female"]);

export const appointmentStatusSchema = z.enum(["scheduled", "completed", "cancelled", "no-show"]);

export const measurementIndicatorSchema = z.enum([
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
  "head-circumference-for-age",
]);

export const lmsIndicatorSchema = z.enum([
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
]);

export const lmsSexSchema = z.enum(["male", "female"]);

export const lmsXAxisSchema = z.enum(["age", "length"]);

export const diagnosisTypeSchema = z.enum(["primary", "secondary"]);

export const auditActionSchema = z.enum(["create", "update", "delete", "view"]);

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

/**
 * Calculate age in months from date of birth to a reference date.
 * Returns decimal months for precise calculations.
 */
export function ageInMonths(dob: Date, referenceDate: Date = new Date()): number {
  const days = (referenceDate.getTime() - dob.getTime()) / MS_PER_DAY;
  return days / DAYS_PER_MONTH;
}

export function decimalMonthsBetween(dob: Date, at: Date): number {
  const days = (at.getTime() - dob.getTime()) / MS_PER_DAY;
  return days / DAYS_PER_MONTH;
}

/**
 * Calculate corrected age for premature infants (<37 weeks gestational age).
 * Standard pediatric formula:
 * Chronological Age (months) - ((40 - Gestational Weeks) * 7 / 30.4375)
 * For term infants (>=37 weeks), corrected age equals chronological age.
 */
export function calculateCorrectedAgeMonths(
  dob: Date,
  gestationalAgeWeeks?: number | null,
  referenceDate: Date = new Date(),
): {
  chronologicalAgeMonths: number;
  correctedAgeMonths: number;
  isPreterm: boolean;
  weeksPremature: number;
} {
  const chronological = decimalMonthsBetween(dob, referenceDate);
  const ga = gestationalAgeWeeks ?? 40;
  const isPreterm = ga < 37;
  const weeksPremature = Math.max(0, 40 - ga);
  const correctionMonths = (weeksPremature * 7) / DAYS_PER_MONTH;
  const corrected = isPreterm ? Math.max(0, chronological - correctionMonths) : chronological;

  return {
    chronologicalAgeMonths: Math.round(chronological * 10) / 10,
    correctedAgeMonths: Math.round(corrected * 10) / 10,
    isPreterm,
    weeksPremature,
  };
}

/**
 * Whole calendar months between two dates (anniversary-based).
 *
 * `completedMonths(new Date('2020-01-31'), new Date('2020-02-29'))` → 0,
 * because 29 February is not the 31st. The `days < 0` branch handles
 * month-end rolling without overflowing into March.
 */
export function completedMonths(dob: Date, at: Date): number {
  const years = at.getFullYear() - dob.getFullYear();
  const months = at.getMonth() - dob.getMonth();
  const days = at.getDate() - dob.getDate();
  const raw = years * 12 + months;
  return days >= 0 ? raw : raw - 1;
}

/**
 * Format a date to a localized short date string.
 */
export function formatDate(date: Date, locale = "en-US"): string {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date to include time.
 */
export function formatDateTime(date: Date, locale = "en-US"): string {
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check if a date is in the past.
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if a date is in the future.
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Get the start of the day for a given date.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the day for a given date.
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format a name as "First Last".
 */
export function formatName(firstName: string, lastName: string): string {
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

// ---------------------------------------------------------------------------
// Number utilities
// ---------------------------------------------------------------------------

/**
 * Format a number with a specified number of decimal places.
 */
export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

/**
 * Clamp a number between min and max values.
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Round a number to a specified precision.
 */
export function round(num: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Wrap any of the above to validate server-action input safely. */
export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new z.ZodError(result.error.issues);
  }
  return result.data;
}

/** Form-action friendly: returns flattened errors instead of throwing. */
export function parseForm<T extends z.ZodType>(schema: T, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);
  return result.success
    ? ({ ok: true, data: result.data } as const)
    : ({ ok: false, errors: z.treeifyError(result.error) } as const);
}
