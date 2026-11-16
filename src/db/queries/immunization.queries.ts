import { eq } from "drizzle-orm";

import { db } from "@/db";
import { type Immunization, immunizations, patients } from "@/db/schema";

import type {
  ImmunizationInput,
  UpdateImmunizationInput,
} from "../../features/immunizations/schema";

import {
  type ImmunizationCoverage,
  type MatrixResult,
  type MatrixRow,
  type MatrixVaccine,
  type PatientVaccinationRecord,
  ROUTINE_CHILDHOOD_SCHEDULE,
} from "../../features/immunizations/types";

export type { ImmunizationCoverage, MatrixResult, MatrixRow, MatrixVaccine };

// ─────────────────────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────────────────────

export async function recordImmunization(input: ImmunizationInput): Promise<Immunization> {
  const [row] = await db
    .insert(immunizations)
    .values({
      ...input,
      administeredDate: input.status === "given" ? (input.administeredDate ?? new Date()) : null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to record immunization");
  }
  return row;
}

export async function updateImmunization(
  id: string,
  patch: UpdateImmunizationInput,
): Promise<Immunization | null> {
  const [row] = await db
    .update(immunizations)
    .set(patch)
    .where(eq(immunizations.id, id))
    .returning();
  return row ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read: one patient
// ─────────────────────────────────────────────────────────────────────────────

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375;

/**
 * Full immunization schedule for a patient, with DB records merged in.
 *
 * When `patientDob` is omitted the function reads `patients.dateOfBirth`
 * itself — never silently treats the patient as 0 months old.
 */
export async function getPatientImmunizations(
  patientId: string,
  patientDob?: Date,
): Promise<PatientVaccinationRecord[]> {
  const [dob, recorded] = await Promise.all([
    patientDob ??
      db.query.patients
        .findFirst({
          where: { id: patientId },
          columns: { dateOfBirth: true },
        })
        .then((p) => (p ? new Date(p.dateOfBirth) : null)),
    db.query.immunizations.findMany({
      where: { patientId },
      orderBy: { targetAgeMonths: "asc" },
    }),
  ]);

  const recordMap = new Map<string, Immunization>();
  for (const r of recorded) {
    recordMap.set(`${r.vaccineKey}-${r.doseNumber}`, r);
  }

  const now = new Date();
  const patientAgeMonths = dob ? (now.getTime() - dob.getTime()) / MS_PER_MONTH : 0;

  return ROUTINE_CHILDHOOD_SCHEDULE.map((scheduled) => {
    const key = `${scheduled.vaccineKey}-${scheduled.doseNumber}`;
    const entry = recordMap.get(key);

    // If there's a DB record, its status is authoritative. Otherwise,
    // derive "overdue" from the schedule + age.
    const status: PatientVaccinationRecord["status"] = entry
      ? entry.status
      : patientAgeMonths > scheduled.targetAgeMonths + 1
        ? "overdue"
        : "due";

    return {
      ...scheduled,
      recordId: entry?.id,
      patientId,
      status,
      administeredDate: entry?.administeredDate ?? null,
      lotNumber: entry?.lotNumber ?? null,
      administeredBy: entry?.administeredById ?? null,
      adverseEvents: entry?.adverseEvents ?? null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read: clinic-wide coverage
// ─────────────────────────────────────────────────────────────────────────────

export async function getCoverage(clinicId: string): Promise<ImmunizationCoverage> {
  const schedule = ROUTINE_CHILDHOOD_SCHEDULE;
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const rows = await db
    .select({
      patientId: patients.id,
      dob: patients.dateOfBirth,
      vaccineKey: immunizations.vaccineKey,
      doseNumber: immunizations.doseNumber,
      status: immunizations.status,
      administeredDate: immunizations.administeredDate,
    })
    .from(patients)
    .leftJoin(immunizations, eq(immunizations.patientId, patients.id))
    .where(eq(patients.clinicId, clinicId));

  // One dob per patient — avoids re-scanning `rows` in the outer loop.
  const dobByPatient = new Map<string, Date>();
  for (const r of rows) {
    if (!dobByPatient.has(r.patientId)) {
      dobByPatient.set(r.patientId, new Date(r.dob));
    }
  }

  // Last-recorded status per (patient, vaccine, dose). Duplicate rows can
  // occur if a patient has multiple records for the same dose — the DB has
  // no unique constraint enforcing one.
  const recordedByKey = new Map<string, { status: string; administeredDate: Date | null }>();
  for (const r of rows) {
    if (!r.vaccineKey || r.status === null) continue;
    const k = `${r.patientId}:${r.vaccineKey}:${r.doseNumber}`;
    recordedByKey.set(k, {
      status: r.status,
      administeredDate: r.administeredDate,
    });
  }

  let dueThisWeek = 0;
  let overdue = 0;
  let refusedOrDeferred = 0;
  const perVaccine = new Map<string, { given: number; due: number; overdue: number }>();

  for (const [patientId, dob] of dobByPatient) {
    for (const s of schedule) {
      const k = `${patientId}:${s.vaccineKey}:${s.doseNumber}`;
      const recorded = recordedByKey.get(k);

      const target = new Date(dob);
      target.setMonth(target.getMonth() + s.targetAgeMonths);

      let bucket: "given" | "due" | "overdue" | "refused";
      if (recorded?.status === "given") {
        bucket = "given";
      } else if (recorded?.status === "deferred" || recorded?.status === "refused") {
        bucket = "refused";
        refusedOrDeferred += 1;
      } else if (target < now) {
        bucket = "overdue";
      } else {
        bucket = "due";
      }

      if (bucket === "overdue") overdue += 1;
      if (bucket === "due" && target <= weekEnd) dueThisWeek += 1;

      const acc = perVaccine.get(s.vaccineKey) ?? {
        given: 0,
        due: 0,
        overdue: 0,
      };
      if (bucket === "given") acc.given += 1;
      if (bucket === "due") acc.due += 1;
      if (bucket === "overdue") acc.overdue += 1;
      perVaccine.set(s.vaccineKey, acc);
    }
  }

  const totals = Array.from(perVaccine.values()).reduce(
    (acc, v) => ({
      given: acc.given + v.given,
      due: acc.due + v.due + v.overdue,
    }),
    { given: 0, due: 0 },
  );

  // Refused/deferred are counted in the denominator so a fully-refused
  // clinic does not misleadingly show 100% coverage.
  const denominator = totals.given + totals.due + refusedOrDeferred;
  const coveragePct = denominator === 0 ? 0 : Math.round((totals.given / denominator) * 100);

  const byVaccine = Array.from(perVaccine.entries()).map(([key, v]) => {
    const meta = schedule.find((s) => s.vaccineKey === key);
    const denom = v.given + v.due + v.overdue;
    return {
      vaccineKey: key,
      vaccineName: meta?.name ?? key,
      given: v.given,
      due: v.due,
      overdue: v.overdue,
      pct: denom === 0 ? 0 : Math.round((v.given / denom) * 100),
    };
  });

  return { dueThisWeek, overdue, coveragePct, refusedOrDeferred, byVaccine };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read: clinic-wide matrix
// ─────────────────────────────────────────────────────────────────────────────

export async function getImmunizationMatrix(
  clinicId: string,
  filter: {
    ageBracket?: "0-6" | "6-12" | "12-24" | ">24";
    onlyOverdue?: boolean;
  },
): Promise<MatrixResult> {
  const schedule = ROUTINE_CHILDHOOD_SCHEDULE;

  // ── Column plan ────────────────────────────────────────────────────
  const perVaccine = new Map<string, MatrixVaccine>();
  for (const s of schedule) {
    const existing = perVaccine.get(s.vaccineKey);
    if (existing) {
      if (!existing.doseNumbers.includes(s.doseNumber)) {
        existing.doseNumbers.push(s.doseNumber);
        existing.doseNumbers.sort((a, b) => a - b);
      }
    } else {
      perVaccine.set(s.vaccineKey, {
        vaccineKey: s.vaccineKey,
        vaccineName: s.name,
        doseNumbers: [s.doseNumber],
        doses: undefined,
      });
    }
  }
  const vaccines = Array.from(perVaccine.values());

  // ── Patients ───────────────────────────────────────────────────────
  const patients = await db.query.patients.findMany({
    where: { clinicId },
    orderBy: (t, { asc }) => [asc(t.lastName), asc(t.firstName)],
    columns: {
      id: true,
      mrn: true,
      firstName: true,
      lastName: true,
      sex: true,
      dateOfBirth: true,
    },
  });

  const now = new Date();
  const filtered = patients.filter((p) => matchesAgeBracket(p.dateOfBirth, filter.ageBracket, now));

  // Guard: Drizzle's `in: []` is dialect-dependent (sqlite returns all,
  // pg errors). Return an empty matrix instead of risking a full-table scan.
  if (filtered.length === 0) {
    return { vaccines, rows: [] };
  }

  const records = await db.query.immunizations.findMany({
    where: { patientId: { in: filtered.map((p) => p.id) } },
  });

  const recordMap = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    recordMap.set(`${r.patientId}:${r.vaccineKey}:${r.doseNumber}`, r);
  }

  // ── Rows ───────────────────────────────────────────────────────────
  const rows: MatrixRow[] = filtered.map((p) => {
    const dob = new Date(p.dateOfBirth);
    const cells: MatrixRow["cells"] = {};

    for (const s of schedule) {
      const rec = recordMap.get(`${p.id}:${s.vaccineKey}:${s.doseNumber}`);
      cells[`${s.vaccineKey}-${s.doseNumber}`] = resolveStatus({
        record: rec,
        dateOfBirth: dob,
        targetAgeMonths: s.targetAgeMonths,
        now,
      });
    }

    return {
      patientId: p.id,
      mrn: p.mrn,
      firstName: p.firstName,
      lastName: p.lastName,
      sex: p.sex as "male" | "female",
      dateOfBirth: p.dateOfBirth,
      cells,
    };
  });

  const finalRows = filter.onlyOverdue
    ? rows.filter((r) => Object.values(r.cells).some((v) => v === "overdue"))
    : rows;

  return { vaccines, rows: finalRows };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type AgeBracket = "0-6" | "6-12" | "12-24" | ">24";

/** Pure, exhaustively-typed age bracket test. Always returns a boolean. */
function matchesAgeBracket(
  dateOfBirth: string,
  bracket: AgeBracket | undefined,
  now: Date,
): boolean {
  if (!bracket) return true;
  const ageMonths = (now.getTime() - new Date(dateOfBirth).getTime()) / MS_PER_MONTH;
  switch (bracket) {
    case "0-6":
      return ageMonths >= 0 && ageMonths < 6;
    case "6-12":
      return ageMonths >= 6 && ageMonths < 12;
    case "12-24":
      return ageMonths >= 12 && ageMonths < 24;
    case ">24":
      return ageMonths >= 24;
    default: {
      // Exhaustiveness check — adding a bracket to the union and not
      // handling it here becomes a compile error.
      const _exhaustive: never = bracket;
      return false;
    }
  }
}

/**
 * Resolve a single cell's display status.
 *
 * Rules:
 *   1. Recorded "given"        → given      (DB wins)
 *   2. Recorded "refused"      → refused    (persistent user decision)
 *   3. Recorded "deferred"     → due        (postponed, not failed)
 *   4. No record + past target → overdue
 *   5. Otherwise               → due
 */
function resolveStatus(input: {
  record: { status: "given" | "due" | "overdue" | "deferred" | "refused" } | undefined;
  dateOfBirth: Date;
  targetAgeMonths: number;
  now: Date;
}): "given" | "due" | "overdue" | "refused" {
  const { record, dateOfBirth, targetAgeMonths, now } = input;

  if (record?.status === "given") return "given";
  if (record?.status === "refused") return "refused";
  if (record?.status === "deferred") return "due";

  const target = new Date(dateOfBirth);
  target.setMonth(target.getMonth() + targetAgeMonths);

  return target < now ? "overdue" : "due";
}
