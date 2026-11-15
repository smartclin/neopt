// routes/_auth/app/visits/$visitId.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { RouteError } from "#/components/blocks/route-error.tsx";
import { Section } from "#/components/blocks/section.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { InfoRow } from "#/components/ui/info-row.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import {
  DiagnosisForm,
  DiagnosisTable,
  MeasurementForm,
  MeasurementsTable,
  PrescriptionForm,
  PrescriptionTable,
} from "#/features/index.ts";
import { visitWithDetailsQuery } from "#/features/visits/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { Icons } from "@/components/icons";

// ─── Route ────────────────────────────────────────────────────────────────
//
// `queryClient.query` isn't a thing on TanStack Router's QueryClient
// context — the deprecated-but-working method is `ensureQueryData`, and
// the supported replacement is `fetchQuery`. Use `fetchQuery` so the
// loader awaits, populates the cache, and surfaces errors to
// `errorComponent` instead of rejecting silently.

export const Route = createFileRoute("/_auth/app/visits/$visitId")({
  loader: ({ context, params }) =>
    context.queryClient.fetchQuery(visitWithDetailsQuery(params.visitId)),
  component: VisitDetailPage,
  errorComponent: ({ error, reset }) => (
    <RouteError
      kind="unknown"
      message={errorMessage(error)}
      onRetry={reset}
      title="Couldn't load this visit"
    />
  ),
  pendingComponent: () => <VisitDetailSkeleton />,
});

// ─── Page ─────────────────────────────────────────────────────────────────

function VisitDetailPage() {
  const { visitId } = Route.useParams();
  const { user } = useAuthSuspense();

  const query = useQuery(visitWithDetailsQuery(visitId));

  // Auth gate first — this is a *redirect* concern, not a data concern.
  // Note: `useAuthSuspense` already throws a redirect if not signed in,
  // so this branch only fires for signed-in users with no clinic.
  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Visit"
      />
    );
  }

  if (query.isPending) return <VisitDetailSkeleton />;

  if (query.isError || !query.data) {
    // `query.data === undefined` without `isError` means the query
    // resolved but the record doesn't exist — a genuine 404.
    if (!query.isError) {
      return <RouteNotFound title="Visit not found" />;
    }
    return (
      <RouteError
        kind="unknown"
        message={errorMessage(query.error)}
        onRetry={() => void query.refetch()}
        title="Couldn't load this visit"
      />
    );
  }

  const visit = query.data;
  const patient = visit.patient;

  return (
    <div className="flex flex-col gap-6">
      <Button
        className="w-fit"
        nativeButton={false}
        render={
          <Link
            params={{ patientId: visit.patientId }}
            search={{ tab: "visits" }}
            to="/app/patients/$patientId"
          />
        }
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to patient
      </Button>

      <PageHeader
        description={`Visit on ${new Date(visit.visitedAt).toLocaleString("en-US")}`}
        title={patient ? `${patient.firstName} ${patient.lastName}` : "Visit"}
      />

      <Card>
        <CardHeader>
          <CardTitle>Encounter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <InfoRow label="Age at visit" value={`${visit.ageMonths.toFixed(1)} months`} />
          <InfoRow label="Doctor" value={visit.doctor?.name ?? null} />
          <InfoRow label="MRN" value={patient?.mrn ?? null} />
        </CardContent>
      </Card>

      <Section
        action={
          <MeasurementForm
            patientId={visit.patientId}
            visitId={visitId}
            {...visitMeasurementCtx(visit, patient)}
          />
        }
        title="Measurements"
      >
        <MeasurementsTable
          indicator="weight-for-age"
          page={1}
          patientId={visit.patientId}
          size={10}
        />
      </Section>

      <Section action={<DiagnosisForm visitId={visitId} />} title="Diagnoses">
        <DiagnosisTable page={1} size={10} visitId={visitId} />
      </Section>

      <Section
        action={
          <PrescriptionForm
            clinicId={visit.clinicId}
            patientId={visit.patientId}
            visitId={visitId}
          />
        }
        title="Prescriptions"
      >
        <PrescriptionTable page={1} size={10} visitId={visitId} />
      </Section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function RouteNotFound({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icons.alertCircle aria-hidden="true" className="text-muted-foreground size-8" />
      <p className="text-lg font-semibold">{title}</p>
      <Button nativeButton={false} render={<Link to="/app/visits" />} variant="outline">
        Back to visits
      </Button>
    </div>
  );
}

function VisitDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading visit" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="space-y-1" key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message && err.message.length < 200) {
    return err.message;
  }
  return "No changes were made. Check your connection and retry.";
}

function visitMeasurementCtx(
  visit: { ageMonths: number },
  patient: { sex: "male" | "female" } | null,
) {
  return {
    ageMonths: visit.ageMonths,
    patientSex: patient?.sex ?? ("male" as const),
  };
}
