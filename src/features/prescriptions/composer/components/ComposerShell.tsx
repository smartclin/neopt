import { Link } from "@tanstack/react-router";
import { PrinterIcon, SaveIcon, XIcon } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/blocks/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { ComposerUnit, PrescriptionComposerValues } from "../types";

import { findComposerDrug } from "../formulary";
import { DoseRow } from "./DoseRow";
import { FrequencyDurationRow } from "./FrequencyDurationRow";
import { InstructionsField } from "./InstructionsField";
import { MedicationAutocomplete } from "./MedicationAutocomplete";
import { type PatientContext, PatientContextCard } from "./PatientContextCard";
import { type InteractionWarning, SafetyRail } from "./SafetyRail";

export interface ComposerShellProps {
  mode: "create" | "edit" | "view";
  patient: PatientContext;
  values: PrescriptionComposerValues;
  onChange: (next: Partial<PrescriptionComposerValues>) => void;
  warnings: InteractionWarning[];
  previous: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    prescribedAt: Date;
    status: string;
  }>;
  onSave: () => Promise<void> | void;
  onSaveAndPrint: () => Promise<void> | void;
  onDiscontinue?: () => Promise<void> | void;
  isSaving?: boolean;
  title: string;
  subtitle: string;
}

export function ComposerShell({
  mode,
  patient,
  values,
  onChange,
  warnings,
  previous,
  onSave,
  onSaveAndPrint,
  onDiscontinue,
  isSaving,
  title,
  subtitle,
}: ComposerShellProps) {
  const drug = useMemo(
    () => (values.drugKey ? findComposerDrug(values.drugKey) : undefined),
    [values.drugKey],
  );
  const readOnly = mode === "view";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          mode === "view" ? (
            <div className="flex flex-wrap gap-2">
              <Button nativeButton onClick={() => void onSaveAndPrint()} variant="outline">
                <PrinterIcon /> Print
              </Button>
              <Button nativeButton onClick={() => void onSave()}>
                <SaveIcon /> Renew
              </Button>
              {onDiscontinue && (
                <Button nativeButton onClick={() => void onDiscontinue()} variant="destructive">
                  <XIcon /> Discontinue
                </Button>
              )}
            </div>
          ) : null
        }
        description={subtitle}
        title={title}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: composer */}
        <section className="flex min-w-0 flex-col gap-4">
          <PatientContextCard
            mode={mode}
            onWeightChange={(kg) => onChange({ weightKg: kg })}
            patient={patient}
            weightKg={values.weightKg ?? patient.weightKg}
          />

          <Separator />

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="composer-med">
              Medication
            </label>
            <MedicationAutocomplete
              disabled={readOnly}
              onSelect={(d) =>
                onChange({
                  drugKey: d.key,
                  medicationName: d.genericName,
                  brandName: d.brandNames[0] ?? null,
                  mgPerKgPerDay: d.dosing.mgPerKgPerDay ?? null,
                  dosesPerDay: d.dosing.dosesPerDay,
                })
              }
              value={values.medicationName}
            />
          </div>

          <Separator />

          <DoseRow
            concentrationIndex={0}
            dosesPerDay={values.dosesPerDay ?? null}
            drug={drug}
            mgPerKgPerDay={values.mgPerKgPerDay ?? null}
            onChange={(next) => onChange(next)}
            strength={values.strength}
            unit={values.unit as ComposerUnit}
            useCalc={Boolean(values.mgPerKgPerDay)}
            weightKg={values.weightKg ?? patient.weightKg}
          />

          <FrequencyDurationRow
            durationDays={values.durationDays}
            frequency={values.frequency}
            onChange={(next) => onChange(next)}
          />

          <InstructionsField
            onChange={(v) => onChange({ instructions: v || null })}
            value={values.instructions ?? ""}
          />

          {!readOnly && (
            <div className="bg-background/95 sticky bottom-0 -mx-6 flex flex-wrap items-center justify-end gap-2 border-t px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
              <Button
                nativeButton={false}
                render={
                  <Link search={{ status: "all", page: 1, size: 20 }} to="/app/prescriptions" />
                }
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={isSaving}
                nativeButton
                onClick={() => void onSave()}
                variant="outline"
              >
                Save draft
              </Button>
              <Button disabled={isSaving} nativeButton onClick={() => void onSaveAndPrint()}>
                {isSaving ? "Saving…" : "Save & print"}
              </Button>
            </div>
          )}
        </section>

        {/* Right: safety rail */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <SafetyRail drug={drug} mode={mode} previous={previous} warnings={warnings} />
        </aside>
      </div>
    </div>
  );
}
