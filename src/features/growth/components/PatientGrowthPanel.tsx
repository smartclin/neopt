import { useQuery } from "@tanstack/react-query";
import { ChartLineIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionState } from "@/components/blocks/state-view";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MeasurementForm } from "@/features/measurements";
import { flaggedMeasurementsQuery } from "@/features/measurements/queries";
import { getPatientQueryOptions } from "@/features/patients/queries";
import { decimalMonthsBetween } from "@/features/shared/helpers";
// ── reads ──────────────────────────────────────────────────────────────
import { bandQuery, getGrowthChartCurvesQuery, seriesQuery } from "../queries";

import type { ChartBand, GrowthIndicator, Sex } from "../types";
import { DOMAIN, type RangeFor } from "../types/sheets";
import { EgyptianGrowthChart, GrowthLegend, type GrowthPoint } from "./EgyptianGrowthChart";
import { GrowthChartSkeleton } from "./GrowthChartSkeleton";
import { WhoGrowthPanel } from "./GrowthPanel";

// ── Constants ──────────────────────────────────────────────────────────

const INDICATORS = [
  "weight-for-age",
  "length-for-age",
  "weight-for-length",
  "bmi-for-age",
] as const satisfies readonly GrowthIndicator[];

type ChartableIndicator = (typeof INDICATORS)[number];

const INDICATOR_LABELS: Record<ChartableIndicator, string> = {
  "weight-for-age": "Weight-for-age",
  "length-for-age": "Length/height-for-age",
  "weight-for-length": "Weight-for-length",
  "bmi-for-age": "BMI-for-age",
};

function isChartableIndicator(v: string | null): v is ChartableIndicator {
  return v !== null && (INDICATORS as readonly string[]).includes(v);
}

function rangeFor(indicator: ChartableIndicator): RangeFor<GrowthIndicator> {
  const bounds = DOMAIN[indicator];
  if (!bounds) throw new Error(`No DOMAIN coverage for ${indicator}`);
  if (bounds.length) {
    return {
      xAxis: "length",
      min: bounds.length.min,
      max: bounds.length.max,
    } as RangeFor<GrowthIndicator>;
  }
  if (bounds.age) {
    return {
      xAxis: "age",
      min: bounds.age.min,
      max: bounds.age.max,
    } as RangeFor<GrowthIndicator>;
  }
  throw new Error(`DOMAIN for ${indicator} has no axis entry`);
}

// ── Types ──────────────────────────────────────────────────────────────

interface PatientGrowthPanelProps {
  patientId: string;
  latestVisitId?: string | null;
  latestAgeMonths?: number;
  latestLengthCm?: number;
  currentX?: number | null;
}

interface PatientGrowthContentProps extends PatientGrowthPanelProps {
  sex: Sex;
  gestationalAgeWeeks: number | null;
  dateOfBirth: string;
}

// ── Outer panel — fetches the patient ─────────────────────────────────

export function PatientGrowthPanel(props: PatientGrowthPanelProps) {
  // ── read via patients factory ─────────────────────────────────────
  const patientQuery = useQuery(getPatientQueryOptions(props.patientId));

  if (patientQuery.isError) {
    return (
      <SectionState
        description={
          patientQuery.error instanceof Error
            ? patientQuery.error.message
            : String(patientQuery.error)
        }
        icon={ChartLineIcon}
        title="Could not load patient"
      />
    );
  }

  if (patientQuery.isPending) return <GrowthChartSkeleton />;

  if (!patientQuery.data) {
    return (
      <SectionState
        description="Growth charts cannot be shown."
        icon={ChartLineIcon}
        title="Patient not found"
      />
    );
  }

  return (
    <PatientGrowthContent
      {...props}
      dateOfBirth={patientQuery.data.dateOfBirth}
      gestationalAgeWeeks={patientQuery.data.gestationalAgeWeeks ?? null}
      sex={patientQuery.data.sex}
    />
  );
}

// ── Content — the actual chart ────────────────────────────────────────

function PatientGrowthContent({
  patientId,
  sex,
  gestationalAgeWeeks,
  dateOfBirth,
  latestVisitId,
  latestAgeMonths,
  latestLengthCm,
  currentX,
}: PatientGrowthContentProps) {
  const [indicator, setIndicator] = useState<ChartableIndicator>("weight-for-age");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [useCorrectedAge, setUseCorrectedAge] = useState(false);

  const isPreterm = gestationalAgeWeeks !== null && gestationalAgeWeeks < 37;
  const dob = useMemo(() => new Date(`${dateOfBirth}T00:00:00Z`), [dateOfBirth]);

  const range = useMemo(() => rangeFor(indicator), [indicator]);
  const bandX = currentX ?? null;

  // ── reads via factories ──────────────────────────────────────────
  const curvesQ = useQuery(getGrowthChartCurvesQuery(indicator, sex, range));
  const seriesQ = useQuery(seriesQuery(patientId, indicator));
  const flaggedQ = useQuery({
    ...flaggedMeasurementsQuery(patientId, 2),
    enabled: flaggedOnly,
  });
  const bandQ = useQuery(bandQuery(indicator, sex, range, bandX));

  const points: GrowthPoint[] = useMemo(() => {
    const rows = seriesQ.data ?? [];
    const allowed = flaggedOnly && flaggedQ.data ? new Set(flaggedQ.data.map((r) => r.id)) : null;
    const filtered = allowed ? rows.filter((r) => allowed.has(r.id)) : rows;

    const collected: GrowthPoint[] = [];
    for (const r of filtered) {
      let x: number | null;
      if (indicator === "weight-for-length") {
        x = r.lengthCm;
      } else if (r.visit) {
        if (useCorrectedAge && isPreterm && gestationalAgeWeeks !== null) {
          const correction = ((40 - gestationalAgeWeeks) * 7) / 30.4375;
          x = Math.max(0, decimalMonthsBetween(dob, r.visit.visitedAt) - correction);
        } else {
          x = r.visit.ageMonths;
        }
      } else {
        x = null;
      }
      if (x == null) continue;
      collected.push({
        x,
        y: r.value,
        visitedAt: r.visit?.visitedAt,
        zScore: r.zScore,
      });
    }
    return collected.toSorted((a, b) => a.x - b.x);
  }, [
    seriesQ.data,
    flaggedQ.data,
    flaggedOnly,
    indicator,
    useCorrectedAge,
    isPreterm,
    gestationalAgeWeeks,
    dob,
  ]);

  const currentBand: ChartBand | null = bandQ.data ?? null;
  const noMeasurements = !seriesQ.isPending && !seriesQ.isError && points.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="indicator-select">Indicator</Label>
          <div className="w-64">
            <Select
              onValueChange={(v) => {
                if (isChartableIndicator(v)) setIndicator(v);
              }}
              value={indicator}
            >
              <SelectTrigger id="indicator-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATORS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {INDICATOR_LABELS[i]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={flaggedOnly} id="flagged-only" onCheckedChange={setFlaggedOnly} />
          <Label htmlFor="flagged-only">Show flagged points only</Label>
        </div>

        {isPreterm && (
          <div className="flex items-center gap-2">
            <Switch
              checked={useCorrectedAge}
              id="corrected-age"
              onCheckedChange={setUseCorrectedAge}
            />
            <Label htmlFor="corrected-age">Use corrected age</Label>
          </div>
        )}

        <Button onClick={() => setFormOpen(!formOpen)} type="button">
          {formOpen ? "Close form" : "Add measurement"}
        </Button>
      </div>

      <section
        aria-labelledby="egyptian-growth-chart-title"
        className="space-y-3 rounded-lg border p-4"
      >
        <header>
          <h2 className="text-lg font-semibold" id="egyptian-growth-chart-title">
            Egyptian z-score chart
          </h2>
          <p className="text-muted-foreground text-sm">
            Egyptian 2021 growth reference · LMS-derived z-score curves
            {useCorrectedAge && isPreterm ? " · corrected age" : ""}
          </p>
        </header>
        <GrowthLegend />

        {curvesQ.isError ? (
          <div
            className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
            role="alert"
          >
            Could not load Egyptian reference curves:{" "}
            {curvesQ.error instanceof Error ? curvesQ.error.message : String(curvesQ.error)}
          </div>
        ) : curvesQ.isPending || !curvesQ.data ? (
          <GrowthChartSkeleton />
        ) : noMeasurements ? (
          <SectionState
            action={
              <Button onClick={() => setFormOpen(true)} type="button" variant="outline">
                Add first measurement
              </Button>
            }
            description={`No ${INDICATOR_LABELS[indicator].toLowerCase()} measurements recorded yet. Reference curves are shown for orientation.`}
            icon={ChartLineIcon}
            title="No measurements for this indicator"
          />
        ) : (
          <EgyptianGrowthChart
            currentBand={currentBand}
            curves={curvesQ.data}
            indicator={indicator}
            points={points}
            sex={sex}
            xAxisLabel={useCorrectedAge && isPreterm ? "Corrected age (months)" : undefined}
          />
        )}
      </section>

      <WhoGrowthPanel indicator={indicator} patientId={patientId} sex={sex} />

      {formOpen && latestVisitId && latestAgeMonths !== undefined && (
        <MeasurementForm
          ageMonths={latestAgeMonths}
          lengthCm={latestLengthCm}
          patientId={patientId}
          patientSex={sex}
          visitId={latestVisitId}
        />
      )}
      {formOpen && (!latestVisitId || latestAgeMonths === undefined) && (
        <p className="text-muted-foreground text-sm">Record a visit before adding measurements.</p>
      )}
    </div>
  );
}
