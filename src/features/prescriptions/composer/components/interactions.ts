import type { ComposerDrug } from "../formulary";
import type { InteractionWarning } from "./SafetyRail";

export function computeInteractions(args: {
  drug: ComposerDrug | undefined;
  allergies: string | null;
  active: Array<{ medicationName: string }>;
}): InteractionWarning[] {
  const warnings: InteractionWarning[] = [];
  if (!args.drug) return warnings;

  const allergyList = (args.allergies ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Red: allergy on the drug's contraindications list
  for (const c of args.drug.contraindications) {
    const lower = c.toLowerCase();
    if (allergyList.some((a) => lower.includes(a))) {
      warnings.push({
        severity: "red",
        title: `Contraindicated: ${c}`,
        detail: `Patient allergy matches a contraindication for ${args.drug.genericName}.`,
      });
    }
  }

  // Amber: currently active medication with a matching generic name
  for (const activeMed of args.active) {
    if (activeMed.medicationName.toLowerCase() === args.drug.genericName.toLowerCase()) {
      warnings.push({
        severity: "amber",
        title: `Already on ${args.drug.genericName}`,
        detail:
          "An active prescription for the same medication exists. Confirm this is intentional.",
      });
    }
  }

  return warnings;
}
