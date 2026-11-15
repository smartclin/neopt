import { EGYPTIAN_NATIONAL_FORMULARY } from "@data/formulary/egyptianNationalFormulary";
import { NEONATAL_PEDIATRIC_FORMULARY } from "@data/formulary/neonatalDrugs";

import type { DrugFormularyItem } from "@/features/medications/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ComposerConcentration {
  label: string;
  mg: number;
  ml: number;
}

export interface ComposerDrug {
  key: string;
  genericName: string;
  brandNames: string[];
  aware: "Access" | "Watch" | "Reserve" | "Not Applicable";
  indication: string;
  contraindications: string[];
  monitoring: string[];
  concentrations: ComposerConcentration[];
  dosing: {
    mgPerKgPerDay?: number;
    dosesPerDay: number;
    maxMgPerKgPerDay?: number;
    maxSingleDoseMg?: number;
    maxDailyDoseMg?: number;
  };
  crossReactivities: string[];
}

// ── Narrowing helpers ──────────────────────────────────────────────────────

/**
 * True iff both concentrations are present, finite, and strictly positive.
 * Returning a `value is T` type predicate narrows the *element* type, so
 * downstream `.map()` sees `number` instead of `number | undefined`.
 */
function hasUsableConcentration<P extends { concentrationMg?: number; volumeMl?: number }>(
  p: P,
): p is P & { concentrationMg: number; volumeMl: number } {
  return (
    typeof p.concentrationMg === "number" &&
    Number.isFinite(p.concentrationMg) &&
    p.concentrationMg > 0 &&
    typeof p.volumeMl === "number" &&
    Number.isFinite(p.volumeMl) &&
    p.volumeMl > 0
  );
}

/**
 * Narrowing for the neonatal formulary's `DrugConcentration` shape — `mg`
 * and `ml` are required on the type but the codebase already guards against
 * `<= 0`, so we do the same.
 */
function hasUsableDrugConcentration<C extends { mg: number; ml: number }>(
  c: C,
): c is C & { mg: number; ml: number } {
  return Number.isFinite(c.mg) && c.mg > 0 && Number.isFinite(c.ml) && c.ml > 0;
}

/**
 * Collect the non-empty strings out of a `safetyWarnings`-shaped object.
 * Values can be `string | undefined`; the predicate narrows to `string`.
 */
function definedStrings<T extends Record<string, string | undefined>>(obj: T): string[] {
  return Object.values(obj).filter((v): v is string => Boolean(v));
}

// ── Adapters ───────────────────────────────────────────────────────────────

function fromEgyptian(d: (typeof EGYPTIAN_NATIONAL_FORMULARY)[number]): ComposerDrug {
  return {
    key: `eg:${d.id}`,
    genericName: d.genericName,
    brandNames: d.brandNamesEgypt,
    aware: d.awareClassification ?? "Not Applicable",
    indication: d.indications[0] ?? "",
    contraindications: d.contraindications,
    monitoring: d.monitoringParameters,
    concentrations: d.presentations
      .filter(hasUsableConcentration)
      .map<ComposerConcentration>((p) => ({
        label: p.strength,
        mg: p.concentrationMg,
        ml: p.volumeMl,
      })),
    dosing: {
      mgPerKgPerDay: d.pediatricDosing.standardDosePerKg,
      dosesPerDay: d.pediatricDosing.dosesPerDay,
      maxMgPerKgPerDay: d.pediatricDosing.maxDosePerKg,
      maxSingleDoseMg: d.pediatricDosing.maxSingleDoseMg,
      maxDailyDoseMg: d.pediatricDosing.maxDailyDoseMg,
    },
    crossReactivities: d.penicillinAllergyCrossReactive ? ["penicillin"] : [],
  };
}

function fromNeonatal(d: DrugFormularyItem): ComposerDrug {
  const safetyNotes = definedStrings(d.safetyWarnings);
  return {
    key: `neo:${d.id}`,
    genericName: d.genericName,
    brandNames: [],
    aware: "Not Applicable",
    indication: d.indication,
    contraindications: safetyNotes,
    monitoring: safetyNotes,
    concentrations: d.concentrations
      .filter(hasUsableDrugConcentration)
      .map<ComposerConcentration>((c) => ({
        label: c.label,
        mg: c.mg,
        ml: c.ml,
      })),
    dosing: {
      mgPerKgPerDay: undefined,
      dosesPerDay: d.dosesPerDay,
      maxMgPerKgPerDay: d.maxDose,
      maxSingleDoseMg: d.maxSingleDoseMg,
      maxDailyDoseMg: d.maxDailyDoseMg,
    },
    crossReactivities: [],
  };
}

// ── Public surface ─────────────────────────────────────────────────────────

export const COMPOSER_DRUGS: readonly ComposerDrug[] = [
  ...EGYPTIAN_NATIONAL_FORMULARY.map(fromEgyptian),
  ...NEONATAL_PEDIATRIC_FORMULARY.map(fromNeonatal),
];

export function findComposerDrug(key: string): ComposerDrug | undefined {
  return COMPOSER_DRUGS.find((d) => d.key === key);
}

/** Fast lookup for the picker's search — pre-computed once, not per render. */
export const COMPOSER_DRUGS_BY_KEY: ReadonlyMap<string, ComposerDrug> = new Map(
  COMPOSER_DRUGS.map((d) => [d.key, d]),
);
