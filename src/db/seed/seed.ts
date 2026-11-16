// src/db/seed.ts
//
// Run with:  npx tsx src/db/seed.ts
// (or "tsx src/db/seed" / "bun src/db/seed" if tsx isn't installed: npm i -D tsx)
//
// Idempotent: safe to re-run. LMS rows use onConflictDoNothing on the composite PK.
// Patient/visit/measurement data uses deterministic IDs so re-runs won't duplicate.

import { sql as drizzleSql } from "drizzle-orm";

import { closeDb, db } from "@/db";
import { DEVELOPMENTAL_MILESTONES } from "@/features/development/types";
// TODO: Run `pnpm exec tsx scripts/parse-lms.ts` to generate the full seed file
import { type Indicator, LMS_SEED, LMS_VERSION, type Sex } from "@/features/growth/types/lms-seed";

import * as schema from "../schema";
import { CLINIC_HURGHADA_ID } from "./seed-config";
import { seedFormulary } from "./seed-formulary";
import { seedWhoGrowthStandards } from "./seed-who";

const DB_PATH = process.env.DB_FILE_NAME ?? "./clinic.sqlite";
const SQLITE_PARAM_LIMIT_CHUNK = 100;

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

/** Deterministic UUID-ish ID derived from a seed string (stable across runs). */
function stableId(seed: string): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  let h3 = Math.imul(h1 ^ 0x9e3779b9, 2654435761);
  let h4 = Math.imul(h2 ^ 0x85ebca6b, 1597334677);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507);
  const hi = (h2 >>> 0).toString(16).padStart(8, "0");
  const lo = (h1 >>> 0).toString(16).padStart(8, "0");
  const hi2 = (h4 >>> 0).toString(16).padStart(8, "0");
  const lo2 = (h3 >>> 0).toString(16).padStart(8, "0");
  const raw = (hi + lo + hi2 + lo2).split("");
  raw[12] = "4";
  raw[16] = ((Number.parseInt(raw[16], 16) & 0x3) | 0x8).toString(16);
  const s = raw.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

/** Chunk an array into groups of `size`. */
function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Insert in chunks, sequentially. better-sqlite3 is sync under the hood, so
 * parallel inserts gain nothing and lose error attribution. Chunking exists
 * only to stay under SQLite's 999-parameter limit.
 */
async function insertInChunks<T>(
  rows: readonly T[],
  insert: (part: T[]) => Promise<unknown>,
  size = SQLITE_PARAM_LIMIT_CHUNK,
): Promise<void> {
  for (const part of chunk(rows, size)) {
    // eslint-disable-next-line no-await-in-loop
    await insert(part);
  }
}

/** Small deterministic PRNG so re-runs produce identical patient data. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20210501);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const randBetween = (min: number, max: number) => min + rand() * (max - min);
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** ISO date string YYYY-MM-DD. */
function isoDate(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

/** Add months to a YYYY-MM-DD date, preserving day-of-month (clamped). */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

/** Age in fractional months between DOB and visit date. */
function ageMonths(dob: string, visitedAt: string): number {
  const [dy, dm, dd] = dob.split("-").map(Number);
  const [vy, vm, vd] = visitedAt.slice(0, 10).split("-").map(Number);
  const dobD = Date.UTC(dy, dm - 1, dd);
  const visD = Date.UTC(vy, vm - 1, vd);
  const days = (visD - dobD) / 86_400_000;
  return round(days / 30.4375, 2);
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

/** Normal CDF (Abramowitz & Stegun 7.1.26). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

/** Clamp a gaussian-ish draw to ±3. */
function clampGaussian(z: number): number {
  if (z > 3) return 3;
  if (z < -3) return -3;
  return z;
}

/** Compute an approximate z-score from LMS for a given value (for display). */
function zFromLms(value: number, l: number, m: number, s: number): number {
  if (Math.abs(l) < 1e-9) return Math.log(value / m) / s;
  return ((value / m) ** l - 1) / (l * s);
}

function classify(
  indicator: Indicator | "head-circumference-for-age",
  z: number | null,
): string | null {
  if (z === null) return null;
  if (indicator === "weight-for-age") {
    if (z < -3) return "Severely underweight";
    if (z < -2) return "Underweight";
    if (z > 3) return "Severely overweight";
    if (z > 2) return "Overweight";
    return "Normal weight";
  }
  if (indicator === "length-for-age") {
    if (z < -3) return "Severely stunted";
    if (z < -2) return "Stunted";
    if (z > 2) return "Tall";
    return "Normal length";
  }
  if (indicator === "bmi-for-age") {
    if (z < -3) return "Severely wasted";
    if (z < -2) return "Wasted";
    if (z > 3) return "Severely obese";
    if (z > 2) return "Obese";
    if (z > 1) return "Overweight risk";
    return "Normal BMI";
  }
  return null;
}

const sqlCount = () => drizzleSql<number>`count(*)`;

// ---------------------------------------------------------------------------
// Static pools
// ---------------------------------------------------------------------------

const CLINICS = [
  { id: "clinic-cairo-01", name: "Cairo Children's Clinic" },
  { id: "clinic-alex-01", name: "Alexandria Pediatric Center" },
  { id: "clinic-giza-01", name: "Giza Family Health Unit" },
  {
    id: CLINIC_HURGHADA_ID,
    name: "Hurghada General Hospital — Pediatric Clinic",
  },
] as const;

const VACCINE_CATALOG = [
  {
    id: "birth-bcg",
    label: "BCG",
    disease: "Tuberculosis",
    recommendedAgeMonths: 0,
    recommendedAgeLabel: "At birth",
  },
  {
    id: "birth-opv",
    label: "Oral polio vaccine (birth dose)",
    disease: "Poliomyelitis",
    recommendedAgeMonths: 0,
    recommendedAgeLabel: "At birth",
  },
  {
    id: "2m-pentavalent-1",
    label: "Pentavalent vaccine (dose 1)",
    disease: "Diphtheria, tetanus, pertussis, hepatitis B, Hib",
    recommendedAgeMonths: 2,
    recommendedAgeLabel: "2 months",
  },
  {
    id: "2m-opv-1",
    label: "Oral polio vaccine (dose 1)",
    disease: "Poliomyelitis",
    recommendedAgeMonths: 2,
    recommendedAgeLabel: "2 months",
  },
  {
    id: "4m-pentavalent-2",
    label: "Pentavalent vaccine (dose 2)",
    disease: "Diphtheria, tetanus, pertussis, hepatitis B, Hib",
    recommendedAgeMonths: 4,
    recommendedAgeLabel: "4 months",
  },
  {
    id: "6m-pentavalent-3",
    label: "Pentavalent vaccine (dose 3)",
    disease: "Diphtheria, tetanus, pertussis, hepatitis B, Hib",
    recommendedAgeMonths: 6,
    recommendedAgeLabel: "6 months",
  },
  {
    id: "9m-mmr-1",
    label: "Measles, mumps, rubella (dose 1)",
    disease: "Measles, mumps, rubella",
    recommendedAgeMonths: 9,
    recommendedAgeLabel: "9 months",
  },
] as const;

const EGYPTIAN_FIRST_M = [
  "Ahmed",
  "Mohamed",
  "Youssef",
  "Karim",
  "Omar",
  "Ali",
  "Hassan",
  "Tarek",
  "Mahmoud",
  "Ziad",
  "Adham",
  "Hazem",
  "Mostafa",
  "Ibrahim",
  "Khaled",
];

const EGYPTIAN_FIRST_F = [
  "Fatma",
  "Aya",
  "Mona",
  "Salma",
  "Nour",
  "Hana",
  "Yasmin",
  "Mariam",
  "Dina",
  "Layla",
  "Sara",
  "Amina",
  "Farida",
  "Rana",
  "Hager",
];

const EGYPTIAN_LAST = [
  "Hassan",
  "Ibrahim",
  "El-Sayed",
  "Abdelrahman",
  "Mostafa",
  "Fahmy",
  "Shokry",
  "Nassar",
  "Farouk",
  "Zaki",
  "El-Masry",
  "Gaber",
  "Othman",
];

const ICD_POOL = [
  { code: "J06.9", desc: "Acute upper respiratory infection, unspecified" },
  { code: "J20.9", desc: "Acute bronchitis, unspecified" },
  { code: "A09", desc: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "R50.9", desc: "Fever, unspecified" },
  { code: "H66.9", desc: "Otitis media, unspecified" },
  { code: "L20.9", desc: "Atopic dermatitis, unspecified" },
  { code: "R63.4", desc: "Abnormal weight loss" },
  { code: "E44.0", desc: "Moderate protein-calorie malnutrition" },
  { code: "Z00.1", desc: "Encounter for routine child health exam" },
  { code: "J45.909", desc: "Unspecified asthma, uncomplicated" },
] as const;

const DRUG_POOL = [
  { name: "Paracetamol", dose: "120mg/5ml", freq: "every 6h PRN", days: 3 },
  { name: "Amoxicillin", dose: "250mg/5ml", freq: "TID", days: 7 },
  { name: "Ibuprofen", dose: "100mg/5ml", freq: "TID", days: 3 },
  { name: "Cetirizine", dose: "2.5mg/5ml", freq: "OD at night", days: 5 },
  { name: "Salbutamol", dose: "2.5mg neb", freq: "QID PRN", days: 5 },
  { name: "ORS sachets", dose: "1 sachet", freq: "after each stool", days: 3 },
  { name: "Vitamin D3", dose: "400 IU", freq: "OD", days: 30 },
  { name: "Zinc sulfate", dose: "20mg", freq: "OD", days: 14 },
] as const;

const NOTE_TEMPLATES = [
  {
    title: "Parental concern — feeding",
    body: "Mother reports reduced feeding for 2 days. No vomiting. Advised to monitor wet diapers.",
  },
  {
    title: "Growth follow-up",
    body: "Weight trending along −1 SD. Re-check in 4 weeks; consider dietary recall.",
  },
  {
    title: "Immunization status",
    body: "Up to date per national schedule. Next DTP due in 6 weeks.",
  },
  {
    title: "Allergy review",
    body: "Mild eczema flare after introducing cow's milk. Advised to delay reintroduction by 3 months.",
  },
  {
    title: "Developmental milestone check",
    body: "Walks independently, says 5+ words. Age-appropriate.",
  },
] as const;

// ---------------------------------------------------------------------------
// LMS references
// ---------------------------------------------------------------------------

async function seedLms() {
  console.log(`\n📐 Seeding LMS references (version=${LMS_VERSION})…`);

  const rows = LMS_SEED.map((r) => {
    const [sd3neg, sd2neg, sd1neg, sd0, sd1, sd2, sd3] = r.rawCheck;
    return {
      indicator: r.indicator,
      sex: r.sex,
      xAxis: r.xAxis,
      xValue: r.xValue,
      l: r.l,
      m: r.m,
      s: r.s,
      sd3neg,
      sd2neg,
      sd1neg,
      sd0,
      sd1,
      sd2,
      sd3,
      version: LMS_VERSION,
    };
  }) satisfies (typeof schema.lmsReferences.$inferInsert)[];

  let inserted = 0;
  await insertInChunks(rows, async (part) => {
    const res = await db
      .insert(schema.lmsReferences)
      .values(part)
      .onConflictDoNothing()
      .returning({ x: schema.lmsReferences.xValue });
    inserted += res.length;
  });

  const [{ count }] = await db.select({ count: sqlCount() }).from(schema.lmsReferences);

  console.log(
    `   ✔ ${rows.length} rows processed, ${inserted} newly inserted, ${count} total in DB`,
  );
}

// ---------------------------------------------------------------------------
// Clinics
// ---------------------------------------------------------------------------

const CLINIC_META: Record<string, { address: string; phone: string }> = {
  "clinic-cairo-01": {
    address: "12 Nile Corniche, Cairo",
    phone: "+20 2 2574 0001",
  },
  "clinic-alex-01": {
    address: "45 El-Horreya Rd, Alexandria",
    phone: "+20 3 486 0002",
  },
  "clinic-giza-01": { address: "8 Giza St, Giza", phone: "+20 2 3570 0003" },
  [CLINIC_HURGHADA_ID]: {
    address: "El Nasr St., Hurghada, Red Sea Governorate",
    phone: "+20 65 344 0000",
  },
};

async function seedClinics() {
  console.log("\n🏥 Seeding clinics…");

  const rows = CLINICS.map((c) => ({
    id: c.id,
    name: c.name,
    address: CLINIC_META[c.id]?.address ?? null,
    phone: CLINIC_META[c.id]?.phone ?? null,
    email: `${c.id.replace("clinic-", "")}@clinic.eg`,
  })) satisfies (typeof schema.clinics.$inferInsert)[];

  await db.insert(schema.clinics).values(rows).onConflictDoNothing();
  console.log(`   ✔ ${rows.length} clinics ensured`);
}

async function seedCatalogs() {
  console.log("\n📚 Seeding vaccine and developmental catalogs…");

  const vaccines = VACCINE_CATALOG.map((vaccine) => ({
    ...vaccine,
    schedule: "demo",
    isMandatoryMoh: false,
    notes: "Synthetic example only; not an official schedule. Confirm current local guidance.",
  })) satisfies (typeof schema.vaccineCatalog.$inferInsert)[];
  await db.insert(schema.vaccineCatalog).values(vaccines).onConflictDoNothing();

  const milestones = DEVELOPMENTAL_MILESTONES.map((milestone) => ({
    id: milestone.id,
    label: milestone.title,
    domain: milestone.domain === "social-emotional" ? "social-cognitive" : milestone.domain,
    expectedAgeMonths: milestone.targetAgeMonths,
    ageLabel: milestone.ageLabel,
    redFlagWarning: milestone.isRedFlagIfMissing ? milestone.description : null,
    notes: milestone.description,
  })) satisfies (typeof schema.milestoneCatalog.$inferInsert)[];
  await insertInChunks(milestones, (part) =>
    db.insert(schema.milestoneCatalog).values(part).onConflictDoNothing(),
  );

  console.log(
    `   ✔ ${vaccines.length} vaccine catalog entries and ${milestones.length} milestones ensured`,
  );
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

async function seedUsers() {
  console.log("\n👩‍⚕️ Seeding users…");

  const users = [
    {
      id: stableId("user:admin"),
      name: "System Admin",
      email: "admin@clinic.eg",
      emailVerified: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      role: "admin" as const,
      clinicId: CLINICS[0].id,
      phone: "+20 100 000 0000",
    },
    {
      id: stableId("user:doctor-sara"),
      name: "Dr. Sara Hassan",
      email: "sara.hassan@clinic.eg",
      emailVerified: true,
      createdAt: new Date("2024-02-10"),
      updatedAt: new Date("2024-02-10"),
      role: "doctor" as const,
      clinicId: CLINICS[0].id,
      phone: "+20 100 111 2222",
    },
    {
      id: stableId("user:doctor-omar"),
      name: "Dr. Omar El-Sayed",
      email: "omar.elsayed@clinic.eg",
      emailVerified: true,
      createdAt: new Date("2024-03-05"),
      updatedAt: new Date("2024-03-05"),
      role: "doctor" as const,
      clinicId: CLINICS[1].id,
      phone: "+20 100 333 4444",
    },
    {
      id: stableId("user:staff-nour"),
      name: "Nour Abdelrahman",
      email: "nour.a@clinic.eg",
      emailVerified: true,
      createdAt: new Date("2024-04-01"),
      updatedAt: new Date("2024-04-01"),
      role: "staff" as const,
      clinicId: CLINICS[2].id,
      phone: "+20 100 555 6666",
    },
  ];

  await Promise.all(users.map((u) => db.insert(schema.user).values(u).onConflictDoNothing()));
  console.log(`   ✔ ${users.length} users ensured`);
}

// ---------------------------------------------------------------------------
// Patients + visits + measurements
// ---------------------------------------------------------------------------

interface PatientSpec {
  seedKey: string;
  firstName: string;
  lastName: string;
  sex: Sex;
  dob: string;
  clinicId: string;
}

/** Pinned so DOB (and thus stableId) never drifts across calendar years. */
const REFERENCE_YEAR = 2025;

function buildPatientSpecs(n: number): PatientSpec[] {
  const specs: PatientSpec[] = [];
  for (let i = 0; i < n; i++) {
    const isMale = rand() > 0.5;
    const first = isMale ? pick(EGYPTIAN_FIRST_M) : pick(EGYPTIAN_FIRST_F);
    const last = pick(EGYPTIAN_LAST);
    const clinic = pick(CLINICS).id;

    const yearsAgo = Math.floor(randBetween(0, 5));
    const month = 1 + Math.floor(randBetween(0, 12));
    const day = 1 + Math.floor(randBetween(0, 28));
    const dob = isoDate(REFERENCE_YEAR - yearsAgo, month, day);

    specs.push({
      seedKey: `patient:${i}:${first}:${last}:${dob}`,
      firstName: first,
      lastName: last,
      sex: isMale ? "male" : "female",
      dob,
      clinicId: clinic,
    });
  }
  return specs;
}

function referenceValue(
  indicator: Indicator | "head-circumference-for-age",
  sex: Sex,
  ageMo: number,
): number {
  if (indicator === "head-circumference-for-age") {
    const base = sex === "male" ? 34.5 : 33.9;
    return round(base + Math.min(ageMo, 24) * 0.35 + randBetween(-0.6, 0.6), 1);
  }

  const rows = LMS_SEED.filter(
    (r) => r.indicator === indicator && r.sex === sex && r.xAxis === "age",
  );
  if (!rows.length) return round(randBetween(3, 10), 2);

  let best = rows[0];
  let bestD = Math.abs(best.xValue - ageMo);
  for (const r of rows) {
    const d = Math.abs(r.xValue - ageMo);
    if (d < bestD) {
      best = r;
      bestD = d;
    }
  }

  const { l: L, m, s } = best;
  const z = clampGaussian(randBetween(-2, 2));
  const value = Math.abs(L) < 1e-9 ? m * Math.exp(s * z) : m * (1 + L * s * z) ** (1 / L);
  return round(value, 2);
}

async function seedPatients() {
  console.log("\n🧒 Seeding patients, visits, measurements…");

  const specs = buildPatientSpecs(60);

  const patientRows = specs.map((s) => ({
    id: stableId(s.seedKey),
    clinicId: s.clinicId,
    mrn: `MRN-${s.seedKey.split(":")[1].padStart(5, "0")}`,
    firstName: s.firstName,
    lastName: s.lastName,
    sex: s.sex,
    dateOfBirth: s.dob,
    parentName: `${pick(EGYPTIAN_FIRST_F)} ${s.lastName}`,
    parentPhone: `+20 10${String(100_000_000 + Math.floor(rand() * 899_999_999)).slice(0, 9)}`,
    address: `${pick(["Nasr City", "Maadi", "Smouha", "Dokki", "Hurghada"] as const)}, Egypt`,
  }));

  await insertInChunks(patientRows, (part) =>
    db
      .insert(schema.patients)
      .values(part)
      .onConflictDoUpdate({
        target: schema.patients.id,
        set: { clinicId: drizzleSql`excluded.clinic_id` },
      }),
  );
  console.log(`   ✔ ${patientRows.length} patients ensured`);

  const visitInserts: (() => Promise<unknown>)[] = [];
  const measurementInserts: (() => Promise<unknown>)[] = [];

  for (const p of patientRows) {
    const nVisits = 2 + Math.floor(rand() * 4);
    const maxAgeMonths = Math.floor(ageMonths(p.dateOfBirth, new Date().toISOString()));

    for (let v = 0; v < nVisits; v++) {
      const visitAgeMonths = Math.floor(((v + 1) * maxAgeMonths) / (nVisits + 1));
      const visitedAt = addMonths(p.dateOfBirth, visitAgeMonths);
      const ageMo = ageMonths(p.dateOfBirth, visitedAt);
      const visitId = stableId(`visit:${p.id}:${visitedAt}`);

      visitInserts.push(() =>
        db
          .insert(schema.visits)
          .values({
            id: visitId,
            patientId: p.id,
            clinicId: p.clinicId,
            visitedAt: new Date(visitedAt),
            ageMonths: ageMo,
            ageYears: Math.floor(ageMo / 12),
            ageMonthsRemainder: Math.floor(ageMo % 12),
          })
          .onConflictDoUpdate({
            target: schema.visits.id,
            set: { clinicId: drizzleSql`excluded.clinic_id` },
          }),
      );

      const chosen: Array<Indicator | "head-circumference-for-age"> = [
        "weight-for-age",
        "length-for-age",
      ];
      if (ageMo >= 24) chosen.push("bmi-for-age");
      if (ageMo < 24) chosen.push("head-circumference-for-age");

      for (const indicator of chosen) {
        const value = referenceValue(indicator, p.sex, ageMo);

        let lmsL: number | null = null;
        let lmsM: number | null = null;
        let lmsS: number | null = null;
        let zScore: number | null = null;

        if (indicator !== "head-circumference-for-age") {
          const rows = LMS_SEED.filter(
            (r) => r.indicator === indicator && r.sex === p.sex && r.xAxis === "age",
          );
          if (rows.length) {
            let best = rows[0];
            let bestD = Math.abs(best.xValue - ageMo);
            for (const r of rows) {
              const d = Math.abs(r.xValue - ageMo);
              if (d < bestD) {
                best = r;
                bestD = d;
              }
            }
            lmsL = best.l;
            lmsM = best.m;
            lmsS = best.s;
            try {
              zScore = round(zFromLms(value, best.l, best.m, best.s), 2);
            } catch {
              zScore = null;
            }
          }
        }

        const percentile = zScore === null ? null : round(normalCdf(zScore) * 100, 1);
        const classification = classify(indicator, zScore);
        const measId = stableId(`meas:${visitId}:${indicator}`);

        measurementInserts.push(() =>
          db
            .insert(schema.measurements)
            .values([
              {
                id: measId,
                visitId,
                patientId: p.id,
                measuredAt: new Date(visitedAt),
                indicator,
                value,
                zScore,
                percentile,
                classification,
                lmsL,
                lmsM,
                lmsS,
              },
            ])
            .onConflictDoNothing(),
        );
      }
    }
  }

  await Promise.all(visitInserts.map((run) => run()));
  await Promise.all(measurementInserts.map((run) => run()));

  console.log(`   ✔ ${visitInserts.length} visits ensured`);
  console.log(`   ✔ ${measurementInserts.length} measurements ensured`);
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

async function seedAppointments(patients: Array<{ id: string; clinicId: string | null }>) {
  console.log("\n📅 Seeding appointments…");

  const reasonPool = [
    "Fever",
    "Cough",
    "Well-child visit",
    "Immunization",
    "Follow-up",
    "Rash",
    "Ear pain",
    "Poor feeding",
    "Loose stools",
  ] as const;

  const rows: (typeof schema.appointments.$inferInsert)[] = [];
  const now = Date.now();
  const DAY = 86_400_000;

  for (const patient of patients) {
    const n = 3 + Math.floor(rand() * 6);
    for (let i = 0; i < n; i++) {
      const offsetDays = rand() < 0.6 ? -Math.floor(rand() * 365) - 1 : Math.floor(rand() * 60) + 1;

      const scheduledAt = new Date(now + offsetDays * DAY);
      scheduledAt.setUTCHours(9 + Math.floor(rand() * 8), Math.floor(rand() * 4) * 15, 0, 0);

      const status =
        offsetDays < 0
          ? pick(["completed", "completed", "completed", "cancelled", "no-show"] as const)
          : "scheduled";

      rows.push({
        id: stableId(`appt:${patient.id}:${scheduledAt.toISOString()}`),
        patientId: patient.id,
        clinicId: patient.clinicId ?? CLINICS[0].id,
        doctorId: null,
        scheduledAt,
        durationMinutes: pick([10, 15, 15, 20, 30] as const),
        status,
        reason: pick(reasonPool),
        notes: rand() < 0.2 ? "Rescheduled from previous slot." : null,
      });
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.appointments).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} appointments ensured`);
}

// ---------------------------------------------------------------------------
// Vaccination, milestones, and certificates
// ---------------------------------------------------------------------------

async function seedVaccinations(patients: Array<{ id: string; dateOfBirth: string }>) {
  console.log("\n💉 Seeding vaccination records…");

  const rows: (typeof schema.vaccinations.$inferInsert)[] = [];
  for (const [patientIndex, patient] of patients.entries()) {
    for (let doseIndex = 0; doseIndex < 3; doseIndex++) {
      const vaccine = VACCINE_CATALOG[(patientIndex + doseIndex) % VACCINE_CATALOG.length];
      const completed = (patientIndex + doseIndex) % 3 !== 0;
      const administeredDate = addMonths(patient.dateOfBirth, vaccine.recommendedAgeMonths);
      rows.push({
        id: stableId(`vaccination:${patient.id}:${vaccine.id}`),
        patientId: patient.id,
        vaccineId: vaccine.id,
        status: completed ? "completed" : "due",
        administeredDate: completed ? administeredDate : null,
        dueDate: completed ? null : administeredDate,
        batchNumber: completed ? `DEMO-${String(patientIndex + 1).padStart(4, "0")}` : null,
        administeredBy: completed ? "Seeded clinic staff" : null,
        facility: completed ? "Demo pediatric clinic" : null,
        notes: "Synthetic sample record.",
      });
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.vaccinations).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} vaccination records ensured`);
}

async function seedMilestones(patients: Array<{ id: string; dateOfBirth: string }>) {
  console.log("\n🧩 Seeding developmental milestone records…");

  const rows: (typeof schema.milestones.$inferInsert)[] = [];
  for (const patient of patients) {
    const ageAtReference = Math.max(0, ageMonths(patient.dateOfBirth, "2025-01-01"));
    for (const milestone of DEVELOPMENTAL_MILESTONES) {
      if (milestone.targetAgeMonths > Math.max(ageAtReference, 2)) continue;
      const achieved = milestone.targetAgeMonths <= ageAtReference;
      rows.push({
        id: stableId(`milestone:${patient.id}:${milestone.id}`),
        patientId: patient.id,
        milestoneId: milestone.id,
        isAchieved: achieved,
        achievedDate: achieved ? addMonths(patient.dateOfBirth, milestone.targetAgeMonths) : null,
        notes: "Synthetic sample record.",
      });
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.milestones).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} milestone records ensured`);
}

async function seedCertificates(
  patients: Array<{ id: string; firstName: string; lastName: string }>,
) {
  console.log("\n📄 Seeding sample certificates…");

  const rows = patients
    .filter((_, index) => index % 5 === 0)
    .map((patient) => ({
      id: stableId(`certificate:well-child:${patient.id}`),
      patientId: patient.id,
      issueDate: "2025-01-15",
      certificateType: "well-child",
      title: "Well-child visit summary",
      body: `This is a synthetic sample certificate for ${patient.firstName} ${patient.lastName}.`,
      issuedBy: "Demo pediatric clinic",
      notes: "For development and demonstration only.",
    })) satisfies (typeof schema.certificates.$inferInsert)[];

  await insertInChunks(rows, (part) =>
    db.insert(schema.certificates).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} sample certificates ensured`);
}

async function seedImmunizations(patients: Array<{ id: string; dateOfBirth: string }>) {
  console.log("\n🩹 Seeding immunization timeline records…");

  const rows: (typeof schema.immunizations.$inferInsert)[] = [];
  for (const [patientIndex, patient] of patients.entries()) {
    for (let doseIndex = 0; doseIndex < 2; doseIndex++) {
      const vaccine = VACCINE_CATALOG[(patientIndex + doseIndex * 2) % VACCINE_CATALOG.length];
      const given = (patientIndex + doseIndex) % 2 === 0;
      rows.push({
        id: stableId(`immunization:${patient.id}:${vaccine.id}`),
        patientId: patient.id,
        vaccineKey: vaccine.id,
        vaccineName: vaccine.label,
        doseNumber: doseIndex + 1,
        targetAgeMonths: vaccine.recommendedAgeMonths,
        status: given ? "given" : doseIndex === 0 ? "overdue" : "due",
        administeredDate: given
          ? new Date(addMonths(patient.dateOfBirth, vaccine.recommendedAgeMonths))
          : null,
        lotNumber: given ? `DEMO-LOT-${patientIndex + 1}` : null,
        site: given ? "Left thigh" : null,
        notes: "Synthetic sample record.",
      });
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.immunizations).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} immunization records ensured`);
}

// ---------------------------------------------------------------------------
// Diagnoses
// ---------------------------------------------------------------------------

async function seedDiagnoses(visitIds: string[]) {
  console.log("\n🩺 Seeding diagnoses…");

  const rows: (typeof schema.diagnoses.$inferInsert)[] = [];
  for (const visitId of visitIds) {
    const n = 1 + Math.floor(rand() * 3);
    const chosen = new Set<string>();
    let primaryAssigned = false;
    for (let i = 0; i < n; i++) {
      let code: string;
      do {
        code = pick(ICD_POOL).code;
      } while (chosen.has(code));
      chosen.add(code);
      const entry = ICD_POOL.find((e) => e.code === code);
      if (!entry) {
        throw new Error(`ICD code ${code} not found`);
      }
      rows.push({
        id: stableId(`dx:${visitId}:${code}`),
        visitId,
        icdCode: entry.code,
        description: entry.desc,
        type: primaryAssigned ? "secondary" : "primary",
      });
      primaryAssigned = true;
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.diagnoses).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} diagnoses ensured`);
}

// ---------------------------------------------------------------------------
// Prescriptions
// ---------------------------------------------------------------------------

async function seedPrescriptions(
  visitIds: string[],
  patientIdByVisitId: Map<string, string>,
  visitedAtByVisitId: Map<string, Date>,
) {
  console.log("\n💊 Seeding prescriptions…");

  const rows: (typeof schema.prescriptions.$inferInsert)[] = [];

  for (const visitId of visitIds) {
    if (rand() > 0.6) continue;
    const patientId = patientIdByVisitId.get(visitId);
    if (!patientId) continue;
    const prescribedAt = visitedAtByVisitId.get(visitId) ?? new Date();

    const n = 1 + Math.floor(rand() * 3);
    const chosen = new Set<string>();
    for (let i = 0; i < n; i++) {
      let d: (typeof DRUG_POOL)[number];
      do {
        d = pick(DRUG_POOL);
      } while (chosen.has(d.name));
      chosen.add(d.name);

      rows.push({
        id: stableId(`rx:${visitId}:${d.name}`),
        visitId,
        patientId,
        prescribedById: null,
        medicationName: d.name,
        dosage: d.dose,
        frequency: d.freq,
        durationDays: d.days,
        instructions: rand() < 0.4 ? "Complete the full course even if symptoms improve." : null,
        prescribedAt,
      });
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.prescriptions).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} prescriptions ensured`);
}

// ---------------------------------------------------------------------------
// Medical notes
// ---------------------------------------------------------------------------

async function seedMedicalNotes(visitIdsByPatient: Map<string, string[]>) {
  console.log("\n📝 Seeding medical notes…");

  const rows: (typeof schema.medicalNotes.$inferInsert)[] = [];
  for (const [patientId, patientVisitIds] of visitIdsByPatient) {
    if (rand() > 0.3) continue;
    const n = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const t = pick(NOTE_TEMPLATES);
      rows.push({
        id: stableId(`note:${patientId}:${t.title}:${i}`),
        patientId,
        visitId: patientVisitIds.length > 0 && rand() < 0.7 ? pick(patientVisitIds) : null,
        authorId: null,
        title: t.title,
        body: t.body,
      });
    }
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.medicalNotes).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} notes ensured`);
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

async function seedAuditLog(patientIds: string[], visitIds: string[]) {
  console.log("\n🔍 Seeding audit log…");

  const rows: (typeof schema.auditLog.$inferInsert)[] = [];

  for (const patientId of patientIds) {
    rows.push({
      id: stableId(`audit:create:patient:${patientId}`),
      actorId: null,
      action: "create",
      entity: "patient",
      entityId: patientId,
      metadata: { after: { seeded: true } },
    });
  }

  for (const visitId of visitIds) {
    rows.push({
      id: stableId(`audit:view:visit:${visitId}`),
      actorId: null,
      action: "view",
      entity: "visit",
      entityId: visitId,
      metadata: null,
    });
  }

  await insertInChunks(rows, (part) =>
    db.insert(schema.auditLog).values(part).onConflictDoNothing(),
  );
  console.log(`   ✔ ${rows.length} audit entries ensured`);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🌱 Seeding ${DB_PATH}`);
  const t0 = Date.now();

  await seedLms();
  await seedWhoGrowthStandards();
  await seedFormulary();
  await seedClinics();
  await seedUsers();
  await seedCatalogs();
  await seedPatients();

  const patientRows = await db
    .select({
      id: schema.patients.id,
      clinicId: schema.patients.clinicId,
      dateOfBirth: schema.patients.dateOfBirth,
      firstName: schema.patients.firstName,
      lastName: schema.patients.lastName,
    })
    .from(schema.patients);
  const patientIds = patientRows.map((r) => r.id);

  const visitRows = await db
    .select({
      id: schema.visits.id,
      patientId: schema.visits.patientId,
      visitedAt: schema.visits.visitedAt,
    })
    .from(schema.visits);

  const visitIds = visitRows.map((r) => r.id);
  const patientIdByVisitId = new Map(visitRows.map((r) => [r.id, r.patientId]));
  const visitedAtByVisitId = new Map(visitRows.map((r) => [r.id, r.visitedAt]));
  const visitIdsByPatient = new Map<string, string[]>();
  for (const visit of visitRows) {
    const visits = visitIdsByPatient.get(visit.patientId) ?? [];
    visits.push(visit.id);
    visitIdsByPatient.set(visit.patientId, visits);
  }

  await seedAppointments(patientRows);
  await seedVaccinations(patientRows);
  await seedMilestones(patientRows);
  await seedCertificates(patientRows);
  await seedImmunizations(patientRows);
  await seedDiagnoses(visitIds);
  await seedPrescriptions(visitIds, patientIdByVisitId, visitedAtByVisitId);
  await seedMedicalNotes(visitIdsByPatient);
  await seedAuditLog(patientIds, visitIds);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`\n✅ Seed complete in ${elapsed}s`);
}

main()
  .catch((err) => {
    console.error("\n❌ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDb();
  });
