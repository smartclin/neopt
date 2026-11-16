import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HeartPulseIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  SyringeIcon,
} from "lucide-react";

import { SERVICES } from "#/components/services.tsx";

export const Route = createFileRoute("/_guest/services/")({
  head: () => ({
    meta: [
      { title: "Services — Pediatric Clinic" },
      {
        name: "description",
        content:
          "Six pediatric services under one roof: newborn care, immunizations, sick visits, chronic care, developmental screening, and well-child visits.",
      },
      { property: "og:title", content: "Services — Pediatric Clinic" },
      {
        property: "og:description",
        content:
          "Comprehensive pediatric care from the first newborn checkup to developmental milestones.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://yourdomain.com/services" }],
  }),
  component: ServicesIndexPage,
});

const HIGHLIGHTS = [
  {
    icon: StethoscopeIcon,
    label: "Board-certified pediatricians",
    description: "Unhurried 30-minute visits with the same clinician, start to finish.",
  },
  {
    icon: SyringeIcon,
    label: "CDC-aligned immunizations",
    description: "Every vaccine in the recommended schedule, tracked and reminded.",
  },
  {
    icon: ShieldCheckIcon,
    label: "Same-day sick care",
    description: "Reserve a slot online or by phone — often seen within hours.",
  },
  {
    icon: HeartPulseIcon,
    label: "Growth tracking built in",
    description: "WHO and Egyptian growth curves, with z-scores at every visit.",
  },
];

function ServicesIndexPage() {
  return (
    <main className="bg-background text-foreground">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="border-border/60 border-b">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <Link
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
            to="/"
          >
            <ArrowLeftIcon className="size-4" />
            Back to home
          </Link>

          <div className="mt-10 max-w-3xl">
            <div className="border-border/60 bg-muted/40 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="bg-primary size-1.5 rounded-full" />
              Six services · one care team
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Comprehensive care,{" "}
              <span className="text-muted-foreground">every step of the way.</span>
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg text-pretty">
              From the first newborn checkup to developmental milestones, our clinic covers the full
              arc of childhood — in one place, with one care team that knows your family.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                to="/about"
              >
                Book a visit
                <ArrowRightIcon className="size-4" />
              </Link>
              <a
                className="border-border/60 hover:bg-muted/40 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
                href="#services"
              >
                Browse all services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE GRID ─────────────────────────────────────── */}
      <section
        aria-labelledby="services-heading"
        className="border-border/60 border-b py-24"
        id="services"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
              id="services-heading"
            >
              Every service, in detail
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Pick the one that matches what your child needs — or book a general visit and we'll
              route you to the right specialist.
            </p>
          </div>

          <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <li key={service.slug}>
                <Link
                  className="group border-border/50 bg-card hover:border-border focus-visible:ring-ring relative flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  preload="intent"
                  to={`/services/${service.slug}` as never}
                >
                  {/* Image */}
                  <div className="bg-muted relative aspect-[16/10] overflow-hidden">
                    <img
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      decoding="async"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={service.image}
                    />
                    <div className="from-background/90 via-background/20 absolute inset-0 bg-gradient-to-t to-transparent" />

                    {/* Icon badge */}
                    <div
                      className={
                        "absolute top-4 left-4 flex size-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-md"
                      }
                    >
                      {service.icon}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-bold tracking-tight">{service.title}</h3>
                      <span className={`mt-1 size-2 shrink-0 rounded-full ${service.accent}`} />
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.tagline}
                    </p>

                    {/* Stat pills */}
                    <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
                      {service.stats.map((stat) => (
                        <div
                          className="border-border/40 bg-muted/40 rounded-lg border p-2 text-center"
                          key={stat.label}
                        >
                          <div className="text-sm font-semibold tabular-nums">{stat.value}</div>
                          <div className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <span
                      className={
                        "group-hover:text-foreground text-muted-foreground mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                      }
                    >
                      Learn more
                      <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────────── */}
      <section className="border-border/60 border-b py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Why families choose us
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Clinical excellence, in a setting that feels unhurried.
            </p>
          </div>

          <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label, description }) => (
              <li className="border-border/50 bg-muted/30 rounded-2xl border p-6" key={label}>
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{label}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-primary relative overflow-hidden rounded-3xl px-8 py-16 text-center shadow-2xl sm:px-16">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
                Not sure which service to book?
              </h2>
              <p className="mt-4 text-lg text-white/90">
                Start with a general visit. Our care team will assess and route you to the right
                specialist — usually the same day.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg transition-transform hover:-translate-y-0.5"
                  to="/about"
                >
                  Book an appointment
                  <ArrowRightIcon className="size-4" />
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  to="/"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
