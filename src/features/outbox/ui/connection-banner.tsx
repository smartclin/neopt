// src/components/blocks/connection-banner.tsx

import { Link } from "@tanstack/react-router";
import * as React from "react";
import { useOutbox } from "@/features/outbox/use-outbox";

export function ConnectionBanner() {
  const [online, setOnline] = React.useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const { data = [] } = useOutbox();
  const syncing = data.filter((e) => e.status === "queued" || e.status === "syncing").length;
  const conflicts = data.filter((e) => e.status === "conflict").length;
  const failed = data.filter((e) => e.status === "failed").length;

  const { label, tone, href } = (() => {
    if (!online)
      return {
        label: `Offline — ${syncing} change${syncing === 1 ? "" : "s"} queued`,
        tone: "warning" as const,
        href: undefined,
      };
    if (conflicts > 0)
      return {
        label: `${conflicts} conflict${conflicts === 1 ? "" : "s"} need review`,
        tone: "destructive" as const,
        href: "/app/conflicts",
      };
    if (failed > 0)
      return {
        label: `${failed} change${failed === 1 ? "" : "s"} failed to sync`,
        tone: "destructive" as const,
        href: "/app/conflicts?status=failed",
      };
    if (syncing > 0)
      return {
        label: `Syncing ${syncing} change${syncing === 1 ? "" : "s"}…`,
        tone: "info" as const,
        href: undefined,
      };
    return { label: null, tone: "info" as const, href: undefined };
  })();

  // Announce only when the *text* changes, not on every poll.
  const lastAnnounced = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (label && label !== lastAnnounced.current) {
      lastAnnounced.current = label;
    }
  }, [label]);

  if (!label) return null;

  const toneClass =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/20"
        : "bg-muted text-foreground border-border";

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-4 py-2 text-sm ${toneClass}`}
      role="status"
    >
      <span>{label}</span>
      {href && (
        <Link className="text-xs font-medium underline underline-offset-2" to={href}>
          Review
        </Link>
      )}
    </div>
  );
}
