import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { MeasurementForm } from "#/features/measurements";
// ── read: query factory from patients/queries ──────────────────────────
import { getPatientForComposerQueryOptions } from "#/features/patients/queries";
import { ageInMonths } from "#/features/shared/helpers";

export const Route = createFileRoute("/_auth/app/patients/$patientId/measurements/new")({
  // `ensureQueryData` (not `query`) — otherwise the loader doesn't await
  // and `useLoaderData()` returns `undefined` on first render.
  // `fetchQuery` is the supported replacement for the deprecated
  // `ensureQueryData`. It awaits, honors staleTime, and returns data.
  loader: ({ context, params }) =>
    context.queryClient.fetchQuery(getPatientForComposerQueryOptions(params.patientId)),
  component: NewMeasurementPage,
});

function NewMeasurementPage() {
  const patient = Route.useLoaderData();
  const navigate = useNavigate();

  if (!patient) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Patient not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This patient may have been deleted or never existed.
        </p>
        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link to="/app/patients" />}
          variant="outline"
        >
          Back to patients
        </Button>
      </div>
    );
  }

  const ageMonths = ageInMonths(new Date(patient.dateOfBirth), new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          nativeButton={false}
          render={
            <Link
              params={{ patientId: patient.id }}
              search={{ tab: "overview" }}
              to="/app/patients/$patientId"
            />
          }
          size="sm"
          variant="ghost"
        >
          <ArrowLeftIcon className="mr-1.5 size-3.5" />
          Back to {patient.firstName} {patient.lastName}
        </Button>
      </div>

      <PageHeader
        description={`Log a new growth measurement for ${patient.firstName} ${patient.lastName}.`}
        title="New Measurement"
      />

      <MeasurementForm
        ageMonths={ageMonths}
        clinicId={patient.clinicId ?? ""}
        onSuccess={() =>
          navigate({
            params: { patientId: patient.id },
            search: { tab: "growth" },
            to: "/app/patients/$patientId/growth",
          })
        }
        patientId={patient.id}
        patientSex={patient.sex}
      />
    </div>
  );
}
