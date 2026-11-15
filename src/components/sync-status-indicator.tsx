// Src/components/table/components/sync-status-indicator.tsx

import { AlertCircle } from "lucide-react";

import { cn } from "#/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export type SyncStatus = "synced" | "pending" | "failed";

interface SyncStatusIndicatorProps {
  className?: string;
  status: SyncStatus | undefined;
}

/**
 * Renders a per-row sync indicator.
 *
 *   pending → spinner (the write is queued locally)
 *   failed  → destructive alert icon (the write was rejected)
 *   synced  → nothing (the common case; keep the cell quiet)
 */
export function SyncStatusIndicator({ status, className }: SyncStatusIndicatorProps) {
  if (!status || status === "synced") {
    return null;
  }

  if (status === "pending") {
    return (
      <Spinner
        aria-label="Pending sync"
        className={cn("text-muted-foreground size-3", className)}
      />
    );
  }

  return (
    <AlertCircle
      aria-label="Sync failed"
      className={cn("text-destructive size-3", className)}
      role="img"
    />
  );
}
