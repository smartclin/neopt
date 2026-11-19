import {useQuery} from "@tanstack/react-query";
import {ChevronLeftIcon, ChevronRightIcon, PlusIcon} from "lucide-react";
import * as React from "react";

import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Skeleton} from "@/components/ui/skeleton";
import {Spinner} from "@/components/ui/spinner";
// ── dates & format ─────────────────────────────────────────────────────
import {formatDayHeading, formatMonth, formatShortDay, formatWeekRange} from "@/lib/dates";
import {
    addDays,
    groupByDay,
    isEditableTarget,
    isSameDay,
    startOfDay,
    startOfMonth,
    startOfWeek,
    toDateKey,
} from "@/lib/dates";
import {cn} from "@/lib/utils";

import type {AppointmentInRange} from "../types";

import {appointmentsInRangeQuery} from "../queries";
import {AppointmentStatusPill} from "./AppointmentStatusPill";

// ── Local types ────────────────────────────────────────────────────────

type ViewMode = "week" | "month";

// ── Mini-month navigator ───────────────────────────────────────────────

interface MiniMonthProps {
  anchor: Date;
  onSelect: (d: Date) => void;
  onNavigate?: (month: Date) => void;
}

function MiniMonth({ anchor, onSelect, onNavigate }: MiniMonthProps) {
  const base = startOfMonth(anchor);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfDay(new Date());

  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const goToMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    if (onNavigate) onNavigate(next);
    else onSelect(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button
          aria-label="Previous month"
          onClick={() => goToMonth(-1)}
          size="icon-xs"
          variant="ghost"
        >
          <ChevronLeftIcon className="size-3" />
        </Button>
        <span aria-live="polite" className="text-xs font-semibold">
          {formatMonth(base)}
        </span>
        <Button aria-label="Next month" onClick={() => goToMonth(1)} size="icon-xs" variant="ghost">
          <ChevronRightIcon className="size-3" />
        </Button>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-px">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span className="text-center text-[0.55rem] font-semibold uppercase" key={i}>
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) =>
          day === null ? (
            <span aria-hidden="true" key={`e-${i}`} />
          ) : (
            <button
              aria-current={isSameDay(day, today) ? "date" : undefined}
              aria-label={formatDayHeading(day)}
              aria-pressed={isSameDay(day, anchor)}
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[0.65rem] transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                isSameDay(day, today) && !isSameDay(day, anchor) && "ring-primary ring-1",
                isSameDay(day, anchor) && "bg-primary text-primary-foreground",
                !isSameDay(day, anchor) && "hover:bg-muted",
              )}
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              type="button"
            >
              {day.getDate()}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

// ── Appointment pill (small wrapper around the shared status pill) ─────

interface AppointmentPillProps {
  appt: AppointmentInRange;
  onEdit: (id: string) => void;
  compact?: boolean;
}

function AppointmentPill({ appt, onEdit, compact = false }: AppointmentPillProps) {
  const raw = new Date(appt.scheduledAt);
  const timeText = Number.isNaN(raw.getTime())
    ? "—"
    : raw.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const patientName = appt.patient
    ? `${appt.patient.firstName} ${appt.patient.lastName}`
    : "Unknown patient";

  return (
    <AppointmentStatusPill onClick={() => onEdit(appt.id)} status={appt.status}>
      <span className="mt-px shrink-0 font-mono text-[0.6rem] tabular-nums opacity-70">
        {timeText}
      </span>

      {!compact && (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[0.7rem] leading-tight font-semibold">{patientName}</span>
          {appt.reason && <span className="truncate text-[0.6rem] opacity-70">{appt.reason}</span>}
          {appt.doctor && <span className="text-[0.6rem] opacity-60">{appt.doctor.name}</span>}
        </div>
      )}
    </AppointmentStatusPill>
  );
}

// ── Week view ──────────────────────────────────────────────────────────

interface WeekViewProps {
  weekStart: Date;
  byDay: Map<string, AppointmentInRange[]>;
  isLoading: boolean;
  onEdit: (id: string) => void;
  onNewAt: (d: Date) => void;
}

const MAX_SLOTS = 12;

function WeekView({ weekStart, byDay, isLoading, onEdit, onNewAt }: WeekViewProps) {
  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const today = React.useMemo(() => startOfDay(new Date()), []);

  return (
    <div aria-label="Week calendar" className="grid grid-cols-7 gap-px" role="group">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const count = byDay.get(toDateKey(day))?.length ?? 0;
        const pct = Math.min(count / MAX_SLOTS, 1);

        return (
          <div
            aria-label={formatDayHeading(day)}
            className="flex flex-col gap-1 pb-1"
            key={day.toISOString()}
            role="group"
          >
            <div
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-2",
                isToday && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "text-[0.6rem] font-semibold tracking-wide uppercase",
                  isToday ? "text-primary" : "",
                )}
              >
                {formatShortDay(day)}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
              <div aria-hidden="true" className="bg-muted mx-2 h-[2px] w-full rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct > 0.8 ? "bg-destructive" : pct > 0.5 ? "bg-warning" : "bg-primary/50",
                  )}
                  style={{ width: `${Math.round(pct * 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {days.map((day) => {
        const dayAppts = byDay.get(toDateKey(day)) ?? [];
        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <div
            aria-label={`${formatDayHeading(day)} — ${dayAppts.length} appointment${dayAppts.length === 1 ? "" : "s"}`}
            className={cn(
              "group min-h-[12rem] rounded-xl p-1.5",
              isToday ? "bg-primary/[0.03]" : "bg-muted/20",
              isWeekend && "bg-muted/40",
            )}
            key={`body-${day.toISOString()}`}
            role="group"
          >
            {isLoading ? (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {dayAppts.map((appt) => (
                  <AppointmentPill appt={appt} key={appt.id} onEdit={onEdit} />
                ))}
                <button
                  aria-label={`Add appointment on ${formatDayHeading(day)}`}
                  className={cn(
                    "bg-muted/40 hover:bg-muted/60",
                    "focus-visible:ring-ring flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs transition-all",
                    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none",
                  )}
                  onClick={() => onNewAt(day)}
                  type="button"
                >
                  <PlusIcon className="size-3" />
                  Add
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Month view ─────────────────────────────────────────────────────────

interface MonthViewProps {
  monthStart: Date;
  byDay: Map<string, AppointmentInRange[]>;
  isLoading: boolean;
  onEdit: (id: string) => void;
  onNewAt: (d: Date) => void;
}

const MAX_VISIBLE = 3;

function MonthView({ monthStart, byDay, isLoading, onEdit, onNewAt }: MonthViewProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = React.useMemo(() => {
    const arr: (Date | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month, offset, daysInMonth]);

  const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div aria-label="Month calendar" className="grid grid-cols-7 gap-px" role="group">
      {weekdayHeaders.map((h) => (
        <div
          className="pb-2 text-center text-[0.65rem] font-semibold tracking-wide uppercase"
          key={h}
          role="presentation"
        >
          {h}
        </div>
      ))}

      {cells.map((day, i) => {
        if (day === null) {
          return (
            <div
              aria-hidden="true"
              className="bg-muted/20 min-h-[6rem] rounded-xl"
              key={`empty-${i}`}
            />
          );
        }

        const dayAppts = byDay.get(toDateKey(day)) ?? [];
        const visible = dayAppts.slice(0, MAX_VISIBLE);
        const overflow = dayAppts.length - MAX_VISIBLE;
        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <div
            aria-label={`${formatDayHeading(day)} — ${dayAppts.length} appointment${dayAppts.length === 1 ? "" : "s"}`}
            className={cn(
              "group min-h-[6rem] rounded-xl p-2",
              isToday ? "bg-primary/[0.04]" : "bg-muted/20",
              isWeekend && "bg-muted/40",
            )}
            key={day.toISOString()}
            role="group"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
              <button
                aria-label={`Add appointment on ${formatDayHeading(day)}`}
                className={cn(
                  "bg-muted/40 hover:bg-muted/60",
                  "focus-visible:ring-ring rounded-sm opacity-0 transition-opacity",
                  "group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none",
                )}
                onClick={() => onNewAt(day)}
                type="button"
              >
                <PlusIcon className="size-3" />
              </button>
            </div>

            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-full" />
            ) : (
              <div className="mt-1 flex flex-col gap-0.5">
                {visible.map((appt) => (
                  <AppointmentPill appt={appt} compact key={appt.id} onEdit={onEdit} />
                ))}
                {overflow > 0 && (
                <button
  aria-label={`Show all ${dayAppts.length} appointments on ${formatDayHeading(day)}`}
  className="hover:text-foreground focus-visible:ring-ring rounded-sm text-[0.6rem] hover:underline focus-visible:ring-2 focus-visible:outline-none"
  onClick={() => onEdit(dayAppts[0]?.id ?? "")}
  type="button"
>
  +{overflow} more
</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main CalendarView ──────────────────────────────────────────────────

interface CalendarViewProps {
  clinicId: string;
  onEdit: (appointmentId: string) => void;
  onNew: (date?: Date) => void;
}

export function CalendarView({ clinicId, onEdit, onNew }: CalendarViewProps) {
  const [view, setView] = React.useState<ViewMode>("week");
  const [anchor, setAnchor] = React.useState<Date>(() => startOfDay(new Date()));

  const rangeStart = React.useMemo(
    () => (view === "week" ? startOfWeek(anchor) : startOfMonth(anchor)),
    [view, anchor],
  );

  const rangeEnd = React.useMemo(() => {
    if (view === "week") return addDays(rangeStart, 7);
    return new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 1);
  }, [view, rangeStart]);

  const query = useQuery(
    appointmentsInRangeQuery(clinicId, rangeStart.toISOString(), rangeEnd.toISOString()),
  );

  const appointments = React.useMemo(() => query.data ?? [], [query.data]);
  const byDay = React.useMemo(() => {
    return new Map(Object.entries(groupByDay(appointments)));
  }, [appointments]);

  const goTo = React.useCallback(
    (direction: -1 | 1) => {
      setAnchor((a) => {
        if (view === "week") return addDays(a, direction * 7);
        return new Date(a.getFullYear(), a.getMonth() + direction, 1);
      });
    },
    [view],
  );

  const goToday = React.useCallback(() => setAnchor(startOfDay(new Date())), []);

  const goToRef = React.useRef(goTo);
  const goTodayRef = React.useRef(goToday);
  const onNewRef = React.useRef(onNew);

  React.useEffect(() => {
    goToRef.current = goTo;
    goTodayRef.current = goToday;
    onNewRef.current = onNew;
  }, [goTo, goToday, onNew]);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isEditableTarget(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToRef.current(1);
      } else if (e.key === "t") {
        e.preventDefault();
        goTodayRef.current();
      } else if (e.key === "n") {
        e.preventDefault();
        onNewRef.current();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const rangeLabel =
    view === "week" ? formatWeekRange(rangeStart, addDays(rangeStart, 6)) : formatMonth(rangeStart);

  return (
    <div className="flex gap-6">
      <aside className="hidden w-44 shrink-0 flex-col gap-6 lg:flex">
        <MiniMonth anchor={anchor} onSelect={(d) => setAnchor(d)} />
        <Button className="w-full" onClick={goToday} size="sm" variant="outline">
          Today
        </Button>
        <Button className="w-full" onClick={() => onNew()} size="sm">
          <PlusIcon className="size-3" />
          New appointment
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button aria-label="Previous" onClick={() => goTo(-1)} size="icon-sm" variant="outline">
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button aria-label="Next" onClick={() => goTo(1)} size="icon-sm" variant="outline">
              <ChevronRightIcon className="size-4" />
            </Button>
            <span aria-live="polite" className="text-sm font-semibold">
              {rangeLabel}
            </span>
            <Button onClick={goToday} size="xs" variant="ghost">
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div
              aria-label="View mode"
              className="bg-muted flex items-center rounded-lg p-1 text-xs font-medium"
              role="group"
            >
              {(["week", "month"] as const).map((v) => (
                <button
                  aria-pressed={view === v}
                  className={cn(
                    "focus-visible:ring-ring rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    view === v
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:text-foreground",
                  )}
                  key={v}
                  onClick={() => setView(v)}
                  type="button"
                >
                  {v}
                </button>
              ))}
            </div>

            <Button onClick={() => onNew()} size="sm">
              <PlusIcon className="size-3" />
              New
            </Button>
          </div>
        </div>

        <ScrollArea>
          {query.isPending && appointments.length === 0 ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : query.isError ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center" role="alert">
              <p className="text-destructive text-sm font-medium">Could not load appointments</p>
              <Button onClick={() => void query.refetch()} size="sm" variant="outline">
                Retry
              </Button>
            </div>
          ) : view === "week" ? (
            <WeekView
              byDay={byDay}
              isLoading={query.isFetching}
              onEdit={onEdit}
              onNewAt={onNew}
              weekStart={rangeStart}
            />
          ) : (
            <MonthView
              byDay={byDay}
              isLoading={query.isFetching}
              monthStart={rangeStart}
              onEdit={onEdit}
              onNewAt={onNew}
            />
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
