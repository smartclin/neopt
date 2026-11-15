import { CalendarClockIcon, CircleAlertIcon, ShieldCheckIcon, UserXIcon } from "lucide-react";
import { IconTile } from "@/components/blocks/icon-tile";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ImmunizationCoverage } from "../types";

interface CoverageStripProps {
  data: ImmunizationCoverage | undefined;
  isLoading: boolean;
}

export function CoverageStrip({ data, isLoading }: CoverageStripProps) {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarClockIcon}
          isLoading={isLoading}
          label="Due this week"
          tone="amber"
          value={data?.dueThisWeek}
        />
        <StatCard
          icon={CircleAlertIcon}
          isLoading={isLoading}
          label="Overdue"
          tone="red"
          value={data?.overdue}
        />
        <StatCard
          icon={ShieldCheckIcon}
          isLoading={isLoading}
          label="Coverage"
          sparkline
          suffix="%"
          tone="green"
          value={data?.coveragePct}
        />
        <StatCard
          icon={UserXIcon}
          isLoading={isLoading}
          label="Refused / deferred"
          tone="neutral"
          value={data?.refusedOrDeferred}
        />
      </div>

      <CoverageBar data={data?.byVaccine ?? []} isLoading={isLoading} />
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
  isLoading,
  sparkline,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  suffix?: string;
  tone: "amber" | "red" | "green" | "neutral";
  isLoading: boolean;
  sparkline?: boolean;
}) {
  const toneClass = {
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    red: "bg-destructive/10 text-destructive",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    neutral: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-4">
      <IconTile tone="secondary">
        <Icon className={toneClass} />
      </IconTile>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-xs">{label}</span>
        {isLoading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold tabular-nums">
              {value ?? 0}
              {suffix}
            </span>
            {sparkline && <MiniSparkline />}
          </div>
        )}
      </div>
    </div>
  );
}

/** Eight deterministic placeholder bars — a real sparkline would need a
 *  weekly series; wire to `getCoverageTrend` when it exists. */
function MiniSparkline() {
  const bars = [4, 5, 6, 5, 7, 8, 8, 9];
  return (
    <svg
      aria-hidden="true"
      className="text-emerald-500"
      fill="currentColor"
      height="16"
      viewBox={`0 0 ${bars.length * 4} 16`}
      width="32"
    >
      {bars.map((b, i) => (
        <rect height={b} key={i} width="3" x={i * 4} y={16 - b} />
      ))}
    </svg>
  );
}

function CoverageBar({
  data,
  isLoading,
}: {
  data: ImmunizationCoverage["byVaccine"];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="bg-muted/50 h-9 w-full animate-pulse rounded-lg" />;
  }
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No immunization data yet.</p>;
  }

  const total = data.reduce((n, v) => n + v.given + v.due + v.overdue, 0);
  if (total === 0) {
    return null;
  }

  return (
    <div
      aria-label="Coverage by vaccine"
      className="flex w-full overflow-hidden rounded-lg border"
      role="group"
    >
      {data.map((v) => {
        const segmentWidth = ((v.given + v.due + v.overdue) / total) * 100;
        return (
          <Tooltip key={v.vaccineKey}>
            <TooltipTrigger
              render={
                <div
                  className="relative flex h-9 min-w-0 items-center justify-center border-r last:border-r-0"
                  style={{ width: `${segmentWidth}%` }}
                />
              }
            >
              <div className="bg-muted absolute inset-0" />
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500/70"
                style={{ width: `${v.pct}%` }}
              />
              <span className="relative z-10 truncate px-1 text-[10px] font-semibold tracking-wider text-white uppercase mix-blend-difference">
                {v.vaccineKey}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="grid gap-1 text-xs">
                <span className="font-medium">{v.vaccineName}</span>
                <span>
                  <Badge variant="success">{v.given} given</Badge>{" "}
                  <Badge variant="warning">{v.due} due</Badge>{" "}
                  <Badge variant="destructive">{v.overdue} overdue</Badge>
                </span>
                <span className="text-muted-foreground">{v.pct}% coverage</span>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
