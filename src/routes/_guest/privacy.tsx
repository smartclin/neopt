// routes/privacy.tsx
//
// Public privacy policy page.
//
// Linked from `components/auth/auth-layout.tsx` (footer of every auth
// page). Copy is limited to factual claims already made on
// `routes/about.tsx` — do not add legal commitments here without a
// lawyer's review. Placeholders marked `TODO(legal)` must be filled in
// before launch.
//
// This page intentionally does NOT link to routes that don't exist
// (e.g. /dpa, /subprocessors). If a section needs one of those, it is
// stubbed as inline text with a TODO.

import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Database, FileCheck, Lock, Mail, Server, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/features/";

/* ── Route ─────────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/_guest/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy · Smart Clinic" },
      {
        content:
          "How Smart Clinic handles pediatric patient data: what we collect, " +
          "how we protect it, your rights, and how to export or delete your data.",
        name: "description",
      },
      { content: "Privacy · Smart Clinic", property: "og:title" },
      {
        content:
          "Factual description of Smart Clinic's data handling. Not a legal " +
          "agreement — see Terms of Service.",
        property: "og:description",
      },
      { content: "website", property: "og:type" },
    ],
  }),
});

/* ── Content model ─────────────────────────────────────────────────────── */
//
// Kept as typed consts so the copy can be reviewed in one place and
// swapped without touching JSX. i18n can lift this later.

const LAST_UPDATED = "2026-01-01";

const SUMMARY = {
  eyebrow: "Privacy",
  headline: "How Smart Clinic handles your data.",
  intro:
    "This page describes, in plain language, what data Smart Clinic " +
    "stores, how it is protected, and what you can do with it. It is a " +
    "factual description of the software — not a legal agreement. The " +
    "binding terms are in the Terms of Service.",
  operator: "[OPERATOR LEGAL NAME]",
  jurisdiction: "[JURISDICTION]",
} as const;

// TODO(legal): confirm the operator legal name and jurisdiction above.
// The placeholders are rendered inline until filled.

interface Section {
  id: string;
  kicker: string;
  title: string;
  paragraphs: readonly string[];
}

const SECTIONS: readonly Section[] = [
  {
    id: "collect",
    kicker: "What we collect",
    title: "Data you or your clinic put in.",
    paragraphs: [
      "Smart Clinic is a pediatric EMR. The data stored is the data a " +
        "clinic enters: patient demographics, guardians, encounters, " +
        "growth measurements, immunizations, prescriptions, " +
        "appointments, and any documents attached to a patient record.",
      "We also store the identity of the person who created or changed " +
        "each record, the timestamp, and (when available) the IP address " +
        "and user agent. This is the audit trail — see below.",
      "We do not place advertising trackers on authenticated pages. The " +
        "public marketing pages (home, about, demo) use no third-party " +
        "analytics that receive patient data. If we ever add " +
        "product analytics, they will be documented here first.",
    ],
  },
  {
    id: "protect",
    kicker: "How we protect it",
    title: "Your data, your server. Encrypted in transit and at rest.",
    paragraphs: [
      "Smart Clinic can be self-hosted on infrastructure you control, or " +
        "run on our managed cloud. In either case, you retain ownership " +
        "of your data and can export it at any time (see Data export).",
      "Traffic is served over TLS. The Postgres database uses " +
        "encryption at rest. The optional offline cache on a clinic " +
        "workstation can be encrypted per-device using WebCrypto; when " +
        "that option is enabled, cached writes are encrypted before they " +
        "reach IndexedDB.",
      "Every create, update, delete, archive, and cancel writes to an " +
        "append-only audit log with actor, entity, timestamp, and " +
        "before/after diff. That log is exportable as CSV or NDJSON.",
      "We do not train machine-learning models on clinic data. The MCP " +
        "integration (used by AI assistants) is opt-in per clinic, and " +
        "every tool call is written to the audit log. You can disable it " +
        "entirely.",
    ],
  },
  {
    id: "rights",
    kicker: "Your rights",
    title: "Access, correction, and deletion.",
    paragraphs: [
      "You can view and correct any record through the app. Role-based " +
        "access controls who can read what: a doctor sees their own " +
        "patient panel; an admin sees the clinic; staff see scheduling " +
        "and demographics but not clinical notes.",
      "To request deletion of an entire clinic account, contact us using " +
        "the address below. Deletion removes the clinic, its patients, " +
        "encounters, growth measurements, prescriptions, documents, and " +
        "audit history, subject to any legal retention requirements that " +
        "apply in [JURISDICTION].",
      "Some records — for example, an administered immunization — may be " +
        "retained as required by local public-health law even after a " +
        "clinic account is deleted. We will tell you which records fall " +
        "into this category when a deletion request is processed.",
    ],
  },
  {
    id: "export",
    kicker: "Data export",
    title: "Full data export, any time.",
    paragraphs: [
      "You can export your full dataset as JSON or CSV from the admin " +
        "settings. The export includes patients, guardians, encounters, " +
        "growth measurements, immunizations, prescriptions, documents " +
        "(metadata and file contents), appointments, allergies, chronic " +
        "conditions, and the audit log.",
      "An export is produced by the same access-controlled API used by " +
        "the rest of the app. It does not bypass role scoping — an admin " +
        "exports the clinic; a doctor exports their panel.",
      "If you self-host, you also have direct access to the Postgres " +
        "database and object storage that back the service. There is no " +
        "proprietary data format to reverse-engineer.",
    ],
  },
  {
    id: "contact",
    kicker: "Contact",
    title: "Questions and requests.",
    paragraphs: [
      "For privacy questions, data exports, or deletion requests, email " +
        "privacy@smartclinic.example. Include the clinic name and, if " +
        "applicable, your role in the clinic so we can route the request " +
        "to the right person.",
      "For security disclosures, email security@smartclinic.example. We " +
        "will acknowledge receipt and coordinate disclosure timing with " +
        "you.",
    ],
  },
] as const;

// TODO(legal): the two email addresses above are placeholders. Replace
// with the actual monitored mailboxes before launch.

/* ── Page ──────────────────────────────────────────────────────────────── */

function PrivacyPage() {
  return (
    <main className="page-wrap space-y-20 px-4 py-16 sm:py-20">
      {/* Header */}
      <header className="max-w-3xl">
        <p className="island-kicker mb-3">{SUMMARY.eyebrow}</p>
        <h1 className="display-title mb-6 text-4xl leading-tight font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          {SUMMARY.headline}
        </h1>
        <p className="text-base leading-8 text-[var(--sea-ink-soft)]">{SUMMARY.intro}</p>

        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs tracking-wider text-[var(--sea-ink-soft)] uppercase">
              Last updated
            </dt>
            <dd className="mt-1 font-medium text-[var(--sea-ink)]">
              {formatDate(new Date(LAST_UPDATED))}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-[var(--sea-ink-soft)] uppercase">
              Operator
            </dt>
            <dd className="mt-1 font-medium text-[var(--sea-ink)]">{SUMMARY.operator}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-[var(--sea-ink-soft)] uppercase">
              Jurisdiction
            </dt>
            <dd className="mt-1 font-medium text-[var(--sea-ink)]">{SUMMARY.jurisdiction}</dd>
          </div>
        </dl>
      </header>

      {/* Trust badges — mirror about.tsx claims */}
      <TrustBar />

      {/* Sections */}
      {SECTIONS.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}

      {/* Footer CTA */}
      <FooterCta />
    </main>
  );
}

/* ── Trust bar ─────────────────────────────────────────────────────────── */

const TRUST_CLAIMS = [
  { icon: Server, label: "Your data, your server" },
  { icon: Lock, label: "Encrypted in transit and at rest" },
  { icon: FileCheck, label: "Audit log you can hand to a regulator" },
  { icon: Database, label: "No training on your data" },
  { icon: Shield, label: "Full data export any time" },
] as const;

function TrustBar() {
  return (
    <section aria-label="Privacy commitments" className="border-y border-[var(--line)] py-6">
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[var(--sea-ink-soft)]">
        {TRUST_CLAIMS.map(({ icon: Icon, label }) => (
          <li className="flex items-center gap-2" key={label}>
            <Icon aria-hidden="true" className="size-4 text-emerald-500" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Section block ─────────────────────────────────────────────────────── */

function SectionBlock({ section }: { section: Section }) {
  return (
    <section className="max-w-3xl" id={section.id}>
      <p className="island-kicker mb-2">{section.kicker}</p>
      <h2 className="display-title mb-4 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
        {section.title}
      </h2>
      <div className="space-y-4 text-sm leading-7 text-[var(--sea-ink-soft)] sm:text-base">
        {section.paragraphs.map((paragraph, index) => (
          <p className="m-0" key={index}>
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

/* ── Footer CTA ────────────────────────────────────────────────────────── */

function FooterCta() {
  return (
    <section className="island-shell rounded-3xl px-8 py-12 text-center sm:px-12">
      <div className="mx-auto max-w-2xl">
        <Badge className="mb-4 gap-1.5 rounded-full px-3 py-1" variant="outline">
          <CheckCircle2 aria-hidden="true" className="size-3" />
          Questions? We answer them.
        </Badge>
        <h2 className="display-title text-2xl font-bold tracking-tight sm:text-3xl">
          Still reading? Talk to us.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
          A walkthrough with your team is the fastest way to see how Smart Clinic handles your
          clinic's data.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            render={
              <a
                aria-label="Email privacy@smartclinic.example"
                className="inline-flex items-center gap-2"
                href="mailto:privacy@smartclinic.example"
              />
            }
            size="lg"
          >
            <Mail aria-hidden="true" className="size-4" />
            Contact privacy team
          </Button>
          <Button
            render={<Link className="inline-flex items-center gap-2" to="/about" />}
            size="lg"
            variant="outline"
          >
            About Smart Clinic
          </Button>
          <Button
            render={<Link className="inline-flex items-center gap-2" to="/terms" />}
            size="lg"
            variant="outline"
          >
            Terms of Service
          </Button>
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--sea-ink-soft)]">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="size-3" />
            Self-hosted or cloud
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="size-3" />
            Full data export any time
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="size-3" />
            No training on your data
          </li>
        </ul>
      </div>
    </section>
  );
}

/* Unused import guard — remove this if you actually use Card */
// (left in as a reminder that we intentionally did not use Card here;
// the section blocks read better as plain prose)
