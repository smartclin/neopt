import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

import { and, db, desc, eq, ilike, isNull, or } from "#/db/index.ts";
import { measurements, measurementIndicators, patients, prescriptions } from "#/db/schema.ts";

const noInputSchema = z.strictObject({});

export function createAssistantTools(clinicId: string, patientId?: string) {
  const listPatients = toolDefinition({
    name: "list_patients",
    description: "Search the clinic roster by patient name or MRN. Returns names only.",
    inputSchema: z.object({
      query: z.string().trim().min(1).max(120).optional().describe("Partial name or MRN"),
      limit: z.number().int().min(1).max(10).default(5),
    }),
  }).server(async ({ query, limit }) => {
    const conditions = [
      eq(patients.clinicId, clinicId),
      eq(patients.isActive, true),
      isNull(patients.deletedAt),
    ];
    if (query) {
      conditions.push(
        or(
          ilike(patients.firstName, `%${query}%`),
          ilike(patients.lastName, `%${query}%`),
          ilike(patients.mrn, `%${query}%`),
        )!,
      );
    }

    const rows = await db
      .select({
        firstName: patients.firstName,
        lastName: patients.lastName,
      })
      .from(patients)
      .where(and(...conditions))
      .limit(limit ?? 5);
    return rows;
  });

  if (!patientId) return [listPatients];

  const getPatientHistory = toolDefinition({
    name: "get_patient_history",
    description: "Recent visit summaries and diagnoses for the selected patient.",
    inputSchema: noInputSchema,
  }).server(async () => {
    return db.query.visits.findMany({
      where: { patientId, clinicId },
      orderBy: { visitedAt: "desc" },
      limit: 5,
      columns: {
        visitedAt: true,
        ageMonths: true,
        chiefComplaint: true,
        diagnosis: true,
        symptoms: true,
        plan: true,
      },
      with: {
        diagnoses: {
          columns: {
            icdCode: true,
            description: true,
            type: true,
          },
        },
      },
    });
  });

  const listActivePrescriptions = toolDefinition({
    name: "list_active_prescriptions",
    description:
      "List active, already-prescribed medications for the selected patient. Do not recommend or change doses.",
    inputSchema: noInputSchema,
  }).server(async () => {
    const rows = await db
      .select({
        medicationName: prescriptions.medicationName,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        durationDays: prescriptions.durationDays,
        prescribedAt: prescriptions.prescribedAt,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(
        and(
          eq(prescriptions.patientId, patientId),
          eq(prescriptions.status, "active"),
          eq(patients.clinicId, clinicId),
        ),
      )
      .orderBy(desc(prescriptions.prescribedAt))
      .limit(20);
    return rows;
  });

  const getGrowthSummary = toolDefinition({
    name: "get_growth_summary",
    description:
      "Latest documented measurement per indicator for the selected patient, including stored z-score and classification.",
    inputSchema: noInputSchema,
  }).server(async () => {
    const latestByIndicator = await Promise.all(
      measurementIndicators.map(async (indicator) => {
        const [row] = await db
          .select({
            indicator: measurements.indicator,
            value: measurements.value,
            measuredAt: measurements.measuredAt,
            zScore: measurements.zScore,
            percentile: measurements.percentile,
            classification: measurements.classification,
          })
          .from(measurements)
          .innerJoin(patients, eq(measurements.patientId, patients.id))
          .where(
            and(
              eq(measurements.patientId, patientId),
              eq(measurements.indicator, indicator),
              eq(patients.clinicId, clinicId),
            ),
          )
          .orderBy(desc(measurements.measuredAt))
          .limit(1);
        return row;
      }),
    );

    return latestByIndicator.filter((measurement) => measurement !== undefined);
  });

  return [getPatientHistory, listActivePrescriptions, getGrowthSummary];
}
