import {createFileRoute, useNavigate} from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import {AppointmentSheet} from "#/features/appointments/components/AppointmentSheet.tsx";
import { uuidSchema } from "#/features/shared/helpers.ts";
import {useAuthSuspense} from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/new")({
  validateSearch: (search: Record<string, unknown>) => {
    const patientId = uuidSchema.safeParse(search.patientId);
    return { patientId: patientId.success ? patientId.data : undefined };
  },
  component: NewAppointmentPage,
});

function NewAppointmentPage() {
  const { user } = useAuthSuspense();
  const navigate = useNavigate();
  const { patientId } = Route.useSearch();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="New Appointment"
      />
    );
  }

  const close = () => void navigate({ to: "/app/appointments" });

  return (
    <AppointmentSheet
      clinicId={user.clinicId}
      defaultPatientId={patientId}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      onSaved={close}
      open
    />
  );
}
