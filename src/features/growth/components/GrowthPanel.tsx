import { useQuery } from "@tanstack/react-query";

import type { Indicator, Sex } from "../types/types";

// ── reads ──────────────────────────────────────────────────────────────
import { childMeasurementsQuery, growthStandardsQuery } from "../queries";
import { GrowthChartSkeleton } from "./GrowthChartSkeleton";
import { WhoGrowthChart } from "./WhoGrowthChart";

type WhoMetric = "lhfa" | "wfa";

const WHO_METRIC_BY_INDICATOR: Partial<Record<Indicator, WhoMetric>> = {
  "length-for-age": "lhfa",
  "weight-for-age": "wfa",
};

const METRIC_LABEL: Record<WhoMetric, string> = {
  lhfa: "Length/height-for-age",
  wfa: "Weight-for-age",
};

export interface WhoGrowthPanelProps {
  patientId: string;
  sex: Sex;
  indicator: Indicator;
}

export function WhoGrowthPanel({ patientId, sex, indicator }: WhoGrowthPanelProps) {
  const metric = WHO_METRIC_BY_INDICATOR[indicator];
  const sectionId = `who-growth-${patientId}`;

  return (
    <section aria-labelledby={`${sectionId}-title`} className="space-y-3 rounded-lg border p-4">
      <header>
        <h2 className="text-lg font-semibold" id={`${sectionId}-title`}>
          WHO growth chart
        </h2>
        <p className="text-muted-foreground text-sm">
          WHO Child Growth Standards, shown separately from the Egyptian 2021 reference.
        </p>
      </header>

      {metric ? (
        <WhoGrowthChartData
          gender={sex === "male" ? "boys" : "girls"}
          metric={metric}
          patientId={patientId}
        />
      ) : (
        <p className="text-muted-foreground text-sm" role="status">
          The bundled WHO data currently covers weight-for-age and length/height-for-age only. No
          WHO chart is available for {indicator.replaceAll("-", " ")}.
        </p>
      )}
    </section>
  );
}

interface WhoGrowthChartDataProps {
  gender: "boys" | "girls";
  metric: WhoMetric;
  patientId: string;
}

function WhoGrowthChartData({ gender, metric, patientId }: WhoGrowthChartDataProps) {
  // ── reads via factories ───────────────────────────────────────────
  const standardsQuery = useQuery(growthStandardsQuery(metric, gender));
  const measurementsQuery = useQuery(childMeasurementsQuery(patientId, metric));

  if (standardsQuery.isError || measurementsQuery.isError) {
    const error = standardsQuery.error ?? measurementsQuery.error;
    return (
      <div
        className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
        role="alert"
      >
        Could not load the WHO growth chart:{" "}
        {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  if (standardsQuery.isPending || measurementsQuery.isPending) {
    return <GrowthChartSkeleton height={380} />;
  }

  if (!standardsQuery.data?.length) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        WHO reference data is not loaded. Seed the WHO growth standards before using this chart.
      </p>
    );
  }

  return (
    <WhoGrowthChart
      gender={gender}
      measurements={measurementsQuery.data ?? []}
      metric={metric}
      standards={standardsQuery.data}
      title={METRIC_LABEL[metric]}
      yLabel={metric === "lhfa" ? "cm" : "kg"}
    />
  );
}
