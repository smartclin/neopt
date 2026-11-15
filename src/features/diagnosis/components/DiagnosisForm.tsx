import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

// ── mutation ───────────────────────────────────────────────────────────
import { useCreateDiagnosesMutation } from "../queries";

const ICD_REGEX = /^[A-Z]\d{2}(\.\d{1,4})?$/;

const diagnosisRowSchema = z.object({
  draftId: z.string().min(1),
  icdCode: z
    .string()
    .trim()
    .min(3, "ICD code is required")
    .max(10)
    .regex(ICD_REGEX, "Expected ICD-10 like A00 or E44.0"),
  description: z.string().trim().min(1, "Description is required").max(500),
  type: z.enum(["primary", "secondary"]),
});

const formSchema = z.object({
  diagnoses: z.array(diagnosisRowSchema).min(1, "Add at least one diagnosis"),
});

type DiagnosisDraft = z.infer<typeof diagnosisRowSchema>;
type DiagnosisType = "primary" | "secondary";

const isDiagnosisType = (v: unknown): v is DiagnosisType => v === "primary" || v === "secondary";

/** `crypto.randomUUID` is only available in secure contexts. */
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dx-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/** TanStack Form hands back `unknown[]`; pull a readable string out. */
function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

interface DiagnosisFormProps {
  visitId: string;
  /** The patient the visit belongs to. Used to invalidate the patient's
   *  diagnosis history — optional so callers can omit it if they don't
   *  have it, but the invalidation is more complete when present. */
  patientId?: string;
  bulk?: boolean;
  inline?: boolean;
  onSuccess?: () => void;
}

function emptyDiagnosis(type: DiagnosisType = "primary"): DiagnosisDraft {
  return {
    draftId: randomId(),
    icdCode: "",
    description: "",
    type,
  };
}

const buildDefaults = () => ({ diagnoses: [emptyDiagnosis()] });

export function DiagnosisForm({
  visitId,
  patientId,
  bulk = true,
  inline = false,
  onSuccess,
}: DiagnosisFormProps) {
  const [open, setOpen] = useState(false);
  const { bulk: bulkMutation, single: singleMutation } = useCreateDiagnosesMutation({
    visitId,
    patientId,
  });

  const form = useForm({
    defaultValues: buildDefaults(),
    validators: {
      onSubmit: formSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const rows = value.diagnoses.map((d) => ({
            visitId,
            icdCode: d.icdCode.trim().toUpperCase(),
            description: d.description.trim(),
            type: d.type,
          }));

          if (bulk) {
            await bulkMutation.mutateAsync(rows);
          } else {
            await Promise.all(rows.map((row) => singleMutation.mutateAsync(row)));
          }

          toast.add({
            type: "success",
            description: `${rows.length} diagnosis${rows.length === 1 ? "" : "es"} saved`,
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
      <form.Field mode="array" name="diagnoses">
        {(field) => (
          <div className="grid gap-3">
            {field.state.value.map((row, index) => (
              <div className="grid gap-3 rounded-md border p-3" key={row.draftId}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Diagnosis {index + 1}</span>
                  <Button
                    aria-label={`Remove diagnosis ${index + 1}`}
                    disabled={field.state.value.length <= 1}
                    onClick={() => field.removeValue(index)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <form.Field name={`diagnoses[${index}].icdCode`}>
                    {(sub) => {
                      const err = fieldErrorMessage(sub.state.meta.errors[0]);
                      return (
                        <div className="grid gap-1">
                          <Label htmlFor={`dx-${row.draftId}-icd`}>ICD-10</Label>
                          <Input
                            aria-invalid={Boolean(err)}
                            autoComplete="off"
                            id={`dx-${row.draftId}-icd`}
                            maxLength={10}
                            onBlur={sub.handleBlur}
                            onChange={(e) => sub.handleChange(e.target.value.toUpperCase())}
                            placeholder="E44.0"
                            required
                            value={sub.state.value}
                          />
                          {err && (
                            <p className="text-destructive text-xs" role="alert">
                              {err}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  </form.Field>

                  <form.Field name={`diagnoses[${index}].type`}>
                    {(sub) => (
                      <div className="grid gap-1">
                        <Label htmlFor={`dx-${row.draftId}-type`}>Type</Label>
                        <Select
                          onValueChange={(v) => {
                            if (isDiagnosisType(v)) sub.handleChange(v);
                          }}
                          value={sub.state.value}
                        >
                          <SelectTrigger id={`dx-${row.draftId}-type`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name={`diagnoses[${index}].description`}>
                  {(sub) => {
                    const err = fieldErrorMessage(sub.state.meta.errors[0]);
                    return (
                      <div className="grid gap-1">
                        <Label htmlFor={`dx-${row.draftId}-description`}>Description</Label>
                        <Input
                          aria-invalid={Boolean(err)}
                          id={`dx-${row.draftId}-description`}
                          maxLength={500}
                          onBlur={sub.handleBlur}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          placeholder="Protein-energy malnutrition"
                          required
                          value={sub.state.value}
                        />
                        {err && (
                          <p className="text-destructive text-xs" role="alert">
                            {err}
                          </p>
                        )}
                      </div>
                    );
                  }}
                </form.Field>
              </div>
            ))}

            <Button
              onClick={() =>
                field.pushValue(
                  emptyDiagnosis(field.state.value.length === 0 ? "primary" : "secondary"),
                )
              }
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus /> Add diagnosis
            </Button>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
        {(err) => {
          const message = fieldErrorMessage(err);
          return message ? (
            <p className="text-destructive text-sm" role="alert">
              {message}
            </p>
          ) : null;
        }}
      </form.Subscribe>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex justify-end gap-2">
            {!inline && (
              <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
                Cancel
              </Button>
            )}
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving…" : "Save Diagnoses"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );

  if (inline) return body;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <Button onClick={() => setOpen(true)} type="button">
        <Plus />
        Add Diagnoses
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Diagnoses</DialogTitle>
          <DialogDescription>
            Add ICD-10 coded diagnoses for this visit. Mark exactly one as primary where possible.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
