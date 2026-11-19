import {createFileRoute, useNavigate} from "@tanstack/react-router";

import {AppointmentSheet} from "#/features/appointments/components/AppointmentSheet.tsx";
import {useAuthSuspense} from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: (search.patientId as string | undefined) ?? undefined,
  }),
  component: NewAppointmentPage,
});

function NewAppointmentPage() {
  const { user } = useAuthSuspense();
  const navigate = useNavigate();
  const { patientId } = Route.useSearch();

  if (!user?.clinicId) return null;

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
