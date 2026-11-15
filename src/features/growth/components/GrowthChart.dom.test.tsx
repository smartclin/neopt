// src/features/growth/components/GrowthChart.dom.test.tsx
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { ChartBand, ChartCurves } from "../types";
import { EgyptianGrowthChart } from "./EgyptianGrowthChart";

// ── Spies ──────────────────────────────────────────────────────────────
//
// `vi.hoisted` runs before any `vi.mock` factory, so the arrays exist by
// the time the mocked `lineY` / `dot` / `Chart` closures capture them.
// Without this, a future change that reads the array inside the factory
// (e.g. a `Set` built once) would crash with `undefined is not iterable`.

const { lineYCalls, dotCalls, chartCalls } = vi.hoisted(() => ({
  lineYCalls: [] as Array<{
    data: Array<{ x: number; y: number }>;
    opts: Record<string, unknown>;
  }>,
  dotCalls: [] as Array<{
    data: Array<{ x: number; y: number }>;
    opts: Record<string, unknown>;
  }>,
  chartCalls: [] as Array<{
    definition: { marks: unknown[] };
    ariaLabel?: string;
  }>,
}));

vi.mock("@tanstack/charts", () => ({
  defineChart: (def: unknown) => def,
  lineY: (data: Array<{ x: number; y: number }>, opts: Record<string, unknown>) => {
    lineYCalls.push({ data, opts });
    return { type: "lineY", data, opts };
  },
  dot: (data: Array<{ x: number; y: number }>, opts: Record<string, unknown>) => {
    dotCalls.push({ data, opts });
    return { type: "dot", data, opts };
  },
}));

vi.mock("@tanstack/charts/scales/linear", () => ({
  scaleLinear: { __isLinear: true },
}));

// `Chart` mock exists so the component's `import { Chart } from
// "@tanstack/charts/react"` resolves, and so we can assert that the
// definition reached `<Chart>` (not just that `lineY` was called).
vi.mock("@tanstack/charts/react", () => ({
  Chart: (props: { definition: { marks: unknown[] }; ariaLabel?: string }) => {
    chartCalls.push(props);
    return <div data-marks={props.definition.marks.length} data-testid="chart" />;
  },
}));

vi.mock("@tanstack/charts/tooltip", () => ({ tooltip: {} }));

// ── Fixtures ────────────────────────────────────────────────────────────

/** Seven reference points across the male 0–24 month age domain. */
const CURVES: ChartCurves = (() => {
  const points = [0, 3, 6, 9, 12, 18, 24].map((x) => ({
    x,
    median: 3.5 + x * 0.5,
    sd3neg: 2.1 + x * 0.4,
    sd2neg: 2.6 + x * 0.42,
    sd1neg: 3.0 + x * 0.45,
    sd1: 4.0 + x * 0.55,
    sd2: 4.6 + x * 0.6,
    sd3: 5.3 + x * 0.65,
  }));
  return { indicator: "weight-for-age", sex: "male", xAxis: "age", points };
})();

/** A band whose `x` (6) is one of the tabulated `CURVES.points` x-values. */
const BAND: ChartBand = {
  x: 6,
  median: 6.5,
  sd3neg: 4.7,
  sd2neg: 5.2,
  sd1neg: 5.7,
  sd1: 7.3,
  sd2: 7.8,
  sd3: 8.3,
};

/** A band at x = 7, which sits *between* CURVES points 6 and 9. */
const BAND_INTERPOLATED: ChartBand = {
  x: 7,
  median: 7.0,
  sd3neg: 5.0,
  sd2neg: 5.5,
  sd1neg: 6.0,
  sd1: 7.7,
  sd2: 8.2,
  sd3: 8.8,
};

const POINTS = [
  { x: 0, y: 3.4 },
  { x: 6, y: 6.5 },
  { x: 12, y: 7.9 },
];

const BAND_STROKES = [
  "var(--growth-series-sd3neg)",
  "var(--growth-series-sd2neg)",
  "var(--growth-series-sd1neg)",
  "var(--growth-series-median)",
  "var(--growth-series-sd1)",
  "var(--growth-series-sd2)",
  "var(--growth-series-sd3)",
] as const;

beforeEach(() => {
  lineYCalls.length = 0;
  dotCalls.length = 0;
  chartCalls.length = 0;
});

// ── Tests ───────────────────────────────────────────────────────────────

describe("EgyptianGrowthChart", () => {
  it("renders exactly the seven band reference lines, in order", () => {
    render(
      <EgyptianGrowthChart
        curves={CURVES}
        indicator="weight-for-age"
        points={[]}
        sex="male"
        showTooltip={false}
      />,
    );

    // Seven `lineY` calls, each for one band.
    expect(lineYCalls).toHaveLength(7);

    // They're the seven band strokes, in the canonical order.
    const strokes = lineYCalls.map((call) => call.opts.stroke);
    expect(strokes).toEqual([...BAND_STROKES]);

    // And the definition reached `<Chart>` with all seven marks.
    expect(chartCalls).toHaveLength(1);
    expect(chartCalls[0].definition.marks).toHaveLength(7);
  });

  it("renders one scatter mark carrying every patient point", () => {
    render(
      <EgyptianGrowthChart
        curves={CURVES}
        indicator="weight-for-age"
        points={POINTS}
        sex="male"
        showTooltip={false}
      />,
    );

    expect(dotCalls).toHaveLength(1);
    expect(dotCalls[0].data).toHaveLength(POINTS.length);
    expect(dotCalls[0].data.map((p) => p.x)).toEqual(POINTS.map((p) => p.x));

    // 7 band lines + 1 dot = 8 marks on the chart.
    expect(chartCalls[0].definition.marks).toHaveLength(8);
  });

  it("adds a two-point marker at the band x when currentBand is tabulated", () => {
    render(
      <EgyptianGrowthChart
        currentBand={BAND}
        curves={CURVES}
        indicator="weight-for-age"
        points={POINTS}
        sex="male"
        showTooltip={false}
      />,
    );

    // The marker is the only 2-point `lineY`; the 7 band lines are 7-point.
    const marker = lineYCalls.find((call) => call.data.length === 2);
    expect(marker).toBeDefined();
    expect(marker!.data).toEqual([
      { x: BAND.x, y: BAND.sd3neg },
      { x: BAND.x, y: BAND.sd3 },
    ]);

    // 7 bands + 1 marker + 1 dot = 9 marks.
    expect(chartCalls[0].definition.marks).toHaveLength(9);
  });

  it("interpolates the marker endpoints when currentBand.x is not tabulated", () => {
    // CURVES points are at x = 0, 3, 6, 9, 12, 18, 24 — 7 is not among them.
    render(
      <EgyptianGrowthChart
        currentBand={BAND_INTERPOLATED}
        curves={CURVES}
        indicator="weight-for-age"
        points={[]}
        sex="male"
        showTooltip={false}
      />,
    );

    const marker = lineYCalls.find((call) => call.data.length === 2);
    expect(marker).toBeDefined();
    // Both endpoints share the requested x.
    expect(marker!.data.every((p) => p.x === BAND_INTERPOLATED.x)).toBe(true);
    // The y endpoints are the sd3neg/sd3 from the *interpolated* band,
    // which the component interpolates from CURVES at x = 7.
    expect(marker!.data).toEqual([
      { x: BAND_INTERPOLATED.x, y: BAND_INTERPOLATED.sd3neg },
      { x: BAND_INTERPOLATED.x, y: BAND_INTERPOLATED.sd3 },
    ]);
  });
});
