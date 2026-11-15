import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/$appointmentId")({
  component: AppointmentDetailPage,
});

function AppointmentDetailPage() {
  const { user } = useAuthSuspense();
  const navigate = useNavigate();
  const { appointmentId } = Route.useParams();

  if (!user?.clinicId) return null;

  return (
    <AppointmentSheet
      appointmentId={appointmentId}
      clinicId={user.clinicId}
      onOpenChange={(open) => {
        if (!open) {
          void navigate({ to: "/app/appointments" });
        }
      }}
      onSaved={() => void navigate({ to: "/app/appointments" })}
      open
    />
  );
}
