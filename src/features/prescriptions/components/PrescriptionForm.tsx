import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

// ── mutation ───────────────────────────────────────────────────────────
import { useCreatePrescriptionsMutation } from "../queries";
import { FormularyMedicationPicker } from "./FormularyMedicationPicker";
import { PediatricDosingCalculator } from "./PediatricDosingCalculator";

// ── helpers ────────────────────────────────────────────────────────────

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

// ── schema ─────────────────────────────────────────────────────────────

const medicationSchema = z.object({
  id: z.string(),
  medicationName: z.string().trim().min(1, "Medication name is required").max(200),
  dosage: z.string().trim().min(1, "Dosage is required").max(80),
  frequency: z.string().trim().min(1, "Frequency is required").max(80),
  durationDays: z
    .number({ error: "Duration must be a number" })
    .int()
    .min(1, "At least 1 day")
    .max(365, "At most 365 days")
    .nullable(),
  instructions: z.string().max(2000, "Instructions are too long"),
});

const formSchema = z.object({
  medications: z.array(medicationSchema).min(1, "Add at least one medication"),
});

type MedicationDraft = z.infer<typeof medicationSchema>;

function createMedication(id: string): MedicationDraft {
  return {
    id,
    medicationName: "",
    dosage: "",
    frequency: "",
    durationDays: null,
    instructions: "",
  };
}

const buildDefaults = () => ({ medications: [createMedication("med-0")] });

// ── props ──────────────────────────────────────────────────────────────

interface PrescriptionFormProps {
  visitId: string;
  patientId: string;
  clinicId: string;
  prescribedById?: string | null;
  inline?: boolean;
  initialWeightKg?: number;
  onSuccess?: () => void;
}

// ── form ───────────────────────────────────────────────────────────────

export function PrescriptionForm({
  visitId,
  patientId,
  clinicId,
  prescribedById = null,
  inline = false,
  initialWeightKg,
  onSuccess,
}: PrescriptionFormProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreatePrescriptionsMutation({
    patientId,
    visitId,
    clinicId,
  });

  const idCounter = useRef(1);

  const resetForm = () => {
    idCounter.current = 1;
    form.reset(buildDefaults());
  };

  const form = useForm({
    defaultValues: buildDefaults(),
    validators: {
      onSubmit: formSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const prescribedAt = new Date().toISOString();
          const rows = value.medications.map((m) => ({
            visitId,
            patientId,
            prescribedById,
            medicationName: m.medicationName.trim(),
            dosage: m.dosage.trim(),
            frequency: m.frequency.trim(),
            durationDays: m.durationDays,
            instructions: m.instructions.trim() || null,
            prescribedAt,
          }));

          await createMutation.mutateAsync({
            data: { rows },
          });

          toast.add({
            type: "success",
            description: `${rows.length} prescription${rows.length === 1 ? "" : "s"} saved`,
          });
          resetForm();
          setOpen(false);
          onSuccess?.();
          return undefined;
        } catch (error) {
          return {
            form: error instanceof Error ? error.message : "Failed to save prescription",
          };
        }
      },
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
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
      <form.Field mode="array" name="medications">
        {(field) => (
          <div className="grid gap-4">
            {field.state.value.map((row, index) => (
              <div className="grid gap-3 rounded-md border p-3" key={row.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Medication {index + 1}</span>
                  <Button
                    aria-label="Remove medication"
                    disabled={field.state.value.length <= 1}
                    onClick={() => field.removeValue(index)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <form.Field name={`medications[${index}].medicationName`}>
                  {(sub) => (
                    <div className="grid gap-1">
                      <Label htmlFor={`rx-${row.id}-name`}>Medication Name</Label>
                      <Input
                        aria-invalid={sub.state.meta.errors.length > 0}
                        autoComplete="off"
                        id={`rx-${row.id}-name`}
                        onBlur={sub.handleBlur}
                        onChange={(e) => sub.handleChange(e.target.value)}
                        placeholder="Amoxicillin"
                        required
                        value={sub.state.value}
                      />
                      {fieldErrorMessage(sub.state.meta.errors[0]) && (
                        <p className="text-destructive text-xs" role="alert">
                          {fieldErrorMessage(sub.state.meta.errors[0])}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <FormularyMedicationPicker
                  id={`rx-${row.id}-formulary`}
                  onSelect={(medicationName) =>
                    form.setFieldValue(`medications[${index}].medicationName`, medicationName)
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <form.Field name={`medications[${index}].dosage`}>
                    {(sub) => (
                      <div className="grid gap-1">
                        <Label htmlFor={`rx-${row.id}-dosage`}>Dosage</Label>
                        <Input
                          aria-invalid={sub.state.meta.errors.length > 0}
                          id={`rx-${row.id}-dosage`}
                          onBlur={sub.handleBlur}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          placeholder="250 mg"
                          required
                          value={sub.state.value}
                        />
                        {fieldErrorMessage(sub.state.meta.errors[0]) && (
                          <p className="text-destructive text-xs" role="alert">
                            {fieldErrorMessage(sub.state.meta.errors[0])}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name={`medications[${index}].frequency`}>
                    {(sub) => (
                      <div className="grid gap-1">
                        <Label htmlFor={`rx-${row.id}-frequency`}>Frequency</Label>
                        <Input
                          aria-invalid={sub.state.meta.errors.length > 0}
                          id={`rx-${row.id}-frequency`}
                          onBlur={sub.handleBlur}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          placeholder="TID"
                          required
                          value={sub.state.value}
                        />
                        {fieldErrorMessage(sub.state.meta.errors[0]) && (
                          <p className="text-destructive text-xs" role="alert">
                            {fieldErrorMessage(sub.state.meta.errors[0])}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                <PediatricDosingCalculator
                  initialWeightKg={initialWeightKg}
                  onApplyToPrescription={(prescription) => {
                    form.setFieldValue(
                      `medications[${index}].medicationName`,
                      prescription.medicationName,
                    );
                    form.setFieldValue(`medications[${index}].dosage`, prescription.dosage);
                    form.setFieldValue(`medications[${index}].frequency`, prescription.frequency);
                    form.setFieldValue(
                      `medications[${index}].instructions`,
                      prescription.instructions,
                    );
                  }}
                />

                <form.Field name={`medications[${index}].durationDays`}>
                  {(sub) => (
                    <div className="grid gap-1">
                      <Label htmlFor={`rx-${row.id}-duration`}>
                        Duration (days, blank = ongoing)
                      </Label>
                      <Input
                        aria-invalid={sub.state.meta.errors.length > 0}
                        id={`rx-${row.id}-duration`}
                        max={365}
                        min={1}
                        onBlur={sub.handleBlur}
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          sub.handleChange(Number.isNaN(n) ? null : Math.round(n));
                        }}
                        step={1}
                        type="number"
                        value={sub.state.value ?? ""}
                      />
                      {fieldErrorMessage(sub.state.meta.errors[0]) && (
                        <p className="text-destructive text-xs" role="alert">
                          {fieldErrorMessage(sub.state.meta.errors[0])}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name={`medications[${index}].instructions`}>
                  {(sub) => (
                    <div className="grid gap-1">
                      <Label htmlFor={`rx-${row.id}-instructions`}>
                        Instructions{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Textarea
                        id={`rx-${row.id}-instructions`}
                        maxLength={2000}
                        onBlur={sub.handleBlur}
                        onChange={(e) => sub.handleChange(e.target.value)}
                        placeholder="Take with food…"
                        rows={2}
                        value={sub.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            ))}

            <Button
              onClick={() => field.pushValue(createMedication(`med-${idCounter.current++}`))}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus /> Add medication
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
              {isSubmitting ? "Saving…" : "Save Prescription"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );

  if (inline) return body;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} type="button">
            <Plus />
            New Prescription
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prescribe Medication</DialogTitle>
          <DialogDescription>
            Add one or more medications for this visit. All are saved together.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
