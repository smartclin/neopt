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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

// ── mutation ───────────────────────────────────────────────────────────
import { useCreateClinicMutation } from "../queries";

const clinicSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120, "Name is too long"),
  email: z.union([z.email("Invalid email").max(254), z.literal("")]),
  phone: z.union([
    z.string().trim().min(7, "Phone is too short").max(20, "Phone is too long"),
    z.literal(""),
  ]),
  address: z.union([z.string().trim().max(500, "Address is too long"), z.literal("")]),
});

export type ClinicFormValues = z.infer<typeof clinicSchema>;

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

interface ClinicFormProps {
  inline?: boolean;
  onSuccess?: (clinic: { id: string }) => void;
}

const emptyValues: ClinicFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export function ClinicForm({ inline = false, onSuccess }: ClinicFormProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateClinicMutation();

  const defaultValues = useMemo(() => emptyValues, []);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: clinicSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const clinic = await createMutation.mutateAsync({
            data: {
              name: value.name.trim(),
              email: value.email.trim() || undefined,
              phone: value.phone.trim() || undefined,
              address: value.address.trim() || undefined,
            },
          });

          toast.add({
            type: "success",
            description: `Clinic created: ${value.name}`,
          });

          form.reset(defaultValues);
          setOpen(false);
          if (clinic) onSuccess?.(clinic);
          return undefined;
        } catch (error) {
          return {
            form: error instanceof Error ? error.message : "Failed to create clinic",
          };
        }
      },
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset(defaultValues);
  };

  const formBody = (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Name</Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              autoComplete="organization"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Cairo Children's Clinic"
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="phone">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>
                Phone <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="tel"
                id={field.name}
                inputMode="tel"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="+20 2 2574 0001"
                type="tel"
                value={field.state.value}
              />
              {fieldErrorMessage(field.state.meta.errors[0]) && (
                <p className="text-destructive text-sm" role="alert">
                  {fieldErrorMessage(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="email"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="hello@clinic.eg"
                type="email"
                value={field.state.value}
              />
              {fieldErrorMessage(field.state.meta.errors[0]) && (
                <p className="text-destructive text-sm" role="alert">
                  {fieldErrorMessage(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="address">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Address <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              aria-invalid={field.state.meta.errors.length > 0}
              autoComplete="street-address"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
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
              {isSubmitting ? "Saving…" : "Create Clinic"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );

  if (inline) return formBody;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} type="button">
            <Plus />
            New Clinic
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Clinic</DialogTitle>
          <DialogDescription>
            Register a clinic. Patients, appointments, and staff are all scoped to a clinic.
          </DialogDescription>
        </DialogHeader>
        {formBody}
      </DialogContent>
    </Dialog>
  );
}
