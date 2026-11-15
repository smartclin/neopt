import type { ComponentType } from "react";

type Tone = "default" | "warning" | "positive" | "critical";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  icon?: ComponentType<{ className?: string }>;
};

const TONE_STYLES: Record<Tone, { card: string; icon: string; value: string; dot: string }> = {
  default: {
    card: "bg-card border-border",
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
    dot: "bg-muted-foreground/40",
  },
  warning: {
    card: "bg-amber-500/5 border-amber-500/20",
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  positive: {
    card: "bg-emerald-500/5 border-emerald-500/20",
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  critical: {
    card: "bg-rose-500/5 border-rose-500/20",
    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    value: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function StatCard({ label, value, sub, tone = "default", icon: Icon }: StatCardProps) {
  const s = TONE_STYLES[tone];

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${s.card}`}>
      {Icon ? (
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${s.icon}`}>
          <Icon className="size-5" />
        </div>
      ) : (
        <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
      )}

      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className={`truncate text-xl font-bold tracking-tight ${s.value}`}>{value}</p>
        {sub ? <p className="text-muted-foreground truncate text-xs">{sub}</p> : null}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border-border flex animate-pulse items-center gap-3 rounded-xl border p-4">
      <div className="bg-muted size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="bg-muted h-2.5 w-16 rounded" />
        <div className="bg-muted h-5 w-12 rounded" />
      </div>
    </div>
  );
}
