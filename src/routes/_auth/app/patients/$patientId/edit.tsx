// routes/_auth/app/patients/$patientId/edit.tsx
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { toast } from "#/components/ui/toast.tsx";
// ── reads + mutations ────────────────────────────────────────────────
import { getPatientQueryOptions, useUpdatePatientMutation } from "#/features/patients/queries";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_TABS = new Set([
  "overview",
  "visits",
  "growth",
  "immunizations",
  "development",
  "diagnoses",
  "prescriptions",
  "appointments",
]);

const searchSchema = z.object({
  tab: z
    .string()
    .optional()
    .transform((v) => (v && KNOWN_TABS.has(v) ? v : "overview")),
});

export const Route = createFileRoute("/_auth/app/patients/$patientId/edit")({
  validateSearch: searchSchema,
  component: EditPatientPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  phone: z.string().trim().max(32).or(z.literal("")),
  address: z.string().trim().max(500).or(z.literal("")),
  parentName: z.string().trim().max(120).or(z.literal("")),
  allergies: z.string().trim().max(500).or(z.literal("")),
});

type EditFormValues = z.infer<typeof editSchema>;

function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function EditPatientPage() {
  const { patientId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  const backToPatient = React.useCallback(() => {
    void navigate({
      to: "/app/patients/$patientId",
      params: { patientId },
      search: { tab },
    });
  }, [navigate, patientId, tab]);

  if (!user?.clinicId) {
    return <PageHeader description="No clinic is assigned to your account." title="Edit Patient" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button nativeButton onClick={backToPatient} variant="outline">
            Cancel
          </Button>
        }
        description={`Patient ID ${patientId}`}
        title="Edit Patient"
      />
      <Card>
        <CardContent>
          <PatientEditFields
            clinicId={user.clinicId}
            onDone={backToPatient}
            patientId={patientId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fields loader
// ─────────────────────────────────────────────────────────────────────────────

function PatientEditFields({
  patientId,
  clinicId,
  onDone,
}: {
  patientId: string;
  clinicId: string;
  onDone: () => void;
}) {
  const patientQuery = useQuery(getPatientQueryOptions(patientId));

  if (patientQuery.isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (patientQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-destructive text-sm font-medium">
          {patientQuery.error instanceof Error
            ? patientQuery.error.message
            : "Could not load patient."}
        </p>
        <Button onClick={() => void patientQuery.refetch()} size="sm" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!patientQuery.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className=" text-sm">This patient no longer exists.</p>
        <Button onClick={onDone} size="sm" variant="outline">
          Back to patients
        </Button>
      </div>
    );
  }

  return <PatientEditForm clinicId={clinicId} onDone={onDone} patient={patientQuery.data} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

interface EditablePatient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  allergies?: string | null;
  updatedAt: string | Date;
}

function PatientEditForm({
  patient,
  clinicId,
  onDone,
}: {
  patient: EditablePatient;
  clinicId: string;
  onDone: () => void;
}) {
  const updateMutation = useUpdatePatientMutation({
    patientId: patient.id,
    clinicId,
  });

  const form = useForm({
    defaultValues: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      parentName: patient.parentName ?? "",
      allergies: patient.allergies ?? "",
    },
    validators: { onSubmit: editSchema },
    onSubmit: async ({ value }) => {
      const trimmed: EditFormValues = {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        phone: value.phone.trim(),
        address: value.address.trim(),
        parentName: value.parentName.trim(),
        allergies: value.allergies.trim(),
      };

      try {
        // Optimistic concurrency: send the timestamp we loaded so the
        // server rejects the write if someone else edited meanwhile.
        const baseVersion =
          typeof patient.updatedAt === "string"
            ? patient.updatedAt
            : patient.updatedAt.toISOString();

        await updateMutation.mutateAsync({
          data: {
            patientId: patient.id,
            baseVersion,
            patch: {
              firstName: trimmed.firstName,
              lastName: trimmed.lastName,
              phone: trimmed.phone || null,
              address: trimmed.address || null,
              parentName: trimmed.parentName || null,
              allergies: trimmed.allergies || null,
            },
          },
        });

        toast.add({ type: "success", description: "Patient updated" });
        onDone();
        return undefined;
      } catch (err) {
        return {
          form: err instanceof Error ? err.message : "Failed to save patient",
        };
      }
    },
  });

  const submittingRef = React.useRef(false);

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (submittingRef.current) return;
        submittingRef.current = true;
        void form.handleSubmit().finally(() => {
          submittingRef.current = false;
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="firstName">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="First name"
            >
              <Input
                autoComplete="given-name"
                id={field.name}
                maxLength={120}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="Last name"
            >
              <Input
                autoComplete="family-name"
                id={field.name}
                maxLength={120}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="parentName">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="Parent / guardian"
            >
              <Input
                autoComplete="name"
                id={field.name}
                maxLength={120}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="Phone"
            >
              <Input
                autoComplete="tel"
                id={field.name}
                inputMode="tel"
                maxLength={32}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="tel"
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>
      </div>

      <form.Field name="address">
        {(field) => (
          <FieldShell
            error={fieldErrorMessage(field.state.meta.errors[0])}
            id={field.name}
            label="Address"
          >
            <Textarea
              autoComplete="street-address"
              id={field.name}
              maxLength={500}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              value={field.state.value}
            />
          </FieldShell>
        )}
      </form.Field>

      <form.Field name="allergies">
        {(field) => (
          <FieldShell
            error={fieldErrorMessage(field.state.meta.errors[0])}
            hint="Comma-separated, e.g. penicillin, peanuts"
            id={field.name}
            label="Allergies"
          >
            <Textarea
              id={field.name}
              maxLength={500}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              value={field.state.value}
            />
          </FieldShell>
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

// ─────────────────────────────────────────────────────────────────────────────
// Small shared field shell (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <label htmlFor={id}>{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              "aria-describedby"?: string;
              "aria-invalid"?: boolean;
            }>,
            {
              "aria-describedby": describedBy,
              "aria-invalid": Boolean(error),
            },
          )
        : children}
      {hint && (
        <p className=" text-[11px]" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-destructive text-sm" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
