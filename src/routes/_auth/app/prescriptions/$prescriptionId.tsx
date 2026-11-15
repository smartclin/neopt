import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v4";

import { PageHeader } from "@/components/blocks/page-header";
import { toast } from "@/components/ui/toast";
// ── composer components ───────────────────────────────────────────────
import { ComposerShell } from "@/features/prescriptions/composer/components/ComposerShell";
import { computeInteractions } from "@/features/prescriptions/composer/components/interactions";
import { findComposerDrug } from "@/features/prescriptions/composer/formulary";
// ── mutations (hooks) ─────────────────────────────────────────────────
import {
  useDiscontinuePrescriptionMutation,
  useSavePrescriptionMutation,
} from "@/features/prescriptions/composer/queries";
import type {
  ComposerUnit,
  PrescriptionComposerValues,
} from "@/features/prescriptions/composer/types";
// ── reads ─────────────────────────────────────────────────────────────
import {
  activePrescriptionsQuery,
  getPatientForComposerQueryOptions,
  prescriptionByIdQuery,
} from "@/features/prescriptions/queries";

export const Route = createFileRoute("/_auth/app/prescriptions/$prescriptionId")({
  validateSearch: z.object({
    edit: z.coerce.boolean().optional(),
    print: z.coerce.boolean().optional(),
  }),
  component: PrescriptionDetailPage,
});

// ── helpers ─────────────────────────────────────────────────────────────

/** Parsed dose: numeric value + canonical unit. */
interface ParsedDose {
  value: number;
  unit: ComposerUnit;
}

const DOSE_PATTERN = /^\s*([\d.]+)\s*(mg|mL|mcg|g|units?)\b/i;

/**
 * Parse a free-form dosage string ("2.5 mL", "10 mg", "0.5 mcg")
 * into { value, unit }. Falls back to { 0, "mg" } for unparseable
 * input so the composer still renders — but never silently assumes
 * "mg" when the source says something else.
 */
function parseDose(dosage: string): ParsedDose {
  const match = DOSE_PATTERN.exec(dosage);
  if (!match) return { value: 0, unit: "mg" };
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return { value: 0, unit: "mg" };
  const raw = match[2].toLowerCase();
  const unit: ParsedDose["unit"] =
    raw === "ml"
      ? "mL"
      : raw === "mcg"
        ? "mcg"
        : raw === "g"
          ? "g"
          : raw.startsWith("unit")
            ? "units"
            : "mg";
  return { value, unit };
}

function toComposerValues(row: {
  patientId: string;
  visitId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
}): PrescriptionComposerValues {
  // SAFETY-REVIEW: unit preservation — do not default to "mg" for
  // non-mg dosages. See parseDose above.
  const dose = parseDose(row.dosage);
  return {
    patientId: row.patientId,
    visitId: row.visitId,
    drugKey: "",
    medicationName: row.medicationName,
    brandName: null,
    strength: dose.value,
    unit: dose.unit,
    frequency: row.frequency,
    durationDays: row.durationDays,
    instructions: row.instructions,
    mgPerKgPerDay: null,
    dosesPerDay: null,
    weightKg: null,
    concentrationLabel: null,
  };
}

// ── page ────────────────────────────────────────────────────────────────

function PrescriptionDetailPage() {
  const { prescriptionId } = Route.useParams();
  const { edit = false, print = false } = Route.useSearch();
  const navigate = useNavigate();

  // ── reads ──────────────────────────────────────────────────────────
  const detail = useQuery(prescriptionByIdQuery(prescriptionId));
  const patientId = detail.data?.patientId;

  const patientQ = useQuery({
    ...getPatientForComposerQueryOptions(patientId ?? ""),
    enabled: Boolean(patientId),
  });

  const activeQ = useQuery({
    ...activePrescriptionsQuery(patientId ?? ""),
    enabled: Boolean(patientId),
  });

  // ── mutations ──────────────────────────────────────────────────────
  const saveMutation = useSavePrescriptionMutation();
  const discontinueMutation = useDiscontinuePrescriptionMutation();

  // ── local composer state ───────────────────────────────────────────
  const [values, setValues] = useState<PrescriptionComposerValues | null>(null);

  // Track which prescription we've initialized for, so a refetch of
  // `detail` doesn't reset the user's in-progress edits.
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    if (initializedFor.current === detail.data.id) return;
    initializedFor.current = detail.data.id;
    setValues(toComposerValues(detail.data));
  }, [detail.data]);

  // ── print effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (!print) return;
    const id = requestAnimationFrame(() => {
      window.print();
      void navigate({
        to: "/app/prescriptions/$prescriptionId",
        params: { prescriptionId },
        search: { edit: edit || undefined },
      });
    });
    return () => cancelAnimationFrame(id);
  }, [print, edit, prescriptionId, navigate]);

  // ── loading / error states ─────────────────────────────────────────
  if (detail.isPending || !values) {
    return <PageHeader description="Loading…" title="Prescription" />;
  }

  if (detail.isError || !detail.data) {
    return (
      <PageHeader
        description={
          detail.error instanceof Error ? detail.error.message : "Prescription not found."
        }
        title="Prescription"
      />
    );
  }

  if (!patientQ.data) {
    return <PageHeader description="Patient not found." title="Prescription" />;
  }

  // ── derived ────────────────────────────────────────────────────────
  const mode = edit ? "edit" : "view";

  const onChange = (next: Partial<PrescriptionComposerValues>) =>
    setValues((v) => (v ? { ...v, ...next } : v));

  const drug = values.drugKey ? findComposerDrug(values.drugKey) : undefined;
  const warnings = computeInteractions({
    drug,
    allergies: patientQ.data.allergies,
    active: (activeQ.data ?? []).filter((m) => m.id !== prescriptionId),
  });

  // ── handlers ───────────────────────────────────────────────────────
  const runSave = (shouldPrint: boolean) => {
    saveMutation.mutate(
      { ...values, prescriptionId },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            description: "Prescription updated",
          });
          void navigate({
            to: "/app/prescriptions/$prescriptionId",
            params: { prescriptionId },
            search: shouldPrint ? { print: true } : { edit: edit || undefined },
          });
        },
        onError: (err: unknown) => {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to save",
          });
        },
      },
    );
  };

  const runDiscontinue = () => {
    discontinueMutation.mutate(
      { prescriptionId },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            description: "Prescription discontinued",
          });
          void navigate({
            to: "/app/prescriptions",
            search: { status: "all", page: 1, size: 20 },
          });
        },
        onError: (err: unknown) => {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to discontinue",
          });
        },
      },
    );
  };

  // ── render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <ComposerShell
        isSaving={saveMutation.isPending}
        mode={mode}
        onChange={onChange}
        onDiscontinue={mode === "view" ? runDiscontinue : undefined}
        onSave={() => runSave(false)}
        onSaveAndPrint={() => runSave(true)}
        patient={patientQ.data}
        previous={(activeQ.data ?? []).filter((m) => m.id !== prescriptionId)}
        subtitle={`Prescription ${prescriptionId.slice(0, 8)} — ${mode === "edit" ? "editing" : "read-only"}.`}
        title={detail.data.medicationName}
        values={values}
        warnings={warnings}
      />
      <footer className="text-muted-foreground border-t pt-4 text-xs">
        <p>
          Created {new Date(detail.data.prescribedAt).toLocaleString()} · Last updated{" "}
          {new Date(detail.data.prescribedAt).toLocaleString()}
        </p>
      </footer>
    </div>
  );
}
