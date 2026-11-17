import { NEONATAL_PEDIATRIC_FORMULARY } from "@data/formulary/neonatalDrugs";
import { AlertCircle, Calculator, Check } from "lucide-react";
import { useMemo, useState } from "react";

import type { DrugFormularyItem } from "@/features/medications/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { NeonatalDoseCalculation } from "../lib/neonatal-dosing";

import { calculateNeonatalDose } from "../lib/neonatal-dosing";

interface DosingCalculatorProps {
  initialWeightKg?: number;
  standalone?: boolean;
  onApplyToPrescription?: (prescription: {
    medicationName: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }) => void;
}

const NICU_DRUGS = NEONATAL_PEDIATRIC_FORMULARY.filter(
  (drug) => drug.doseUnit.startsWith("mg/kg/") || drug.doseUnit.startsWith("mcg/kg/"),
);

function formatDose(value: number, digits = 2): string {
  return Number(value.toFixed(digits)).toString();
}

function dosesPerDayFromFrequency(frequency: string): number | null {
  const intervalHours = frequency.match(/\bq(\d+(?:\.\d+)?)\s*h\b/i);
  if (intervalHours) return 24 / Number(intervalHours[1]);
  if (/\bonce daily\b/i.test(frequency)) return 1;
  if (/\btwice daily\b/i.test(frequency)) return 2;
  if (/\bthree times daily\b/i.test(frequency)) return 3;
  if (/\bfour times daily\b/i.test(frequency)) return 4;
  return null;
}

export function PediatricDosingCalculator({
  initialWeightKg,
  standalone = false,
  onApplyToPrescription,
}: DosingCalculatorProps) {
  const [drugId, setDrugId] = useState(NICU_DRUGS[0]?.id ?? "");
  const [weight, setWeight] = useState(initialWeightKg ? String(initialWeightKg) : "");
  const [dose, setDose] = useState(
    String(NICU_DRUGS.find((drug) => drug.id === drugId)?.standardDose ?? ""),
  );
  const [route, setRoute] = useState<DrugFormularyItem["routes"][number] | "">("");
  const [concentrationId, setConcentrationId] = useState("");
  const [frequency, setFrequency] = useState(
    NICU_DRUGS.find((drug) => drug.id === drugId)?.frequency ?? "",
  );
  const [dosesPerDay, setDosesPerDay] = useState(
    String(NICU_DRUGS.find((drug) => drug.id === drugId)?.dosesPerDay ?? 1),
  );
  const [postnatalAgeDays, setPostnatalAgeDays] = useState("");
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState("");
  const [capConfirmed, setCapConfirmed] = useState(false);

  const drug = useMemo(() => NICU_DRUGS.find((item) => item.id === drugId), [drugId]);
  const availableRoutes = drug?.routes ?? [];
  const selectedRoute = route && availableRoutes.includes(route) ? route : availableRoutes[0];
  const concentrations = drug?.concentrations.filter((item) => item.route === selectedRoute) ?? [];
  const concentration =
    concentrations.find((item) => item.id === concentrationId) ??
    concentrations.find((item) => item.isDefault) ??
    concentrations[0];

  const weightKg = Number(weight);
  const dosePerKg = Number(dose);
  const dailyFrequency = Number(dosesPerDay);
  const calculation = useMemo<{
    result: NeonatalDoseCalculation | null;
    error: string | null;
  }>(() => {
    if (!drug || !concentration || !Number.isFinite(weightKg) || weightKg <= 0) {
      return { result: null, error: null };
    }
    try {
      return {
        result: calculateNeonatalDose({
          drug,
          weightKg,
          dosePerKg,
          dosesPerDay: dailyFrequency,
          concentration,
        }),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [concentration, dailyFrequency, dosePerKg, drug, weightKg]);
  const { result } = calculation;

  const changeDrug = (nextId: string | null) => {
    if (!nextId) return;
    const nextDrug = NICU_DRUGS.find((item) => item.id === nextId);
    if (!nextDrug) return;
    setDrugId(nextId);
    setDose(String(nextDrug.standardDose));
    setRoute(nextDrug.routes[0] ?? "");
    setConcentrationId("");
    setFrequency(nextDrug.frequency);
    setDosesPerDay(String(nextDrug.dosesPerDay));
  };

  const applyPrescription = () => {
    if (!drug || !concentration || !result || !onApplyToPrescription) return;
    const unit = drug.doseUnit.startsWith("mcg/") ? "mcg" : "mg";
    const doseText = `${formatDose(result.singleDoseMg * (unit === "mcg" ? 1000 : 1))} ${unit}`;
    const volumeText = `${formatDose(result.volumeMlPerDose, 3)} mL`;
    onApplyToPrescription({
      medicationName: `${drug.genericName} (${selectedRoute})`,
      dosage: `${doseText} per dose (${volumeText})`,
      frequency: frequency.trim(),
      instructions: [
        `Calculated from ${formatDose(weightKg)} kg using ${formatDose(dosePerKg)} ${drug.doseUnit}.`,
        result.isCapped ? "A formulary maximum-dose limit was applied and reviewed." : "",
        `Selected preparation: ${concentration.label}.`,
        drug.dilutionGuideline,
        "Confirm the dose and interval against the current NICU protocol, indication, postnatal and gestational age, renal function, and therapeutic drug monitoring requirements.",
      ]
        .filter(Boolean)
        .join(" "),
    });
  };
  const frequencyNeedsReview = /\bor\b|[-–—;]|\b\d+\s+to\s+\d+\b|loading dose/i.test(frequency);
  const scheduleReady = Boolean(frequency.trim()) && !frequencyNeedsReview;

  return (
    <details className="rounded-md border" open={standalone}>
      <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-medium">
        <Calculator aria-hidden="true" className="text-primary size-4" />
        NICU dose calculator
        <Badge className="ml-auto" variant="outline">
          Verify before prescribing
        </Badge>
      </summary>
      <div className="space-y-4 border-t p-3">
        <p className=" text-sm">
          Uses the neonatal formulary dose range and selected preparation to calculate an arithmetic
          dose and volume. It does not choose an age-dependent interval or replace NICU protocols.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label htmlFor="nicu-drug">Medication</Label>
            <Select onValueChange={changeDrug} value={drugId}>
              <SelectTrigger id="nicu-drug">
                <SelectValue placeholder="Select neonatal medication" />
              </SelectTrigger>
              <SelectContent>
                {NICU_DRUGS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nicu-weight">Dosing weight (kg)</Label>
            <Input
              id="nicu-weight"
              max="30"
              min="0.1"
              onChange={(event) => setWeight(event.target.value)}
              step="0.01"
              type="number"
              value={weight}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nicu-age-days">Postnatal age (days, context only)</Label>
            <Input
              id="nicu-age-days"
              min="0"
              onChange={(event) => setPostnatalAgeDays(event.target.value)}
              step="1"
              type="number"
              value={postnatalAgeDays}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nicu-frequency">Selected frequency / interval</Label>
            <Input
              id="nicu-frequency"
              onChange={(event) => {
                const nextFrequency = event.target.value;
                setFrequency(nextFrequency);
                const inferred = dosesPerDayFromFrequency(nextFrequency);
                if (inferred !== null) setDosesPerDay(String(inferred));
              }}
              placeholder="Select one schedule, e.g. q12h"
              value={frequency}
            />
            {frequencyNeedsReview && (
              <p className="text-xs text-warning dark:text-warning">
                This reference contains alternate schedules. Select and enter the clinically
                appropriate interval before transferring the dose.
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nicu-doses-per-day">Doses per day for daily-limit checks</Label>
            <Input
              id="nicu-doses-per-day"
              max="24"
              min="0.1"
              onChange={(event) => setDosesPerDay(event.target.value)}
              step="0.01"
              type="number"
              value={dosesPerDay}
            />
            <p className=" text-xs">
              Match this value to the selected interval (for example, q12h = 2 doses/day). For
              irregular intervals, enter the appropriate daily average from your protocol.
            </p>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="nicu-ga">Gestational age at birth (weeks, context only)</Label>
            <Input
              id="nicu-ga"
              max="45"
              min="20"
              onChange={(event) => setGestationalAgeWeeks(event.target.value)}
              step="0.1"
              type="number"
              value={gestationalAgeWeeks}
            />
          </div>
          {drug && (
            <div className="grid gap-1">
              <Label htmlFor="nicu-dose">
                Dose ({drug.doseUnit}; range {drug.minDose}–{drug.maxDose})
              </Label>
              <Input
                id="nicu-dose"
                max={drug.maxDose}
                min={drug.minDose}
                onChange={(event) => setDose(event.target.value)}
                step="any"
                type="number"
                value={dose}
              />
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="nicu-route">Route</Label>
            <Select
              onValueChange={(value) => {
                if (value && availableRoutes.includes(value as (typeof availableRoutes)[number])) {
                  setRoute(value as (typeof availableRoutes)[number]);
                  setConcentrationId("");
                }
              }}
              value={selectedRoute}
            >
              <SelectTrigger id="nicu-route">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                {availableRoutes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="nicu-concentration">Preparation</Label>
            <Select
              onValueChange={(value) => value && setConcentrationId(value)}
              value={concentration?.id}
            >
              <SelectTrigger id="nicu-concentration">
                <SelectValue placeholder="Select preparation" />
              </SelectTrigger>
              <SelectContent>
                {concentrations.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {calculation.error && (
          <p className="text-destructive text-sm" role="alert">
            {calculation.error}
          </p>
        )}

        {result && !scheduleReady && (
          <p className="rounded-md bg-warning/10 p-3 text-sm text-warning dark:text-warning">
            Select one dosing interval and confirm the doses-per-day value to see the calculated
            per-dose amount. The reference schedule contains alternatives.
          </p>
        )}

        {result && scheduleReady && drug && concentration && (
          <div className="bg-muted/40 space-y-3 rounded-md p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className=" text-xs uppercase">Calculated amount per dose</p>
                <p className="text-xl font-semibold">
                  {formatDose(result.singleDoseMg * (drug.doseUnit.startsWith("mcg/") ? 1000 : 1))}{" "}
                  {drug.doseUnit.startsWith("mcg/") ? "mcg" : "mg"}
                  <span className=" ml-2 text-base font-normal">
                    ({formatDose(result.volumeMlPerDose, 3)} mL)
                  </span>
                </p>
              </div>
              <p className="text-sm">
                {frequency} · {selectedRoute}
              </p>
            </div>
            <p className=" text-sm">
              Estimated total per 24 hours: {formatDose(result.dailyDoseMg)} mg at{" "}
              {formatDose(dailyFrequency)} doses/day.
            </p>
            {result.isCapped && (
              <p className="flex items-start gap-2 text-sm text-warning dark:text-warning">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                Maximum daily or single-dose limit applied. Verify this adjustment.
              </p>
            )}
            <div className=" space-y-1 text-sm">
              <p>{drug.indication}</p>
              {drug.dilutionGuideline && <p>{drug.dilutionGuideline}</p>}
              {Object.values(drug.safetyWarnings)
                .filter((warning): warning is string => Boolean(warning))
                .map((warning) => (
                  <p className="text-warning dark:text-warning" key={warning}>
                    {warning}
                  </p>
                ))}
            </div>
            {onApplyToPrescription && (
              <Button
                className="w-full"
                disabled={Boolean(result.isCapped && !capConfirmed)}
                onClick={applyPrescription}
                type="button"
                variant="outline"
              >
                <Check aria-hidden="true" className="mr-2 size-4" />
                Add calculated dose to prescription
              </Button>
            )}
            {result.isCapped && onApplyToPrescription && (
              <Button
                aria-pressed={capConfirmed}
                onClick={() => setCapConfirmed((confirmed) => !confirmed)}
                type="button"
                variant={capConfirmed ? "secondary" : "outline"}
              >
                {capConfirmed ? "Capped dose verified" : "Confirm capped dose was reviewed"}
              </Button>
            )}
          </div>
        )}
        {postnatalAgeDays && gestationalAgeWeeks && (
          <p className=" text-xs">
            Patient context entered: postnatal day {postnatalAgeDays}, gestational age{" "}
            {gestationalAgeWeeks} weeks. These values are not used to select or change the dose
            interval.
          </p>
        )}
      </div>
    </details>
  );
}
