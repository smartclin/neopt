import { GrowthChartVisual } from "./feature-visuals";

const BULLETS = [
  "Automatic z-score & percentile interpretation per age",
  "Side-by-side WHO and Egyptian reference overlays",
  "Capture weight, length, and head circumference in one form",
  "Per-patient growth panel with printable history",
] as const;

export function GrowthPreview() {
  return (
    <section className="border-border/60 bg-muted/30 scroll-mt-20 border-t" id="growth">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <span className="text-primary text-sm font-semibold">Growth tracking</span>
          <h2 className="text-foreground mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Growth charts that stay out of the way
          </h2>
          <p className=" mt-4 text-lg">
            Enter one measurement and G-Tracker does the interpretation — plotting against both WHO
            LMS references and Egyptian percentile sheets, with clear z-score and percentile output
            per patient.
          </p>
          <ul className="mt-8 space-y-3">
            {BULLETS.map((b) => (
              <li className="text-foreground flex items-start gap-3 text-sm" key={b}>
                <svg
                  aria-hidden="true"
                  className="text-primary mt-0.5 h-5 w-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative">
            <div
              aria-hidden="true"
              className="from-primary/15 to-secondary/10 absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr blur-2xl"
            />
            {/* Simplified wrapper to showcase the image cleanly */}
            <div className="group border-border shadow-primary/10 overflow-hidden rounded-3xl border shadow-2xl">
              <GrowthChartVisual aspect="aspect-[4/3]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
