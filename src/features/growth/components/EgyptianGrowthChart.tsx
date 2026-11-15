// src/components/growth/EgyptianGrowthChart.tsx

import { defineChart, dot, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import type { CSSProperties } from "react";
import { useMemo } from "react";

import type { ChartBand, ChartCurves, Indicator, Sex, XAxis } from "@/features/growth/types";
import { cn } from "@/lib/utils";

export interface GrowthPoint {
  x: number;
  y: number;
  visitedAt?: Date;
  zScore?: number | null;
}

export interface EgyptianGrowthChartProps {
  indicator: Indicator;
  sex: Sex;
  curves: ChartCurves;
  points?: readonly GrowthPoint[];
  currentBand?: ChartBand | null;
  height?: number;
  width?: number;
  aspectRatio?: number;
  ariaLabel?: string;
  xAxisLabel?: string;
  onFocusChange?: (point: GrowthPoint | null) => void;
  onSelect?: (point: GrowthPoint) => void;
  className?: string;
  style?: CSSProperties;
  showTooltip?: boolean;
  animate?: boolean;
}

const BAND_LABELS = {
  sd3neg: "−3 SD",
  sd2neg: "−2 SD",
  sd1neg: "−1 SD",
  median: "Median",
  sd1: "+1 SD",
  sd2: "+2 SD",
  sd3: "+3 SD",
} as const;

const SERIES_COLORS = {
  sd3neg: "var(--growth-series-sd3neg)",
  sd2neg: "var(--growth-series-sd2neg)",
  sd1neg: "var(--growth-series-sd1neg)",
  median: "var(--growth-series-median)",
  sd1: "var(--growth-series-sd1)",
  sd2: "var(--growth-series-sd2)",
  sd3: "var(--growth-series-sd3)",
} as const;

const BAND_KEYS = ["sd3neg", "sd2neg", "sd1neg", "median", "sd1", "sd2", "sd3"] as const;

const EMPTY_POINTS: readonly GrowthPoint[] = [];

function axisLabel(xAxis: XAxis): string {
  return xAxis === "age" ? "Age (months)" : "Length (cm)";
}

function valueLabel(indicator: Indicator): string {
  switch (indicator) {
    case "weight-for-age":
    case "weight-for-length":
      return "Weight (kg)";
    case "length-for-age":
      return "Length / height (cm)";
    case "bmi-for-age":
      return "BMI (kg/m²)";
    default:
      return "Measurement";
  }
}

function defaultAriaLabel(indicator: Indicator, sex: Sex): string {
  const who = sex === "male" ? "boy" : "girl";
  return `Egyptian 2021 ${indicator} reference chart for a ${who}`;
}

interface BandRow {
  x: number;
  sd3neg: number;
  sd2neg: number;
  sd1neg: number;
  median: number;
  sd1: number;
  sd2: number;
  sd3: number;
}

function toBandRows(points: ChartCurves["points"]): BandRow[] {
  return points.map((p) => ({
    x: p.x,
    sd3neg: p.sd3neg,
    sd2neg: p.sd2neg,
    sd1neg: p.sd1neg,
    median: p.median,
    sd1: p.sd1,
    sd2: p.sd2,
    sd3: p.sd3,
  }));
}

function isGrowthPoint(value: unknown): value is GrowthPoint {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    typeof (value as { x: unknown }).x === "number" &&
    "y" in value &&
    typeof (value as { y: unknown }).y === "number"
  );
}

/**
 * TanStack Charts passes the *datum* to focus/select handlers. Older or
 * wrapped versions may pass `{ datum }`. Accept both shapes so `onSelect`
 * reliably fires.
 */
function datumFromEvent(value: unknown): GrowthPoint | null {
  if (isGrowthPoint(value)) return value;
  if (typeof value !== "object" || value === null || !("datum" in value)) return null;
  return isGrowthPoint((value as { datum: unknown }).datum)
    ? (value as { datum: GrowthPoint }).datum
    : null;
}

export function EgyptianGrowthChart({
  indicator,
  sex,
  curves,
  points = EMPTY_POINTS,
  currentBand,
  height = 360,
  width,
  aspectRatio,
  ariaLabel,
  xAxisLabel,
  onFocusChange,
  onSelect,
  className,
  style,
  showTooltip = true,
  animate = true,
}: EgyptianGrowthChartProps) {
  const xAxis = curves.xAxis;
  const resolvedAriaLabel = ariaLabel ?? defaultAriaLabel(indicator, sex);

  const definition = useMemo(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      (curves.indicator !== indicator || curves.sex !== sex)
    ) {
      console.warn(
        `[EgyptianGrowthChart] curves (${curves.indicator}/${curves.sex}/${curves.xAxis}) ` +
          `do not match props (${indicator}/${sex}). Using curves for rendering.`,
      );
    }

    const rows = toBandRows(curves.points);

    const bandMarks = [
      lineY(rows, {
        x: "x",
        y: "sd3neg",
        stroke: SERIES_COLORS.sd3neg,
        strokeWidth: 1,
        strokeDasharray: "4 3",
      }),
      lineY(rows, {
        x: "x",
        y: "sd2neg",
        stroke: SERIES_COLORS.sd2neg,
        strokeWidth: 1.5,
      }),
      lineY(rows, {
        x: "x",
        y: "sd1neg",
        stroke: SERIES_COLORS.sd1neg,
        strokeWidth: 1,
        strokeDasharray: "4 3",
      }),
      lineY(rows, {
        x: "x",
        y: "median",
        stroke: SERIES_COLORS.median,
        strokeWidth: 2,
      }),
      lineY(rows, {
        x: "x",
        y: "sd1",
        stroke: SERIES_COLORS.sd1,
        strokeWidth: 1,
        strokeDasharray: "4 3",
      }),
      lineY(rows, {
        x: "x",
        y: "sd2",
        stroke: SERIES_COLORS.sd2,
        strokeWidth: 1.5,
      }),
      lineY(rows, {
        x: "x",
        y: "sd3",
        stroke: SERIES_COLORS.sd3,
        strokeWidth: 1,
        strokeDasharray: "4 3",
      }),
    ];

    // `dot` requires a mutable array; clone so we don't mutate the prop.
    const pointData: GrowthPoint[] = points.map((p) => ({ ...p }));
    const pointMarks =
      pointData.length > 0
        ? [
            dot(pointData, {
              x: "x",
              y: "y",
              fill: "var(--growth-patient)",
              r: 4,
              stroke: "#fff",
              strokeWidth: 1.5,
            }),
          ]
        : [];

    const marker =
      currentBand !== null && currentBand !== undefined
        ? [
            lineY(
              [
                {
                  x: currentBand.x,
                  y: currentBand.sd3neg,
                },
                { x: currentBand.x, y: currentBand.sd3 },
              ],
              {
                x: "x",
                y: "y",
                stroke: "var(--growth-marker, #0ea5e9)",
                strokeWidth: 1.5,
                strokeDasharray: "3 3",
              },
            ),
          ]
        : [];

    return defineChart({
      // Draw reference bands first, then the marker, then patient dots
      // on top so they're never occluded.
      marks: [...bandMarks, ...marker, ...pointMarks],
      scales: {
        x: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: xAxisLabel ?? axisLabel(xAxis) },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: valueLabel(indicator) },
        },
      },
      ...(showTooltip ? { tooltip } : {}),
      ...(animate ? { svgAnimation: true } : {}),
      ariaLabel: resolvedAriaLabel,
    });
  }, [
    curves,
    points,
    currentBand,
    xAxis,
    indicator,
    sex,
    resolvedAriaLabel,
    xAxisLabel,
    showTooltip,
    animate,
  ]);

  const handleFocusChange = (point: unknown) => {
    if (!onFocusChange) return;
    onFocusChange(datumFromEvent(point));
  };

  const handleSelect = (point: unknown) => {
    if (!onSelect) return;
    const datum = datumFromEvent(point);
    if (datum) onSelect(datum);
  };

  return (
    <div className={className} style={style}>
      <Chart
        definition={definition}
        height={height}
        {...(width !== undefined ? { width } : {})}
        {...(width === undefined && aspectRatio !== undefined ? { aspectRatio } : {})}
        ariaLabel={resolvedAriaLabel}
        {...(onFocusChange ? { onFocusChange: handleFocusChange } : {})}
        {...(onSelect ? { onSelect: handleSelect } : {})}
      />
    </div>
  );
}

export interface GrowthLegendProps {
  className?: string;
}

export function GrowthLegend({ className }: GrowthLegendProps) {
  return (
    <div
      aria-label="Growth chart reference bands"
      className={cn("text-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm", className)}
      role="list"
    >
      {BAND_KEYS.map((band) => (
        <div className="inline-flex items-center gap-2" key={band} role="listitem">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-0 w-5 border-t-2",
              band === "median" ? "border-solid" : "border-dashed",
            )}
            data-growth-series={band}
            style={{ borderTopColor: SERIES_COLORS[band] }}
          />
          <span>{BAND_LABELS[band]}</span>
        </div>
      ))}
      <div className="inline-flex items-center gap-2" role="listitem">
        <span
          aria-hidden="true"
          className="border-background size-2 rounded-full border"
          style={{ backgroundColor: "var(--growth-patient)" }}
        />
        <span>Patient</span>
      </div>
    </div>
  );
}
