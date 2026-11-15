import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { ClinicForm } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/new")({
  component: NewClinicPage,
});

function NewClinicPage() {
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  if (typeof user?.role !== "string" || user.role !== "admin") {
    return <PageHeader description="Only administrators can create clinics." title="New Clinic" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            nativeButton={false}
            render={<a aria-label="Cancel and return to clinics" href="/app/clinics" />}
            variant="outline"
          >
            Cancel
          </Button>
        }
        description="Register a clinic. You can add staff and patients afterwards."
        title="New Clinic"
      />
      <Card>
        <CardContent className="pt-6">
          <ClinicForm
            inline
            onSuccess={(clinic) => {
              void navigate({
                to: "/app/clinics/$clinicId",
                params: { clinicId: clinic.id },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
