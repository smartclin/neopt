# Pediatric Clinic Management System

A comprehensive, full-stack pediatric and neonatal clinic management application built with TanStack Start, React 19, Drizzle ORM, and Better Auth. Designed for Egyptian pediatric practices with integrated WHO growth standards, Egyptian 2021 LMS references, and clinical decision support.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Seeding Data](#seeding-data)
  - [Development](#development)
- [Clinical Features](#clinical-features)
  - [Patient Management](#patient-management)
  - [Growth Charts & Z-Scores](#growth-charts--z-scores)
  - [Visit & Encounter Management](#visit--encounter-management)
  - [Prescriptions & Dosing](#prescriptions--dosing)
  - [Immunizations](#immunizations)
  - [Diagnoses & ICD-10](#diagnoses--icd-10)
  - [Developmental Milestones](#developmental-milestones)
- [API & Data Layer](#api--data-layer)
- [Authentication & Authorization](#authentication--authorization)
- [Testing](#testing)
- [Design System](#design-system)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This application provides pediatricians, neonatologists, and clinic staff with a complete digital workflow for managing child patients. It handles everything from patient registration and appointment scheduling through growth monitoring with WHO/Egyptian reference standards, prescribing with weight-based pediatric dose calculations, and immunization tracking per the Egyptian Ministry of Health schedule.

**Who it's built for:**

- **Pediatric clinics** and **neonatal units** in Egypt
- **Solo practitioners** and **multi-doctor practices**
- **Front-desk staff**, **nurses**, and **physicians** with role-scoped access

---

## Key Features

### 🧒 Patient & Clinic Management

- Multi-clinic support with per-clinic patient rosters
- Unique MRN generation with race-safe retry logic
- Full patient chart: demographics, visits, measurements, diagnoses, prescriptions, and notes

### 📈 Growth Monitoring

- **WHO Child Growth Standards** (weight-for-age, length/height-for-age)
- **Egyptian 2021 LMS references** (weight-for-age, length-for-age, weight-for-length, BMI-for-age)
- LMS interpolation for precise z-scores at any age/length
- Interactive growth charts with ±1/±2/±3 SD bands
- Automatic classification (stunting, wasting, underweight, overweight, obesity)
- Corrected age for premature infants (gestational age adjustment)

### 💊 Prescriptions & Dosing

- Egyptian National Drug Formulary integration
- Neonatal & pediatric drug formulary
- **Weight-based dose calculators** with max-dose cap enforcement
- NICU-specific dosing with concentration/volume calculations
- Bulk prescription workflows

### 💉 Immunizations

- Full routine childhood vaccination schedule (Egyptian MoH-aligned)
- Status tracking: given, due, overdue, deferred
- Batch/lot number recording and adverse event capture

### 🩺 Clinical Encounters

- Visit recording with automatic age calculation
- ICD-10-coded diagnoses (primary/secondary)
- Physical exam, chief complaint, and plan documentation
- Medical notes with author tracking

### 🧩 Developmental Screening

- CDC/WHO-aligned milestone checklist
- Red-flag warnings for age-inappropriate development
- Domain-filtered view (gross motor, fine motor, language, social)

### 🎨 Modern UI

- shadcn/ui-inspired component library built on **Base UI**
- Dark/light/system theme with flash-free SSR
- Responsive layouts with collapsible sidebar
- Command menu (⌘K) for navigation
- Accessible tables with pagination, filtering, and empty states

---

## Tech Stack

| Layer             | Technology                                                                         |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Framework**     | [TanStack Start](https://tanstack.com/start) (React 19 + SSR + file-based routing) |
| **Router**        | [TanStack Router](https://tanstack.com/router) with type-safe routes               |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query) with SSR integration                  |
| **Database**      | SQLite via [Bun SQLite](https://bun.sh) + [Drizzle ORM](https://orm.drizzle.team)  |
| **Validation**    | [Zod v4](https://zod.dev)                                                          |
| **Forms**         | [TanStack Form](https://tanstack.com/form)                                         |
| **Auth**          | [Better Auth](https://better-auth.com) (email/password + GitHub/Google OAuth)      |
| **Charts**        | [TanStack Charts](https://tanstack.com/charts) + D3                                |
| **UI Primitives** | [Base UI](https://base-ui.com) (`@base-ui/react`)                                  |
| **Styling**       | Tailwind CSS v4                                                                    |
| **Icons**         | [Lucide](https://lucide.dev)                                                       |
| **Testing**       | [Vitest](https://vitest.dev) + React Testing Library                               |
| **Runtime**       | [Bun](https://bun.sh) (recommended)                                                |

---

## Architecture

The application follows a **feature-sliced architecture**, grouping code by domain rather than technical layer.

```
┌─────────────────────────────────────────────────────────────┐
│                      Routes (TanStack Router)               │
│  /_auth/app/*  →  protected application shell               │
│  /_guest/*     →  login / signup                            │
│  /api/auth/*   →  Better Auth handler                       │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Features (domain modules)                │
│  patients │ visits │ appointments │ prescriptions │ growth  │
│  Each feature:  api.ts · queries.ts · schema.ts · components│
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (Drizzle ORM + SQLite)              │
│  schema.ts · relations.ts · seed/ · cache.ts                │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│           Components (blocks, tables, UI primitives)        │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

1. **Server functions (`createServerFn`) are the API boundary.** Each feature exposes typed RPC-style functions that are called directly from React components via TanStack Query.
2. **Zod schemas are the single source of truth** for validation on both server and client.
3. **Queries are colocated with features**, keeping read/write logic next to the schema it operates on.
4. **Growth math is pure and testable** (`features/growth/types/lms.ts`), separate from the DB access layer.
5. **No raw string queries in components** — all DB access goes through the feature `queries.ts` modules.

---

## Project Structure

```
src/
├── components/
│   ├── blocks/              # Composite layout blocks (PageHeader, AppShell, StateView…)
│   ├── tables/              # Shared table primitives (pagination, filter bar, empty state)
│   ├── ui/                  # ~80 shadcn-compatible UI primitives (Base UI-backed)
│   ├── forms/               # TanStack Form ↔ shadcn integration
│   ├── growth/              # Chart-specific components
│   ├── theme-provider.tsx   # Dark/light/system with SSR-safe flash prevention
│   └── icons.tsx            # Icon registry (Lucide + custom brand marks)
│
├── db/
│   ├── schema.ts            # Drizzle schema — every table + relations
│   ├── relations.ts         # Query relations (defineRelations)
│   ├── index.ts             # DB client, transactions, retry helpers
│   ├── cache.ts             # In-process query cache with tag invalidation
│   ├── reset.ts             # Dev database reset
│   ├── validations.ts       # Cross-cutting Zod schemas
│   └── seed/                # Idempotent seeding scripts
│       ├── seed.ts          # Orchestrator
│       ├── seed-admin.ts    # Admin user bootstrap
│       ├── seed-who.ts      # WHO daily growth standards
│       ├── seed-formulary.ts# Drug formularies
│       └── seed-config.ts   # Seed constants
│
├── features/
│   ├── appointments/        # Scheduling + calendar
│   ├── clinics/             # Clinic registry
│   ├── development/         # Milestone checklists
│   ├── diagnosis/           # ICD-10 diagnosis entry
│   ├── growth/              # Growth charts, LMS math, WHO/Egyptian refs
│   ├── immunizations/       # Vaccination schedule + records
│   ├── measurements/        # Anthropometric measurements
│   ├── patients/            # Patient CRUD + full chart
│   ├── prescriptions/       # Rx + neonatal dosing
│   ├── shared/              # Cross-feature helpers, query keys, invalidations
│   └── visits/              # Clinical encounters
│
├── hooks/                   # Reusable React hooks
├── integrations/            # TanStack Query, Better Auth glue
├── lib/
│   ├── auth/                # Better Auth config, permissions, middleware
│   ├── auth-client.ts       # Browser-side auth client
│   ├── highlighter.tsx      # Shiki code highlighting (for docs)
│   ├── shadcn/              # Theme, navigation, pagination helpers
│   └── test-utils.tsx       # Route render helpers
│
├── routes/
│   ├── __root.tsx           # Root document shell
│   ├── _auth/               # Protected route group
│   │   ├── route.tsx        # Auth guard (beforeLoad)
│   │   └── app/             # Application shell
│   ├── _guest/              # Login / signup
│   └── api/auth/$.ts        # Better Auth handler
│
├── types/form.ts            # Shared form types
└── utils/                   # Server function ID generator, helpers
```

---

## Getting Started

### Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.1 (recommended; the app uses `bun:sqlite`)
- **Node.js** ≥ 20 (alternative runtime)
- **Git**

### Installation

```bash
git clone <your-repo-url> pediatric-clinic
cd pediatric-clinic
bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# ── Required ───────────────────────────────────────────────────
DB_FILE_NAME="./clinic.sqlite"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<32+ character random string>"

# ── OAuth providers (optional, but both slots must be filled) ─
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ── Optional ───────────────────────────────────────────────────
SERVER_URL="http://localhost:3000"
VITE_APP_TITLE="Pediatric Clinic"
VITE_BASE_URL="http://localhost:3000"
```

Generate a secure `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Database Setup

The app uses SQLite. Run migrations (if you have them) or let Drizzle push the schema:

```bash
# Push schema directly (development)
bunx drizzle-kit push

# Or, if you maintain migration files:
bunx drizzle-kit migrate
```

### Seeding Data

The seed scripts are **idempotent** — safe to re-run.

```bash
# Full seed (LMS references, WHO standards, formularies, demo patients, admin)
bun run src/db/seed/seed.ts

# Or individually:
bun run src/db/seed/seed-admin.ts     # Admin user only
bun run src/db/seed/seed-who.ts       # WHO growth standards only
bun run src/db/seed/seed-formulary.ts # Drug formularies only
```

**Default admin credentials** (from `seed-admin.ts`):

| Field    | Value                                        |
| -------- | -------------------------------------------- |
| Email    | `clinysmar@gmail.com`                        |
| Password | `HealthF27`                                  |
| Role     | `admin`                                      |
| Clinic   | Hurghada General Hospital — Pediatric Clinic |

> ⚠️ **Change these immediately in any non-local environment.**

### Development

```bash
bun dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Log in with the seeded admin credentials, or sign up with an OAuth provider.

### Production Build

```bash
bun run build
bun run start
```

---

## Clinical Features

### Patient Management

- **MRN generation** — `MRN-{YEAR}-{NNN}` scoped per clinic, race-safe with retry on unique constraint collision
- **Gestational age tracking** — automatic corrected-age calculation for premature infants (<37 weeks)
- **Full patient chart** — demographics, visit history, growth series, diagnoses, prescriptions, and notes in a single query

### Growth Charts & Z-Scores

Two independent reference systems are available:

| System                         | Coverage                              | Use Case                                   |
| ------------------------------ | ------------------------------------- | ------------------------------------------ |
| **WHO Child Growth Standards** | Birth to 5 years, daily resolution    | International comparison, standard-of-care |
| **Egyptian 2021 LMS**          | Birth to 19 years, monthly resolution | Local population reference                 |

**LMS math** (`features/growth/types/lms.ts`) is pure and heavily tested:

```ts
// Z-score from a measured value
const z = zScoreForValue({ l: -0.35, m: 4.66, s: 0.09 }, 4.5);

// Value at a given z-score (for reference bands)
const median = valueAtZScore({ l, m, s }, 0);

// Interpolate between tabulated grid points
const lms = interpolateLms(2.5, { x: 2, l, m, s }, { x: 3, l, m, s });
```

**Classifications** follow WHO cutoffs:

- **Weight-for-age:** severely underweight (<−3 SD), underweight (−3 to −2), normal, overweight (+2 to +3), severely obese (>+3)
- **Length-for-age:** severely stunted (<−3), stunted (−3 to −2), normal, tall (>+3)
- **Weight-for-length / BMI-for-age:** severely wasted (<−3), wasted (−3 to −2), normal, at-risk overweight (+1 to +2), overweight (+2 to +3), obese (>+3)

### Visit & Encounter Management

- Automatic `ageMonths`, `ageYears`, `ageMonthsRemainder` derivation
- Optional link to a scheduled appointment
- Chief complaint, physical exam, plan, and free-text notes
- Each visit cascades to measurements, diagnoses, prescriptions, and notes

### Prescriptions & Dosing

Two dosing calculators are provided:

1. **General pediatric** (`features/prescriptions/lib/dosing.ts`)
   - Weight-based mg/kg/day or mg/kg/dose
   - Max single-dose and max-daily-dose caps
   - Liquid volume conversion (mg → mL based on selected concentration)

2. **Neonatal / NICU** (`features/prescriptions/lib/neonatal-dosing.ts`)
   - Formulary-range enforcement (min/max dose per kg)
   - Microgram-to-milligram conversion
   - Safety warnings for renal, hepatic, and neonatal contraindications

The **formulary picker** searches across:

- Egyptian National Drug Formulary (EDA-2024)
- Neonatal & Pediatric Formulary

### Immunizations

- **Routine childhood schedule** aligned with Egyptian MoH:
  - Birth: BCG, HepB, OPV-0
  - 2, 4, 6 months: Pentavalent, IPV, Rotavirus, PCV
  - 9 months: Measles
  - 12 months: MMR-1, Varicella
  - 18 months: MMR-2, DTP booster, HepA-1
- **Status logic** — compares child's age against target age to flag overdue vaccines
- **Administration recording** — batch/lot, site, adverse events

### Diagnoses & ICD-10

- Code format validation (`A00` to `Z99.9999`)
- Primary vs. secondary designation
- Bulk entry for multi-diagnosis encounters
- Top-diagnoses report per clinic

### Developmental Milestones

- 22 milestones across 4 domains, aligned with CDC/WHO age brackets
- **Red-flag warnings** for age-inappropriate development
- Age-bracket selector (2m, 4m, 6m, 9m, 12m, 18m, 24m)

---

## API & Data Layer

Every feature exposes **server functions** that are safe to call from client components:

```ts
// features/patients/api.ts
export const fetchPatientById = createServerFn({ method: "GET" })
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => getPatientById(data.patientId));
```

```tsx
// In a component
const { data } = useQuery({
  queryKey: ["patient", patientId],
  queryFn: () => fetchPatientById({ data: { patientId } }),
});
```

**Query-key discipline:** all keys are built from `features/shared/queryKeys.queries.ts` to ensure consistent invalidation.

**Invalidation helpers** (`features/shared/invalidations.queries.ts`) centralize post-mutation refetches — a measurement write invalidates series, band, flagged, and latest queries in one call.

### Query Cache

An in-process **tag-based query cache** (`db/cache.ts`) provides:

- Per-entity TTLs (appointments 15s, patients 30s, clinics 60s, static 5min)
- Stale-while-revalidate semantics
- Tag-based invalidation (`invalidateTag("patient")`)
- LRU eviction when capacity is exceeded

### Transactions

`withTransaction()` in `db/index.ts` provides retry logic for transient errors:

```ts
await withTransaction(async tx => {
  const patient = await tx.insert(patients).values(...).returning();
  await tx.insert(visits).values({ patientId: patient[0].id, ... });
}, { maxRetries: 3 });
```

---

## Authentication & Authorization

**Better Auth** handles sessions with:

- Email/password
- GitHub and Google OAuth
- Admin plugin for user management
- Cookie caching (5-minute TTL) for reduced DB load

### Role-Based Access Control

Four roles, enforced via a statement-based access control (`lib/auth/permissions.ts`):

| Role        | Scope                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| **admin**   | Full access to all resources                                                   |
| **doctor**  | Full clinical access + prescribing; read-only billing                          |
| **staff**   | Scheduling, vitals, immunization administration, dispensing; no clinical edits |
| **patient** | Read-only access to own records (row-level scoping in API layer)               |

Protect routes with the `_auth` layout guard:

```tsx
// routes/_auth/route.tsx
beforeLoad: async ({ context }) => {
  const user = await context.queryClient.query(authQueryOptions());
  if (!user) throw redirect({ to: "/login" });
};
```

Protect server functions with `authMiddleware`:

```ts
export const createVisitFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(visitInputSchema)
  .handler(async ({ data, context }) => {
    // context.user is guaranteed here
    return createVisit({ ...data, doctorId: context.user.id });
  });
```

---

## Testing

Tests use **Vitest** + **React Testing Library**.

```bash
bun test               # Run all tests
bun test --watch       # Watch mode
bun test --coverage    # Coverage report
```

### Test Coverage Highlights

| File                      | What it tests                                                |
| ------------------------- | ------------------------------------------------------------ |
| `app-shell-1.test.tsx`    | Sidebar navigation, command menu, theme toggle, issue dialog |
| `GrowthChart.test.tsx`    | Reference line rendering, scatter dots, interpolated bands   |
| `chartData.test.ts`       | LMS interpolation, domain errors, curve monotonicity         |
| `theme-provider.test.tsx` | SSR flash prevention, storage persistence, system theme      |
| `copy-button.test.tsx`    | Clipboard API, fallback, timeout reset                       |
| `route-error.test.tsx`    | Error boundary retry, loader re-execution                    |

**Test helpers** (`lib/test-utils.tsx`) provide `renderRoute()` for real route rendering with the actual router.

---

## Design System

The UI is built on **Base UI primitives** styled to match **shadcn/ui** conventions.

### Key Components

- **80+ primitives** in `components/ui/` — buttons, dialogs, forms, tables, charts, etc.
- **Composite blocks** in `components/blocks/` — `PageHeader`, `Section`, `StateView`, `TableColGroup`, `AppShell`
- **Table system** — fixed-layout tables with `TableColGroup` for column width stability, mobile column hiding, and skeleton loading
- **Form system** — TanStack Form ↔ shadcn integration with `createFormField`, `FormFieldSet`, and typed field names

### Theming

```tsx
// Toggle theme anywhere
const { resolvedTheme, toggleTheme } = useTheme();
```

Dark mode is applied via the `.dark` class on `<html>`, with an inline `<script>` in the root document that reads `localStorage` before first paint — **no flash of unstyled content**.

### Layout

The application shell (`components/blocks/app-shell-1.tsx`) provides:

- Collapsible sidebar with mobile sheet fallback
- ⌘K command menu
- Theme toggle in the footer
- Lazy-loaded dialogs (VisitForm, CommandMenu)
- `CloseSheetOnNavigate` to collapse the mobile sheet on route change

---

## Roadmap

- [ ] **Billing & invoicing** — payment tracking, invoice generation
- [ ] **Multi-clinic switcher** — for users with access to multiple clinics
- [ ] **Appointment calendar view** — week/month views beyond today's list
- [ ] **Lab orders & results** — integration with local lab systems
- [ ] **Patient portal** — read-only access for guardians
- [ ] **Export to PDF** — growth charts, prescriptions, certificates
- [ ] **HIPAA/Data-residency audit** — formal compliance review
- [ ] **Backup & restore tooling** — automated SQLite snapshots

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the existing patterns:
   - **Server functions** in `features/*/api.ts`
   - **DB queries** in `features/*/queries.ts`
   - **Zod schemas** in `features/*/schema.ts`
   - **Tests** alongside the code they test
4. Run `bun test` and `bun run lint` before committing
5. Open a pull request with a clear description

### Code Style

- **TypeScript strict mode** — no `any`, no `as` casts except where unavoidable (documented)
- **No raw strings for query keys** — use `features/shared/queryKeys.queries.ts`
- **No direct DB access in components** — go through feature `queries.ts`
- **Accessibility** — every interactive element has an accessible name; every table has an `aria-label`

---

## License

_Add your license here (e.g., MIT, Apache-2.0, proprietary)._

---

## Acknowledgments

- **[WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards)** — reference data
- **Egyptian Ministry of Health** — LMS reference data (2021 edition)
- **Egyptian Drug Authority (EDA)** — national drug formulary
- **[TanStack](https://tanstack.com)** — Router, Query, Form, Start, Charts
- **[Base UI](https://base-ui.com)** — accessible component primitives
- **[shadcn/ui](https://ui.shadcn.com)** — design inspiration
- **[Better Auth](https://better-auth.com)** — authentication

---

**Built with care for pediatric care teams in Egypt and beyond.** 🩺👶
