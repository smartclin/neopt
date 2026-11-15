import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { VisitComposerValues } from "../schema";
import { SYMPTOM_CHIPS } from "../schema";

// ── Datetime helpers ───────────────────────────────────────────────────────

/**
 * Render `Date` → `YYYY-MM-DDTHH:mm` **in local time**.
 *
 * `toISOString()` converts to UTC first, so a visit at 14:00 UTC+2 renders
 * as "12:00", and the round-trip through `<input type="datetime-local">`
 * (which parses as local) silently shifts the time on every save.
 */
function toLocalDateTimeValue(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse `YYYY-MM-DDTHH:mm` (as emitted by `<input type="datetime-local">`) in local time. */
function fromLocalDateTimeValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ── Chip helper ────────────────────────────────────────────────────────────

function chipClass(selected: boolean, readOnly: boolean | undefined): string {
  return cn(
    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
    !readOnly && !selected && "hover:bg-muted/80",
    readOnly && "opacity-60",
  );
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]?.toUpperCase() + value.slice(1);
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  values: VisitComposerValues;
  patch: (p: Partial<VisitComposerValues>) => void;
  /**
   * Display name of the clinic. When absent, falls back to a short id
   * fragment. Pass `clinic.name` from the route so users see something
   * meaningful instead of "a1b2c3d4".
   */
  clinicName?: string;
  /**
   * When provided, replaces the free-text doctor input with a selectable
   * list. Pass the clinic's user roster from the route.
   */
  doctors?: ReadonlyArray<{ id: string; name: string }>;
  readOnly?: boolean;
}

export function EncounterContextSection({ values, patch, clinicName, doctors, readOnly }: Props) {
  const [doctorError, setDoctorError] = React.useState<string | null>(null);

  const setVisitedAt = (value: string) => {
    const next = fromLocalDateTimeValue(value);
    if (next) patch({ visitedAt: next });
  };

  const setDoctorId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setDoctorError(null);
      patch({ doctorId: null });
      return;
    }
    // If the caller supplied a roster, only allow known ids.
    if (doctors && !doctors.some((d) => d.id === trimmed)) {
      setDoctorError("Unknown doctor id");
      return;
    }
    setDoctorError(null);
    patch({ doctorId: trimmed });
  };

  const toggleSymptom = (symptom: (typeof SYMPTOM_CHIPS)[number]) => {
    const selected = values.symptoms.includes(symptom);
    patch({
      symptoms: selected
        ? values.symptoms.filter((s) => s !== symptom)
        : [...values.symptoms, symptom],
    });
  };

  const clearSymptoms = () => patch({ symptoms: [] });

  return (
    <div className="grid gap-4">
      {/* Date / clinic / doctor row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="visitedAt">Visit date</Label>
          <Input
            disabled={readOnly}
            id="visitedAt"
            max={toLocalDateTimeValue(new Date())}
            onChange={(e) => setVisitedAt(e.target.value)}
            type="datetime-local"
            value={toLocalDateTimeValue(values.visitedAt)}
          />
          <p className="text-muted-foreground text-[11px]">
            Local time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </p>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="visitClinic">Clinic</Label>
          <Input
            disabled
            id="visitClinic"
            readOnly
            value={clinicName ?? values.clinicId.slice(0, 8)}
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="visitDoctor">Doctor</Label>
          {doctors ? (
            <select
              className="border-b-input focus-visible:border-b-ring h-10 w-full rounded-none border border-transparent bg-transparent px-0 py-1 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={readOnly}
              id="visitDoctor"
              onChange={(e) => setDoctorId(e.target.value)}
              value={values.doctorId ?? ""}
            >
              <option value="">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              aria-invalid={Boolean(doctorError)}
              disabled={readOnly}
              id="visitDoctor"
              onBlur={(e) => setDoctorId(e.target.value)}
              placeholder="Unassigned"
              value={values.doctorId ?? ""}
            />
          )}
          {doctorError && (
            <p className="text-destructive text-[11px]" role="alert">
              {doctorError}
            </p>
          )}
        </div>
      </div>

      {/* Chief complaint */}
      <div className="grid gap-1">
        <Label htmlFor="chiefComplaint">Chief complaint</Label>
        <Input
          disabled={readOnly}
          id="chiefComplaint"
          maxLength={500}
          onChange={(e) => patch({ chiefComplaint: e.target.value })}
          placeholder="e.g. Fever for 2 days, cough"
          value={values.chiefComplaint}
        />
      </div>

      {/* Symptom chips */}
      <fieldset className="grid gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <legend className="text-xs font-semibold tracking-wide uppercase">
            Symptoms{" "}
            <span className="text-muted-foreground font-normal normal-case">
              (select all that apply)
            </span>
          </legend>
          {!readOnly && values.symptoms.length > 0 && (
            <button
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-[11px] underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              onClick={clearSymptoms}
              type="button"
            >
              Clear ({values.symptoms.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {SYMPTOM_CHIPS.map((symptom) => {
            const selected = values.symptoms.includes(symptom);
            return (
              <button
                aria-pressed={selected}
                className={chipClass(selected, readOnly)}
                disabled={readOnly}
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                type="button"
              >
                {capitalize(symptom)}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
