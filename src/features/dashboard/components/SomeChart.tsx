
import {
    AreaChart,
    BarChart,
    ChartContainer,
    ChartLegend,
    type ChartConfig,
    type ChartDataPoint,
    LineChart,
} from "@/components/chart";
import {useState} from "react";

// ============================================================
// Types
// ============================================================

type ChartVariant = "area" | "line" | "bar";

interface SomeChartProps {
  data?: ChartDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

const CHART_OPTIONS: {
  value: ChartVariant;
  label: string;
}[] = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
];

// ============================================================
// Configuration
// ============================================================

const chartConfig = {
  patients: {
    label: "Patients",
    color: "var(--chart-1)",
  },
  appointments: {
    label: "Appointments",
    color: "var(--chart-2)",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// ============================================================
// Demo Data
// ============================================================

const DEFAULT_DATA: ChartDataPoint[] = [
  { month: "Jan", patients: 120, appointments: 95, revenue: 4200 },
  { month: "Feb", patients: 145, appointments: 110, revenue: 5100 },
  { month: "Mar", patients: 132, appointments: 105, revenue: 4800 },
  { month: "Apr", patients: 168, appointments: 140, revenue: 6200 },
  { month: "May", patients: 190, appointments: 155, revenue: 7100 },
  { month: "Jun", patients: 175, appointments: 148, revenue: 6800 },
  { month: "Jul", patients: 210, appointments: 180, revenue: 8200 },
  { month: "Aug", patients: 225, appointments: 195, revenue: 9100 },
  { month: "Sep", patients: 205, appointments: 175, revenue: 8500 },
  { month: "Oct", patients: 240, appointments: 210, revenue: 10200 },
  { month: "Nov", patients: 260, appointments: 225, revenue: 11500 },
  { month: "Dec", patients: 285, appointments: 245, revenue: 12800 },
];

// ============================================================
// Chart Renderer
// ============================================================

interface ChartRendererProps {
  variant: ChartVariant;
  data: ChartDataPoint[];
  height: number;
}

function ChartRenderer({ variant, data, height }: ChartRendererProps) {
  const chartProps = {
    data,
    dataKeys: ["patients", "appointments", "revenue"],
    xAxisKey: "month",
    height,
    colors: [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
    ],
  };

  switch (variant) {
    case "area":
      return <AreaChart {...chartProps} />;

    case "line":
      return <LineChart {...chartProps} />;

    case "bar":
      return <BarChart {...chartProps} />;

    default:
      return null;
  }
}

// ============================================================
// Main Component
// ============================================================

export function SomeChart({
  data = DEFAULT_DATA,
  title = "Clinic Overview",
  description = "Monthly patient activity and clinic performance",
  height = 300,
  className,
}: SomeChartProps) {
  const [variant, setVariant] = useState<ChartVariant>("area");

  return (
    <section
      aria-label={title}
      className={className}
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Chart Type Selector */}
        <div
          aria-label="Chart type"
          className="inline-flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
        >
          {CHART_OPTIONS.map((option) => (
            <button
              aria-pressed={variant === option.value}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                variant === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              key={option.value}
              onClick={() => setVariant(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ChartContainer
        config={chartConfig}
        height={height + 10}
      >
        <ChartRenderer
          data={data}
          height={height}
          variant={variant}
        />
      </ChartContainer>

      {/* Legend */}
      <ChartLegend config={chartConfig} />
    </section>
  );
}

export default SomeChart;
