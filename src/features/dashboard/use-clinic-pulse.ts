import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarClockIcon, ClipboardListIcon, ClockIcon, TriangleAlertIcon } from "lucide-react";
import type { ComponentType } from "react";

export type StatTone = "default" | "warning" | "positive" | "critical";

export type ClinicPulseStat = {
  label: string;
  value: string | number;
  sub?: string;
  tone?: StatTone;
  icon?: ComponentType<{ className?: string }>;
};

type PulseResponse = {
  todayCount: number;
  pendingForms: number;
  overdueFollowUps: number;
  nextAppointment: { time: string; patientName: string } | null;
};

async function fetchClinicPulse(clinicId: string | undefined): Promise<ClinicPulseStat[]> {
  if (!clinicId) return [];

  const res = await fetch(`/api/clinics/${clinicId}/pulse`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Pulse fetch failed: ${res.status}`);
  const data: PulseResponse = await res.json();

  return [
    {
      label: "Today",
      value: data.todayCount,
      sub: "appointments",
      icon: CalendarClockIcon,
    },
    {
      label: "Pending",
      value: data.pendingForms,
      sub: "intake forms",
      tone: data.pendingForms > 0 ? "warning" : "default",
      icon: ClipboardListIcon,
    },
    {
      label: "Overdue",
      value: data.overdueFollowUps,
      sub: "follow-ups",
      tone: data.overdueFollowUps > 0 ? "critical" : "default",
      icon: TriangleAlertIcon,
    },
    {
      label: "Next up",
      value: data.nextAppointment?.time ?? "—",
      sub: data.nextAppointment?.patientName ?? "no more today",
      icon: ClockIcon,
    },
  ];
}

export function useClinicPulse(clinicId: string | undefined) {
  return useSuspenseQuery({
    queryKey: ["clinic-pulse", clinicId ?? null],
    queryFn: () => fetchClinicPulse(clinicId),
    staleTime: 60_000,
  });
}
