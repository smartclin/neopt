import {createFileRoute, Link} from "@tanstack/react-router";
import {CalendarIcon, PlusIcon} from "lucide-react";
import * as React from "react";

import {PageHeader} from "#/components/blocks/page-header.tsx";
import {Button} from "#/components/ui/button.tsx";
import {AppointmentSheet} from "#/features/appointments/components/AppointmentSheet.tsx";
import {FiltersRail} from "#/features/appointments/components/FiltersRail.tsx";
import {TodayQueue} from "#/features/appointments/components/TodayQueue.tsx";
import {WeekStrip} from "#/features/appointments/components/WeekStrip.tsx";
import {useAuthSuspense} from "#/lib/auth/hooks.ts";

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
              : " hover:text-foreground"
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

  const openNew = React.useCallback(() => {
    setEditId(undefined);
    setSheetOpen(true);
  }, []);

  const openEdit = React.useCallback((id: string) => {
    setEditId(id);
    setSheetOpen(true);
  }, []);

  const handleSelectDate = React.useCallback(
    (date: Date) => {
      setSelectedDate(date);
      openNew();
    },
    [openNew],
  );

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Appointments"
      />
    );
  }

  const clinicId = user.clinicId;

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
              <Button onClick={() => openNew()} size="sm" title="New appointment (N)">
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

        {/* Desktop: three-column grid. Mobile: single column, driven by SegmentedToggle. */}
        <div className="gap-6 md:grid md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_260px_220px]">
          {/* Today queue — shown on desktop and on mobile when "today" is active */}
          <div
            className={
              mobileView === "today"
                ? "bg-card rounded-xl border p-5"
                : "bg-card hidden rounded-xl border p-5 md:block"
            }
          >
            <TodayQueue clinicId={clinicId} onEdit={openEdit} onNew={() => openNew()} />
          </div>

          {/* Week strip — shown on desktop and on mobile when "week" is active */}
          <div className="flex flex-col gap-5">
            <div
              className={
                mobileView === "week"
                  ? "bg-card rounded-xl border p-5"
                  : "bg-card hidden rounded-xl border p-5 md:block"
              }
            >
              <WeekStrip
                clinicId={clinicId}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
            </div>
          </div>

          {/* Filters rail — shown on desktop (lg+) and on mobile when "all" is active */}
          <div
            className={
              mobileView === "all"
                ? "bg-card rounded-xl border p-5"
                : "bg-card hidden rounded-xl border p-5 lg:block"
            }
          >
            {/* Store-backed — no props. `doctors` left out until
                the route has a roster to pass in. */}
            <FiltersRail />
          </div>
        </div>
      </div>

      <AppointmentSheet
        appointmentId={editId}
        clinicId={clinicId}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditId(undefined);
          }
        }}
        onSaved={() => {
          setSheetOpen(false);
          setEditId(undefined);
          setSelectedDate(undefined);
        }}
        open={sheetOpen}
      />
    </>
  );
}
