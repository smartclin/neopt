import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Section } from "#/components/blocks/section.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { InfoRow } from "#/components/ui/info-row.tsx";
// ── read: query factory from queries.ts ────────────────────────────────
import { clinicWithStatsQuery } from "#/features/clinics/queries";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/$clinicId")({
  component: ClinicLayout,
});

function ClinicLayout() {
  const { clinicId } = Route.useParams();
  const { user } = useAuthSuspense();

  if (typeof user?.role !== "string" || user.role !== "admin") {
    return <PageHeader description="Only administrators can view clinic details." title="Clinic" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        className="w-fit"
        nativeButton={false}
        render={<Link to="/app/clinics" />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to clinics
      </Button>
      <ClinicDetail clinicId={clinicId} />
      <Outlet />
    </div>
  );
}

function ClinicDetail({ clinicId }: { clinicId: string }) {
  // ── read via factory ────────────────────────────────────────────────
  const { data: clinic } = useSuspenseQuery(clinicWithStatsQuery(clinicId));

  if (!clinic) {
    return (
      <PageHeader description={`No clinic exists with ID ${clinicId}.`} title="Clinic not found" />
    );
  }

  const patientCount = clinic.patients?.length ?? 0;
  const staffCount = clinic.users?.length ?? 0;
  const upcomingCount = clinic.appointments?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            nativeButton={false}
            render={<Link params={{ clinicId }} to="/app/clinics/$clinicId/edit" />}
            variant="outline"
          >
            <PencilIcon aria-hidden="true" />
            Edit
          </Button>
        }
        description="Clinic overview and directory."
        title={clinic.name}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Patients" value={patientCount} />
        <StatCard label="Staff" value={staffCount} />
        <StatCard label="Upcoming appointments" value={upcomingCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Phone" value={clinic.phone} />
          <InfoRow label="Email" value={clinic.email} />
          <InfoRow label="Address" value={clinic.address} />
        </CardContent>
      </Card>

      <Section description="Users linked to this clinic." title="Staff">
        {clinic.users.length === 0 ? (
          <p className=" py-6 text-center text-sm">No staff linked to this clinic yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {clinic.users.map((u) => (
              <li className="flex items-center justify-between px-3 py-2 text-sm" key={u.id}>
                <span className="font-medium">{u.name ?? "Unknown staff"}</span>
                <span className=" text-xs capitalize">{u.role ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
      </CardContent>
    </Card>
  );
}
