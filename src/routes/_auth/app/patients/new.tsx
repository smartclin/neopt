import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PatientForm } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/patients/new")({
  component: NewPatientPage,
});

function NewPatientPage() {
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="New Patient"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            nativeButton={false}
            render={<a aria-label="Cancel" href="/app/patients" />}
            variant="outline"
          >
            Cancel
          </Button>
        }
        description="Register a child at your clinic."
        title="New Patient"
      />
      <Card>
        <CardContent className="pt-6">
          <PatientForm
            clinicId={user.clinicId}
            inline
            onSuccess={(patient) => {
              void navigate({
                to: "/app/patients/$patientId",
                params: { patientId: patient.id },
                search: { tab: "overview" },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
