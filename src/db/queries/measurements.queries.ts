// src/features/patients/queries.ts
//
// Moved verbatim from `src/server/db/queries/patient.queries.ts`.
// Only imports changed:
//   @/lib/db            → @/server/db
//   @/lib/db/schema     → ./schema (patients) / @/server/db/schema (visits, etc.)
//
// TODO: clinics: import from `@/features/clinics/schema` once it exists.

import type { QueryClient } from "@tanstack/react-query";

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

import type { Indicator, LmsRow, LmsTriple, Sex, XAxis } from "#/features/growth/types/types.ts";

import { db } from "@/db";
import { lmsReferences, measurements, patients, visits } from "@/db/schema";

import { interpolateLms, zScoreForValue } from "../../features/measurements/lib/lms";
import { qk } from "../../features/shared/queryKeys.queries";

// The DB stores a fifth indicator that has no Egyptian LMS reference.
type StoredIndicator = Indicator | "head-circumference-for-age";

export const LMS_VERSION = "egyptian-2021" as const;

function toLmsTriple(row: { l: number; m: number; s: number }): LmsTriple {
  return { l: row.l, m: row.m, s: row.s };
}

export async function getLmsByAge(
  indicator: Indicator,
  sex: Sex,
  ageMonths: number,
): Promise<LmsTriple | null> {
  const where = and(
    eq(lmsReferences.indicator, indicator),
    eq(lmsReferences.sex, sex),
    eq(lmsReferences.xAxis, "age"),
    eq(lmsReferences.version, LMS_VERSION),
  );

  const [below] = await db
    .select()
    .from(lmsReferences)
    .where(and(where, lte(lmsReferences.xValue, ageMonths)))
    .orderBy(desc(lmsReferences.xValue))
    .limit(1);

  const [above] = await db
    .select()
    .from(lmsReferences)
    .where(and(where, gte(lmsReferences.xValue, ageMonths)))
    .orderBy(asc(lmsReferences.xValue))
    .limit(1);

  if (!below || !above) return null;
  if (below.xValue === above.xValue) return toLmsTriple(below);

  const tri = interpolateLms(
    ageMonths,
    { x: below.xValue, l: below.l, m: below.m, s: below.s },
    { x: above.xValue, l: above.l, m: above.m, s: above.s },
  );
  return tri;
}

export async function getLmsByLength(sex: Sex, lengthCm: number): Promise<LmsTriple | null> {
  const where = and(
    eq(lmsReferences.indicator, "weight-for-length"),
    eq(lmsReferences.sex, sex),
    eq(lmsReferences.xAxis, "length"),
    eq(lmsReferences.version, LMS_VERSION),
  );

  const [below] = await db
    .select()
    .from(lmsReferences)
    .where(and(where, lte(lmsReferences.xValue, lengthCm)))
    .orderBy(desc(lmsReferences.xValue))
    .limit(1);

  const [above] = await db
    .select()
    .from(lmsReferences)
    .where(and(where, gte(lmsReferences.xValue, lengthCm)))
    .orderBy(asc(lmsReferences.xValue))
    .limit(1);

  if (!below || !above) return null;
  if (below.xValue === above.xValue) return toLmsTriple(below);

  return interpolateLms(
    lengthCm,
    { x: below.xValue, l: below.l, m: below.m, s: below.s },
    { x: above.xValue, l: above.l, m: above.m, s: above.s },
  );
}

// --- Standalone measurement insert (creates a measurement-only visit) -----

/**
 * Create a "measurement-only" visit + insert all measurements with
 * z-scores where LMS is available. Used by the standalone
 * `/patients/$patientId/measurements/new` route.
 */
export async function insertMeasurementsStandalone(input: {
  patientId: string;
  clinicId: string;
  rows: Array<{
    indicator: Indicator;
    value: number;
    lengthCm?: number | null;
  }>;
}) {
  const [patient] = await db
    .select({
      sex: patients.sex,
      dateOfBirth: patients.dateOfBirth,
    })
    .from(patients)
    .where(eq(patients.id, input.patientId))
    .limit(1);

  if (!patient) throw new Error("Patient not found");

  const visitedAt = new Date();
  const ageMonths =
    (visitedAt.getTime() - new Date(patient.dateOfBirth).getTime()) / (86_400_000 * 30.4375);
  const years = Math.floor(ageMonths / 12);
  const remainder = Math.round(ageMonths - years * 12);

  const [visit] = await db
    .insert(visits)
    .values({
      patientId: input.patientId,
      clinicId: input.clinicId,
      visitedAt,
      ageMonths,
      ageYears: years,
      ageMonthsRemainder: remainder >= 12 ? 0 : remainder,
    })
    .returning({ id: visits.id });

  if (!visit) throw new Error("Failed to create visit");

  const prepared = await Promise.all(
    input.rows.map(async (row) => {
      const measurement = {
        visitId: visit.id,
        patientId: input.patientId,
        measuredAt: visitedAt,
        indicator: row.indicator,
        value: row.value,
      };
      let lms: LmsTriple | null = null;
      try {
        if (row.indicator === "weight-for-length") {
          if (!row.lengthCm) {
            return measurement;
          }
          lms = await getLmsByLength(patient.sex, row.lengthCm);
        } else if (row.indicator !== "head-circumference-for-age") {
          lms = await getLmsByAge(row.indicator, patient.sex, ageMonths);
        }
      } catch {
        return measurement;
      }

      if (!lms) return measurement;

      const zScore = zScoreForValue(lms, row.value);
      return {
        ...measurement,
        zScore,
        lmsL: lms.l,
        lmsM: lms.m,
        lmsS: lms.s,
      };
    }),
  );

  return db.insert(measurements).values(prepared).returning();
}

// --- Bulk insert into an existing visit ------------------------------------

export async function createMeasurementsForVisit(input: {
  visitId: string;
  rows: Array<{
    indicator: Indicator;
    value: number;
    zScore?: number;
    percentile?: number;
    classification?: string;
    lmsL?: number;
    lmsM?: number;
    lmsS?: number;
  }>;
}) {
  if (input.rows.length === 0) return [];
  const visitContext = await getMeasurementVisitContext(input.visitId);
  return db
    .insert(measurements)
    .values(
      input.rows.map((r) => ({
        ...r,
        visitId: input.visitId,
        ...visitContext,
      })),
    )
    .returning();
}
async function getMeasurementVisitContext(visitId: string) {
  const visit = await db.query.visits.findFirst({
    where: { id: visitId },
    columns: {
      patientId: true,
      visitedAt: true,
    },
  });
  if (!visit) throw new Error(`Visit ${visitId} was not found`);
  return { patientId: visit.patientId, measuredAt: visit.visitedAt };
}

export function invalidateAfterMeasurementCreate(
  qc: QueryClient,
  patientId: string,
  indicator: Indicator,
): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.series(patientId, indicator) }),
    qc.invalidateQueries({ queryKey: ["flagged", patientId] }),
    // Band keys are grouped under "band"; invalidating the prefix hits
    // every (indicator, sex, range, x) tuple. That's fine — band data is
    // cheap and the refetch batches.
    qc.invalidateQueries({ queryKey: ["band"] }),
  ]);
}
// ---------------------------------------------------------------------------
// Create: measurement + z-score in one shot
// ---------------------------------------------------------------------------

export async function addMeasurementWithZScore(
  visitId: string,
  indicator: StoredIndicator,
  value: number,
  sex: "male" | "female",
  ageMonths: number,
  lengthCm?: number,
) {
  if (indicator === "head-circumference-for-age") {
    throw new Error("No Egyptian LMS reference data is available for head circumference.");
  }

  // 1. Resolve LMS — length-based for WFL, age-based otherwise.
  const lms: LmsTriple | null =
    indicator === "weight-for-length"
      ? lengthCm === undefined
        ? null
        : await getLmsByLength(sex, lengthCm)
      : await getLmsByAge(indicator, sex, ageMonths);

  if (!lms) {
    throw new Error(
      indicator === "weight-for-length"
        ? `No LMS reference found for ${indicator}, ${sex}, length ${lengthCm ?? "(required)"}`
        : `No LMS reference found for ${indicator}, ${sex}, age ${ageMonths}`,
    );
  }

  // 2. Z-score. `zScoreForValue` throws `LmsDomainError` on invalid value/LMS,
  // which is exactly what we want — the old `calculateZScore` returned 0 on
  // bad input, which silently classified junk as "median".
  const zScore = zScoreForValue(lms, value);

  // 3. Insert.
  const visitContext = await getMeasurementVisitContext(visitId);
  const [newMeasurement] = await db
    .insert(measurements)
    .values([
      {
        visitId,
        ...visitContext,
        indicator,
        value,
        zScore,
        lmsL: lms.l,
        lmsM: lms.m,
        lmsS: lms.s,
      },
    ])
    .returning();

  return newMeasurement;
}

// ---------------------------------------------------------------------------
// Create: raw
// ---------------------------------------------------------------------------

export async function createMeasurement(input: {
  visitId: string;
  indicator: StoredIndicator;
  value: number;
  zScore?: number;
  percentile?: number;
  classification?: string;
  lmsL?: number;
  lmsM?: number;
  lmsS?: number;
}) {
  const visitContext = await getMeasurementVisitContext(input.visitId);
  const [row] = await db
    .insert(measurements)
    .values([{ ...input, ...visitContext }])
    .returning();
  return row;
}

/** Bulk insert — useful when saving a full panel at once. */
export async function createMeasurements(
  rows: Array<{
    visitId: string;
    indicator: StoredIndicator;
    value: number;
    zScore?: number;
    percentile?: number;
    classification?: string;
    lmsL?: number;
    lmsM?: number;
    lmsS?: number;
  }>,
) {
  if (rows.length === 0) return [];

  const preparedRows = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      ...(await getMeasurementVisitContext(row.visitId)),
    })),
  );
  return db.insert(measurements).values(preparedRows).returning();
}

// ---------------------------------------------------------------------------
// Read: single
// ---------------------------------------------------------------------------

export async function getMeasurementById(id: string) {
  return db.query.measurements.findFirst({
    where: { id },
    with: { visit: { with: { patient: true } } },
  });
}

export async function listMeasurementsForVisit(visitId: string) {
  return db.query.measurements.findMany({
    where: { visitId },
    orderBy: { indicator: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Read: series (growth chart)
// ---------------------------------------------------------------------------

/**
 * Time series for one indicator for one patient — the core growth-chart query.
 * Returns oldest → newest so it can feed straight into a chart.
 *
 * The explicit `Promise<IndicatorSeriesRow[]>` return type is load-bearing:
 * Drizzle's relational `with` inference widens the `visit` relation to `any`
 * when the schema's relation map is composed from multiple
 * `defineRelationsPart` calls, which cascades into `implicit any` at every
 * call site. Pinning the shape here stops that leak.
 */
// ---------------------------------------------------------------------------
// Read: flagged
// ---------------------------------------------------------------------------

/** Flagged measurements (|z| ≥ threshold) for a patient. */
export async function listFlaggedMeasurements(patientId: string, zThreshold = 2) {
  return db.query.measurements.findMany({
    where: {
      visit: { patientId },
      OR: [{ zScore: { gte: zThreshold } }, { zScore: { lte: -zThreshold } }],
    },
    with: {
      visit: {
        columns: { visitedAt: true, ageMonths: true },
      },
    },
    orderBy: { id: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Read: latest panel
// ---------------------------------------------------------------------------

/**
 * Latest measurement per indicator for a patient.
 *
 * Uses a correlated subquery on `visits.id` rather than window functions —
 * clear, portable, and cheap given the `(patient_id, visited_at)` index.
 *
 * Replaces the old `RAW:` form, which isn't a Drizzle v0.3x API. `RAW` was
 * silently ignored, so the old version returned **every** measurement for
 * the patient, not the latest.
 */
export async function latestMeasurementPerIndicator(patientId: string) {
  const latestVisit = await db
    .select({ id: visits.id })
    .from(visits)
    .where(eq(visits.patientId, patientId))
    .orderBy(desc(visits.visitedAt))
    .limit(1);

  const visitId = latestVisit[0]?.id;
  if (!visitId) return [];

  return db.query.measurements.findMany({
    where: { visitId },
    with: {
      visit: {
        columns: { visitedAt: true, ageMonths: true },
      },
    },
    orderBy: { indicator: "asc" },
  });
}

/**
 * Latest value per indicator, flattened across visits.
 *
 * Two-query approach (SELECT + reduce in JS) rather than one clever SQL:
 * readable, and the row count per patient is tiny.
 */
export async function latestPanelForPatient(patientId: string) {
  const rows = await db
    .select({
      indicator: measurements.indicator,
      value: measurements.value,
      zScore: measurements.zScore,
      percentile: measurements.percentile,
      classification: measurements.classification,
      visitedAt: visits.visitedAt,
      ageMonths: visits.ageMonths,
    })
    .from(measurements)
    .innerJoin(visits, eq(measurements.visitId, visits.id))
    .where(eq(visits.patientId, patientId))
    .orderBy(desc(visits.visitedAt));

  const seen = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!seen.has(r.indicator)) seen.set(r.indicator, r);
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Read: aggregates / dashboard
// ---------------------------------------------------------------------------

/** Classification distribution across a clinic — useful for a dashboard. */
export async function classificationCountsForClinic(clinicId: string) {
  return db
    .select({
      indicator: measurements.indicator,
      classification: measurements.classification,
      count: sql<number>`COUNT(*)`,
    })
    .from(measurements)
    .innerJoin(visits, eq(measurements.visitId, visits.id))
    .innerJoin(patients, eq(visits.patientId, patients.id))
    .where(eq(patients.clinicId, clinicId))
    .groupBy(measurements.indicator, measurements.classification);
}

// ---------------------------------------------------------------------------
// Read: severe cases (referral queue)
// ---------------------------------------------------------------------------

/**
 * Patients with |z| ≥ 3 — the referral queue.
 *
 * Scoped to `clinicId` via `visits.clinicId`. The old version filtered by
 * `visit: { clinicId }`, which is a column, not a relation, so it never
 * matched (the old query returned nothing).
 */
export async function severeCasesForClinic(clinicId: string) {
  return db.query.measurements.findMany({
    where: {
      visit: { clinicId },
      OR: [{ zScore: { gte: 3 } }, { zScore: { lte: -3 } }],
    },
    with: {
      visit: {
        columns: { visitedAt: true, ageMonths: true },
        with: {
          patient: {
            columns: { id: true, mrn: true, firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Update / delete
// ---------------------------------------------------------------------------

export async function updateMeasurement(
  id: string,
  patch: Partial<{
    value: number;
    zScore: number | null;
    percentile: number | null;
    classification: string | null;
    lmsL: number | null;
    lmsM: number | null;
    lmsS: number | null;
  }>,
) {
  const [row] = await db.update(measurements).set(patch).where(eq(measurements.id, id)).returning();
  return row;
}

export async function deleteMeasurement(id: string) {
  await db.delete(measurements).where(eq(measurements.id, id));
}

// ---------------------------------------------------------------------------
// LMS Reference Data
// ---------------------------------------------------------------------------

/** Whatever `db.select().from(lmsReferences)` returns. */
type LmsRefRow = typeof lmsReferences.$inferSelect;

function toLmsRow(row: LmsRefRow): LmsRow {
  return {
    indicator: row.indicator as Indicator,
    sex: row.sex as Sex,
    xAxis: row.xAxis as XAxis,
    xValue: row.xValue,
    l: row.l,
    m: row.m,
    s: row.s,
  };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/**
 * Insert the LMS seed exactly once. Idempotent via `onConflictDoNothing`.
 *
 * Chunks by **parameter count**, not row count — SQLite's default
 * SQLITE_MAX_VARIABLE_NUMBER is 999, and each row binds 9 params.
 * Wraps the whole seed in one transaction so a failed chunk doesn't leave
 * the table half-populated.
 */
export async function seedLmsReferences(seed: readonly LmsRow[]): Promise<void> {
  const COLS_PER_ROW = 9;
  const MAX_PARAMS = 900;
  const CHUNK = Math.floor(MAX_PARAMS / COLS_PER_ROW);

  const values = seed.map((r) => ({
    indicator: r.indicator,
    sex: r.sex,
    xAxis: r.xAxis,
    xValue: r.xValue,
    l: r.l,
    m: r.m,
    s: r.s,
    version: LMS_VERSION,
  }));

  db.transaction((tx) => {
    for (let i = 0; i < values.length; i += CHUNK) {
      tx.insert(lmsReferences)
        .values(values.slice(i, i + CHUNK))
        .onConflictDoNothing()
        .run();
    }
  });
}

/**
 * Replace all rows for `LMS_VERSION`. Use during dev/migrations.
 * (Other versions are preserved.)
 */
export async function replaceLmsReferences(seed: readonly LmsRow[]): Promise<void> {
  await db.delete(lmsReferences).where(eq(lmsReferences.version, LMS_VERSION));
  await seedLmsReferences(seed);
}

// ---------------------------------------------------------------------------
// Lookup: exact grid point
// ---------------------------------------------------------------------------

/**
 * Exact LMS row for `(indicator, sex, xAxis, xValue)`, or `null` if that
 * tuple isn't tabulated. Use `getLmsInterpolated` for off-grid x.
 */
export async function getLms(params: {
  indicator: Indicator;
  sex: Sex;
  xAxis: XAxis;
  xValue: number;
}): Promise<LmsRow | null> {
  const [row] = await db
    .select()
    .from(lmsReferences)
    .where(
      and(
        eq(lmsReferences.indicator, params.indicator),
        eq(lmsReferences.sex, params.sex),
        eq(lmsReferences.xAxis, params.xAxis),
        eq(lmsReferences.xValue, params.xValue),
        eq(lmsReferences.version, LMS_VERSION),
      ),
    )
    .limit(1);

  return row ? toLmsRow(row) : null;
}

// ---------------------------------------------------------------------------
// Lookup: interpolated
// ---------------------------------------------------------------------------

/**
 * Linearly interpolate L/M/S between the two bracketing grid points.
 *
 * Returns `null` when `xValue` is outside the tabulated coverage — this
 * function never extrapolates from the nearest row.
 */
export async function getLmsInterpolated(params: {
  indicator: Indicator;
  sex: Sex;
  xAxis: XAxis;
  xValue: number;
}): Promise<LmsRow | null> {
  const { indicator, sex, xAxis, xValue } = params;

  const baseWhere = and(
    eq(lmsReferences.indicator, indicator),
    eq(lmsReferences.sex, sex),
    eq(lmsReferences.xAxis, xAxis),
    eq(lmsReferences.version, LMS_VERSION),
  );

  const [belowRows, aboveRows] = await Promise.all([
    db
      .select()
      .from(lmsReferences)
      .where(and(baseWhere, lte(lmsReferences.xValue, xValue)))
      .orderBy(desc(lmsReferences.xValue))
      .limit(1),
    db
      .select()
      .from(lmsReferences)
      .where(and(baseWhere, gte(lmsReferences.xValue, xValue)))
      .orderBy(asc(lmsReferences.xValue))
      .limit(1),
  ]);

  const below = belowRows[0];
  const above = aboveRows[0];

  if (!below || !above) return null;
  if (below.xValue === above.xValue) return toLmsRow(below);

  const tri = interpolateLms(
    xValue,
    { x: below.xValue, l: below.l, m: below.m, s: below.s },
    { x: above.xValue, l: above.l, m: above.m, s: above.s },
  );

  return {
    indicator,
    sex,
    xAxis,
    xValue,
    l: tri.l,
    m: tri.m,
    s: tri.s,
  };
}

// ---------------------------------------------------------------------------
// Lookup: type-safe wrappers
// ---------------------------------------------------------------------------
