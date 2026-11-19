import {useQuery} from "@tanstack/react-query";
import {Link} from "@tanstack/react-router";
import {CalendarClockIcon, CheckIcon, UserXIcon, XIcon} from "lucide-react";
import * as React from "react";

import {SectionState} from "@/components/blocks/state-view";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/spinner";
import {toast} from "@/components/ui/toast";
import {formatDayHeading, formatTime, isEditableTarget} from "@/lib/dates";
import {cn} from "@/lib/utils";

// ── reads + mutations ──────────────────────────────────────────────────
import {
    todayAppointmentsQuery,
    useCancelAppointmentMutation,
    useCompleteAppointmentMutation,
    useMarkNoShowMutation,
} from "../queries";
import {ageLabel, type AppointmentStatus, normalizeStatus, STATUS_CONFIG} from "../status";
import type {AppointmentRow} from "../types";
import {AppointmentStatusBadge} from "./AppointmentStatusBadge";

// ── Shared action interface ────────────────────────────────────────────

interface QueueActions {
  complete: { mutate: (id: string) => void; isPending: boolean };
  noShow: { mutate: (id: string) => void; isPending: boolean };
  cancel: { mutate: (id: string) => void; isPending: boolean };
}

// ── Small action button ────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ icon: Icon, iconClassName, label, onClick, disabled }: ActionButtonProps) {
  return (
    <Button
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      size="icon-xs"
      title={label}
      variant="ghost"
    >
      <Icon className={cn("size-3", iconClassName)} />
    </Button>
  );
}

// ── Queue item ─────────────────────────────────────────────────────────

interface QueueItemProps {
  appt: AppointmentRow;
  isActive: boolean;
  rowRef?: (el: HTMLDivElement | null) => void;
  onFocus: () => void;
  onEdit: (id: string) => void;
  actions: QueueActions;
}

function QueueItem({ appt, isActive, rowRef, onFocus, onEdit, actions }: QueueItemProps) {
  const patient = appt.patient;
  const initials = patient
    ? `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()
    : "?";

  const isDone =
    appt.status === "completed" || appt.status === "cancelled" || appt.status === "no-show";

  const timeText = formatTime(new Date(appt.scheduledAt));

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl p-3 transition-colors",
        isActive ? "bg-primary/5 ring-primary/20 ring-1" : "hover:bg-muted/40",
        isDone && "opacity-60",
      )}
      data-active={isActive}
      data-appointment-id={appt.id}
      onClick={onFocus}
      ref={rowRef}
      role="listitem"
    >
      {/* Time column */}
      <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
        <span className="font-mono text-xs leading-tight tabular-nums">{timeText}</span>
        <div aria-hidden="true" className="bg-border mt-1 w-px flex-1" />
      </div>

      <Avatar size="sm">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Name + age + allergy + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              className="focus-visible:ring-ring truncate rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              onClick={(e) => e.stopPropagation()}
              params={{ patientId: patient?.id ?? "" }}
              search={{ tab: "appointments" }}
              to="/app/patients/$patientId"
            >
              {patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient"}
            </Link>

            {patient && (
              <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.6rem]">
                {ageLabel(patient.dateOfBirth)}
              </span>
            )}

            {patient?.allergies && (
              <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 text-[0.6rem] font-medium">
                Allergy
              </span>
            )}
          </div>

          <AppointmentStatusBadge status={appt.status} />
        </div>

        {appt.reason && <p className="truncate text-xs">{appt.reason}</p>}
        {appt.doctor && <span className="text-xs">{appt.doctor.name}</span>}
      </div>

      {/* Status actions */}
      {!isDone && (
        <div
  className={cn(
    "absolute top-2 right-2 flex items-center gap-1 transition-opacity",
    "opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100",
    isActive && "md:opacity-100",
  )}
>
          <ActionButton
            disabled={actions.complete.isPending}
            icon={CheckIcon}
            iconClassName="text-module-encounters"
            label="Complete"
            onClick={() => actions.complete.mutate(appt.id)}
          />
          <ActionButton
            disabled={actions.noShow.isPending}
            icon={UserXIcon}
            iconClassName="text-warning"
            label="No-show"
            onClick={() => actions.noShow.mutate(appt.id)}
          />
          <ActionButton
            disabled={actions.cancel.isPending}
            icon={XIcon}
            iconClassName="text-destructive"
            label="Cancel"
            onClick={() => actions.cancel.mutate(appt.id)}
          />
        </div>
      )}

      {/* Screen-reader-only edit affordance */}
      <button
        aria-label={`Edit appointment for ${patient?.firstName ?? "unknown"} ${patient?.lastName ?? ""} at ${timeText}`}
        className="focus:ring-ring sr-only focus:not-sr-only focus:ring-2 focus:ring-offset-2"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(appt.id);
        }}
        tabIndex={-1}
        type="button"
      >
        Edit
      </button>
    </div>
  );
}

// ── Mutation wiring ────────────────────────────────────────────────────

function useQueueActions(): QueueActions {
  const completeMutation = useCompleteAppointmentMutation();
  const noShowMutation = useMarkNoShowMutation();
  const cancelMutation = useCancelAppointmentMutation();

  const onError = (err: unknown) =>
    toast.add({
      type: "error",
      description: err instanceof Error ? err.message : "Update failed",
    });

  return {
    complete: {
      mutate: (id) => {
        completeMutation.mutate(
          { data: { appointmentId: id } },
          {
            onSuccess: () => toast.add({ type: "success", description: "Marked as completed" }),
            onError,
          },
        );
      },
      isPending: completeMutation.isPending,
    },
    noShow: {
      mutate: (id) => {
        noShowMutation.mutate(
          { data: { appointmentId: id } },
          {
            onSuccess: () => toast.add({ type: "warning", description: "Marked as no-show" }),
            onError,
          },
        );
      },
      isPending: noShowMutation.isPending,
    },
    cancel: {
      mutate: (id) => {
        cancelMutation.mutate(
          { data: { appointmentId: id } },
          {
            onSuccess: () => toast.add({ type: "info", description: "Appointment cancelled" }),
            onError,
          },
        );
      },
      isPending: cancelMutation.isPending,
    },
  };
}

// ── Summary strip ──────────────────────────────────────────────────────

const SUMMARY_ORDER = ["scheduled", "completed", "no-show", "cancelled"] as const;

function QueueSummary({ counts }: { counts: Record<AppointmentStatus, number> }) {
  const visible = SUMMARY_ORDER.filter((s) => counts[s] > 0);
  if (visible.length === 0) return null;

  return (
   <output
  aria-label="Appointment counts by status"
  aria-live="polite"
  className="mb-3 flex flex-wrap gap-1.5"
>
  {(["scheduled", "completed", "no-show", "cancelled"] as const).map((s) => {
    if (counts[s] === 0) return null;
    const cfg = STATUS_CONFIG[s];
    return (
      <span
        key={s}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xss font-medium",
          cfg.pillClass,
        )}
      >
        <span className={cn("inline-block size-1.5 rounded-full", cfg.dotClass)} />
        {counts[s]} {cfg.label.toLowerCase()}
      </span>
    );
  })}
</output>
  );
}

// ── Keyboard navigation hook ───────────────────────────────────────────

function useQueueKeyboard(
  ids: string[],
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>,
  onNew: () => void,
) {
  const idsRef = React.useRef(ids);
  const onNewRef = React.useRef(onNew);

  React.useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  React.useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isEditableTarget(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const current = idsRef.current;
      if (current.length === 0 && e.key !== "n") return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveId((prev) => {
          const i = prev ? current.indexOf(prev) : -1;
          const next = Math.min(i + 1, current.length - 1);
          return current[next] ?? null;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveId((prev) => {
          const i = prev ? current.indexOf(prev) : 0;
          const next = Math.max(i - 1, 0);
          return current[next] ?? null;
        });
      } else if (e.key === "n") {
        e.preventDefault();
        onNewRef.current();
      } else if (e.key === "Escape") {
        setActiveId(null);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [setActiveId]);
}

// ── Main component ─────────────────────────────────────────────────────

interface TodayQueueProps {
  clinicId: string;
  onEdit: (appointmentId: string) => void;
  onNew: () => void;
}

export function TodayQueue({ clinicId, onEdit, onNew }: TodayQueueProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const rowsRef = React.useRef(new Map<string, HTMLDivElement>());

  const query = useQuery({
    ...todayAppointmentsQuery(clinicId),
    refetchInterval: 60_000,
  });

  const appointments = React.useMemo(() => query.data ?? [], [query.data]);
  const appointmentsData = query.data;
  const actions = useQueueActions();

  const activeIdx = React.useMemo(() => {
    if (!activeId) return -1;
    return appointments.findIndex((a) => a.id === activeId);
  }, [activeId, appointments]);

  React.useEffect(() => {
    if (!activeId) return;
    rowsRef.current.get(activeId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  useQueueKeyboard(
    appointments.map((a) => a.id),
    setActiveId,
    onNew,
  );

  const counts = React.useMemo(() => {
    const c: Record<AppointmentStatus, number> = {
      scheduled: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
      "no-show": 0,
    };
    for (const a of appointmentsData ?? []) {
      c[normalizeStatus(a.status)]++;
    }
    return c;
  }, [appointmentsData]);

  const setRowRef = React.useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) rowsRef.current.set(id, el);
      else rowsRef.current.delete(id);
    },
    [],
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">Today&rsquo;s Queue</h2>
          <p className="text-xs">{formatDayHeading(new Date())}</p>
        </div>
        <Button onClick={onNew} size="xs" title="New appointment (N)" variant="outline">
          New
        </Button>
      </div>

      <QueueSummary counts={counts} />

      {/* Body */}
      {query.isPending ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : query.isError ? (
        <SectionState
          action={
            <Button onClick={() => void query.refetch()} size="sm" variant="outline">
              Retry
            </Button>
          }
          description={
            query.error instanceof Error ? query.error.message : "An unexpected error occurred."
          }
          icon={CalendarClockIcon}
          title="Could not load queue"
        />
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="bg-muted rounded-full p-3">
            <CalendarClockIcon className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">No appointments today</p>
            <p className="text-xs">The schedule is clear. Block a slot to get started.</p>
          </div>
          <Button onClick={onNew} size="sm" variant="outline">
            Block a slot
          </Button>
        </div>
      ) : (
        <div aria-label="Today's appointment queue" className="flex flex-col gap-1" role="list">
          {appointments.map((appt, idx) => (
            <QueueItem
              actions={actions}
              appt={appt}
              isActive={idx === activeIdx}
              key={appt.id}
              onEdit={onEdit}
              onFocus={() => setActiveId(appt.id)}
              rowRef={setRowRef(appt.id)}
            />
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      {appointments.length > 0 && (
        <p className="mt-3 text-center text-[0.65rem]">
          <kbd className="bg-muted rounded py-0.5 font-mono text-[0.6rem]">j</kbd>
          {" / "}
          <kbd className="bg-muted rounded py-0.5 font-mono text-[0.6rem]">k</kbd> navigate
          &middot; <kbd className="bg-muted rounded py-0.5 font-mono text-[0.6rem]">n</kbd> new
        </p>
      )}
    </div>
  );
}
