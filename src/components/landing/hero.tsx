import { Link } from "@tanstack/react-router";
import { HeroVisual } from "./feature-visuals";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]"
      />
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold">
              <span aria-hidden="true" className="bg-primary h-2 w-2 rounded-full" />
              Built for pediatric teams
            </span>

            <h1 className="text-foreground mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The clinic platform your{" "}
              <span className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent">
                pediatric team
              </span>{" "}
              deserves.
            </h1>

            <p className="text-muted-foreground mt-6 max-w-xl text-lg">
              G-Tracker unifies patient records, WHO &amp; Egyptian growth charts, immunization
              tracking, pediatric dosing calculators, and visit notes — so your clinicians can focus
              on the child, not the charts.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold shadow-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                to="/signup"
              >
                Get started
              </Link>
              <Link
                className="border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-xl border px-8 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                to="/login"
              >
                Sign in
              </Link>

              {/* NEW BUTTON: Smooth scrolls to the Feature Grid */}
              <a
                className="text-primary hover:text-primary/80 focus-visible:ring-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:outline-none"
                href="#features"
              >
                Explore features
                <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    clipRule="evenodd"
                    d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                    fillRule="evenodd"
                  />
                </svg>
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                { label: "Growth standards", value: "WHO + EG" },
                { label: "Built-in calculators", value: "Pediatric & neo" },
                { label: "Immunization schemes", value: "Full matrix" },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-muted-foreground text-xs">{s.label}</dt>
                  <dd className="text-foreground mt-1 text-sm font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div
              aria-hidden="true"
              className="from-primary/15 via-secondary/10 absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br to-transparent blur-2xl"
            />
            <div className="border-border/80 bg-card/85 shadow-primary/15 overflow-hidden rounded-[1.75rem] border shadow-[0_24px_80px_-32px_rgba(59,130,246,0.45)] backdrop-blur-sm sm:p-3">
              <HeroVisual aspect="aspect-[4/3]" priority />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
