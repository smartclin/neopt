import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { normalizeStatus, STATUS_CONFIG } from "../status";

interface AppointmentStatusBadgeProps {
  status: string;
  className?: string;
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  const s = normalizeStatus(status);
  const cfg = STATUS_CONFIG[s];
  const Icon = cfg.icon;

  return (
    <Badge className={cn("gap-1.5", className)} variant={cfg.badgeVariant}>
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      <span>{cfg.label}</span>
    </Badge>
  );
}
