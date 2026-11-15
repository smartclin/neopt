import { useSuspenseQuery } from "@tanstack/react-query";

export type GrowthEntry = {
  patientId: string;
  patientName: string;
  ageLabel: string; // e.g. "14 mo"
  measuredAt: string; // ISO
  weightKg: number;
  heightCm: number;
  headCm?: number;
  // Percentile from your growth-chart service — null if not computed
  weightPercentile?: number;
  heightPercentile?: number;
};

async function fetchRecentGrowth(clinicId: string | undefined): Promise<GrowthEntry[]> {
  if (!clinicId) return [];
  const res = await fetch(`/api/clinics/${clinicId}/growth/recent?limit=5`);
  if (!res.ok) throw new Error(`Growth fetch failed: ${res.status}`);
  return res.json();
}

export function useRecentGrowth(clinicId: string | undefined) {
  return useSuspenseQuery({
    queryKey: ["recent-growth", clinicId ?? null],
    queryFn: () => fetchRecentGrowth(clinicId),
    staleTime: 120_000,
  });
}
