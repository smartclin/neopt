// features/development/components/DomainRings.tsx

import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

import { DOMAIN_META, DOMAIN_ORDER, type MilestoneDomain } from "../types";

export interface DomainRingData {
  domain: MilestoneDomain;
  /** Achieved count within this domain for the current bracket. */
  achieved: number;
  /** Total expected for this bracket (achieved + expected + red-flag). */
  expected: number;
  /** Count of red-flag milestones in this domain (unfulfilled, past target). */
  redFlags: number;
}

interface DomainRingsProps {
  data: readonly DomainRingData[];
  className?: string;
}

/**
 * 2×2 grid of animated SVG progress rings — one per domain.
 * Rings show `% achieved / expected` for the current age bracket.
 * A red-flag badge appears if `redFlags > 0`.
 */
export function DomainRings({ data, className }: DomainRingsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)} role="list">
      {DOMAIN_ORDER.map((domain) => {
        const row = data.find((r) => r.domain === domain) ?? {
          domain,
          achieved: 0,
          expected: 0,
          redFlags: 0,
        };
        return <DomainRing key={domain} row={row} />;
      })}
    </div>
  );
}

function DomainRing({ row }: { row: DomainRingData }) {
  const meta = DOMAIN_META[row.domain];
  const Icon = meta.icon;
  const pct = row.expected === 0 ? 0 : Math.round((row.achieved / row.expected) * 100);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <li className="border-border/60 bg-card flex items-center gap-3 rounded-lg border p-3">
      <svg
        aria-hidden="true"
        className="shrink-0 -rotate-90"
        height={64}
        viewBox="0 0 64 64"
        width={64}
      >
        <circle className="stroke-muted" cx="32" cy="32" fill="none" r={radius} strokeWidth={6} />
        <circle
          className={meta.stroke}
          cx="32"
          cy="32"
          fill="none"
          r={radius}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          strokeWidth={6}
          style={{ transition: "stroke-dasharray 400ms ease" }}
        />
      </svg>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", meta.text)} />
          <span className=" truncate text-xs font-semibold tracking-wider uppercase">
            {meta.shortLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg leading-tight font-semibold tabular-nums">{pct}</span>
          <span className=" text-xs">%</span>
          <span className=" ml-auto text-xs tabular-nums">
            {row.achieved}/{row.expected}
          </span>
        </div>
        {row.redFlags > 0 && (
          <span className="text-destructive mt-0.5 flex items-center gap-1 text-[11px] font-medium">
            <AlertTriangle aria-hidden="true" className="size-3" />
            {row.redFlags} red flag{row.redFlags > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </li>
  );
}
