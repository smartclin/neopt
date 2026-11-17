// features/development/components/MilestoneTimeline.tsx

import { AlertTriangle, Check, Circle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { PatientMilestone } from "../types";

import { type MilestoneStatus, milestoneStatus } from "../status";
import { DOMAIN_META, DOMAIN_ORDER } from "../types";

export interface MilestoneTimelineProps {
  milestones: readonly PatientMilestone[];
  correctedAgeMonths: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TICKS = [0, 2, 4, 6, 9, 12, 18, 24, 36, 60];
const TICK_LABELS: Record<number, string> = {
  0: "Birth",
  2: "2m",
  4: "4m",
  6: "6m",
  9: "9m",
  12: "1y",
  18: "1.5y",
  24: "2y",
  36: "3y",
  60: "5y",
};

const LANE_HEIGHT = 64;

function xPercent(ageMonths: number): number {
  // Non-linear: more resolution below 24m, compressed to 60m after.
  if (ageMonths <= 24) return (ageMonths / 24) * 60;
  return 60 + ((ageMonths - 24) / 36) * 40;
}

interface MilestonePoint {
  id: string;
  domain: string;
  label: string;
  description: string;
  ageMonths: number;
  status: MilestoneStatus;
  achievedDate: string | null;
  isRedFlagIfMissing: boolean;
}

export function MilestoneTimeline({
  milestones,
  correctedAgeMonths,
  selectedId,
  onSelect,
}: MilestoneTimelineProps) {
  const grouped = React.useMemo(() => {
    const byDomain = new Map<string, MilestonePoint[]>();
    for (const domain of DOMAIN_ORDER) byDomain.set(domain, []);
    for (const m of milestones) {
      byDomain.get(m.domain)?.push({
        id: m.id,
        domain: m.domain,
        label: m.title,
        description: m.description,
        ageMonths: m.targetAgeMonths,
        status: milestoneStatus(m, correctedAgeMonths),
        achievedDate: m.achievedDate,
        isRedFlagIfMissing: Boolean(m.isRedFlagIfMissing),
      });
    }
    for (const list of byDomain.values()) {
      list.sort((a, b) => a.ageMonths - b.ageMonths);
    }
    return byDomain;
  }, [milestones, correctedAgeMonths]);

  const totalHeight = DOMAIN_ORDER.length * LANE_HEIGHT + 40;

  return (
    <div
      className="border-border/60 bg-card relative w-full overflow-hidden rounded-lg border"
      style={{ height: totalHeight }}
    >
      {/* Vertical age ticks */}
      <div className=" absolute inset-x-0 top-0 h-full">
        {TICKS.map((tick) => (
          <div
            className="border-border/40 absolute top-0 bottom-0 border-l"
            key={tick}
            style={{ left: `${xPercent(tick)}%` }}
          >
            <span className="bg-background absolute top-0 left-1 rounded-br  text-[10px] tabular-nums">
              {TICK_LABELS[tick]}
            </span>
          </div>
        ))}
      </div>

      {/* Age marker (corrected age) */}
      <div
        aria-hidden="true"
        className="bg-foreground/50 pointer-events-none absolute inset-y-0 w-px"
        style={{
          left: `${xPercent(Math.min(correctedAgeMonths, 60))}%`,
          top: 20,
        }}
      >
        <span className="bg-foreground text-background absolute top-0 left-1/2 -translate-x-1/2 rounded-full py-0.5 text-[9px] font-semibold tabular-nums">
          {correctedAgeMonths.toFixed(0)}m
        </span>
      </div>

      {/* Domain lanes */}
      <div className="relative pt-10">
        {DOMAIN_ORDER.map((domain, laneIndex) => {
          const meta = DOMAIN_META[domain];
          const Icon = meta.icon;
          const points = grouped.get(domain) ?? [];
          const achieved = points.filter((p) => p.status === "achieved");
          return (
            <div
              className="border-border/20 relative flex items-center border-t"
              key={domain}
              style={{ height: LANE_HEIGHT }}
            >
              <div className="bg-background sticky left-0 z-10 flex w-32 shrink-0 items-center gap-1.5 px-2">
                <Icon aria-hidden="true" className={cn("size-3.5", meta.text)} />
                <span className=" truncate text-[11px] font-semibold tracking-wider uppercase">
                  {meta.shortLabel}
                </span>
              </div>
              <div className="relative flex-1">
                <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
                  {achieved.length >= 2 && (
                    <polyline
                      fill="none"
                      points={achieved
                        .map((p) => `${xPercent(p.ageMonths)}%,${LANE_HEIGHT / 2}`)
                        .join(" ")}
                      stroke={meta.hex}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeOpacity={0.35}
                      strokeWidth={1.5}
                    />
                  )}
                </svg>
                {points.map((p) => (
                  <MilestoneDot
                    key={p.id}
                    laneIndex={laneIndex}
                    onSelect={onSelect}
                    point={p}
                    selected={p.id === selectedId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MilestoneDot({
  point,
  onSelect,
  selected,
}: {
  point: MilestonePoint;
  onSelect: (id: string) => void;
  selected: boolean;
  laneIndex: number;
}) {
  const meta = DOMAIN_META[point.domain as keyof typeof DOMAIN_META];
  const status = point.status;
  const isAchieved = status === "achieved";
  const isRedFlag = status === "red-flag";
  const isFuture = status === "future";

  return (
    <button
      aria-label={`${point.label}, ${status}`}
      aria-pressed={selected}
      className={cn(
        "group focus-visible:ring-ring absolute top-1/2 z-20 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none",
        isAchieved && `${meta.bg} border-transparent text-white shadow-sm`,
        status === "expected" && "border-foreground/40 border-dashed",
        isRedFlag && "border-destructive/80 bg-destructive/10 animate-pulse-slow",
        isFuture && "border-border bg-background",
        selected && "ring-ring ring-2 ring-offset-2",
      )}
      onClick={() => onSelect(point.id)}
      style={{
        left: `${xPercent(point.ageMonths)}%`,
        backgroundColor: isAchieved ? meta.hex : undefined,
      }}
      title={`${point.label} — ${point.ageMonths}m`}
      type="button"
    >
      {isAchieved ? (
        <Check aria-hidden="true" className="size-3 text-white" strokeWidth={3} />
      ) : isRedFlag ? (
        <AlertTriangle aria-hidden="true" className="text-destructive size-3" />
      ) : (
        <Circle
          aria-hidden="true"
          className={cn("size-2", isFuture ? "fill-muted-foreground/30" : "fill-foreground/40")}
        />
      )}
    </button>
  );
}
