import { CalculatorIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { ComposerDrug } from "../formulary";
import type { ComposerUnit } from "../types";

import { calculateNeonatalDose } from "../../lib/neonatal-dosing";

interface DoseRowProps {
  drug: ComposerDrug | undefined;
  strength: number;
  unit: ComposerUnit;
  weightKg: number | null;
  mgPerKgPerDay: number | null;
  dosesPerDay: number | null;
  concentrationIndex: number;
  useCalc: boolean;
  onChange: (next: {
    strength?: number;
    unit?: ComposerUnit;
    mgPerKgPerDay?: number | null;
    dosesPerDay?: number | null;
    concentrationIndex?: number;
    useCalc?: boolean;
  }) => void;
}

const UNITS: ComposerUnit[] = ["mg", "mcg", "g", "mL", "drops", "puffs", "units"];

export function DoseRow(props: DoseRowProps) {
  const { drug, useCalc, weightKg, mgPerKgPerDay, dosesPerDay, concentrationIndex } = props;

  const calc =
    useCalc &&
    drug &&
    weightKg &&
    mgPerKgPerDay &&
    dosesPerDay &&
    drug.concentrations[concentrationIndex]
      ? calculateNeonatalDose({
          drug: {
            id: drug.key,
            name: drug.genericName,
            genericName: drug.genericName,
            category: "Antibiotic",
            indication: drug.indication,
            standardDose: mgPerKgPerDay,
            minDose: 0,
            maxDose: drug.dosing.maxMgPerKgPerDay ?? mgPerKgPerDay,
            doseUnit: "mg/kg/day",
            frequency: "q8h",
            dosesPerDay,
            routes: ["Oral"],
            concentrations: drug.concentrations.map((c, i) => ({
              id: `c-${i}`,
              label: c.label,
              mg: c.mg,
              ml: c.ml,
              route: "Oral",
            })),
            safetyWarnings: {},
          },
          weightKg,
          dosePerKg: mgPerKgPerDay,
          dosesPerDay,
          concentration: {
            id: `c-${concentrationIndex}`,
            label: drug.concentrations[concentrationIndex].label,
            mg: drug.concentrations[concentrationIndex].mg,
            ml: drug.concentrations[concentrationIndex].ml,
            route: "Oral",
          },
        })
      : null;

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <CalculatorIcon className="size-3.5" />
          Dose
        </Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={useCalc}
            id="composer-use-calc"
            onCheckedChange={(v) => props.onChange({ useCalc: v })}
          />
          <Label className="text-xs font-normal" htmlFor="composer-use-calc">
            Calculate from mg/kg
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-2">
        <div className="grid gap-1">
          <Label htmlFor="composer-strength">Strength</Label>
          <Input
            disabled={useCalc}
            id="composer-strength"
            inputMode="decimal"
            min="0"
            onChange={(e) => props.onChange({ strength: e.target.valueAsNumber || 0 })}
            step="0.01"
            type="number"
            value={Number.isFinite(props.strength) ? props.strength : ""}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="composer-unit">Unit</Label>
          <Select
            onValueChange={(v) => {
              if (UNITS.includes(v as ComposerUnit)) {
                props.onChange({ unit: v as ComposerUnit });
              }
            }}
            value={props.unit}
          >
            <SelectTrigger id="composer-unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {useCalc && (
        <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-md p-3 sm:grid-cols-3">
          <div className="grid gap-1">
            <Label htmlFor="composer-mgkg">mg/kg/day</Label>
            <Input
              id="composer-mgkg"
              inputMode="decimal"
              min="0"
              onChange={(e) =>
                props.onChange({
                  mgPerKgPerDay: e.target.valueAsNumber || null,
                })
              }
              step="0.01"
              type="number"
              value={mgPerKgPerDay ?? ""}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="composer-doses">Doses/day</Label>
            <Input
              id="composer-doses"
              inputMode="numeric"
              max="12"
              min="1"
              onChange={(e) => props.onChange({ dosesPerDay: e.target.valueAsNumber || null })}
              step="1"
              type="number"
              value={dosesPerDay ?? ""}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="composer-conc">Preparation</Label>
            <Select
              onValueChange={(v) => {
                const idx = Number(v);
                if (Number.isFinite(idx)) {
                  props.onChange({ concentrationIndex: idx });
                }
              }}
              value={String(concentrationIndex)}
            >
              <SelectTrigger id="composer-conc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(drug?.concentrations ?? []).map((c, i) => (
                  <SelectItem key={c.label} value={String(i)}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {calc && (
            <p className="col-span-full text-sm">
              <span className="text-muted-foreground">Dose: </span>
              <span className="font-mono tabular-nums">
                {calc.singleDoseMg.toFixed(2)} mg per {calc.volumeMlPerDose.toFixed(2)} mL
              </span>
              {calc.isCapped && (
                <span className="ml-2 text-warning">(capped at formulary max)</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
