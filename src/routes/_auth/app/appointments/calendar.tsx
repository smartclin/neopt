import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { CalendarView } from "#/features/appointments/components/CalendarView.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/calendar")({
  component: AppointmentsCalendarPage,
});

function AppointmentsCalendarPage() {
  const { user } = useAuthSuspense();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | undefined>(undefined);
  const [prefilledDate, setPrefilledDate] = React.useState<Date | undefined>(undefined);

  if (!user?.clinicId) {
    return <PageHeader description="No clinic is assigned to your account." title="Calendar" />;
  }

  const clinicId = user.clinicId;

  const openNew = (date?: Date) => {
    setEditId(undefined);
    setPrefilledDate(date);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setPrefilledDate(undefined);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <Button
          className="w-fit"
          nativeButton={false}
          render={<Link to="/app/appointments" />}
          size="sm"
          variant="ghost"
        >
          <ArrowLeftIcon aria-hidden="true" />
          Back to overview
        </Button>

        <PageHeader
          actions={
            <Button onClick={() => openNew()} size="sm">
              <PlusIcon className="size-3.5" />
              New appointment
            </Button>
          }
          description="Week and month schedule view."
          title="Calendar"
        />

        <CalendarView clinicId={clinicId} onEdit={openEdit} onNew={openNew} />
      </div>

      <AppointmentSheet
        key={editId ?? "new"}
        appointmentId={editId}
        clinicId={clinicId}
        defaultScheduledAt={prefilledDate}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditId(undefined);
            setPrefilledDate(undefined);
          }
        }}
        onSaved={() => setSheetOpen(false)}
        open={sheetOpen}
      />
    </>
  );
}
