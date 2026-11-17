import { useMemo, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ageInMonths } from "@/features/shared/helpers";

export interface PatientContext {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  sex: "male" | "female";
  dateOfBirth: string;
  allergies: string | null;
  weightKg: number | null;
}

interface PatientContextCardProps {
  patient: PatientContext;
  weightKg: number | null;
  onWeightChange: (kg: number | null) => void;
  mode: "create" | "edit" | "view";
}

export function PatientContextCard({
  patient,
  weightKg,
  onWeightChange,
  mode,
}: PatientContextCardProps) {
  const [referenceDate] = useState(() => new Date());
  const ageMonths = useMemo(
    () => ageInMonths(new Date(patient.dateOfBirth), referenceDate),
    [patient.dateOfBirth, referenceDate],
  );
  const ageLabel =
    ageMonths < 24
      ? `${ageMonths.toFixed(1)} mo`
      : `${Math.floor(ageMonths / 12)}y ${Math.round(ageMonths % 12)}m`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground uppercase"
        >
          {patient.firstName.charAt(0)}
          {patient.lastName.charAt(0)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">
            {patient.firstName} {patient.lastName}
          </span>
          <span className="font-mono text-xs  tabular-nums">
            {patient.mrn} · {ageLabel} · {patient.sex === "male" ? "Boy" : "Girl"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="composer-weight">Weight (kg)</Label>
          {mode === "view" ? (
            <span className="font-mono text-sm tabular-nums">
              {weightKg ? weightKg.toFixed(2) : "—"}
            </span>
          ) : (
            <Input
              id="composer-weight"
              inputMode="decimal"
              min="0.3"
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                onWeightChange(Number.isFinite(n) && n > 0 ? n : null);
              }}
              step="0.01"
              type="number"
              value={weightKg ?? ""}
            />
          )}
          <p className=" text-xss">Drives mg/kg calculation.</p>
        </div>

        <div className="grid gap-1">
          <Label>Allergies</Label>
          {patient.allergies ? (
            <div className="flex flex-wrap gap-1">
              {patient.allergies
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean)
                .map((a) => (
                  <Badge key={a} variant="destructive">
                    {a}
                  </Badge>
                ))}
            </div>
          ) : (
            <span className="text-xs ">None recorded</span>
          )}
        </div>
      </div>
    </div>
  );
}
