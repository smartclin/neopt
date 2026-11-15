// Shared status metadata: colors, icons, labels.
// Import this wherever you need a consistent representation of appointment status.

import { CheckCircle2Icon, CircleDashedIcon, CircleSlashIcon, UserXIcon } from "lucide-react";

export type AppointmentStatus = "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show";

export const STATUS_CONFIG = {
  scheduled: {
    label: "Scheduled",
    icon: CircleDashedIcon,
    badgeVariant: "info" as const,
    dotClass: "bg-sky-500",
    pillClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  "in-progress": {
    label: "In Progress",
    icon: CircleDashedIcon,
    badgeVariant: "warning" as const,
    dotClass: "bg-amber-500",
    pillClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2Icon,
    badgeVariant: "success" as const,
    dotClass: "bg-emerald-500",
    pillClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: CircleSlashIcon,
    badgeVariant: "destructive" as const,
    dotClass: "bg-rose-500",
    pillClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  "no-show": {
    label: "No Show",
    icon: UserXIcon,
    badgeVariant: "secondary" as const,
    dotClass: "bg-zinc-400",
    pillClass:
      "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700",
  },
} satisfies Record<
  AppointmentStatus,
  {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    badgeVariant: "info" | "warning" | "success" | "destructive" | "secondary";
    dotClass: string;
    pillClass: string;
  }
>;

// DB statuses don't include "in-progress", map it gracefully
export function normalizeStatus(raw: string): AppointmentStatus {
  if (raw in STATUS_CONFIG) return raw as AppointmentStatus;
  return "scheduled";
}
