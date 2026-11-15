import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { FiltersRail } from "#/features/appointments/components/FiltersRail.tsx";
import { TodayQueue } from "#/features/appointments/components/TodayQueue.tsx";
import { WeekStrip } from "#/features/appointments/components/WeekStrip.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/")({
  component: AppointmentsPage,
});

type MobileView = "today" | "week" | "all";

function SegmentedToggle({
  value,
  onChange,
}: {
  value: MobileView;
  onChange: (v: MobileView) => void;
}) {
  const options: { value: MobileView; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "all", label: "All" },
  ];

  return (
    <div
      aria-label="View mode"
      className="bg-muted flex w-full items-center rounded-xl p-1"
      role="tablist"
    >
      {options.map((opt) => (
        <button
          aria-selected={value === opt.value}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          key={opt.value}
          onClick={() => onChange(opt.value)}
          role="tab"
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AppointmentsPage() {
  const { user } = useAuthSuspense();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [mobileView, setMobileView] = React.useState<MobileView>("today");

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Appointments"
      />
    );
  }

  const clinicId = user.clinicId;

  const openNew = () => {
    setEditId(undefined);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          actions={
            <div className="flex items-center gap-2">
              <Button
                nativeButton={false}
                render={<Link to="/app/appointments/calendar" />}
                size="sm"
                variant="outline"
              >
                <CalendarIcon className="size-3.5" />
                Calendar
              </Button>
              <Button onClick={openNew} size="sm" title="New appointment (N)">
                <PlusIcon className="size-3.5" />
                New
              </Button>
            </div>
          }
          description="Today's schedule and weekly overview."
          title="Appointments"
        />

        <div className="md:hidden">
          <SegmentedToggle onChange={setMobileView} value={mobileView} />
        </div>

        <div className="hidden gap-6 md:grid md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_260px_220px]">
          <div className="bg-card rounded-xl border p-5">
            <TodayQueue clinicId={clinicId} onEdit={openEdit} onNew={openNew} />
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-card rounded-xl border p-5">
              <WeekStrip
                clinicId={clinicId}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          </div>

          <div className="bg-card hidden rounded-xl border p-5 lg:block">
            {/* Store-backed — no props. `doctors` left out until
						    the route has a roster to pass in. */}
            <FiltersRail />
          </div>
        </div>

        <div className="md:hidden">
          {mobileView === "today" && (
            <div className="bg-card rounded-xl border p-4">
              <TodayQueue clinicId={clinicId} onEdit={openEdit} onNew={openNew} />
            </div>
          )}
          {mobileView === "week" && (
            <div className="bg-card rounded-xl border p-4">
              <WeekStrip
                clinicId={clinicId}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          )}
          {mobileView === "all" && (
            <div className="bg-card rounded-xl border p-4">
              <FiltersRail />
            </div>
          )}
        </div>
      </div>

      <AppointmentSheet
        appointmentId={editId}
        clinicId={clinicId}
        onOpenChange={setSheetOpen}
        onSaved={() => {
          setSheetOpen(false);
          setEditId(undefined);
        }}
        open={sheetOpen}
      />
    </>
  );
}
