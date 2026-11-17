// Packages/ui/src/components/chart.tsx

import { areaY, type ChartPoint, d3Curve, defineChart } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { RendererChart } from "@tanstack/charts/react/tooltip";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveNatural } from "d3-shape";
import * as React from "react";

const NATURAL_CURVE = d3Curve(curveNatural);

import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
const Reg = /-?(bars|lines|areas|slices|values|radar)$/u;
export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  }
>;

export type ChartDataPoint = Record<string, string | number>;

export interface ChartSeries {
  dataKey: string;
  label: string;
  color: string;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ef4444", // Red
];

// ============================================================
// Context
// ============================================================

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

// ============================================================
// Chart Container
// ============================================================

type ChartContainerProps = {
  children: React.ReactNode;
  config: ChartConfig;
  height?: number;
  width?: number | string;
} & React.ComponentProps<"div">;

export function ChartContainer({
  id,
  className,
  children,
  config,
  height = 300,
  width = "100%",
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replaceAll(":", "")}`;
  const contextValue = React.useMemo(() => ({ config }), [config]);

  return (
    <ChartContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex w-full justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          className,
        )}
        data-chart={chartId}
        data-slot="chart"
        {...props}
      >
        <div className="w-full" style={{ height, width }}>
          {children}
        </div>
      </div>
    </ChartContext.Provider>
  );
}

// ============================================================
// Chart Tooltip
// ============================================================

function shadcnTooltipContent<TDatum>(points: readonly ChartPoint<TDatum>[]) {
  return {
    rows: points.map((point) => ({
      color: point.color,
      label: String(point.group ?? point.markId.replace(Reg, "")),
      value: Number(point.yValue ?? point.xValue ?? 0).toLocaleString("en-US"),
    })),
    title: String(points[0]?.xValue ?? ""),
  };
}

// ============================================================
// Chart Components
// ============================================================

interface ChartProps {
  colors?: string[];
  data: ChartDataPoint[];
  dataKeys: string[];
  height?: number;
  width?: number;
  xAxisKey?: string;
}
type ChartVariant = "area" | "line" | "bar";

const VARIANT_STYLES: Record<
  ChartVariant,
  {
    fillOpacity: number;
    strokeWidth: number;
    ariaLabel: string;
  }
> = {
  area: { ariaLabel: "Area chart", fillOpacity: 0.4, strokeWidth: 2 },
  bar: { ariaLabel: "Bar chart", fillOpacity: 0.8, strokeWidth: 0 },
  line: { ariaLabel: "Line chart", fillOpacity: 0.1, strokeWidth: 2.5 },
};

function BaseChart({
  variant,
  data,
  dataKeys,
  colors = DEFAULT_COLORS,
  xAxisKey = "month",
  height = 300,
  width,
}: ChartProps & { variant: ChartVariant }) {
  const style = VARIANT_STYLES[variant];

  const renderer = React.useMemo(
    () =>
      motion({
        initial: "always",
        transition: {
          damping: 18,
          mass: 1,
          stiffness: 170,
          type: "spring",
        },
      }),
    [],
  );

  // Stabilize array identities. Callers frequently pass inline literals
  // (`colors={["var(--chart-1)"]}`), which would otherwise invalidate the
  // `definition` memo on every render and rebuild every `areaY` mark.
  // We join-then-split so the dependency is a primitive string, not an array.
  const colorsKey = colors.join("\u0000");
  const dataKeysKey = dataKeys.join("\u0000");

  const stableColors = React.useMemo(() => colorsKey.split("\u0000"), [colorsKey]);
  const stableDataKeys = React.useMemo(() => dataKeysKey.split("\u0000"), [dataKeysKey]);

  const definition = React.useMemo(() => {
    const fallbackColor = stableColors[0] ?? "currentColor";
    const marks = stableDataKeys.map((key, index) =>
      areaY(data, {
        // Hoisted — not re-created per memo invalidation.
        curve: NATURAL_CURVE,
        fill: stableColors[index % stableColors.length] ?? fallbackColor,
        fillOpacity: style.fillOpacity,
        id: key,
        stroke: stableColors[index % stableColors.length] ?? fallbackColor,
        strokeWidth: style.strokeWidth,
        x: xAxisKey,
        y: (point: ChartDataPoint) => Number(point[key]),
      }),
    );

    return defineChart(
      {
        color: { domain: stableDataKeys, range: stableColors },
        margin: { bottom: 35, left: 40, right: 10, top: 10 },
        marks,
        scales: {
          x: {
            axis: { line: false, ticks: { padding: 10, size: 0 } },
            scale: scalePoint,
          },
          y: {
            axis: { line: false, tickLabels: false, ticks: false },
            grid: true,
            scale: scaleLinear,
          },
        },
        theme: {
          background: "transparent",
          foreground: "var(--muted-foreground)",
          grid: "var(--border)",
        },
      },
      {
        focus: "group-x",
        svgAnimation: false,
        tooltip: {
          anchor: "group-center",
          className: "sc-chart-tooltip",
          content: (points) => shadcnTooltipContent(points),
          placement: "auto",
          sort: "color-domain",
          use: tooltip,
        },
      },
    );
  }, [data, stableDataKeys, stableColors, xAxisKey, style]);

  return (
    <div style={{ height, width: width ?? "100%" }}>
      <RendererChart
        ariaLabel={style.ariaLabel}
        definition={definition}
        height={height}
        initialWidth={width ?? 600}
        renderer={renderer}
        {...(width !== undefined ? { width } : {})}
      />
    </div>
  );
}

export function AreaChart(props: ChartProps) {
  return <BaseChart variant="area" {...props} />;
}

export function LineChart(props: ChartProps) {
  return <BaseChart variant="line" {...props} />;
}

export function BarChart(props: ChartProps) {
  return <BaseChart variant="bar" {...props} />;
}

// ============================================================
// Chart Tooltip Content
// ============================================================

export interface ChartTooltipContentProps {
  active?: boolean;
  label?: string;
  payload?: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
  if (!(active && payload?.length)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {Boolean(label) && (
        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div className="flex items-center justify-between gap-4" key={index}>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-600 dark:text-slate-400">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Chart Legend
// ============================================================

export interface ChartLegendProps {
  config: ChartConfig;
}

export function ChartLegend({ config }: ChartLegendProps) {
  const entries = Object.entries(config);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
      {entries.map(([key, item]) => (
        <div className="flex items-center gap-1.5" key={key}>
          <div className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <span className=" text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Export
// ============================================================

export type { ChartContextProps };
