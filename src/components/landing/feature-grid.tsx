import { cn } from "@/lib/utils";
import {
  AppointmentsVisual,
  DosingVisual,
  GrowthChartVisual,
  ImmunizationVisual,
  SickChildVisual,
} from "./feature-visuals";

const FEATURES = [
  {
    visual: GrowthChartVisual,
    title: "WHO & Egyptian growth charts",
    desc: "Plot weight, length, and head circumference against WHO LMS reference and Egyptian percentile curves with automatic z-score interpretation.",
    accent: "text-primary",
  },
  {
    visual: DosingVisual,
    title: "Pediatric & neonatal dosing",
    desc: "Weight-based prescription composer with a neonatal dosing calculator and formulary-aware medication picker — with safety rails built in.",
    accent: "text-secondary",
  },
  {
    visual: ImmunizationVisual,
    title: "Immunization coverage matrix",
    desc: "Track every scheduled dose against the clinic scheme, spot coverage gaps at a glance, and keep an auditable record per child.",
    accent: "text-emerald-500",
  },
  {
    visual: SickChildVisual,
    title: "Sick visits & acute care",
    desc: "Rapid assessment tools, symptom checkers, and prescription templates for acute childhood illnesses.",
    accent: "text-violet-500",
  },
  {
    visual: AppointmentsVisual,
    title: "Appointments & today queue",
    desc: "Calendar and week-strip views, a live today queue, and filters keep the front desk and clinicians on the same page.",
    accent: "text-amber-500",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="border-border/60 bg-background scroll-mt-20 border-t" id="features">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a pediatric clinic needs — in one place
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Purpose-built modules that work together, from first appointment to long-term
            developmental follow-up.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ visual: Visual, title, desc, accent }, i) => (
            <article
              className={cn(
                "group border-border bg-card hover:shadow-primary/10 relative overflow-hidden rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                i === 0 && "md:col-span-2 lg:col-span-1",
              )}
              key={title}
            >
              <div className={accent}>
                {/* Using aspect-[4/3] ensures all cards are perfectly uniform */}
                <Visual aspect="aspect-[4/3]" />
              </div>
              <h3 className="text-foreground mt-6 text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
