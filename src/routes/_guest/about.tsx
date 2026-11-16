import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck,
  HeartPulse,
  Lock,
  Mail,
  Pill,
  Server,
  Shield,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_guest/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About · Smart Clinic" },
      {
        content:
          "Smart Clinic is a pediatric EMR built around WHO growth standards, " +
          "weight-based dosing, and offline-first records. Learn who it's for, " +
          "how it handles your data, and what makes it different.",
        name: "description",
      },
      { content: "About · Smart Clinic", property: "og:title" },
      {
        content: "A pediatric EMR built around WHO growth standards and offline-first records.",
        property: "og:description",
      },
      { content: "website", property: "og:type" },
    ],
  }),
});

// ─── Content model ────────────────────────────────────────────────
//
// All copy lives in typed const objects so:
//   1. Editors can review the whole page in one place
//   2. i18n can swap strings without touching JSX
//   3. Tests can assert against the source of truth

const MISSION = {
  body: [
    "Smart Clinic started because pediatricians kept telling us the same thing: " +
      "the EMRs they were using were built for adult medicine, then awkwardly " +
      "retrofitted for children. Weight-based dosing was an afterthought. Growth " +
      "charts were PDFs stapled to a paper file. Immunization schedules lived in " +
      "a spreadsheet the front desk updated by hand.",
    "We built Smart Clinic around the assumption that pediatric care is the " +
      "primary use case, not a special case. WHO growth standards are computed " +
      "on every measurement. Dosing is weight-based with hard safety caps. " +
      "Records work offline, because half of your patients live in places " +
      "where the Wi-Fi doesn't.",
  ],
  eyebrow: "About",
  headline: "Pediatric care deserves better software.",
} as const;

const AUDIENCES = [
  {
    accent: "text-sky-600 bg-sky-500/10",
    body: "One provider, one clinic, zero IT department. Runs on a laptop and a browser. Self-host it or use our cloud.",
    icon: Stethoscope,
    title: "Solo pediatricians",
  },
  {
    accent: "text-teal-600 bg-teal-500/10",
    body: "2–10 providers sharing a roster. Role-based access means front desk, nursing, and physicians each see what they need.",
    icon: Users,
    title: "Small group practices",
  },
  {
    accent: "text-violet-600 bg-violet-500/10",
    body: "Clinic-scoped data, per-provider patient panels, and an audit log that survives every write.",
    icon: Building2,
    title: "Multi-site clinics",
  },
] as const;

const DIFFERENTIATORS = [
  {
    body: "WHO 2006 LMS tables are loaded per-day, interpolated, and inverted in the database. Every measurement gets weight-for-age, height-for-age, and BMI-for-age Z-scores — not a snapshot from a lookup table.",
    icon: TrendingUp,
    title: "Growth is first-class",
  },
  {
    body: "The pediatric formulary ships with per-dose and per-day caps, minimum ages, and per-suspension concentrations. You cannot write a prescription that exceeds a safety limit without the system flagging it.",
    icon: Pill,
    title: "Dosing enforces itself",
  },
  {
    body: "Reads hit a local cache. Writes queue in a durable outbox. A pediatrician on a home visit with no signal can chart a full encounter, prescribe, and record growth — the app syncs when connectivity returns.",
    icon: Server,
    title: "Offline-first, not offline-tolerant",
  },
  {
    body: "Every create, update, and delete writes to an append-only audit log with actor, entity, timestamp, and before/after diff. Not bolted on — it's in the base procedure every mutation goes through.",
    icon: FileCheck,
    title: "Audit by default",
  },
  {
    body: "Row-level scoping runs in the API layer. A doctor querying patients they don't own gets a 404, not a 403 — so the API never leaks the existence of a record the caller can't see.",
    icon: Lock,
    title: "Role-based access, not role-based UI",
  },
  {
    body: "WHO Child Growth Standards (2006). CDC immunization schedule. Weight-based pediatric formulary sourced from published references. No proprietary formulas, no black boxes.",
    icon: HeartPulse,
    title: "Standards we can point to",
  },
] as const;

const STANDARDS = [
  {
    detail: "Per-day LMS tables for weight-for-age, height-for-age, and BMI-for-age, 0–60 months.",
    label: "Growth",
    value: "WHO Child Growth Standards, 2006",
  },
  {
    detail: "Birth through adolescence, with site, route, and manufacturer defaults.",
    label: "Immunizations",
    value: "CDC / WHO harmonized schedule",
  },
  {
    detail: "10 core drugs with per-dose caps, daily maximums, and minimum-age gates.",
    label: "Dosing",
    value: "Weight-based pediatric formulary",
  },
  {
    detail:
      "Classification uses the exact fractional month, so boundary ages never bucket into the wrong group.",
    label: "Age",
    value: "Unrounded month count",
  },
] as const;

const SECURITY = [
  {
    body: "Self-host Smart Clinic on your own infrastructure. Or use our managed cloud. Either way, you can export your full dataset at any time.",
    icon: Shield,
    title: "Your data, your server",
  },
  {
    body: "TLS everywhere. Postgres encryption at rest. Optional per-device encryption of the offline cache using WebCrypto.",
    icon: Lock,
    title: "Encrypted in transit and at rest",
  },
  {
    body: "Append-only. Actor, entity, timestamp, IP, user agent, before/after diff. Exportable as CSV or NDJSON.",
    icon: FileCheck,
    title: "Audit log you can hand to a regulator",
  },
  {
    body: "We don't train models on clinic data. The MCP integration exposes data to assistants you configure, with per-tool allow/deny and an audit trail for every tool call.",
    icon: Database,
    title: "No training on your data",
  },
] as const;

const ORIGIN = {
  paragraphs: [
    "The team behind Smart Clinic is a small group of engineers and clinicians who spent a decade building and maintaining pediatric software in clinics that couldn't afford enterprise EMRs. We watched good pediatricians waste hours every week on tools that didn't fit.",
    "We're not trying to replace your hospital's EMR. We're building the tool a pediatric clinic actually wants: fast, offline-capable, WHO-compliant, and priced for a practice that doesn't have a CIO.",
  ],
  stats: [
    { label: "Started building", value: "2024" },
    { label: "Design partner clinics", value: "12" },
    { label: "VC funding", value: "0" },
  ],
  title: "How we got here",
} as const;

// ─── Page ─────────────────────────────────────────────────────────

function About() {
  return (
    <main className="page-wrap space-y-20 px-4 py-16 sm:py-20">
      <MissionSection />
      <AudienceSection />
      <DifferentiatorsSection />
      <StandardsSection />
      <SecuritySection />
      <OriginSection />
      <FinalCta />
    </main>
  );
}

// ─── 1. Mission ───────────────────────────────────────────────────

function MissionSection() {
  return (
    <section className="max-w-3xl">
      <p className="mb-3 text-xs font-medium tracking-wider text-[var(--sea-ink-soft)] uppercase">
        {MISSION.eyebrow}
      </p>
      <h1 className="display-title mb-6 text-4xl leading-tight font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
        {MISSION.headline}
      </h1>
      <div className="space-y-4 text-base leading-8 text-[var(--sea-ink-soft)]">
        {MISSION.body.map((paragraph, index) => (
          <p className="m-0" key={index}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--sea-ink-soft)]">
        <span className="flex items-center gap-2">
          <Baby aria-hidden="true" className="size-4 text-emerald-500" />
          Built for children, not adapted from adults
        </span>
        <span className="flex items-center gap-2">
          <BookOpen aria-hidden="true" className="size-4 text-emerald-500" />
          Every formula sourced from published standards
        </span>
      </div>
    </section>
  );
}

// ─── 2. Audience ──────────────────────────────────────────────────

function AudienceSection() {
  return (
    <section>
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 text-xs font-medium tracking-wider text-[var(--sea-ink-soft)] uppercase">
          Who it's for
        </p>
        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          From one pediatrician to ten clinics.
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--sea-ink-soft)]">
          The same codebase runs a solo practice and a multi-site group. What changes is who can see
          what.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, title, body, accent }) => (
          <li key={title}>
            <Card className="h-full">
              <CardContent>
                <span className={`flex size-10 items-center justify-center rounded-xl ${accent}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">{body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── 3. Differentiators ───────────────────────────────────────────

function DifferentiatorsSection() {
  return (
    <section>
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 text-xs font-medium tracking-wider text-[var(--sea-ink-soft)] uppercase">
          What's different
        </p>
        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          Six decisions that shaped the product.
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--sea-ink-soft)]">
          Every EMR claims to be built for its specialty. Here's what that actually means in Smart
          Clinic.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DIFFERENTIATORS.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Card className="h-full">
              <CardHeader>
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">{body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── 4. Clinical standards ────────────────────────────────────────

function StandardsSection() {
  return (
    <section>
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 text-xs font-medium tracking-wider text-[var(--sea-ink-soft)] uppercase">
          Clinical standards
        </p>
        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          Every formula has a citation.
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--sea-ink-soft)]">
          If a number appears on a patient's chart, you can trace it back to a published source.
        </p>
      </header>

      <Card className="overflow-hidden">
        <CardContent>
          <dl className="divide-y divide-[var(--line)]">
            {STANDARDS.map(({ label, value, detail }) => (
              <div className="grid gap-2 py-4 sm:grid-cols-[140px_1fr] sm:gap-6" key={label}>
                <dt className="text-xs font-medium tracking-wider text-[var(--sea-ink-soft)] uppercase">
                  {label}
                </dt>
                <dd className="space-y-1">
                  <p className="font-semibold text-[var(--sea-ink)]">{value}</p>
                  <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">{detail}</p>
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}

// ─── 5. Security & data ───────────────────────────────────────────

function SecuritySection() {
  return (
    <section>
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 text-xs font-medium tracking-wider text-[var(--sea-ink-soft)] uppercase">
          Security & data
        </p>
        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          The questions every clinic admin asks.
        </h2>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECURITY.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Card className="h-full">
              <CardContent>
                <div className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">{body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── 6. Origin ────────────────────────────────────────────────────

function OriginSection() {
  return (
    <section className="rounded-3xl border border-[var(--line)] px-8 py-14 sm:px-12 sm:py-16">
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h2 className="display-title mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {ORIGIN.title}
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-[var(--sea-ink-soft)] sm:text-base">
            {ORIGIN.paragraphs.map((paragraph, index) => (
              <p className="m-0" key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-6">
          {ORIGIN.stats.map(({ value, label }) => (
            <div key={label}>
              <dt className="font-mono text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
                {value}
              </dt>
              <dd className="mt-1 text-xs text-[var(--sea-ink-soft)]">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ─── 7. Final CTA ─────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="rounded-3xl border border-[var(--line)] px-8 py-16 text-center sm:px-16">
      <div className="mx-auto max-w-2xl">
        <Badge className="mb-5" variant="outline">
          <ClipboardCheck aria-hidden="true" className="size-3" />
          Onboarding in 15 minutes
        </Badge>

        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          See it with your own patient panel.
        </h2>
        <p className="mt-4 text-[var(--sea-ink-soft)]">
          Sign in to a sandbox, or talk to us about a guided walkthrough with your team.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link to="/login" />} size="lg">
            Sign in to your clinic
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            render={
              <a
                aria-label="Email hello@smartclinic.example"
                href="mailto:hello@smartclinic.example"
              />
            }
            size="lg"
            variant="outline"
          >
            <Mail aria-hidden="true" className="size-4" />
            hello@smartclinic.example
          </Button>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--sea-ink-soft)]">
          {[
            "Self-hosted or cloud",
            "Full data export any time",
            "No credit card required",
            "Open API + MCP support",
          ].map((item) => (
            <li className="flex items-center gap-1.5" key={item}>
              <CheckCircle2 aria-hidden="true" className="size-3" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
