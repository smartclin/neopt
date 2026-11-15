import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { CalendarClockIcon, CheckIcon, UserXIcon, XIcon } from "lucide-react";
import * as React from "react";

import { SectionState } from "@/components/blocks/state-view";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
// ── Row type — derived from the server fn ──────────────────────────────
import type { fetchTodayAppointments } from "../functions";
// ── reads + mutations ──────────────────────────────────────────────────
import {
  todayAppointmentsQuery,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useMarkNoShowMutation,
} from "../queries";
import { type AppointmentStatus, normalizeStatus } from "../status";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";

type QueueAppointment = Awaited<ReturnType<typeof fetchTodayAppointments>>[number];

// ── Time helpers ───────────────────────────────────────────────────────

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function timeStr(value: Date | string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : TIME_FMT.format(date);
}

function isEditableTarget(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLInputElement) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  if (el.isContentEditable) return true;
  return false;
}

// ── Queue item ─────────────────────────────────────────────────────────

interface QueueItemProps {
  appt: QueueAppointment;
  isActive: boolean;
  rowRef?: (el: HTMLDivElement | null) => void;
  onFocus: () => void;
  onEdit: (id: string) => void;
  actions: QueueActions;
}

function QueueItem({ appt, isActive, rowRef, onFocus, onEdit, actions }: QueueItemProps) {
  const initials = appt.patient
    ? `${appt.patient.firstName[0]}${appt.patient.lastName[0]}`.toUpperCase()
    : "?";

  const isDone =
    appt.status === "completed" || appt.status === "cancelled" || appt.status === "no-show";

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
      <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
        <span className="font-mono text-[0.65rem] leading-tight tabular-nums">
          {timeStr(appt.scheduledAt)}
        </span>
        <div aria-hidden="true" className="bg-border mt-1 w-px flex-1" />
      </div>

      <Avatar size="sm">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Link
            className="focus-visible:ring-ring truncate rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            onClick={(e) => e.stopPropagation()}
            params={{ patientId: appt.patient?.id ?? "" }}
            search={{ tab: "appointments" }}
            to="/app/patients/$patientId"
          >
            {appt.patient
              ? `${appt.patient.firstName} ${appt.patient.lastName}`
              : "Unknown patient"}
          </Link>
          <AppointmentStatusBadge status={appt.status} />
        </div>

        {appt.reason && <p className="text-muted-foreground truncate text-xs">{appt.reason}</p>}

        {appt.doctor && <span className="text-muted-foreground text-xs">{appt.doctor.name}</span>}
      </div>

      {!isDone && (
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100",
            isActive && "opacity-100",
          )}
        >
          <ActionButton
            disabled={actions.complete.isPending}
            icon={CheckIcon}
            iconClassName="text-emerald-600"
            label="Complete"
            onClick={() => actions.complete.mutate(appt.id)}
          />
          <ActionButton
            disabled={actions.noShow.isPending}
            icon={UserXIcon}
            iconClassName="text-amber-600"
            label="No-show"
            onClick={() => actions.noShow.mutate(appt.id)}
          />
          <ActionButton
            disabled={actions.cancel.isPending}
            icon={XIcon}
            iconClassName="text-rose-600"
            label="Cancel"
            onClick={() => actions.cancel.mutate(appt.id)}
          />
        </div>
      )}

      <button
        aria-label={`Edit appointment for ${appt.patient?.firstName ?? "unknown"} ${appt.patient?.lastName ?? ""} at ${timeStr(appt.scheduledAt)}`}
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

function ActionButton({
  icon: Icon,
  iconClassName,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
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

// ── Shared queue actions ───────────────────────────────────────────────
//
// The mutation hooks from `../queries` already:
//   - invalidate the today queue and the patient's appointment history
//   - invalidate the clinic's list and range caches
//
// All that's left here is presenting `mutate` and `isPending` per action.

interface QueueActions {
  complete: { mutate: (id: string) => void; isPending: boolean };
  noShow: { mutate: (id: string) => void; isPending: boolean };
  cancel: { mutate: (id: string) => void; isPending: boolean };
}

function useQueueActions(): QueueActions {
  const completeMutation = useCompleteAppointmentMutation();
  const noShowMutation = useMarkNoShowMutation();
  const cancelMutation = useCancelAppointmentMutation();

  return {
    complete: {
      mutate: (id) => {
        completeMutation.mutate(
          { data: { appointmentId: id } },
          {
            onSuccess: () =>
              toast.add({
                type: "success",
                description: "Marked as completed",
              }),
            onError: (err) =>
              toast.add({
                type: "error",
                description: err instanceof Error ? err.message : "Update failed",
              }),
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
            onSuccess: () =>
              toast.add({
                type: "warning",
                description: "Marked as no-show",
              }),
            onError: (err) =>
              toast.add({
                type: "error",
                description: err instanceof Error ? err.message : "Update failed",
              }),
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
            onSuccess: () =>
              toast.add({
                type: "info",
                description: "Appointment cancelled",
              }),
            onError: (err) =>
              toast.add({
                type: "error",
                description: err instanceof Error ? err.message : "Update failed",
              }),
          },
        );
      },
      isPending: cancelMutation.isPending,
    },
  };
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
    // Override the factory's stale time to poll while the queue is open.
    // If you prefer a polling query, this is the one place to change it.
    refetchInterval: 60_000,
  });

  const appointments = query.data ?? [];
  const actions = useQueueActions();

  const activeIdx = React.useMemo(() => {
    if (!activeId) return -1;
    return appointments.findIndex((a) => a.id === activeId);
  }, [activeId, appointments]);

  React.useEffect(() => {
    if (activeId && activeIdx === -1) setActiveId(null);
  }, [activeId, activeIdx]);

  React.useEffect(() => {
    if (!activeId) return;
    const el = rowsRef.current.get(activeId);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const onNewRef = React.useRef(onNew);
  React.useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  const idsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    idsRef.current = appointments.map((a) => a.id);
  }, [appointments]);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isEditableTarget(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const ids = idsRef.current;
      if (ids.length === 0 && e.key !== "n") return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveId((prev) => {
          const i = prev ? ids.indexOf(prev) : -1;
          const next = Math.min(i + 1, ids.length - 1);
          return ids[next] ?? null;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveId((prev) => {
          const i = prev ? ids.indexOf(prev) : 0;
          const next = Math.max(i - 1, 0);
          return ids[next] ?? null;
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
  }, []);

  const counts = React.useMemo(() => {
    const c: Record<AppointmentStatus, number> = {
      scheduled: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
      "no-show": 0,
    };
    for (const a of appointments) {
      const s = normalizeStatus(a.status);
      c[s]++;
    }
    return c;
  }, [appointments]);

  const setRowRef = React.useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) rowsRef.current.set(id, el);
      else rowsRef.current.delete(id);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">Today&rsquo;s Queue</h2>
          <p className="text-muted-foreground text-xs">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button onClick={onNew} size="xs" title="New appointment (N)" variant="outline">
          New
        </Button>
      </div>

      {appointments.length > 0 && (
        <output
          aria-label="Appointment counts by status"
          aria-live="polite"
          className="mb-3 flex flex-wrap gap-1.5"
        >
          {counts.scheduled > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[0.65rem] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <span className="inline-block size-1.5 rounded-full bg-sky-500" />
              {counts.scheduled} scheduled
            </span>
          )}
          {counts.completed > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              {counts.completed} done
            </span>
          )}
          {counts["no-show"] > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="inline-block size-1.5 rounded-full bg-amber-500" />
              {counts["no-show"]} no-show
            </span>
          )}
        </output>
      )}

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
            <CalendarClockIcon className="text-muted-foreground size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">No appointments today</p>
            <p className="text-muted-foreground text-xs">
              The schedule is clear. Block a slot to get started.
            </p>
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

      {appointments.length > 0 && (
        <p className="text-muted-foreground mt-3 text-center text-[0.65rem]">
          <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[0.6rem]">j</kbd>
          {" / "}
          <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[0.6rem]">k</kbd> navigate
          &middot; <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[0.6rem]">n</kbd> new
        </p>
      )}
    </div>
  );
}
