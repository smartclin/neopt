// routes/_auth/app/patients/$patientId.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { RouteError } from "#/components/blocks/route-error.tsx";
import { Section } from "#/components/blocks/section.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { InfoRow } from "#/components/ui/info-row.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import {
  AppointmentForm,
  AppointmentsTable,
  DiagnosisTable,
  ImmunizationCard,
  MilestoneChecklist,
  PatientGrowthPanel,
  PrescriptionTable,
  VisitForm,
  VisitsTable,
} from "#/features/index.ts";
import { patientHistoryQuery } from "#/features/patients/queries.ts";
import { patientVisitsQuery } from "#/features/visits/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { Icons } from "@/components/icons";

// ─── Route ────────────────────────────────────────────────────────────────
//
// `ensureQueryData` is deprecated in this version of TanStack Router.
// `fetchQuery` is the supported replacement: it awaits the query, honors
// `staleTime`, and — critically — does NOT re-fetch when the query is
// already fresh in the cache. Behavior is identical for our purposes:
// the loader resolves with the cache primed, and the component's
// `useQuery` reads from cache on the first render.

export const Route = createFileRoute("/_auth/app/patients/$patientId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.query(patientHistoryQuery(params.patientId)),
      context.queryClient.query(patientVisitsQuery(params.patientId)),
    ]),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string | undefined) ?? "overview",
  }),
  component: PatientLayout,
  errorComponent: ({ error, reset }) => (
    <RouteError
      kind="unknown"
      message={errorMessage(error)}
      onRetry={reset}
      title="Couldn't load this patient"
    />
  ),
  pendingComponent: () => <PatientDetailSkeleton />,
});

// ─── Page ─────────────────────────────────────────────────────────────────

function PatientLayout() {
  const { patientId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  const patientQ = useQuery(patientHistoryQuery(patientId));
  const visitsQ = useQuery(patientVisitsQuery(patientId));

  const patient = patientQ.data;
  const visits = visitsQ.data ?? [];
  const latestVisit = visits[0];

  const ageMonths = useMemo(() => {
    if (!patient?.dateOfBirth) return undefined;
    const days = (Date.now() - new Date(`${patient.dateOfBirth}T00:00:00Z`).getTime()) / 86_400_000;
    return days / 30.4375;
  }, [patient?.dateOfBirth]);

  // Safety-critical: never render a partial chart while the primary
  // record is unresolved.
  if (patientQ.isPending) return <PatientDetailSkeleton />;
  if (patientQ.isError) {
    return (
      <RouteError
        kind="unknown"
        message={errorMessage(patientQ.error)}
        onRetry={() => patientQ.refetch()}
        title="Couldn't load this patient"
      />
    );
  }
  if (!patientQ.data) return <RouteNotFound title="Patient not found" />;

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Patient"
      />
    );
  }
  if (!patient) return <RouteNotFound title="Patient not found" />;

  const clinicId = user.clinicId;

  return (
    <div aria-busy={visitsQ.isFetching} className="flex flex-col gap-6">
      {visitsQ.isError && (
        <InlineBanner tone="warning">
          Visits failed to refresh. Showing last loaded data.{" "}
          <Button onClick={() => void visitsQ.refetch()} size="xs" variant="link">
            Retry
          </Button>
        </InlineBanner>
      )}

      <Button
        className="w-fit"
        nativeButton={false}
        render={<Link to="/app/patients" />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to patients
      </Button>

      <PageHeader
        actions={
          <>
            <VisitForm clinicId={clinicId} patientId={patientId} />
            <AppointmentForm clinicId={clinicId} patientId={patientId} />
            <Button
              nativeButton={false}
              render={
                <Link params={{ patientId }} search={{ tab }} to="/app/patients/$patientId/edit" />
              }
              variant="outline"
            >
              <PencilIcon aria-hidden="true" />
              Edit
            </Button>
          </>
        }
        description={`MRN ${patient.mrn} · ${patient.sex} · ${
          ageMonths != null ? `${ageMonths.toFixed(1)} months` : "—"
        }`}
        title={`${patient.firstName} ${patient.lastName}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <InfoRow label="Date of birth" value={patient.dateOfBirth} />
          <InfoRow label="Parent" value={patient.parentName} />
          <InfoRow label="Phone" value={patient.phone ?? patient.parentPhone} />
          <InfoRow label="Address" value={patient.address} />
          <InfoRow label="Allergies" value={patient.allergies} />
          <InfoRow label="Notes" value={patient.notes} />
        </CardContent>
      </Card>

      <Tabs
        onValueChange={(next) => {
          void navigate({
            to: "/app/patients/$patientId",
            params: { patientId },
            search: { tab: next },
          });
        }}
        value={tab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientGrowthPanel
                  currentX={latestVisit?.ageMonths}
                  latestAgeMonths={latestVisit?.ageMonths}
                  latestVisitId={latestVisit?.id}
                  patientId={patientId}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Latest visit</CardTitle>
              </CardHeader>
              <CardContent>
                {latestVisit ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow
                      label="Date"
                      value={new Date(latestVisit.visitedAt).toLocaleString("en-US")}
                    />
                    <InfoRow label="Age" value={`${latestVisit.ageMonths.toFixed(1)} months`} />
                    <InfoRow label="Doctor" value={latestVisit.doctorId ?? null} />
                    <Button
                      nativeButton={false}
                      render={
                        <Link params={{ visitId: latestVisit.id }} to="/app/visits/$visitId" />
                      }
                      variant="outline"
                    >
                      View encounter
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No visits recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <Section
            action={<VisitForm clinicId={clinicId} patientId={patientId} />}
            title="Visit history"
          >
            <VisitsTable visits={visits} />
          </Section>
        </TabsContent>

        <TabsContent value="growth">
          <Card>
            <CardContent>
              <PatientGrowthPanel patientId={patientId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent>
                <MilestoneChecklist childAgeMonths={ageMonths ?? 0} />
              </CardContent>
            </Card>
            <Button
              className="w-fit"
              nativeButton={false}
              render={<Link params={{ patientId }} to="/app/development/$patientId" />}
              variant="outline"
            >
              Open full developmental tracker
              <Icons.chevronRight aria-hidden="true" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="immunizations">
          <ImmunizationCard
            patientDob={patient.dateOfBirth}
            patientId={patientId}
            visitId={latestVisit?.id}
          />
        </TabsContent>

        <TabsContent value="diagnoses">
          {latestVisit ? (
            <DiagnosisTable page={1} size={20} visitId={latestVisit.id} />
          ) : (
            <p className="text-muted-foreground text-sm">Record a visit before adding diagnoses.</p>
          )}
        </TabsContent>

        <TabsContent value="prescriptions">
          <PrescriptionTable page={1} patientId={patientId} size={20} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTable clinicId={clinicId} />
        </TabsContent>
      </Tabs>

      <Outlet />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function InlineBanner({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  const toneClass =
    tone === "warning"
      ? "border-warning/30 bg-warning/5 text-accent-foreground dark:text-accent"
      : "border-ring/30 bg-sidebar-ring/5 text-muted-foreground dark:text-sidebar-border";
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs ${toneClass}`}
      role="status"
    >
      <span>{children}</span>
    </div>
  );
}

function RouteNotFound({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icons.alertCircle aria-hidden="true" className="text-muted-foreground size-8" />
      <p className="text-lg font-semibold">{title}</p>
      <Button nativeButton={false} render={<Link to="/app/patients" />} variant="outline">
        Back to patients
      </Button>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading patient record" className="flex flex-col gap-6">
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="space-y-1" key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="h-9 w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Turn an arbitrary error into a message safe to show a clinician.
 * Prefer the server's message when it's an Error, but never leak a
 * stack trace or an internal identifier.
 */
function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length < 200) {
    // Only surface messages that look deliberately user-facing.
    // Postgres / Drizzle errors contain SQL identifiers and are not safe to show.
    if (!/^(error:|duplicate key|violates|relation|column|syntax)/i.test(err.message)) {
      return err.message;
    }
  }
  return "No changes were made. Check your connection and retry.";
}
