import type { ChildMeasurement } from "../types";

export function attachChildValue(day: number, sortedMeasurements: ChildMeasurement[]) {
  // exact hit
  const exact = sortedMeasurements.find((m) => m.day === day);
  if (exact) return exact.value;
  return null; // Chart handles nulls; or interpolate if you want continuous line
}
