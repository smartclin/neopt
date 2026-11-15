import type { DrugFormularyItem } from "@/features/medications/types";

export interface NeonatalDoseCalculation {
  dosePerKg: number;
  dosesPerDay: number;
  singleDoseMg: number;
  dailyDoseMg: number;
  volumeMlPerDose: number;
  isCapped: boolean;
}

export function calculateNeonatalDose(input: {
  drug: DrugFormularyItem;
  weightKg: number;
  dosePerKg: number;
  dosesPerDay: number;
  concentration: DrugFormularyItem["concentrations"][number];
}): NeonatalDoseCalculation {
  const { drug, weightKg, dosePerKg, dosesPerDay, concentration } = input;

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error("Enter a valid weight greater than zero.");
  }
  if (!Number.isFinite(dosePerKg) || dosePerKg <= 0) {
    throw new Error("Enter a valid dose greater than zero.");
  }
  if (dosePerKg < drug.minDose || dosePerKg > drug.maxDose) {
    throw new Error(
      `Dose must be within the formulary range of ${drug.minDose}–${drug.maxDose} ${drug.doseUnit}.`,
    );
  }
  if (
    !drug.concentrations.some(
      (item) => item.id === concentration.id && item.route === concentration.route,
    )
  ) {
    throw new Error("Select a formulation listed for this medication.");
  }
  if (
    !Number.isFinite(dosesPerDay) ||
    dosesPerDay <= 0 ||
    !Number.isFinite(concentration.mg) ||
    concentration.mg <= 0 ||
    !Number.isFinite(concentration.ml) ||
    concentration.ml <= 0
  ) {
    throw new Error("This medication does not have usable dose or concentration data.");
  }

  const isMicrogramDose = drug.doseUnit.startsWith("mcg/");
  const isPerDay = drug.doseUnit.endsWith("/day");
  if (!isMicrogramDose && !drug.doseUnit.startsWith("mg/")) {
    throw new Error(`Unsupported neonatal dose unit: ${drug.doseUnit}`);
  }

  const conversionToMg = isMicrogramDose ? 1 / 1000 : 1;
  let singleDoseMg = weightKg * dosePerKg * conversionToMg;
  if (isPerDay) singleDoseMg /= dosesPerDay;

  let dailyDoseMg = singleDoseMg * dosesPerDay;
  let isCapped = false;

  if (drug.maxDailyDoseMg !== undefined && dailyDoseMg > drug.maxDailyDoseMg) {
    dailyDoseMg = drug.maxDailyDoseMg;
    singleDoseMg = dailyDoseMg / dosesPerDay;
    isCapped = true;
  }
  if (drug.maxSingleDoseMg !== undefined && singleDoseMg > drug.maxSingleDoseMg) {
    singleDoseMg = drug.maxSingleDoseMg;
    dailyDoseMg = singleDoseMg * dosesPerDay;
    isCapped = true;
  }

  return {
    dosePerKg,
    dosesPerDay,
    singleDoseMg,
    dailyDoseMg,
    volumeMlPerDose: (singleDoseMg / concentration.mg) * concentration.ml,
    isCapped,
  };
}
