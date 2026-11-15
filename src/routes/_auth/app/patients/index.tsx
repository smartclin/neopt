import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { PatientForm, PatientsTable } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/patients/")({
  component: PatientsPage,
});

const DEFAULT_PAGE_SIZE = 20;

function PatientsPage() {
  const { user } = useAuthSuspense();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Patients"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <PatientForm clinicId={user.clinicId} onSuccess={() => window.location.reload()} />
        }
        description="Browse and manage the children registered at your clinic."
        title="Patients"
      />
      <PatientsTable clinicId={user.clinicId} page={1} size={DEFAULT_PAGE_SIZE} />
    </div>
  );
}
