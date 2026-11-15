// routes/_auth/app/development/index.tsx
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { MilestoneChecklist } from "#/features/development";

export const Route = createFileRoute("/_auth/app/development/")({
  component: DevelopmentPage,
});

function DevelopmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="WHO/CDC-aligned developmental screening milestones by age bracket."
        title="Developmental Milestones"
      />
      <Card>
        <CardContent className="pt-6">
          <MilestoneChecklist />
        </CardContent>
      </Card>
    </div>
  );
}
