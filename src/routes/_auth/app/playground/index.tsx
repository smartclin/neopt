// src/routes/_auth/app/playground/index.tsx
import {createFileRoute} from "@tanstack/react-router";

import {PageHeader} from "#/components/blocks/page-header.tsx";
import {Card, CardContent} from "#/components/ui/card.tsx";
import {SomeChart} from "#/features/dashboard/components/SomeChart.tsx";

export const Route = createFileRoute("/_auth/app/playground/")({
  component: PlaygroundPage,
});

const MOCK_DATA = [
  { month: "Jan", visits: 120, newPatients: 30 },
  { month: "Feb", visits: 145, newPatients: 42 },
  { month: "Mar", visits: 160, newPatients: 38 },
  { month: "Apr", visits: 132, newPatients: 25 },
  { month: "May", visits: 178, newPatients: 51 },
  { month: "Jun", visits: 190, newPatients: 47 },
];

function PlaygroundPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Sandbox for unreleased components. Not part of the product surface."
        title="Playground"
      />

      <Card>
        <CardContent>
          <div className="mt-6">
            <SomeChart data={MOCK_DATA} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
