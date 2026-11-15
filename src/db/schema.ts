// src/lib/db/schema/enums.ts

import { defineRelationsPart, type SQL, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  type SQLiteColumn,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import type { DrugMonograph } from "#/features/medications/formulary.ts";
import type { DrugFormularyItem } from "#/features/medications/types.ts";

export const patientGenders = ["boy", "girl"] as const;
export const patientSexes = ["male", "female"] as const; // already exists
export const appointmentStatuses = ["scheduled", "completed", "cancelled", "no-show"] as const;
export const vaccinationStatuses = [
  "due",
  "scheduled",
  "completed",
  "missed",
  "refused",
  "contraindicated",
] as const;
export const prescriptionStatuses = ["active", "completed", "cancelled"] as const;
export const milestoneDomains = [
  "gross-motor",
  "fine-motor",
  "language",
  "social-cognitive",
] as const;
export const measurementIndicators = [
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
  "head-circumference-for-age",
] as const;
export const lmsIndicators = measurementIndicators;
export const lmsSexes = patientSexes;
export const lmsXAxes = ["age", "length"] as const;
export const diagnosisTypes = ["primary", "secondary"] as const;
export const auditActions = ["create", "update", "delete", "view"] as const;

export type PatientGender = (typeof patientGenders)[number];
export type VaccinationStatus = (typeof vaccinationStatuses)[number];
export type PrescriptionStatus = (typeof prescriptionStatuses)[number];
export type MilestoneDomain = (typeof milestoneDomains)[number];
export function inCheck<T extends string>(column: SQL | SQLiteColumn, values: readonly T[]): SQL {
  const list = sql.join(
    values.map((v) => sql.raw(`'${v.replaceAll("'", "''")}'`)),
    sql`, `,
  );
  return sql`${column} IN (${list})`;
}
export type PrescriptionMedicationRoute = "IV" | "IM" | "Oral" | "Inhalation" | "PR";

export interface PrescriptionMedication {
  drugId: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  route: PrescriptionMedicationRoute;
  instructions?: string;
}

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
  role: text("role", { enum: ["admin", "doctor", "patient", "staff"] })
    .default("patient")
    .notNull(),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
  address: text("address"),
  apiKey: text("api_key"),
  clinicId: text("clinic_id"),
  phone: text("phone"),
});
export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = sqliteTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: integer("last_request").notNull(),
});

// ── Inferred TS union types ─────────────────────────────────────────────────

export type AuditAction = (typeof auditActions)[number];
export type PatientSex = (typeof patientSexes)[number];
export type AppointmentStatus = (typeof appointmentStatuses)[number];
export type MeasurementIndicator = (typeof measurementIndicators)[number];
export type LmsIndicator = (typeof lmsIndicators)[number];
export type LmsSex = (typeof lmsSexes)[number];
export type LmsXAxis = (typeof lmsXAxes)[number];
export type DiagnosisType = (typeof diagnosisTypes)[number];

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds `column IN ('a', 'b', 'c')` as a SQL fragment for use inside
 * `check(...)`. Values are inlined as SQL string literals (from trusted
 * `as const` tuples, so no injection risk).
 */

/** Shared timestamp columns. */
export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date()),
};

// ============================================================================
// Organization
// ============================================================================

export const clinics = sqliteTable("clinics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  ...timestamps,
});

// ============================================================================
// Patients
// ============================================================================

export const patients = sqliteTable(
  "patients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clinicId: text("clinic_id").references(() => clinics.id, {
      onDelete: "set null",
    }),
    providerId: text("provider_id").references(() => user.id, {
      onDelete: "cascade",
    }),

    mrn: text("mrn").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    // `gender` matches the clinical package ("boy" | "girl"); `sex` was your
    // existing field ("male" | "female"). If you want to keep both, keep both
    // columns and make one derived in the UI. For now this schema uses `sex`
    // because every downstream feature (`PatientsTable`, `PatientForm`,
    // `PatientGrowthPanel`) reads `sex`.
    sex: text("sex", { enum: patientSexes }).notNull(),
    dateOfBirth: text("date_of_birth").notNull(),
    phone: text("phone"),
    address: text("address"),
    allergies: text("allergies"),
    gestationalAgeWeeks: real("gestational_age_weeks"),
    birthWeightKg: real("birth_weight_kg"),
    birthLengthCm: real("birth_length_cm"),
    birthHeadCircumferenceCm: real("birth_head_circumference_cm"),

    // ── NEW: current weight, updated by the prescription composer ──
    weightKg: real("weight_kg"),
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),

    notes: text("notes"),
    version: integer("version").notNull().default(1),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),

    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),

    ...timestamps,
  },
  (t) => [
    // MRN unique per clinic (multi-tenant) — matches the Postgres original's
    // single-clinic global unique; widen this if you go multi-clinic.
    unique("patients_clinic_mrn_unq").on(t.clinicId, t.mrn),
    index("patients_provider_idx").on(t.providerId),
    index("patients_clinic_idx").on(t.clinicId),
    index("patients_name_idx").on(t.lastName, t.firstName),
    index("patients_dob_idx").on(t.dateOfBirth),
    uniqueIndex("patients_clinic_mrn_idx").on(t.clinicId, t.mrn),
    // Active-record index: matches the Postgres partial index
    index("patients_active_idx")
      .on(t.providerId, t.createdAt, t.id)
      .where(sql`${t.deletedAt} IS NULL`),
    check("patients_sex_check", inCheck(t.sex, patientSexes)),
  ],
);

// ============================================================================
// Appointments
// ============================================================================
export const guardianLinks = sqliteTable(
  "guardian_links",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    relation: text("relation").notNull(), // "mother" | "father" | "guardian" | "other"
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.patientId] }),
    index("guardian_links_patient_id_idx").on(table.patientId),
  ],
);

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(15),
    status: text("status", { enum: appointmentStatuses }).notNull().default("scheduled"),
    reason: text("reason"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("appointments_patient_idx").on(t.patientId, t.scheduledAt),
    index("appointments_clinic_idx").on(t.clinicId, t.scheduledAt),
    index("appointments_doctor_idx").on(t.doctorId, t.scheduledAt),
    index("appointments_status_idx").on(t.status),
    check("appointments_status_check", inCheck(t.status, appointmentStatuses)),
  ],
);

// ════════════════════════════════════════════════════════════════════════════
// visits
// ════════════════════════════════════════════════════════════════════════════

export const visits = sqliteTable(
  "visits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    appointmentId: text("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    doctorId: text("doctor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    visitedAt: integer("visited_at", { mode: "timestamp_ms" }).notNull(),
    ageMonths: real("age_months").notNull(),
    ageYears: integer("age_years"),
    ageMonthsRemainder: integer("age_months_remainder"),
    // Clinical package adds these — keep them here so `visits` remains
    // the single encounter row.
    chiefComplaint: text("chief_complaint"),
    diagnosis: text("diagnosis"),
    symptoms: text("symptoms"),
    physicalExam: text("physical_exam"),
    plan: text("plan"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("visits_patient_idx").on(t.patientId, t.visitedAt),
    index("visits_clinic_idx").on(t.clinicId, t.visitedAt),
    index("visits_doctor_idx").on(t.doctorId, t.visitedAt),
  ],
);

// ============================================================================
// Measurements & Growth Standards
// ============================================================================

export const measurements = sqliteTable(
  "measurements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    visitId: text("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    measuredAt: integer("measured_at", { mode: "timestamp_ms" }).notNull(),
    indicator: text("indicator", { enum: measurementIndicators }).notNull(),
    value: real("value").notNull(),
    lengthCmAtMeasurement: real("length_cm_at_measurement"),

    zScore: real("z_score"),
    percentile: real("percentile"),
    classification: text("classification"),
    lmsL: real("lms_l"),
    lmsM: real("lms_m"),
    lmsS: real("lms_s"),
    ...timestamps,
  },
  (t) => [
    index("measurements_visit_idx").on(t.visitId),
    index("measurements_indicator_idx").on(t.indicator),
    index("measurements_patient_date_idx").on(t.patientId, t.measuredAt),
    unique("measurements_visit_indicator_unq").on(t.visitId, t.indicator),
    check("measurements_indicator_check", inCheck(t.indicator, measurementIndicators)),
    check(
      "measurements_wfl_requires_length",
      sql`${t.indicator} <> 'weight-for-length' OR ${t.lengthCmAtMeasurement} IS NOT NULL`,
    ),
  ],
);

export const lmsReferences = sqliteTable(
  "lms_references",
  {
    indicator: text("indicator", { enum: lmsIndicators }).notNull(),
    sex: text("sex", { enum: lmsSexes }).notNull(),
    xAxis: text("x_axis", { enum: lmsXAxes }).notNull(),
    xValue: real("x_value").notNull(),
    l: real("l").notNull(),
    m: real("m").notNull(),
    s: real("s").notNull(),
    version: text("version").notNull().default("egyptian-2021"),

    // Denormalised SD bands (nullable so you can migrate row-by-row).
    // Populate these from `valueAtZScore` at seed time; the chart layer can
    // then read them directly without recomputing.
    sd3neg: real("sd3neg"),
    sd2neg: real("sd2neg"),
    sd1neg: real("sd1neg"),
    sd0: real("sd0"),
    sd1: real("sd1"),
    sd2: real("sd2"),
    sd3: real("sd3"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({
      columns: [t.indicator, t.sex, t.xAxis, t.xValue, t.version],
      name: "lms_references_pkey",
    }),
    index("lms_references_lookup_idx").on(t.indicator, t.sex, t.xAxis, t.version, t.xValue),
    check("lms_references_indicator_check", inCheck(t.indicator, lmsIndicators)),
    check("lms_references_sex_check", inCheck(t.sex, lmsSexes)),
    check("lms_references_xaxis_check", inCheck(t.xAxis, lmsXAxes)),
  ],
);

export const growthStandards = sqliteTable(
  "growth_standards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    metric: text("metric", { enum: ["lhfa", "wfa"] }).notNull(),
    gender: text("gender", { enum: ["boys", "girls"] }).notNull(),
    day: integer("day").notNull(),
    l: real("l").notNull(),
    m: real("m").notNull(),
    s: real("s").notNull(),
    sd4neg: real("sd4neg").notNull(),
    sd3neg: real("sd3neg").notNull(),
    sd2neg: real("sd2neg").notNull(),
    sd1neg: real("sd1neg").notNull(),
    sd0: real("sd0").notNull(),
    sd1: real("sd1").notNull(),
    sd2: real("sd2").notNull(),
    sd3: real("sd3").notNull(),
    sd4: real("sd4").notNull(),
  },
  (t) => [
    index("growth_lookup_idx").on(t.metric, t.gender, t.day),
    unique("growth_metric_gender_day_unq").on(t.metric, t.gender, t.day),
    check("growth_metric_check", inCheck(t.metric, ["lhfa", "wfa"] as const)),
    check("growth_gender_check", inCheck(t.gender, ["boys", "girls"] as const)),
  ],
);

// ============================================================================
// Clinical records
// ============================================================================

export const diagnoses = sqliteTable(
  "diagnoses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    visitId: text("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),
    icdCode: text("icd_code").notNull(),
    description: text("description").notNull(),
    type: text("type", { enum: diagnosisTypes }).notNull().default("primary"),
    ...timestamps,
  },
  (t) => [
    index("diagnoses_visit_idx").on(t.visitId),
    index("diagnoses_icd_idx").on(t.icdCode),
    check("diagnoses_type_check", inCheck(t.type, diagnosisTypes)),
  ],
);

export const vaccineCatalog = sqliteTable("vaccine_catalog", {
  id: text("id").primaryKey(), // 'birth-bcg'
  label: text("label").notNull(),
  arabicLabel: text("arabic_label"),
  disease: text("disease").notNull(),
  recommendedAgeMonths: integer("recommended_age_months").notNull(),
  recommendedAgeLabel: text("recommended_age_label").notNull(),
  schedule: text("schedule").notNull().default("egypt-moh"),
  isMandatoryMoh: integer("is_mandatory_moh", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
});

export const vaccinations = sqliteTable(
  "vaccinations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    visitId: text("visit_id").references(() => visits.id, {
      onDelete: "set null",
    }),
    vaccineId: text("vaccine_id")
      .notNull()
      .references(() => vaccineCatalog.id, { onDelete: "restrict" }),

    status: text("status", { enum: vaccinationStatuses }).notNull().default("due"),
    administeredDate: text("administered_date"), // 'YYYY-MM-DD'
    dueDate: text("due_date"), // 'YYYY-MM-DD'

    batchNumber: text("batch_number"),
    administeredBy: text("administered_by"),
    facility: text("facility"),
    adverseReactions: text("adverse_reactions"),
    notes: text("notes"),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),

    ...timestamps,
  },
  (t) => [
    index("vaccinations_patient_idx").on(t.patientId),
    index("vaccinations_visit_idx").on(t.visitId),
    index("vaccinations_status_idx").on(t.status),
    index("vaccinations_due_idx").on(t.dueDate, t.status),
    unique("vaccinations_patient_vaccine_unq").on(t.patientId, t.vaccineId),
    check("vaccinations_status_check", inCheck(t.status, vaccinationStatuses)),
  ],
);

// ════════════════════════════════════════════════════════════════════════════
// milestone catalog + milestones
// ════════════════════════════════════════════════════════════════════════════

export const milestoneCatalog = sqliteTable("milestone_catalog", {
  id: text("id").primaryKey(), // 'm-2m-smile'
  label: text("label").notNull(),
  arabicLabel: text("arabic_label"),
  domain: text("domain", { enum: milestoneDomains }).notNull(),
  expectedAgeMonths: integer("expected_age_months").notNull(),
  ageLabel: text("age_label").notNull(),
  redFlagWarning: text("red_flag_warning"),
  notes: text("notes"),
});

export const milestones = sqliteTable(
  "milestones",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    milestoneId: text("milestone_id")
      .notNull()
      .references(() => milestoneCatalog.id, { onDelete: "restrict" }),

    isAchieved: integer("is_achieved", { mode: "boolean" }).notNull().default(false),
    achievedDate: text("achieved_date"),
    notes: text("notes"),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),

    ...timestamps,
  },
  (t) => [
    index("milestones_patient_idx").on(t.patientId),
    unique("milestones_patient_milestone_unq").on(t.patientId, t.milestoneId),
  ],
);

export const prescriptions = sqliteTable(
  "prescriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    visitId: text("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    prescribedById: text("prescribed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    medicationName: text("medication_name").notNull(),
    dosage: text("dosage").notNull(),
    frequency: text("frequency").notNull(),
    durationDays: integer("duration_days"),
    instructions: text("instructions"),

    // ── NEW: lifecycle status ────────────────────────────────────────
    status: text("status", { enum: prescriptionStatuses }).notNull().default("active"),

    // ── NEW: when the status last changed (audit trail) ──────────────
    statusChangedAt: integer("status_changed_at", { mode: "timestamp_ms" }),

    prescribedAt: integer("prescribed_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    ...timestamps,
  },
  (t) => [
    index("prescriptions_visit_idx").on(t.visitId),
    index("prescriptions_patient_idx").on(t.patientId),
    index("prescriptions_date_idx").on(t.prescribedAt),
    // ── NEW: fast lookup of active meds per patient ──────────────────
    index("prescriptions_patient_status_idx").on(t.patientId, t.status),
    check("prescriptions_status_check", inCheck(t.status, prescriptionStatuses)),
  ],
);

// ════════════════════════════════════════════════════════════════════════════
// certificates
// ════════════════════════════════════════════════════════════════════════════

export const certificates = sqliteTable(
  "certificates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),

    issueDate: text("issue_date").notNull(),
    certificateType: text("certificate_type").notNull(),
    title: text("title").notNull(),
    diagnosis: text("diagnosis"),
    body: text("body").notNull(),
    issuedBy: text("issued_by"),
    notes: text("notes"),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),

    ...timestamps,
  },
  (t) => [
    index("certificates_patient_idx").on(t.patientId),
    index("certificates_date_idx").on(t.issueDate),
  ],
);

// ════════════════════════════════════════════════════════════════════════════
// audit_log
// ════════════════════════════════════════════════════════════════════════════

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action", { enum: auditActions }).notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown> | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entity, t.entityId),
    index("audit_log_actor_idx").on(t.actorId, t.createdAt),
    index("audit_log_action_idx").on(t.action),
    check("audit_log_action_check", inCheck(t.action, auditActions)),
  ],
);
export const medicalNotes = sqliteTable(
  "medical_notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    visitId: text("visit_id").references(() => visits.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body"),
    ...timestamps,
  },
  (t) => [
    index("medical_notes_patient_idx").on(t.patientId, t.createdAt),
    index("medical_notes_visit_idx").on(t.visitId),
  ],
);

export const immunizationStatuses = ["given", "due", "overdue", "deferred"] as const;
export type ImmunizationStatus = (typeof immunizationStatuses)[number];

export const immunizations = sqliteTable(
  "immunizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    visitId: text("visit_id").references(() => visits.id, {
      onDelete: "set null",
    }),
    vaccineKey: text("vaccine_key").notNull(),
    vaccineName: text("vaccine_name").notNull(),
    doseNumber: integer("dose_number").notNull().default(1),
    targetAgeMonths: real("target_age_months").notNull(),
    status: text("status", { enum: immunizationStatuses }).notNull().default("due"),
    administeredDate: integer("administered_date", { mode: "timestamp_ms" }),
    lotNumber: text("lot_number"),
    site: text("site"),
    administeredById: text("administered_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    adverseEvents: text("adverse_events"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("immunizations_patient_idx").on(t.patientId, t.targetAgeMonths),
    index("immunizations_status_idx").on(t.status),
  ],
);
export const drugFormulary = sqliteTable(
  "drug_formulary",
  {
    id: text("id").primaryKey(), // matches DrugMonograph.id
    genericName: text("generic_name").notNull(),
    pharmacologicalCategory: text("pharmacological_category").notNull(),
    atcCode: text("atc_code"),
    awareClassification: text("aware_classification"),
    data: text("data", { mode: "json" }).$type<DrugMonograph>().notNull(),
    sourceEdition: text("source_edition").notNull().default("EDA-2024"),
    ...timestamps,
  },
  (t) => [
    index("drug_formulary_generic_idx").on(t.genericName),
    index("drug_formulary_category_idx").on(t.pharmacologicalCategory),
  ],
);

export const neonatalFormulary = sqliteTable(
  "neonatal_formulary",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    genericName: text("generic_name").notNull(),
    category: text("category").notNull(),
    data: text("data", { mode: "json" }).$type<DrugFormularyItem>().notNull(),
    ...timestamps,
  },
  (t) => [
    index("neonatal_formulary_category_idx").on(t.category),
    index("neonatal_formulary_generic_idx").on(t.genericName),
  ],
);

export const idempotency = sqliteTable("idempotency", {
  id: text("id").primaryKey(),
  requestHash: text("request_hash").notNull().unique(),
  key: text("key").notNull().unique(),
  result: text("result", { mode: "json" }).notNull(),
  ...timestamps,
});

export type NeonatalFormularyRow = typeof neonatalFormulary.$inferSelect;
export type NewNeonatalFormularyRow = typeof neonatalFormulary.$inferInsert;
// ============================================================================
// Inferred types
// ============================================================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
export type Measurement = typeof measurements.$inferSelect;
export type NewMeasurement = typeof measurements.$inferInsert;
export type Diagnosis = typeof diagnoses.$inferSelect;
export type NewDiagnosis = typeof diagnoses.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;
export type MedicalNote = typeof medicalNotes.$inferSelect;
export type NewMedicalNote = typeof medicalNotes.$inferInsert;
export type Immunization = typeof immunizations.$inferSelect;
export type NewImmunization = typeof immunizations.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;

export type LmsReference = typeof lmsReferences.$inferSelect;
export type NewLmsReference = typeof lmsReferences.$inferInsert;

export type DrugFormularyRow = typeof drugFormulary.$inferSelect;
export type NewDrugFormularyRow = typeof drugFormulary.$inferInsert;

export const authRelations = defineRelationsPart(
  { user, session, account, verification, rateLimit },
  (r) => ({
    user: {
      sessions: r.many.session({
        from: r.user.id,
        to: r.session.userId,
      }),
      accounts: r.many.account({
        from: r.user.id,
        to: r.account.userId,
      }),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
  }),
);
