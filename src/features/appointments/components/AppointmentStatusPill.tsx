import { cn } from "@/lib/utils";

import { type AppointmentStatus, normalizeStatus, STATUS_CONFIG } from "../status";

interface AppointmentStatusPillProps {
  status: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * A coloured pill for one status. Used by the calendar and anywhere a
 * full-row status treatment is needed. The badge (`.AppointmentStatusBadge`)
 * is the alternative — a small inline chip; the pill is a row/block.
 */
export function AppointmentStatusPill({
  status,
  children,
  className,
  onClick,
}: AppointmentStatusPillProps) {
  const s: AppointmentStatus = normalizeStatus(status);
  const cfg = STATUS_CONFIG[s];

  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn("mt-1 size-1.5 shrink-0 rounded-full", cfg.dotClass)}
      />
      {children}
    </>
  );

  const classes = cn(
    "group flex w-full items-start gap-1.5 rounded-lg border px-2 py-1.5 text-left transition-all",
    "hover:shadow-sm",
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
    cfg.pillClass,
    className,
  );

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} type="button">
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}
