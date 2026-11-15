// src/components/growth/GrowthChartSkeleton.tsx

import { cn } from "@/lib/utils";

export interface GrowthChartSkeletonProps {
  height?: number;
  className?: string;
}
export function GrowthChartSkeleton({ height = 360, className }: GrowthChartSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("growth-chart-skeleton w-full rounded-lg", className)}
      role="status"
      style={{ height }}
    >
      <span className="sr-only">Loading growth chart…</span>
    </div>
  );
}
