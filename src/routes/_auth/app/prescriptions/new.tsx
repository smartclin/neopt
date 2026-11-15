import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod/v4";

import { PageHeader } from "@/components/blocks/page-header";
import { toast } from "@/components/ui/toast";
// ── composer components ───────────────────────────────────────────────
import { ComposerShell } from "@/features/prescriptions/composer/components/ComposerShell";
import { computeInteractions } from "@/features/prescriptions/composer/components/interactions";
import { findComposerDrug } from "@/features/prescriptions/composer/formulary";
// ── mutation ──────────────────────────────────────────────────────────
import { useSavePrescriptionMutation } from "@/features/prescriptions/composer/queries";
import type { PrescriptionComposerValues } from "@/features/prescriptions/composer/types";
// ── reads ─────────────────────────────────────────────────────────────
import {
  activePrescriptionsQuery,
  getPatientForComposerQueryOptions,
} from "@/features/prescriptions/queries";

export const Route = createFileRoute("/_auth/app/prescriptions/new")({
  validateSearch: z.object({
    patientId: z.uuid(),
    visitId: z.uuid(),
  }),
  component: NewPrescriptionPage,
});

const EMPTY: Omit<PrescriptionComposerValues, "patientId" | "visitId"> = {
  drugKey: "",
  medicationName: "",
  brandName: null,
  strength: 0,
  unit: "mg",
  frequency: "BID",
  durationDays: 5,
  instructions: null,
  mgPerKgPerDay: null,
  dosesPerDay: 2,
  weightKg: null,
  concentrationLabel: null,
};

function NewPrescriptionPage() {
  const { patientId, visitId } = Route.useSearch();
  const navigate = useNavigate();

  // ── reads ──────────────────────────────────────────────────────────
  const patientQ = useQuery(getPatientForComposerQueryOptions(patientId));
  const activeQ = useQuery(activePrescriptionsQuery(patientId));

  // ── mutation ───────────────────────────────────────────────────────
  const saveMutation = useSavePrescriptionMutation();

  // ── composer state ─────────────────────────────────────────────────
  const [values, setValues] = React.useState<PrescriptionComposerValues>({
    ...EMPTY,
    patientId,
    visitId,
  });

  React.useEffect(() => {
    setValues({ ...EMPTY, patientId, visitId });
  }, [patientId, visitId]);

  // Pre-fill weight from the patient record, but never clobber a value the
  // user typed. Runs once per loaded patient.
  const lastPrefilledPatientRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const weight = patientQ.data?.weightKg;
    if (!weight) return;
    if (lastPrefilledPatientRef.current === patientId) return;
    lastPrefilledPatientRef.current = patientId;
    setValues((v) => (v.weightKg == null ? { ...v, weightKg: weight } : v));
  }, [patientQ.data, patientId]);

  // ── loading / error states ─────────────────────────────────────────
  if (patientQ.isPending) {
    return <PageHeader description="Loading patient…" title="New prescription" />;
  }

  if (patientQ.isError || !patientQ.data) {
    return (
      <PageHeader
        description={
          patientQ.error instanceof Error ? patientQ.error.message : "Patient not found."
        }
        title="New prescription"
      />
    );
  }

  // ── derived ────────────────────────────────────────────────────────
  const onChange = (next: Partial<PrescriptionComposerValues>) =>
    setValues((v) => ({ ...v, ...next }));

  const interactionsUnavailable = activeQ.isError;
  const warnings = interactionsUnavailable
    ? [
        {
          severity: "amber" as const,
          title: "Interaction check unavailable",
          detail:
            "The patient's active prescriptions could not be loaded. Verify interactions manually before saving.",
        },
      ]
    : computeInteractions({
        drug: values.drugKey ? findComposerDrug(values.drugKey) : undefined,
        allergies: patientQ.data.allergies,
        active: activeQ.data ?? [],
      });

  // ── handlers ───────────────────────────────────────────────────────
  const runSave = (shouldPrint: boolean) => {
    saveMutation.mutate(values, {
      onSuccess: (row) => {
        toast.add({
          type: "success",
          description: "Prescription saved",
        });
        // Navigate first, then print from the detail page so the
        // print dialog shows the saved prescription, not the
        // composer.
        void navigate({
          to: "/app/prescriptions/$prescriptionId",
          params: { prescriptionId: row.id },
          search: shouldPrint ? { print: true } : undefined,
        });
      },
      onError: (err: unknown) => {
        toast.add({
          type: "destructive",
          description: err instanceof Error ? err.message : "Failed to save prescription",
        });
      },
    });
  };

  // ── render ─────────────────────────────────────────────────────────
  return (
    <ComposerShell
      isSaving={saveMutation.isPending}
      mode="create"
      onChange={onChange}
      onSave={() => runSave(false)}
      onSaveAndPrint={() => runSave(true)}
      patient={patientQ.data}
      previous={[]}
      subtitle="Write a new prescription. Weight, dosing, and interactions update live."
      title="New prescription"
      values={values}
      warnings={warnings}
    />
  );
}
