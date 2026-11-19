# Smart Clinic / G-Tracker — Application Context

## What this document is

This is the working product and engineering context for this repository. It
describes the application as it is represented in the current source tree, not
as a roadmap or a guarantee about a production deployment. When this document,
the README, marketing copy, and implementation disagree, use the code and
tests as the technical source of truth and update this document when behavior
changes.

## Product overview

Smart Clinic (also branded as G-Tracker in parts of the public site) is a
pediatric clinic record and workflow application. It is designed to help
pediatric clinicians and clinic teams manage a child's clinic record from
registration and appointment scheduling through encounters, measurements,
growth review, immunization tracking, developmental milestones, and
prescriptions.

The public product pages position it for solo pediatricians, small group
practices, and multi-site clinics, with a focus on pediatric workflows and
Egyptian practice context. The clinical application is organized around
authenticated, clinic-scoped workflows. It is not a substitute for clinical
judgment: growth references, dose calculations, flags, and other decision
support must be verified by the treating professional and against current
clinical guidance.

### Main user workflows

1. A clinic team signs in and works within a clinic-scoped workspace.
2. Staff create or find a patient and maintain demographics, guardian/contact
   information, and clinical context.
3. Staff schedule appointments; clinicians record visits and link encounters
   to appointments when applicable.
4. During a visit, the team can record measurements, diagnoses, clinical
   notes, immunizations, developmental milestones, and prescriptions.
5. Patient-specific views bring together history, growth trends, and relevant
   clinical records.
6. Where supported, writes can be queued in the browser outbox and retried
   when connectivity returns.

### Application routes and modules

Public routes include the landing page, about and service pages, login,
signup, password reset, privacy, and terms. Authenticated application routes
include:

- **Dashboard** — clinic pulse and recent growth context.
- **Patients** — patient list, create/edit, patient record, measurements, and
  growth views.
- **Appointments** — appointment list, calendar, create, and appointment
  details.
- **Visits** — encounter list, create, view, edit, and visit composer.
- **Prescriptions** — prescription list/details, creation, and a neonatal dose
  calculator.
- **Immunizations** — clinic-level tracking and a patient's immunization
  record.
- **Development** — developmental milestone overview and patient checklist.
- **Clinics** — clinic list, details, create, and edit.
- **Conflicts** — a route for conflict review.

The concrete route definitions live in [`src/routes/`](./src/routes), with
clinical UI and behavior grouped under [`src/features/`](./src/features).
Routes compose these modules; they should not become a second home for
database or domain logic.

## Clinical capabilities represented in the code

### Patients and clinics

The data model supports clinics, clinic-associated patients, provider
assignment, a medical record number (MRN), date of birth, sex, contact and
guardian details, allergies, notes, gestational age, and birth measurements.
Patient records also have active/deleted state and version fields. The
patients feature provides list/search and create/update/delete workflows.

### Visits and appointments

Appointments have a patient, clinic, optional doctor, scheduled time, duration,
status, reason, and notes. Visits record the patient, clinic, optional linked
appointment and doctor, encounter date, age-at-visit fields, complaint,
symptoms, examination, plan, diagnosis text, and notes. Visit composition
connects encounter data with measurements, diagnoses, and prescriptions.

### Growth and measurements

The app records weight, length/height, weight-for-length, BMI, and head
circumference indicators. The growth feature includes Egyptian LMS reference
data and WHO growth-standard data, interpolation and Z-score helpers, patient
series, reference curves, and chart components. The Egyptian chart is the
primary chart in the patient growth UI; the WHO chart is a secondary comparison.
The growth panel supports a corrected-age view for preterm patients.

Reference datasets and indicator coverage differ by standard. Do not assume a
given indicator, age range, or chart is available from every dataset; check
the feature's metadata and seed data before changing calculations or making
clinical claims.

### Diagnoses, notes, and development

Diagnoses are attached to visits and distinguish primary from secondary
entries. Medical notes can be associated with a patient and optionally a
visit, and retain an author reference. Developmental milestones use a catalog
and patient-specific achievement records across gross motor, fine motor,
language, and social-cognitive domains.

### Immunizations

The active immunizations feature uses a patient immunization record with a
vaccine key/name, dose number, target age, status, administration date, lot,
site, administering user, adverse events, and notes. Keep the distinction
between a scheduled/due record and an administered record clear in UI and
mutations.

### Prescriptions and dosing

Prescription records are tied to both a patient and a visit and include
medication, dose, frequency, duration, instructions, prescriber, and lifecycle
status. The feature includes a medication picker/formulary, pediatric
weight-based dose helpers, and neonatal dosing helpers. Treat computed doses
as decision support and retain the existing validation, contraindication, and
maximum-dose safeguards when changing these workflows.

## Technology stack

| Area                      | Current implementation                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Language                  | TypeScript (strictly typed application code)                                                |
| Runtime / package manager | Bun; the database driver uses `bun:sqlite`                                                  |
| Web framework             | TanStack Start with React 19 and SSR support                                                |
| Routing                   | TanStack Router, file-based routes and generated route tree                                 |
| Server/client boundary    | TanStack Start `createServerFn` functions                                                   |
| Client data               | TanStack Query with router SSR integration                                                  |
| Forms                     | TanStack Form and shared form/UI helpers                                                    |
| Database                  | SQLite with Drizzle ORM and Drizzle Kit                                                     |
| Validation                | Zod v4                                                                                      |
| Authentication            | Better Auth with Drizzle adapter, email/password, GitHub and Google provider configuration  |
| UI                        | React, Base UI primitives, shadcn-style project components, Lucide icons                    |
| CSS                       | Tailwind CSS v4                                                                             |
| Charts                    | TanStack Charts for the primary Egyptian chart; D3 utilities are also used by the WHO chart |
| Build/dev tooling         | Vite+ (`vp`) integrating Vite, Rolldown, Vitest, Oxlint and Oxfmt                           |
| Tests                     | Vitest, Testing Library, Happy DOM; Playwright configuration for browser E2E                |

The package manifest is [`package.json`](./package.json); the Vite+/TanStack
configuration is in [`vite.config.ts`](./vite.config.ts).

## Architecture and data flow

```text
File-based routes
  ├─ public guest pages
  └─ authenticated app shell
       └─ feature UI and feature-owned query hooks
            └─ TanStack Query
                 └─ typed TanStack Start server functions
                      ├─ auth / clinic middleware
                      ├─ feature validation and domain operations
                      └─ feature query modules → Drizzle → SQLite
```

### Code organization

- [`src/routes/`](./src/routes) contains route definitions, layouts, and
  composition.
- [`src/features/`](./src/features) owns domain functions, schemas, query
  options/hooks, types, and feature UI. Major domains include appointments,
  clinics, development, diagnosis, growth, immunizations, measurements,
  patients, prescriptions, search, and visits.
- [`src/db/`](./src/db) contains the Drizzle schema, relations, SQLite client,
  SQL query modules, migrations, seeds, and shared database validations.
- [`src/lib/auth/`](./src/lib/auth) contains authentication helpers,
  middleware, role vocabulary, and access-control definitions.
- [`src/components/`](./src/components) contains shared layout blocks,
  tables, landing-page components, and reusable UI primitives.
- [`src/features/shared/`](./src/features/shared) contains shared query keys,
  invalidation helpers, and domain utilities.

### Data access conventions

- Browser-facing components call typed server functions; they must not import
  the database client or server-only code.
- Server functions validate inputs with the feature's Zod schema and use
  feature-owned queries for persistence.
- Reuse feature-owned query-key factories and mutation hooks. Put cache
  invalidation with the feature that owns a write; avoid ad-hoc query key
  arrays.
- SQLite is opened once by [`src/db/index.ts`](./src/db/index.ts), with foreign
  keys and WAL configured. Write transactions use the synchronous
  `withTransaction` helper; transaction callbacks must not be async.
- The database schema is defined in
  [`src/db/schema.ts`](./src/db/schema.ts); generated migration files are under
  [`src/db/migrations/`](./src/db/migrations/).

## Authentication, authorization, and tenant boundaries

The `/_auth` route layout resolves the current session and redirects
unauthenticated users to `/login`. Better Auth is configured in
[`src/lib/auth.ts`](./src/lib/auth.ts). Server-side auth middleware provides a
fresh-session option; clinic access middleware resolves a clinic from the
request or referenced patient/visit/appointment and rejects cross-clinic
access for non-admin users.

The canonical TypeScript role vocabulary in
[`src/lib/auth/role.ts`](./src/lib/auth/role.ts) is `admin`, `doctor`, `staff`,
`guardian`, and `patient`. Capability statements are declared in
[`src/lib/auth/permissions.ts`](./src/lib/auth/permissions.ts). These
definitions do not by themselves prove that every operation is protected:
when adding or changing a server function, verify its middleware and
entity/clinic scoping explicitly.

There is a schema/type discrepancy to keep in mind: the Better Auth user role
column's SQLite enum in [`src/db/schema.ts`](./src/db/schema.ts) lists `admin`,
`doctor`, `patient`, and `staff`, while the TypeScript role vocabulary also
includes `guardian`. Reconcile this in the schema and migrations before
relying on guardian accounts or changing role handling.

Never put credentials, auth tokens, or real patient information in source
control, fixtures, logs, screenshots, or this document. The database contains
sensitive clinical and identity data; configure the deployment's storage,
backups, transport security, and access controls accordingly.

## Offline writes and conflict handling

[`src/features/outbox/`](./src/features/outbox) implements a browser
IndexedDB outbox. Its currently declared write kinds are immunization
recording, saving a visit, saving a prescription, setting a milestone, and
creating a measurement. The authenticated app installs a flusher that retries
queued entries when the app starts, the browser comes online, the tab regains
focus, and on an interval.

Outbox entries carry idempotency keys; relevant server functions deduplicate
retries using the `idempotency` table. The flusher distinguishes retryable
failures, fatal failures, and conflicts. Conflicts are retained for resolution
rather than silently overwritten. This is an offline **write queue**, not
proof that every screen or read works offline. The client store is IndexedDB;
do not claim that it is encrypted unless an encryption layer is implemented
and verified.

## Data model at a glance

The schema includes:

- **Identity and sessions:** users, sessions, provider accounts, verification,
  and rate limits.
- **Organization and access:** clinics and guardian-to-patient links.
- **Patient and scheduling:** patients, appointments, and visits.
- **Clinical data:** measurements, diagnoses, prescriptions, medical notes,
  certificates, and audit-log entries.
- **Clinical reference data:** Egyptian LMS references, WHO growth standards,
  vaccine catalogs/records, developmental milestone catalogs/records, and
  drug formularies.
- **Reliability:** idempotency records for deduplicating retried writes.

Use the schema and feature queries as the authority for relationships,
cascades, status enums, and constraints. The schema contains both
`vaccinations`/`vaccine_catalog` and `immunizations` models; the current
immunizations feature imports and writes the `immunizations` table. Check
existing callers and migrations before expanding or consolidating either
model.

## UI and interaction conventions

The authenticated workspace uses a responsive application shell, sidebar
navigation, mobile navigation sheet, command menu, and theme controls. Shared
blocks provide page headers, state/empty/error views, and table behavior.
Theme initialization is performed before first paint to reduce theme
flicker.

Follow the existing shadcn-style component and Tailwind token conventions.
Prefer shared components and variants over restyling primitive internals or
adding new design tokens. Keep route modules focused on route loading and
composition; put domain behavior in feature modules.

## Local development

### Prerequisites and environment

Use Bun because the server database client depends on `bun:sqlite`. Create a
local `.env` or `.env.local` file; do not commit it. The runtime environment
schema in [`src/env.ts`](./src/env.ts) currently declares:

| Variable                                   | Required by current schema | Purpose                                           |
| ------------------------------------------ | -------------------------- | ------------------------------------------------- |
| `DB_FILE_NAME`                             | Yes                        | SQLite database file path                         |
| `BETTER_AUTH_URL`                          | Yes                        | Canonical app/auth URL                            |
| `BETTER_AUTH_SECRET`                       | Yes; minimum 32 characters | Better Auth signing/encryption secret             |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Yes                        | GitHub OAuth configuration                        |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Yes                        | Google OAuth configuration                        |
| `SERVER_URL`                               | No                         | Optional server URL                               |
| `COOKIE_DOMAIN`                            | No                         | Optional production cross-subdomain cookie domain |
| `ALLOWED_ORIGINS`                          | No                         | Comma-separated additional trusted origins        |
| `VITE_APP_TITLE`                           | No                         | Optional client app title                         |
| `VITE_BASE_URL`                            | No                         | Optional client base URL                          |

Although OAuth may not be needed for local email/password testing, the current
Zod environment schema declares all four provider credential variables as
required strings. Supply values or deliberately change the schema before
assuming they are optional. Drizzle Kit also requires `DB_FILE_NAME`.

There is no checked-in `.env.example` at present. The README's environment
sample and setup directions may not match the current runtime validation or
scripts; consult the files above and `package.json`.

### Common commands

```sh
bun install
bun run dev
```

The dev server defaults to port `3000`; `PORT` can override it. The
`predev`/`prebuild` scripts attempt to stop a process already using port 3000,
so be aware they may affect another local process on that port.

Database scripts (the database path must be configured):

```sh
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:seed
bun run db:seed:admin
bun run db:studio
```

The full seed orchestrator is [`src/db/seed/seed.ts`](./src/db/seed/seed.ts).
Review the seed scripts and rotate any bootstrap credentials before using
seeded accounts outside a disposable local environment.

Validation commands:

```sh
bun run test
bun run typecheck
bun run lint
bun run build
```

`bun run check` invokes `vp check --fix` and may modify files. Review the
worktree before and after running it. Playwright browser tests are configured
in [`playwright.config.ts`](./playwright.config.ts); the current package
manifest does not define a dedicated E2E script.

## Tests and operational expectations

Vitest is configured in `vite.config.ts` for unit and component tests under
`src/` and selected repository scripts. Playwright is set up as separate
guest, auth-guard, and authenticated-app projects; the app project signs in
with a seeded administrator and stores browser state under ignored E2E
artifacts.

For code changes, run the narrowest relevant test and type-check. When
touching clinical calculations, add focused tests for boundary inputs and
calculation outcomes. When touching mutations, check authorization,
idempotency, optimistic state, and feature cache invalidation as applicable.

## Current implementation caveats

These are important context for future work:

1. **Several public pages are marketing copy, not an implementation
   specification.** For example, the About page makes claims about Postgres,
   per-device encryption, comprehensive audit coverage, and broad offline
   workflows. The current database implementation uses Bun SQLite, and the
   outbox uses browser IndexedDB. Verify each claim against code and deployed
   infrastructure before repeating it as a product guarantee.
2. **Audit schema does not establish universal audit coverage.** An
   `audit_log` table exists and selected mutations write audit records, but
   verify each path before asserting every create/update/delete is logged or
   that all requested before/after details are available.
3. **Schema includes more than the active application workflows.** A table,
   role statement, or dependency is not proof that its corresponding product
   screen or end-to-end behavior is complete.
4. **Brand names vary by page.** The root metadata says “Smart Clinic ·
   Pediatrics,” while the landing page title uses “G-Tracker”; package name
   is `patient-tracker`. Prefer “Smart Clinic” in generic product descriptions
   and preserve an existing route's brand until product copy is intentionally
   unified.
5. **Medical reference content needs provenance and review.** Keep seed
   sources, versions, units, age conventions, and clinical thresholds explicit
   when changing WHO/Egyptian references, immunization schedules, or drug
   data. Do not silently substitute one standard for another.

## Guidance for future changes

- Search the owning feature for an existing schema, query factory, mutation,
  helper, and tests before adding a parallel implementation.
- Keep server-only imports on the server side and use authenticated,
  clinic-scoped server functions for clinical data.
- Keep shared query keys and invalidation inside the feature that owns the
  affected data.
- Preserve type safety and existing UI/accessibility patterns.
- Treat patient and guardian data as sensitive; use synthetic data in tests.
- Update this document when the app's product scope, stack, security
  boundaries, or developer workflow changes.
