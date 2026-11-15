// features/development/status.ts
import type { MilestoneDomain } from "./types";

export type MilestoneStatus = "achieved" | "expected" | "future" | "red-flag";

export interface MilestoneForStatus {
  isAchieved: boolean;
  targetAgeMonths: number;
  isRedFlagIfMissing?: boolean;
}

/**
 * Compute the display status of a milestone relative to a patient's
 * corrected age. `correctedAgeMonths` is what the chart should use
 * (fallback to chronological if not preterm).
 */
export function milestoneStatus(
  m: MilestoneForStatus,
  correctedAgeMonths: number,
): MilestoneStatus {
  if (m.isAchieved) return "achieved";
  if (correctedAgeMonths >= m.targetAgeMonths) {
    return m.isRedFlagIfMissing ? "red-flag" : "expected";
  }
  return "future";
}

/** Counts by status across a slice of milestones. */
export function countByStatus(
  milestones: ReadonlyArray<MilestoneForStatus & { domain: MilestoneDomain }>,
  correctedAgeMonths: number,
) {
  const result: Record<MilestoneStatus, { total: number; achieved: number; redFlag: number }> = {
    achieved: { total: 0, achieved: 0, redFlag: 0 },
    expected: { total: 0, achieved: 0, redFlag: 0 },
    future: { total: 0, achieved: 0, redFlag: 0 },
    "red-flag": { total: 0, achieved: 0, redFlag: 0 },
  };
  for (const m of milestones) {
    const s = milestoneStatus(m, correctedAgeMonths);
    result[s].total += 1;
    if (m.isAchieved) result[s].achieved += 1;
    if (s === "red-flag") result[s].redFlag += 1;
  }
  return result;
}
