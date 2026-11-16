// src/db/queries/search.queries.ts
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { SearchCategory, SearchResponse, SearchResult } from "@/features/search/schema";

import { db } from "@/db";
import { diagnoses, patients, prescriptions, visits } from "@/db/schema";
import { formatDate, formatTime } from "@/lib/dates";

const PATIENT_LIMIT = 8;
const APPOINTMENT_LIMIT = 5;
const PRESCRIPTION_LIMIT = 5;
const DIAGNOSIS_LIMIT = 5;
// const MEASUREMENT_LIMIT = 0; // off by default — no free-text fields

interface Args {
  clinicId: string;
  query: string;
  categories?: SearchCategory[];
  limit: number;
}

function wants(all: SearchCategory[] | undefined, cat: SearchCategory) {
  return !all || all.includes(cat);
}

export async function searchAcrossEntities({
  clinicId,
  query,
  categories,
  limit,
}: Args): Promise<SearchResponse> {
  const started = performance.now();
  const q = `%${query}%`;

  const [patientHits, apptHits, rxHits, dxHits] = await Promise.all([
    wants(categories, "patient")
      ? db
          .select({
            id: patients.id,
            mrn: patients.mrn,
            firstName: patients.firstName,
            lastName: patients.lastName,
            dob: patients.dateOfBirth,
            phone: patients.phone,
          })
          .from(patients)
          .where(
            and(
              eq(patients.clinicId, clinicId),
              or(
                ilike(patients.mrn, q),
                ilike(patients.firstName, q),
                ilike(patients.lastName, q),
                ilike(sql`${patients.firstName} || ' ' || ${patients.lastName}`, q),
                ilike(patients.phone, q),
              ),
            ),
          )
          .orderBy(
            // exact MRN match ranks first
            sql`case when ${patients.mrn} = ${query} then 0 else 1 end`,
            patients.lastName,
          )
          .limit(PATIENT_LIMIT)
      : [],

    wants(categories, "appointment")
      ? db.query.appointments.findMany({
          where: {
            clinicId: clinicId, // equality shorthand
            scheduledAt: { gte: new Date(Date.now() - 90 * 86_400_000) },
          },
          with: { patient: true },
          orderBy: { scheduledAt: "desc" },
          limit: APPOINTMENT_LIMIT * 4,
        })
      : [],

    wants(categories, "prescription")
      ? db
          .select({
            id: prescriptions.id,
            medicationName: prescriptions.medicationName,
            dosage: prescriptions.dosage,
            patientId: prescriptions.patientId,
            patientFirst: patients.firstName,
            patientLast: patients.lastName,
            prescribedAt: prescriptions.prescribedAt,
          })
          .from(prescriptions)
          .innerJoin(patients, eq(patients.id, prescriptions.patientId))
          .where(and(eq(patients.clinicId, clinicId), ilike(prescriptions.medicationName, q)))
          .orderBy(desc(prescriptions.prescribedAt))
          .limit(PRESCRIPTION_LIMIT)
      : [],

    wants(categories, "diagnosis")
      ? db
          .select({
            id: diagnoses.id,
            icdCode: diagnoses.icdCode,
            description: diagnoses.description,
            visitId: diagnoses.visitId,
            patientId: visits.patientId,
            patientFirst: patients.firstName,
            patientLast: patients.lastName,
          })
          .from(diagnoses)
          .innerJoin(visits, eq(visits.id, diagnoses.visitId))
          .innerJoin(patients, eq(patients.id, visits.patientId))
          .where(
            and(
              eq(patients.clinicId, clinicId),
              or(ilike(diagnoses.icdCode, q), ilike(diagnoses.description, q)),
            ),
          )
          .limit(DIAGNOSIS_LIMIT)
      : [],
  ]);

  const results: SearchResult[] = [];
  const lower = query.toLowerCase();

  // ── Patients
  for (const p of patientHits) {
    results.push({
      category: "patient",
      id: p.id,
      title: `${p.firstName} ${p.lastName}`,
      subtitle: `MRN ${p.mrn}`,
      href: `/app/patients/${p.id}?tab=overview`,
      score: p.mrn.toLowerCase() === lower ? 100 : 70,
      meta: { phone: p.phone },
    });
  }
  // ── Appointments (filter in-memory: we over-fetched)
  const apptResults = apptHits
    .filter((a) => {
      const name = `${a.patient?.firstName ?? ""} ${a.patient?.lastName ?? ""}`;
      return (
        name.toLowerCase().includes(lower) || (a.reason?.toLowerCase().includes(lower) ?? false)
      );
    })
    .slice(0, APPOINTMENT_LIMIT);
  for (const a of apptResults) {
    const when = new Date(a.scheduledAt);
    results.push({
      category: "appointment",
      id: a.id,
      title: `${a.patient?.firstName ?? "?"} ${a.patient?.lastName ?? ""} — ${formatDate(when)}`,
      subtitle: a.reason ?? null,
      href: `/app/appointments?date=${when.toISOString().slice(0, 10)}`,
      score: 50,
      meta: {
        time: formatTime(when),
      },
    });
  }

  // ── Prescriptions
  for (const r of rxHits) {
    results.push({
      category: "prescription",
      id: r.id,
      title: r.medicationName,
      subtitle: `${r.dosage} · ${r.patientFirst} ${r.patientLast}`,
      href: `/app/patients/${r.patientId}?tab=prescriptions`,
      score: 60,
    });
  }

  // ── Diagnoses
  for (const d of dxHits) {
    results.push({
      category: "diagnosis",
      id: d.id,
      title: `${d.icdCode} · ${d.description}`,
      subtitle: `${d.patientFirst} ${d.patientLast}`,
      href: `/app/patients/${d.patientId}?tab=diagnoses`,
      score: d.icdCode.toLowerCase() === lower ? 90 : 55,
    });
  }

  // Rank: score desc, then patients > meds > dx > appts
  const catWeight: Record<SearchCategory, number> = {
    patient: 4,
    prescription: 3,
    diagnosis: 2,
    appointment: 1,
    measurement: 0,
  };
  results.sort(
    (a, b) =>
      b.score - a.score ||
      catWeight[b.category] - catWeight[a.category] ||
      a.title.localeCompare(b.title),
  );

  const byCategory = results.reduce<Record<SearchCategory, number>>(
    (acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<SearchCategory, number>,
  );
  return {
    query,
    results: results.slice(0, limit),
    byCategory,
    elapsedMs: Math.round(performance.now() - started),
  };
}
