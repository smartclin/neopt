// routes/_auth/app/visits/index.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { SectionState } from "#/components/blocks/state-view.tsx";
import { Icons } from "#/components/icons.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { VisitsTable } from "#/features/visits/components/VisitsTable.tsx";
import { recentVisitsQuery } from "#/features/visits/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/visits/")({
  validateSearch: z.object({
    page: z.number().int().min(1).optional(),
  }),
  component: VisitsPage,
});

function VisitsPage() {
  const { user } = useAuthSuspense();

  const query = useQuery({
    ...recentVisitsQuery(user?.clinicId ?? ""),
    enabled: Boolean(user?.clinicId),
  });

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Visits"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader description="Recent encounters, diagnoses, and clinical notes." title="Visits" />

      <Card>
        <CardHeader>
          <CardTitle>Encounter log</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : query.isError ? (
            <SectionState
              action={
                <Button onClick={() => void query.refetch()} variant="outline">
                  Try Again
                </Button>
              }
              description={
                query.error instanceof Error ? query.error.message : "Failed to load visits."
              }
              icon={Icons.alertCircle}
              title="Could Not Load Visits"
            />
          ) : (
            <VisitsTable showPatientColumn visits={query.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
