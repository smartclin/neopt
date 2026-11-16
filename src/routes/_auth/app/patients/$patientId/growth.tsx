import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PatientGrowthPanel } from "#/features/index.ts";

export const Route = createFileRoute("/_auth/app/patients/$patientId/growth")({
  component: GrowthPage,
});

function GrowthPage() {
  const { patientId } = Route.useParams();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={`Longitudinal growth for patient ${patientId}.`}
        title="Growth Chart"
      />
      <Card>
        <CardContent>
          <div className="mt-6">
            <PatientGrowthPanel patientId={patientId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
