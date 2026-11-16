import { Link } from "@tanstack/react-router";

import type { Service } from "#/components/services.tsx";

type Props = { service: Service };

const ArrowLeft = (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowRight = (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ServiceLayout({ service }: Props) {
  return (
    <main className="bg-background text-foreground">
      {/* ---------- HERO ---------- */}
      <section className="relative isolate overflow-hidden">
        {/* Backdrop image */}
        <div className="absolute inset-0 -z-10">
          <img alt="" className="h-full w-full object-cover" src={service.image} />
          <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-black/85" />
          <div className={`absolute inset-0 ${service.accentSoft} mix-blend-overlay`} />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
            to="/"
          >
            {ArrowLeft}
            Back to home
          </Link>

          <div className="mt-10 max-w-2xl">
            <div
              className={
                "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md"
              }
            >
              <span className={`h-1.5 w-1.5 rounded-full ${service.accent}`} />
              Pediatric Service
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-white sm:text-6xl">
              {service.title}
            </h1>
            <p className="mt-4 text-lg text-white/85 sm:text-xl">{service.tagline}</p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75">
              {service.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                to="/about"
              >
                Book a visit
                {ArrowRight}
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                to="/"
              >
                Explore other services
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid max-w-3xl grid-cols-3 gap-4">
            {service.stats.map((stat) => (
              <div
                className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                key={stat.label}
              >
                <div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HIGHLIGHTS ---------- */}
      <section className="border-border/60 border-t py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              What's included
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              A complete, thoughtful approach — designed around your child.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {service.highlights.map((h) => (
              <div
                className="group border-border/50 bg-muted/40 hover:border-border relative rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                key={h.title}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${service.accentSoft} ${service.color}`}
                >
                  {h.icon}
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{h.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {h.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SPLIT IMAGE + COPY ---------- */}
      <section className="border-border/60 border-t py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
              <img
                alt={service.title}
                className="h-full w-full object-cover"
                loading="lazy"
                src={service.image}
              />
              <div className="absolute inset-0 ring-1 ring-black/10 ring-inset" />
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Why families choose us
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                {service.tagline}. Our team blends clinical excellence with warm, unhurried visits —
                because trust is the best medicine.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Unhurried 30-minute visits",
                  "Board-certified pediatric providers",
                  "Direct messaging with your care team",
                  "Same-day appointment availability",
                ].map((item) => (
                  <li className="flex items-start gap-3" key={item}>
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${service.accentSoft} ${service.color}`}
                    >
                      {CheckIcon}
                    </span>
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900"
                to="/about"
              >
                Schedule your visit
                {ArrowRight}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="border-border/60 border-t py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Quick answers to the questions we hear most.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {service.faqs.map((faq) => (
              <details
                className="group border-border/60 bg-muted/40 open:bg-muted rounded-2xl border p-5 transition-colors"
                key={faq.q}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold">
                  <span>{faq.q}</span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${service.accentSoft} ${service.color} transition-transform group-open:rotate-45`}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 4.5v15m7.5-7.5h-15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="border-border/60 border-t py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div
            className={`relative overflow-hidden rounded-3xl ${service.accent} px-8 py-16 text-center shadow-2xl sm:px-16`}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-white/90">
                Book your first visit today — most families are seen within 24 hours.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg transition-transform hover:-translate-y-0.5"
                  to="/about"
                >
                  Book an appointment
                  {ArrowRight}
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  to="/services"
                >
                  View all services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
