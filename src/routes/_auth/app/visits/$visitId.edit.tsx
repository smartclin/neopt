import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/blocks/page-header";
import { toast } from "@/components/ui/toast";
import { visitSnapshotQuery } from "@/features/visits/composer/queries";
import type { VisitComposerValues } from "@/features/visits/composer/schema";
import { VisitComposer } from "@/features/visits/composer/VisitComposer";
import { useDeleteVisitMutation, visitWithDetailsQuery } from "@/features/visits/queries";

export const Route = createFileRoute("/_auth/app/visits/$visitId/edit")({
  component: EditVisitPage,
});

function EditVisitPage() {
  const { visitId } = Route.useParams();
  const navigate = useNavigate();
  const deleteVisit = useDeleteVisitMutation();

  const detail = useQuery(visitWithDetailsQuery(visitId));
  const snapshotQ = useQuery({
    ...visitSnapshotQuery(detail.data?.patientId ?? ""),
    enabled: Boolean(detail.data?.patientId),
  });

  if (detail.isLoading || snapshotQ.isLoading) {
    return <PageHeader description="Loading…" title="Edit visit" />;
  }
  if (!detail.data || !snapshotQ.data) {
    return <PageHeader description="Not found." title="Edit visit" />;
  }

  const d = detail.data;
  const initial: VisitComposerValues = {
    patientId: d.patientId,
    clinicId: d.clinicId,
    doctorId: d.doctorId,
    visitedAt: new Date(d.visitedAt),
    chiefComplaint: d.chiefComplaint ?? "",
    symptoms: (d.symptoms ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as never,
    examFindings: d.physicalExam ?? "",
    template: null,
    measurements: (d.measurements ?? []).map((m) => ({
      draftId: `m-${m.id}`,
      indicator: m.indicator as never,
      value: m.value,
    })),
    diagnoses: (d.diagnoses ?? []).map((dx) => ({
      draftId: `dx-${dx.id}`,
      icdCode: dx.icdCode,
      description: dx.description,
      type: dx.type as never,
    })),
    prescriptions: (d.prescriptions ?? []).map((rx) => ({
      draftId: `rx-${rx.id}`,
      medicationName: rx.medicationName,
      dosage: rx.dosage,
      frequency: rx.frequency,
      durationDays: rx.durationDays,
      instructions: rx.instructions ?? "",
    })),
    plan: d.plan ?? "",
    followUpWeeks: 4,
  };

  return (
    <VisitComposer
      initial={initial}
      mode="edit"
      onDelete={async () => {
        try {
          await deleteVisit.mutateAsync({
            visitId,
            clinicId: d.clinicId,
            patientId: d.patientId,
          });
          toast.add({ type: "success", description: "Visit deleted" });
          void navigate({ to: "/app/visits" });
        } catch (err) {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to delete",
          });
        }
      }}
      onSuccess={() => void navigate({ to: "/app/visits/$visitId", params: { visitId } })}
      snapshot={snapshotQ.data}
      visitId={visitId}
    />
  );
}
