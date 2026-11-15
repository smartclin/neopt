import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Classification, Indicator } from "@/features/growth/types";
import { classify, percentileFromZ, zScoreForValue } from "@/features/measurements/lib/lms";

import type { VisitComposerValues } from "../schema";

// ── Types ──────────────────────────────────────────────────────────────────

/** One entry of the LMS table for a single (indicator, sex, age). */
export interface LmsLookup {
  l: number;
  m: number;
  s: number;
}

export type LmsByIndicator = Partial<Record<Indicator, LmsLookup>>;

interface VitalsSectionProps {
  values: VisitComposerValues;
  patch: (p: Partial<VisitComposerValues>) => void;
  patientId: string;
  /**
   * Optional LMS rows for this patient at this visit's age. When provided,
   * each valid measurement shows a live z-score + classification badge.
   * Supply from a batch query in the parent; `VitalsSection` does not
   * fetch on its own.
   */
  lmsByIndicator?: LmsByIndicator;
  readOnly?: boolean;
}

// ── Field config ───────────────────────────────────────────────────────────

type FieldSpec = {
  indicator: Indicator;
  label: string;
  unit: string;
  /** The input that supplies x for WFL z-scores. Not applicable elsewhere. */
  requiresLength?: boolean;
  /**
   * Whether the Egyptian LMS reference covers this indicator.
   * Head circumference has no reference in the current seed.
   */
  hasReference: boolean;
};

const FIELDS: readonly FieldSpec[] = [
  {
    indicator: "weight-for-age",
    label: "Weight",
    unit: "kg",
    hasReference: true,
  },
  {
    indicator: "length-for-age",
    label: "Length",
    unit: "cm",
    hasReference: true,
  },
  {
    indicator: "head-circumference-for-age",
    label: "Head circ.",
    unit: "cm",
    hasReference: false,
  },
  {
    indicator: "bmi-for-age",
    label: "BMI",
    unit: "kg/m²",
    hasReference: true,
  },
  {
    indicator: "weight-for-length",
    label: "Weight / length",
    unit: "kg",
    requiresLength: true,
    hasReference: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function isFinitePositive(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

/** Tailwind variants keyed by classification category. */
function classificationVariant(
  c: Classification,
): "success" | "warning" | "destructive" | "outline" {
  if (c.severity === "severe") return "destructive";
  if (c.severity === "moderate") return "warning";
  if (c.severity === "mild") return "warning";
  if (c.category === "normal") return "success";
  return "outline";
}

type ComputedZ = {
  z: number;
  percentile: number;
  classification: Classification;
};

function computeZ(
  indicator: Indicator,
  value: number,
  lms: LmsLookup | undefined,
): ComputedZ | null {
  if (!lms) return null;
  try {
    const z = zScoreForValue({ l: lms.l, m: lms.m, s: lms.s }, value);
    const percentile = percentileFromZ(z);
    const classification = classify(indicator, z);
    return { z, percentile, classification };
  } catch {
    // zScoreForValue throws on domain errors (value <= 0, invalid LMS)
    return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function VitalsSection({ values, patch, lmsByIndicator, readOnly }: VitalsSectionProps) {
  const measurementByIndicator = React.useMemo(() => {
    const map = new Map<Indicator, (typeof values.measurements)[number]>();
    for (const m of values.measurements) map.set(m.indicator, m);
    return map;
  }, [values.measurements]);

  const setMeasurement = React.useCallback(
    (indicator: Indicator, value: number | null, lengthCm?: number | null) => {
      const others = values.measurements.filter((m) => m.indicator !== indicator);

      if (!isFinitePositive(value)) {
        patch({ measurements: others });
        return;
      }

      patch({
        measurements: [
          ...others,
          {
            draftId: `v-${indicator}`,
            indicator,
            value,
            lengthCm: indicator === "weight-for-length" ? (lengthCm ?? null) : null,
          },
        ],
      });
    },
    [patch, values.measurements],
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FIELDS.map((field) => (
        <VitalField
          existing={measurementByIndicator.get(field.indicator)}
          field={field}
          key={field.indicator}
          lms={lmsByIndicator?.[field.indicator]}
          onChange={setMeasurement}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ── Single field ───────────────────────────────────────────────────────────

interface VitalFieldProps {
  field: FieldSpec;
  existing:
    | {
        value: number;
        lengthCm?: number | null;
      }
    | undefined;
  lms: LmsLookup | undefined;
  onChange: (indicator: Indicator, value: number | null, lengthCm?: number | null) => void;
  readOnly: boolean | undefined;
}

function VitalField({ field, existing, lms, onChange, readOnly }: VitalFieldProps) {
  const inputId = `vital-${field.indicator}`;
  const lengthId = `${inputId}-length`;
  const badgeId = `${inputId}-z`;

  const lengthCm = field.requiresLength ? (existing?.lengthCm ?? null) : null;

  const computed = React.useMemo<ComputedZ | null>(() => {
    if (!existing) return null;
    if (!field.hasReference) return null;
    if (!isFinitePositive(existing.value)) return null;
    if (field.requiresLength && !isFinitePositive(lengthCm)) return null;
    return computeZ(field.indicator, existing.value, lms);
  }, [existing, field.hasReference, field.indicator, field.requiresLength, lengthCm, lms]);

  const variant = computed ? classificationVariant(computed.classification) : "outline";

  return (
    <div className="grid gap-1">
      <Label htmlFor={inputId}>
        {field.label} <span className="text-muted-foreground font-normal">({field.unit})</span>
      </Label>

      <div className="flex items-center gap-1">
        <Input
          aria-describedby={computed ? badgeId : undefined}
          disabled={readOnly}
          id={inputId}
          inputMode="decimal"
          min="0"
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            onChange(field.indicator, Number.isFinite(n) && n > 0 ? n : null, lengthCm);
          }}
          placeholder="—"
          step="0.01"
          type="number"
          value={existing?.value ?? ""}
        />
        {computed && (
          <Badge
            aria-label={`Z-score ${computed.z.toFixed(2)}, ${computed.classification.label}, ${computed.percentile.toFixed(0)}th percentile`}
            className="shrink-0"
            id={badgeId}
            title={`${computed.classification.label} · ${computed.percentile.toFixed(1)}th percentile`}
            variant={variant}
          >
            z&nbsp;
            <span className="tabular-nums">
              {computed.z > 0 ? "+" : ""}
              {computed.z.toFixed(2)}
            </span>
          </Badge>
        )}
      </div>

      {field.requiresLength && (
        <div className="grid gap-1">
          <Label className="text-xs font-normal" htmlFor={lengthId}>
            Length at measurement (cm)
          </Label>
          <Input
            disabled={readOnly}
            id={lengthId}
            inputMode="decimal"
            min="0"
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              onChange(
                field.indicator,
                existing?.value ?? null,
                Number.isFinite(n) && n > 0 ? n : null,
              );
            }}
            placeholder="Required for z-score"
            step="0.1"
            type="number"
            value={lengthCm ?? ""}
          />
        </div>
      )}

      {/* Small helper when z-score can't be computed */}
      {existing &&
        !computed &&
        field.hasReference &&
        (field.requiresLength && !lengthCm ? (
          <p className="text-muted-foreground text-[11px]">Add the length to compute a z-score.</p>
        ) : null)}
    </div>
  );
}
