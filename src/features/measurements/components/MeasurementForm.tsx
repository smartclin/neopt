// src/components/forms/MeasurementForm.tsx

import { useForm } from "@tanstack/react-form";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classify, percentileFromZ, zScoreForValue } from "@/features/measurements/lib/lms";
import {
  useCreateMeasurementsMutation,
  useCreateStandaloneMeasurementsMutation,
} from "@/features/measurements/queries";

import { toast } from "../../../components/ui/toast";

const INDICATORS = [
  { value: "weight-for-age", label: "Weight-for-age", unit: "kg" },
  { value: "length-for-age", label: "Length/height-for-age", unit: "cm" },
  { value: "weight-for-length", label: "Weight-for-length", unit: "kg" },
  { value: "bmi-for-age", label: "BMI-for-age", unit: "kg/m²" },
  {
    value: "head-circumference-for-age",
    label: "Head circumference",
    unit: "cm",
  },
] as const;

// Derive the enum tuple from `INDICATORS` so the schema's inferred
// type matches the literal union. `as const` on the array above keeps
// `.value` as the literal union; the explicit tuple type below makes
// it visible to `z.enum`.
const INDICATOR_VALUES = [
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
  "head-circumference-for-age",
] as const;

type Indicator = (typeof INDICATOR_VALUES)[number];

const INDICATOR_SET: ReadonlySet<string> = new Set(INDICATOR_VALUES);

const isIndicator = (v: unknown): v is Indicator => typeof v === "string" && INDICATOR_SET.has(v);

const rowSchema = z.object({
  draftId: z.string().min(1),
  indicator: z.enum(INDICATOR_VALUES),
  value: z.number().positive("Value must be positive"),
});

const formSchema = z.object({
  rows: z.array(rowSchema).min(1, "Add at least one measurement"),
});

export interface LmsLookupEntry {
  l: number;
  m: number;
  s: number;
}

type DraftRow = z.infer<typeof rowSchema>;

interface MeasurementFormProps {
  /** Preferred: log against an existing encounter. */
  visitId?: string;
  patientId: string;
  /** Required when `visitId` is absent — the server creates a visit. */
  clinicId?: string;
  patientSex: "male" | "female";
  ageMonths: number;
  lengthCm?: number;
  lmsByIndicator?: Partial<Record<Indicator, LmsLookupEntry>>;
  inline?: boolean;
  onSuccess?: () => void;
}

function emptyRow(indicator: Indicator = "weight-for-age"): DraftRow {
  return { draftId: crypto.randomUUID(), indicator, value: 0 };
}

const buildDefaults = () => ({ rows: [emptyRow()] });

export function MeasurementForm({
  visitId,
  patientId,
  clinicId,
  patientSex,
  ageMonths,
  lengthCm,
  lmsByIndicator,
  inline = false,
  onSuccess,
}: MeasurementFormProps) {
  const [open, setOpen] = useState(false);

  // The mutations are constructed once per patient — the hook owns
  // the query client, the server fn, and the invalidation. Both
  // hooks are always created so hook order is stable when `visitId`
  // toggles between renders. Only one is ever called.
  const createVisitMeasurements = useCreateMeasurementsMutation({
    patientId,
  });
  const createStandalone = useCreateStandaloneMeasurementsMutation({
    patientId,
  });

  // Which mutation is "the one" for this form, given the current
  // props — used to disable the submit button while it is pending.
  const activeMutation = visitId ? createVisitMeasurements : createStandalone;

  const form = useForm({
    defaultValues: buildDefaults(),
    validators: {
      onSubmit: formSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          if (visitId) {
            const payload = value.rows.map((row) => {
              const lms = lmsByIndicator?.[row.indicator];
              const canComputeZ =
                lms !== undefined &&
                (row.indicator !== "weight-for-length" || lengthCm !== undefined);

              if (!lms || !canComputeZ) {
                return { indicator: row.indicator, value: row.value };
              }

              const zScore = zScoreForValue({ l: lms.l, m: lms.m, s: lms.s }, row.value);
              const percentile = percentileFromZ(zScore);
              const classification =
                row.indicator === "head-circumference-for-age"
                  ? undefined
                  : classify(row.indicator, zScore).label;

              return {
                indicator: row.indicator,
                value: row.value,
                zScore,
                percentile,
                classification,
                lmsL: lms.l,
                lmsM: lms.m,
                lmsS: lms.s,
              };
            });

            // NOTE: `patientId` is NOT in the mutate payload —
            // the hook already carries it via `args`.
            await createVisitMeasurements.mutateAsync({
              data: { visitId, rows: payload },
            });
          } else {
            if (!clinicId) {
              return { form: "Missing patient or clinic context" };
            }

            await createStandalone.mutateAsync({
              data: {
                patientId,
                clinicId,
                rows: value.rows.map((r) => ({
                  indicator: r.indicator,
                  value: r.value,
                  lengthCm: r.indicator === "weight-for-length" ? (lengthCm ?? null) : null,
                })),
              },
            });
          }

          toast.add({
            type: "success",
            description: `${value.rows.length} measurement(s) saved`,
          });
          form.reset(buildDefaults());
          setOpen(false);
          onSuccess?.();
          return undefined;
        } catch (error) {
          return {
            form: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset(buildDefaults());
  };

  const body = (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-muted-foreground text-sm">
        Sex: <span className="capitalize">{patientSex}</span> · Age: {ageMonths.toFixed(1)} months
        {lengthCm !== undefined && ` · Length: ${lengthCm} cm`}
      </p>

      <form.Field mode="array" name="rows">
        {(field) => (
          <div className="grid gap-3">
            {field.state.value.map((row, index) => (
              <div className="flex items-end gap-2 rounded-md border p-3" key={row.draftId}>
                <div className="flex-1">
                  <form.Field name={`rows[${index}].indicator`}>
                    {(sub) => (
                      <div className="grid gap-1">
                        <Label htmlFor={`m-${row.draftId}-indicator`}>Indicator</Label>
                        <Select
                          onValueChange={(v) => {
                            if (isIndicator(v)) sub.handleChange(v);
                          }}
                          value={sub.state.value}
                        >
                          <SelectTrigger id={`m-${row.draftId}-indicator`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INDICATORS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="flex-1">
                  <form.Field name={`rows[${index}].value`}>
                    {(sub) => {
                      const unit = INDICATORS.find((i) => i.value === row.indicator)?.unit ?? "";
                      return (
                        <div className="grid gap-1">
                          <Label htmlFor={`m-${row.draftId}-value`}>Value ({unit})</Label>
                          <Input
                            id={`m-${row.draftId}-value`}
                            min="0"
                            onChange={(e) => sub.handleChange(e.target.valueAsNumber || 0)}
                            step="0.01"
                            type="number"
                            value={sub.state.value || ""}
                          />
                        </div>
                      );
                    }}
                  </form.Field>
                </div>

                <Button
                  aria-label={`Remove measurement ${index + 1}`}
                  disabled={field.state.value.length <= 1}
                  onClick={() => field.removeValue(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X />
                </Button>
              </div>
            ))}

            <Button
              onClick={() => field.pushValue(emptyRow("length-for-age"))}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus /> Add measurement
            </Button>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
        {(error) =>
          typeof error?.form === "string" && (
            <p className="text-destructive text-sm" role="alert">
              {error.form}
            </p>
          )
        }
      </form.Subscribe>

      {/*
       * Read `activeMutation.isPending` instead of
       * `form.state.isSubmitting`. The mutation's onSuccess
       * awaits invalidation, so `isPending` stays true through
       * the refetch — the button doesn't re-enable while the
       * chart is still refetching stale data.
       */}
      <Button disabled={activeMutation.isPending} type="submit">
        {activeMutation.isPending ? "Saving…" : "Save Measurements"}
      </Button>
    </form>
  );

  if (inline) return body;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <Button onClick={() => setOpen(true)} type="button">
        <Plus />
        Add Measurements
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Measurements</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
