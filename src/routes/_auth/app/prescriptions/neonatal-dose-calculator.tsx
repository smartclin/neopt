import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PediatricDosingCalculator } from "#/features/prescriptions/components/PediatricDosingCalculator.tsx";

export const Route = createFileRoute("/_auth/app/prescriptions/neonatal-dose-calculator")({
  component: NeonatalDoseCalculatorPage,
});

function NeonatalDoseCalculatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Calculate a reference dose and preparation volume without creating or saving a prescription."
        title="Neonatal dose calculator"
      />
      <Card>
        <CardContent className="pt-6">
          <PediatricDosingCalculator standalone />
        </CardContent>
      </Card>
    </div>
  );
}
