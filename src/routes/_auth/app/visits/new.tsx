import { PageHeader } from "@/components/blocks/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { visitSnapshotQuery } from "@/features/visits/composer/queries";
import {
  VISIT_COMPOSER_DEFAULTS,
  type VisitComposerValues,
} from "@/features/visits/composer/schema";
import { VisitComposer } from "@/features/visits/composer/VisitComposer";
import { useAuthSuspense } from "@/lib/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React from "react";
import { z } from "zod";

export const Route = createFileRoute("/_auth/app/visits/new")({
  validateSearch: z.object({ patientId: z.string() }),
  component: NewVisitPage,
});

function NewVisitPage() {
  const { user } = useAuthSuspense();
  const { patientId } = Route.useSearch();
  const navigate = useNavigate();

  const snapshotQ = useQuery(visitSnapshotQuery(patientId));

  const initial: VisitComposerValues = React.useMemo(
    () => ({
      ...VISIT_COMPOSER_DEFAULTS,
      patientId,
      clinicId: user?.clinicId ?? "",
      doctorId: null,
    }),
    [patientId, user?.clinicId],
  );

  if (!user?.clinicId) {
    return <PageHeader description="No clinic assigned." title="New visit" />;
  }
  if (snapshotQ.isLoading) return <Skeleton className="h-96 w-full" />;
  if (!snapshotQ.data) return <PageHeader description="Patient not found." title="New visit" />;

  return (
    <VisitComposer
      initial={initial}
      mode="create"
      onSuccess={(visitId: string) =>
        void navigate({
          to: "/app/visits/$visitId",
          params: { visitId },
        })
      }
      snapshot={snapshotQ.data}
    />
  );
}
