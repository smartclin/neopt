import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

import type { createPatientFn } from "../functions";

import { useCreatePatientMutation } from "../queries";

const patientSchema = z.object({
  clinicId: z.string().trim().min(1, "Clinic is required"),
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  sex: z.enum(["male", "female"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine(
      (value) => {
        const dob = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(dob.getTime()) && dob <= new Date();
      },
      { message: "Date of birth cannot be in the future" },
    ),
  phone: z.string().trim().max(32).or(z.literal("")),
  address: z.string().trim().max(500).or(z.literal("")),
  parentName: z.string().trim().max(120).or(z.literal("")).optional(),
  gestationalAgeWeeks: z.number().min(22).max(44).optional().nullable(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  clinicId?: string;
  inline?: boolean;
  /** The server-returned patient row. Typed so callers don't get `any`. */
  onSuccess?: (patient: Awaited<ReturnType<typeof createPatientFn>>) => void;
}

function isSex(v: string | null | undefined): v is "male" | "female" {
  return v === "male" || v === "female";
}

const today = () => new Date().toISOString().slice(0, 10);

export function PatientForm({ clinicId, inline = false, onSuccess }: PatientFormProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreatePatientMutation({ clinicId });
  const defaultValues = useMemo<PatientFormValues>(
    () => ({
      clinicId: clinicId ?? "",
      firstName: "",
      lastName: "",
      sex: "male",
      dateOfBirth: "",
      phone: "",
      address: "",
      parentName: "",
      gestationalAgeWeeks: 40,
    }),
    [clinicId],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: patientSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const patient = await createMutation.mutateAsync({
            ...value,
            phone: value.phone?.trim() || null,
            address: value.address?.trim() || null,
            parentName: value.parentName?.trim() || null,
            gestationalAgeWeeks: value.gestationalAgeWeeks ?? 40,
          });

          toast.add({
            type: "success",
            data: `Patient ${value.firstName} ${value.lastName} created`,
            description: `MRN ${patient.mrn}`,
          });

          form.reset(defaultValues);
          setOpen(false);
          onSuccess?.(patient);
          return undefined;
        } catch (error) {
          return {
            form: error instanceof Error ? error.message : "Failed to create patient",
          };
        }
      },
    },
  });

  const formContent = (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {!clinicId && (
        <form.Field name="clinicId">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Clinic ID</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              {field.state.meta.errors[0] && (
                <p className="text-destructive text-sm" role="alert">
                  {field.state.meta.errors[0].message}
                </p>
              )}
            </div>
          )}
        </form.Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="firstName">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Child First Name</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              {field.state.meta.errors[0] && (
                <p className="text-destructive text-sm" role="alert">
                  {field.state.meta.errors[0].message}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Last Name (Family Name)</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              {field.state.meta.errors[0] && (
                <p className="text-destructive text-sm" role="alert">
                  {field.state.meta.errors[0].message}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="sex">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Biological Sex</Label>
              <Select
                onValueChange={(val) => {
                  if (isSex(val)) field.handleChange(val);
                }}
                value={field.state.value}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male (Boy)</SelectItem>
                  <SelectItem value="female">Female (Girl)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="dateOfBirth">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Date of Birth</Label>
              <Input
                id={field.name}
                max={today()}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="date"
                value={field.state.value}
              />
              {field.state.meta.errors[0] && (
                <p className="text-destructive text-sm" role="alert">
                  {field.state.meta.errors[0].message}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="parentName">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Parent / Guardian Name</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Mother / Father"
                value={field.state.value ?? ""}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="gestationalAgeWeeks">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Gestational Age at Birth (Weeks)</Label>
              <Input
                id={field.name}
                max="44"
                min="22"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number.parseInt(e.target.value, 10) || 40)}
                type="number"
                value={field.state.value ?? 40}
              />
              {field.state.value && field.state.value < 37 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Preterm baby ({field.state.value}w): Corrected age enabled for growth curves.
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="phone">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Contact Phone</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="tel"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="address">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Address</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex justify-end gap-2 pt-2">
            {!inline && (
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
            )}
            <Button disabled={!canSubmit || isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Create Patient Record"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );

  if (inline) {
    return formContent;
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-1.5 size-4" />
        New Patient
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Register New Pediatric Patient</DialogTitle>
          <DialogDescription>
            Register a new child with demographics, birth history, and parent details.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
