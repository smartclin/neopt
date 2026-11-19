import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { RouteError } from "#/components/blocks/route-error.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { appointmentByIdQuery } from "#/features/appointments/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { authQueryOptions } from "#/lib/auth/queries.ts";

export const Route = createFileRoute("/_auth/app/appointments/$appointmentId")({
  loader: async ({ context, params }) => {
    const user = await context.queryClient.query({
      ...authQueryOptions(),
      staleTime: "static",
    });
    if (!user?.clinicId) return null;

    const appointment = await context.queryClient.fetchQuery(
      appointmentByIdQuery(params.appointmentId),
    );
    if (!appointment) throw new Error("Appointment not found.");
    return appointment;
  },
  component: AppointmentDetailPage,
  errorComponent: ({ error, reset }) => (
    <RouteError
      kind="unknown"
      message={errorMessage(error)}
      onRetry={reset}
      title="Couldn't load this appointment"
    />
  ),
  pendingComponent: () => <AppointmentDetailSkeleton />,
});

function AppointmentDetailPage() {
  const { user } = useAuthSuspense();
  const navigate = useNavigate();
  const { appointmentId } = Route.useParams();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Appointment"
      />
    );
  }

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

function AppointmentDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading appointment" className="p-6">
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length < 200) {
    if (!/^(error:|duplicate key|violates|relation|column|syntax)/i.test(error.message)) {
      return error.message;
    }
  }
  return "No changes were made. Check your connection and retry.";
}
