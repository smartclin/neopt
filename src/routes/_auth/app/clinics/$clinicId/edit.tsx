// routes/_auth/app/clinics/$clinicId/edit.tsx
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { toast } from "#/components/ui/toast.tsx";

// ── reads + mutations ────────────────────────────────────────────────
import { clinicByIdQuery, useUpdateClinicMutation } from "#/features/clinics/queries";

import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/$clinicId/edit")({
  component: EditClinicPage,
});

const updateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.email("Invalid email").or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone must be at least 7 characters")
    .max(20, "Phone is too long")
    .or(z.literal("")),
  address: z.string().trim().max(500).or(z.literal("")),
});

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

function EditClinicPage() {
  const { clinicId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  const cancel = () => void navigate({ to: "/app/clinics/$clinicId", params: { clinicId } });

  if (typeof user?.role !== "string" || user.role !== "admin") {
    return <PageHeader description="Only administrators can edit clinics." title="Edit Clinic" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button nativeButton onClick={cancel} variant="outline">
            Cancel
          </Button>
        }
        description={`Clinic ${clinicId}`}
        title="Edit Clinic"
      />
      <Card>
        <CardContent className="pt-6">
          <EditClinicForm clinicId={clinicId} onDone={cancel} />
        </CardContent>
      </Card>
    </div>
  );
}

function EditClinicForm({ clinicId, onDone }: { clinicId: string; onDone: () => void }) {
  const clinicQuery = useQuery(clinicByIdQuery(clinicId));

  if (clinicQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (clinicQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-destructive text-sm font-medium">
          {clinicQuery.error instanceof Error
            ? clinicQuery.error.message
            : "Could not load clinic."}
        </p>
        <Button onClick={() => void clinicQuery.refetch()} size="sm" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!clinicQuery.data) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        This clinic no longer exists.
      </p>
    );
  }

  // useForm lives below — we can't call it conditionally, so the split is required.
  return <ClinicEditFields clinic={clinicQuery.data} clinicId={clinicId} onDone={onDone} />;
}

function ClinicEditFields({
  clinicId,
  clinic,
  onDone,
}: {
  clinicId: string;
  clinic: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  onDone: () => void;
}) {
  const updateMutation = useUpdateClinicMutation();

  const form = useForm({
    defaultValues: {
      name: clinic.name,
      email: clinic.email ?? "",
      phone: clinic.phone ?? "",
      address: clinic.address ?? "",
    },
    validators: { onSubmit: updateSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync({
          data: {
            clinicId,
            patch: {
              name: value.name.trim(),
              email: value.email.trim() || null,
              phone: value.phone.trim() || null,
              address: value.address.trim() || null,
            },
          },
        });
        toast.add({ type: "success", data: "Clinic updated" });
        onDone();
        return undefined;
      } catch (err) {
        // Bubble into TanStack Form's errorMap so the user sees why
        // the save failed instead of a silent no-op.
        return {
          form: err instanceof Error ? err.message : "Failed to save clinic",
        };
      }
    },
  });

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor="clinic-name">Name</Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              autoComplete="organization"
              id="clinic-name"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
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
              <Label htmlFor="clinic-phone">Phone</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="clinic-phone"
                inputMode="tel"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
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
              <Label htmlFor="clinic-email">Email</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="clinic-email"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
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
            <Label htmlFor="clinic-address">Address</Label>
            <Textarea
              id="clinic-address"
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

      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => {
          const message = fieldErrorMessage(err);
          return message ? (
            <p className="text-destructive text-sm" role="alert">
              {message}
            </p>
          ) : null;
        }}
      </form.Subscribe>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex justify-end gap-2">
            <Button disabled={isSubmitting} onClick={onDone} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
