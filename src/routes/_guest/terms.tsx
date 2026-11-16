// Routes/terms.tsx
//
// Public Terms of Service page.
//
// Linked from `components/auth/auth-layout.tsx` (the footer of every
// auth page: login, signup, forgot-password, reset-password).
//
// Copy policy:
//   - Every claim below is descriptive of what the software *does*,
//     not a binding legal promise. Anything that must be binding is
//     flagged `TODO(legal)` so it is impossible to ship without a
//     lawyer reviewing it.
//   - Placeholders `[OPERATOR LEGAL NAME]` and `[JURISDICTION]` are
//     filled in by counsel. Do not replace them with invented text.
//   - This file intentionally contains no analytics, no cookies, no
//     third-party scripts.

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Mail, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Constants ─────────────────────────────────────────────────────

/**
 * ISO date of the last substantive copy change. Rendered as a readable
 * date below the heading. Bump this whenever the content changes —
 * not on cosmetic edits.
 */
const LAST_UPDATED = "2026-01-01";

/**
 * Operator identity. Both are `TODO(legal)`: a lawyer must confirm the
 * legal entity name and the governing jurisdiction before launch. The
 * bracket placeholders are deliberately impossible to mistake for real
 * values.
 */
const OPERATOR = "[OPERATOR LEGAL NAME]";
const JURISDICTION = "[JURISDICTION]";

// ─── Content model ─────────────────────────────────────────────────
//
// Each section is a small discriminated object so editors can review
// the whole document in one place and i18n can swap strings without
// touching JSX.

interface Section {
  id: string;
  label: string;
  body: readonly string[];
}

const SECTIONS: readonly Section[] = [
  {
    body: [
      "Smart Clinic is software for managing a pediatric clinic: patient records, encounters, growth tracking, immunizations, prescriptions, and appointments. It is a record-keeping and workflow tool.",
      "Smart Clinic is not a medical device. It does not diagnose, treat, or recommend care. Every clinical decision — including dosing, growth interpretation, and triage — remains the responsibility of a licensed clinician exercising independent judgment.",
      "You are responsible for verifying that any calculation the software produces is appropriate for your patient. The software surfaces the formula it used, the reference data behind it, and its safety flags, but it does not replace clinical review.",
    ],
    id: "service",
    label: "The service",
  },
  {
    body: [
      "You are responsible for the confidentiality of your login credentials and for all activity under your account. Use a unique password and enable two-factor authentication where available.",
      "Accounts are per-person. Do not share credentials with colleagues. If a colleague needs access, invite them under their own account so that the audit log attributes every change to the correct actor.",
      "Notify your clinic administrator immediately if you believe your account has been compromised. Your administrator can disable the account and revoke active sessions.",
    ],
    id: "account",
    label: "Your account",
  },
  {
    body: [
      "Use Smart Clinic only for its intended purpose: managing patient care at the clinic that issued your account. Do not use it to store or process data unrelated to that purpose.",
      "Do not attempt to access records belonging to patients outside your permitted scope, whether by guessing identifiers, replaying requests, or any other means. Access controls are enforced in the API and audit-logged; attempts to bypass them are detectable.",
      "Do not resell, sublicense, or redistribute access to the software. Do not reverse engineer, decompile, or attempt to extract source code from any distributed binary. If you need an integration, use the documented OpenAPI and MCP interfaces.",
      "Do not upload malware, run automated scans against the service, or take any action that degrades availability for other clinics.",
    ],
    id: "acceptable-use",
    label: "Acceptable use",
  },
  {
    body: [
      "Your clinic owns the patient data it enters into Smart Clinic. We claim no ownership over it and we do not use it to train models, build profiles, or sell to third parties.",
      "You grant us the minimum license necessary to operate the service on your behalf: to store, transmit, back up, and display the data to the users you authorize. This license ends when you delete the data or terminate your account.",
      "You can export the full dataset — patients, encounters, growth measurements, prescriptions, documents, and the audit log — at any time. Export is available as CSV and NDJSON from the admin settings page.",
      "You are responsible for obtaining any consents required by your jurisdiction before entering a patient's data, and for responding to patient requests to access or correct their records.",
    ],
    id: "data",
    label: "Data & content",
  },
  {
    body: [
      "The self-hosted edition runs entirely on infrastructure you control. Availability depends on the environment you operate it in, and we make no uptime commitment for self-hosted deployments.",
      "The managed cloud edition targets an availability commitment of [SLA PLACEHOLDER]. Planned maintenance is announced at least 48 hours in advance; emergency maintenance may occur without notice to address a security issue.",
      "The offline-first design means most clinical workflows continue during a network outage. Writes queue locally and sync when connectivity returns. This is a resilience feature, not a substitute for your clinic's business-continuity plan.",
    ],
    id: "availability",
    label: "Availability",
  },
  {
    body: [
      "TODO(legal): Limitation of liability, indemnification, warranty disclaimer, and governing law must be drafted by counsel. The placeholders below are structural, not binding.",
      `To the maximum extent permitted under the laws of ${JURISDICTION}, ${OPERATOR} disclaims all warranties not expressly stated in a signed agreement, and neither party is liable for indirect, incidental, or consequential damages.`,
      "Nothing in these terms limits liability for gross negligence, willful misconduct, or any other liability that cannot be limited under applicable law.",
    ],
    id: "liability",
    label: "Liability",
  },
  {
    body: [
      "We may update these terms to reflect changes in the software, in applicable law, or in our operations. When we do, we update the Last updated date at the top of this page.",
      "For material changes, we notify clinic administrators by email at least 30 days before the change takes effect. Continued use of the service after that date constitutes acceptance of the updated terms.",
      "If a change is not acceptable to you, you may export your data and close your account before it takes effect.",
    ],
    id: "changes",
    label: "Changes",
  },
];

// ─── Route ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/_guest/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms · Smart Clinic" },
      {
        content:
          "Terms of service for Smart Clinic, a pediatric EMR. " +
          "Plain-language description of what the software does, what " +
          "it does not do, and how clinic data is handled.",
        name: "description",
      },
      { content: "Terms · Smart Clinic", property: "og:title" },
      {
        content:
          "Plain-language terms for Smart Clinic, a pediatric EMR. " +
          "Not a medical device; clinic owns its data; full export available.",
        property: "og:description",
      },
      { content: "website", property: "og:type" },
      // Terms pages should never be indexed — they are boilerplate and
      // dilute the SEO of the marketing pages.
      { content: "noindex", name: "robots" },
    ],
  }),
});

// ─── Page ──────────────────────────────────────────────────────────

function TermsPage() {
  const lastUpdatedLabel = formatLongDate(LAST_UPDATED);

  return (
    <main className="page-wrap px-4 py-16 sm:py-20">
      {/* Header */}
      <header className="max-w-3xl">
        <Badge variant="outline">
          <ShieldCheck aria-hidden="true" className="size-3" />
          Plain language · not a substitute for a signed agreement
        </Badge>

        <h1 className="display-title mb-4 text-4xl leading-tight font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Terms of Service
        </h1>

        <p className="text-sm text-[var(--sea-ink-soft)]">
          Last updated: <time dateTime={LAST_UPDATED}>{lastUpdatedLabel}</time>
          {" · "}
          {/* TODO(legal): confirm the operator's legal name and the
              governing jurisdiction before launch. */}
          Operated by {OPERATOR} under the laws of {JURISDICTION}.
        </p>
      </header>

      {/* Body */}
      <article className="mt-16 space-y-14">
        {SECTIONS.map((section, index) => (
          <section
            aria-labelledby={`terms-section-${section.id}`}
            className="grid gap-6 sm:grid-cols-[200px_1fr] sm:gap-10"
            key={section.id}
          >
            <header>
              <p>{String(index + 1).padStart(2, "0")}</p>
              <h2
                className="mt-1 text-lg font-semibold text-[var(--sea-ink)]"
                id={`terms-section-${section.id}`}
              >
                {section.label}
              </h2>
            </header>

            <div className="space-y-4 text-sm leading-7 text-[var(--sea-ink-soft)] sm:text-base sm:leading-8">
              {section.body.map((paragraph, i) => (
                <p
                  className="m-0"
                  // Paragraph order within a section is fixed by the
                  // content model — index keys are safe here.
                  key={i}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}

        {/* Contact — rendered as its own section because it carries a
            CTA (mailto) rather than prose. */}
        <section
          aria-labelledby="terms-section-contact"
          className="grid gap-6 sm:grid-cols-[200px_1fr] sm:gap-10"
        >
          <header>
            <p>{String(SECTIONS.length + 1).padStart(2, "0")}</p>
            <h2
              className="mt-1 text-lg font-semibold text-[var(--sea-ink)]"
              id="terms-section-contact"
            >
              Contact
            </h2>
          </header>

          <div className="space-y-4 text-sm leading-7 text-[var(--sea-ink-soft)] sm:text-base sm:leading-8">
            <p className="m-0">
              Questions about these terms, or about a specific clause? Email the legal team:
            </p>
            <Button
              render={
                <a
                  aria-label="Email legal@smartclinic.example"
                  href="mailto:legal@smartclinic.example"
                />
              }
              variant="outline"
            >
              <Mail aria-hidden="true" className="size-4" />
              legal@smartclinic.example
              <ExternalLink aria-hidden="true" className="size-3 opacity-60" />
            </Button>
          </div>
        </section>
      </article>

      {/* Footer CTA */}
      <footer className="mt-20 border-t border-[var(--line)] pt-10">
        <div className="flex flex-wrap items-center gap-3">
          <Button render={<Link to="/privacy" />} variant="outline">
            Privacy Policy
          </Button>
          <Button render={<Link to="/about" />} variant="ghost">
            About Smart Clinic
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-[var(--sea-ink-soft)]">
          This page describes the software's behaviour in plain language. It is not a negotiated
          contract. A signed agreement between your clinic and {OPERATOR} — if one exists — takes
          precedence over anything on this page.
        </p>
      </footer>
    </main>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Format an ISO date (`YYYY-MM-DD`) as a long, locale-stable string
 * ("January 1, 2026").
 *
 * Uses `Intl.DateTimeFormat` with an explicit `en-US` locale and UTC
 * timezone so the output is identical on the server and client — a
 * hydration mismatch on the "Last updated" line would be annoying to
 * debug and is trivial to avoid.
 */
function formatLongDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(parsed);
}
