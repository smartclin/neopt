// components/GrowthChart.tsx
import { areaY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleLinear, scaleUtc } from "d3-scale";
import * as React from "react";

import type { ChildMeasurement, GrowthStandard } from "../types/types";

interface GrowthChartProps {
  standards: GrowthStandard[];
  measurements?: ChildMeasurement[];
  title: string;
  yLabel: string;
  metric: "lhfa" | "wfa";
  gender: "boys" | "girls";
}

// Build a single row per day holding the band edges
interface BandRow {
  child: number | null;
  day: number;
  date: Date;
  sd4neg: number;
  sd3neg: number;
  sd2neg: number;
  sd1neg: number;
  sd0: number;
  sd1: number;
  sd2: number;
  sd3: number;
  sd4: number;
}

// Convert day number to a representative date for scaleUtc
// Using a fixed epoch so all charts align
const EPOCH = Date.UTC(2026, 0, 1);

function dayToDate(day: number): Date {
  return new Date(EPOCH + day * 86_400_000);
}

// Merge standards with child measurements onto the same day grid
function mergeData(standards: GrowthStandard[], measurements: ChildMeasurement[]): BandRow[] {
  const childMap = new Map(measurements.map((m) => [m.day, m.value]));

  return standards.map((s) => ({
    day: s.day,
    date: dayToDate(s.day),
    sd4neg: s.sd4neg,
    sd3neg: s.sd3neg,
    sd2neg: s.sd2neg,
    sd1neg: s.sd1neg,
    sd0: s.sd0,
    sd1: s.sd1,
    sd2: s.sd2,
    sd3: s.sd3,
    sd4: s.sd4,
    // child value as a separate field for the line
    child: childMap.get(s.day) ?? null,
  }));
}

// Resolve the y domain from the reference range plus child values
function resolveDomain(rows: BandRow[]): [number, number] {
  if (rows.length === 0) return [0, 1];

  const values: number[] = [];
  for (const row of rows) {
    values.push(row.sd4neg, row.sd4, row.sd0);
    if (row.child !== null) values.push(row.child);
  }
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return [0, 1];

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const padding = Math.max((max - min) * 0.1, Math.abs(max) * 0.02, 0.1);
  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

// Resolve x domain based on visible day range
function resolveXDomain(rows: BandRow[]): [Date, Date] {
  if (rows.length === 0) return [dayToDate(0), dayToDate(365)];
  const first = rows[0].date;
  const last = rows[rows.length - 1].date;
  return first.getTime() === last.getTime() ? [first, dayToDate(rows[0].day + 1)] : [first, last];
}

export function WhoGrowthChart({
  standards,
  measurements = [],
  title,
  yLabel,
  metric,
  gender,
}: GrowthChartProps) {
  const rows = React.useMemo(() => mergeData(standards, measurements), [standards, measurements]);

  const domain = React.useMemo(() => resolveDomain(rows), [rows]);
  const xDomain = React.useMemo(() => resolveXDomain(rows), [rows]);

  const definition = React.useMemo(
    () =>
      defineChart({
        tooltip: {
          use: tooltip,
          placement: ["top", "right", "left"],
          format: (point) => {
            const day = point.datum.day;
            const month = Math.round(day / 30.44);
            const label = day < 30 ? `${day}d` : `${month}mo (${day}d)`;
            return `${label}\n${point.yValue.toFixed(1)} ${yLabel}`;
          },
        },
        marks: [
          areaY(rows, {
            id: "band-outer",
            x: "date",
            y1: "sd2neg",
            y2: "sd2",
            fill: "#dbeafe",
            fillOpacity: 0.55,
          }),
          areaY(rows, {
            id: "band-inner",
            x: "date",
            y1: "sd1neg",
            y2: "sd1",
            fill: "#93c5fd",
            fillOpacity: 0.45,
          }),
          // Median reference line
          lineY(rows, {
            id: "median",
            x: "date",
            y: "sd0",
            stroke: "#1d4ed8",
            strokeWidth: 2,
            strokeDasharray: "6 3",
          }),
          // ±2 SD boundary lines
          lineY(rows, {
            id: "sd2-upper",
            x: "date",
            y: "sd2",
            stroke: "#60a5fa",
            strokeWidth: 1.25,
          }),
          lineY(rows, {
            id: "sd2-lower",
            x: "date",
            y: "sd2neg",
            stroke: "#60a5fa",
            strokeWidth: 1.25,
          }),
          // Child measurements (only if provided)
          ...(measurements.length > 0
            ? [
                lineY(rows, {
                  id: "child",
                  x: "date",
                  y: "child",
                  stroke: "#dc2626",
                  strokeWidth: 2.5,
                  points: true,
                }),
              ]
            : []),
        ],
        scales: {
          x: {
            scale: scaleUtc().domain(xDomain),
            axis: {
              line: false,
              ticks: {
                count: 6,
                format: (d: Date) => {
                  const day = Math.round((d.getTime() - EPOCH) / 86_400_000);
                  const month = Math.round(day / 30.44);
                  return day < 30 ? `${day}d` : `${month}mo`;
                },
                size: 0,
                padding: 8,
              },
              tickLabels: { thin: { priority: "ends", minGap: 24 } },
            },
          },
          y: {
            scale: scaleLinear().domain(domain),
            grid: true,
            axis: {
              line: false,
              ticks: {
                count: 5,
                format: (v: number) => v.toFixed(0),
                size: 0,
                padding: 8,
              },
              tickLabels: { thin: { priority: "ends", minGap: 16 } },
              label: yLabel,
            },
          },
        },
        margin: { top: 12, right: 16, bottom: 32, left: 44 },
        clip: true,
      }),
    [rows, domain, xDomain, yLabel, measurements.length],
  );

  const metricLabel = metric === "lhfa" ? "Length/Height" : "Weight";
  const genderLabel = gender === "boys" ? "Boys" : "Girls";

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className=" text-sm">
            WHO {metricLabel}-for-age · {genderLabel} · shaded = ±1 SD / ±2 SD
          </p>
        </div>
        {measurements.length > 0 && (
          <span className=" text-sm">{measurements.length} measurements</span>
        )}
      </div>
      <Chart
        ariaLabel={`${metricLabel}-for-age chart for ${genderLabel} with WHO standard deviation bands`}
        definition={definition}
        height={380}
        initialWidth={760}
      />
    </section>
  );
}
