Project Path: routes

Source Tree:

```txt
routes
├── __root.tsx
├── _auth
│   ├── app
│   │   ├── appointments
│   │   │   ├── $appointmentId.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── index.tsx
│   │   │   └── new.tsx
│   │   ├── clinics
│   │   │   ├── $clinicId
│   │   │   │   └── edit.tsx
│   │   │   ├── $clinicId.tsx
│   │   │   ├── index.tsx
│   │   │   └── new.tsx
│   │   ├── conflicts
│   │   │   └── $conflictId.tsx
│   │   ├── development
│   │   │   ├── $patientId.tsx
│   │   │   └── index.tsx
│   │   ├── immunizations
│   │   │   ├── $patientId.tsx
│   │   │   └── index.tsx
│   │   ├── index.tsx
│   │   ├── patients
│   │   │   ├── $patientId
│   │   │   │   ├── edit.tsx
│   │   │   │   ├── growth.tsx
│   │   │   │   └── measurements
│   │   │   │       └── new.tsx
│   │   │   ├── $patientId.tsx
│   │   │   ├── index.tsx
│   │   │   └── new.tsx
│   │   ├── prescriptions
│   │   │   ├── $prescriptionId.tsx
│   │   │   ├── index.tsx
│   │   │   ├── neonatal-dose-calculator.tsx
│   │   │   └── new.tsx
│   │   ├── route.tsx
│   │   └── visits
│   │       ├── $visitId.edit.tsx
│   │       ├── $visitId.tsx
│   │       ├── index.tsx
│   │       └── new.tsx
│   └── route.tsx
├── _guest
│   ├── about.tsx
│   ├── forgot-password.tsx
│   ├── login.tsx
│   ├── privacy.tsx
│   ├── reset-password.tsx
│   ├── route.tsx
│   ├── services
│   │   ├── chronic-care.tsx
│   │   ├── developmental-screening.tsx
│   │   ├── immunizations.tsx
│   │   ├── index.tsx
│   │   ├── newborn-care.tsx
│   │   ├── sick-visits.tsx
│   │   └── well-child.tsx
│   ├── signup.tsx
│   └── terms.tsx
├── api
│   └── auth
│       └── $.ts
└── index.tsx

```

`__root.tsx`:

```tsx
// src/routes/__root.tsx

import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { ThemeProvider } from "#/lib/shadcn/theme.tsx";
import { THEME_INIT_SCRIPT } from "#/lib/shadcn/theme-init.ts";
import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "../styles.css?url";

// ─── Router context ─────────────────────────────────────────────────
//
// The root route's context is what `beforeLoad` / `loader` receive
// under `context`. This interface is the *only* declaration of that
// shape on the routing side — `router.tsx`'s `Register` interface is
// the other half of the contract. If you add a field here, add it
// there too (and vice versa) until a compile-time link exists.

interface RouterContext {
  queryClient: QueryClient;
}

// ─── App metadata ──────────────────────────────────────────────────

const APP = {
  title: "Smart Clinic · Pediatrics",
  description:
    "Pediatric clinic management: patients, encounters, growth tracking, prescriptions, and appointments.",
  themeColor: {
    light: "#f4f6fa" as `#${string}`,
    dark: "#0e1524" as `#${string}`,
  },
} as const;

// ─── Devtools (dev only, lazy) ─────────────────────────────────────
//
// `components/Devtools.tsx` guards against SSR via
// `useSyncExternalStore`, so `lazy()` is safe. The DEV ternary drops
// the dynamic import from the prod bundle — the fallback component
// never renders because `DevtoolsDeferred` early-returns below.

const Devtools = import.meta.env.DEV ? lazy(() => import("#/components/Devtools")) : () => null;

// `requestIdleCallback` is *non-optional* on `Window` in lib.dom, so
// `"requestIdleCallback" in window` narrows the else-branch to `never`
// and `window.setTimeout` becomes "does not exist on type 'never'".
// Declaring the property optional on a widened view of `window` makes
// the feature-detect a real one.
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

function DevtoolsDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as WindowWithIdleCallback;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setReady(true));
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(id);
  }, []);

  if (!import.meta.env.DEV || !ready) return null;

  return (
    <Suspense fallback={null}>
      <Devtools />
    </Suspense>
  );
}

// ─── Root route ────────────────────────────────────────────────────

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP.title },
      { name: "description", content: APP.description },
      // Two declarative theme-color tags. The browser picks the one
      // matching `prefers-color-scheme` — first-paint correct with
      // no JS. If the user overrides their OS theme in-app, only
      // `<html style="color-scheme">` (set by the init script)
      // reflects that; browsers read it for scrollbar and form-
      // control tinting. To also correct the address-bar color on
      // user override, that logic belongs in `applyTheme` in
      // theme-utils.ts, not in the inline script.
      {
        name: "theme-color",
        content: APP.themeColor.light,
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: APP.themeColor.dark,
        media: "(prefers-color-scheme: dark)",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Preconnect kept because `styles.css` @imports a Google
      // Fonts stylesheet. Remove if that stops being true — a
      // stray preconnect is a DNS + TLS handshake paid for nothing.
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "",
      },
    ],
    // Executed synchronously inside <head> by `<HeadContent />`,
    // before the body paints. See theme-init.ts for the contract.
    scripts: [{ children: THEME_INIT_SCRIPT }],
  }),
  shellComponent: RootDocument,
});

// ─── Shell ─────────────────────────────────────────────────────────
//
// `suppressHydrationWarning` is on `<html>` because the `class`
// attribute legitimately differs between SSR and the first client
// render (init script vs. `matchMedia`). React has no per-attribute
// opt-out. The blast radius — also suppressing warnings for `lang`
// and `dir` — is accepted: those attributes are static today.
//
// `ThemeProvider` is mounted without `defaultTheme` (defaults to
// "system"). The first client render of any `useTheme()` consumer
// can disagree with SSR until `mounted` flips; the fix belongs in
// `lib/shadcn/theme.tsx` (gate `resolvedTheme` on `mounted`), not
// here. Do not paper over it with `defaultTheme="light"` — that
// breaks first paint for system-dark users.

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <DevtoolsDeferred />
        <Scripts />
      </body>
    </html>
  );
}
```

`_auth/app/appointments/$appointmentId.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/$appointmentId")({
  component: AppointmentDetailPage,
});

function AppointmentDetailPage() {
  const { user } = useAuthSuspense();
  const navigate = useNavigate();
  const { appointmentId } = Route.useParams();

  if (!user?.clinicId) return null;

  return (
    <AppointmentSheet
      appointmentId={appointmentId}
      clinicId={user.clinicId}
      onOpenChange={(open) => {
        if (!open) {
          void navigate({ to: "/app/appointments" });
        }
      }}
      onSaved={() => void navigate({ to: "/app/appointments" })}
      open
    />
  );
}
```

`_auth/app/appointments/calendar.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { CalendarView } from "#/features/appointments/components/CalendarView.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/calendar")({
  component: AppointmentsCalendarPage,
});

function AppointmentsCalendarPage() {
  const { user } = useAuthSuspense();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | undefined>(undefined);
  const [_prefilledDate, setPrefilledDate] = React.useState<Date | undefined>(undefined);

  if (!user?.clinicId) {
    return <PageHeader description="No clinic is assigned to your account." title="Calendar" />;
  }

  const clinicId = user.clinicId;

  const openNew = (date?: Date) => {
    setEditId(undefined);
    setPrefilledDate(date);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setPrefilledDate(undefined);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <Button
          className="w-fit"
          nativeButton={false}
          render={<Link to="/app/appointments" />}
          size="sm"
          variant="ghost"
        >
          <ArrowLeftIcon aria-hidden="true" />
          Back to overview
        </Button>

        <PageHeader
          actions={
            <Button onClick={() => openNew()} size="sm">
              <PlusIcon className="size-3.5" />
              New appointment
            </Button>
          }
          description="Week and month schedule view."
          title="Calendar"
        />

        <CalendarView clinicId={clinicId} onEdit={openEdit} onNew={openNew} />
      </div>

      <AppointmentSheet
        appointmentId={editId}
        clinicId={clinicId}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditId(undefined);
            setPrefilledDate(undefined);
          }
        }}
        open={sheetOpen}
      />
    </>
  );
}
```

`_auth/app/appointments/index.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { FiltersRail } from "#/features/appointments/components/FiltersRail.tsx";
import { TodayQueue } from "#/features/appointments/components/TodayQueue.tsx";
import { WeekStrip } from "#/features/appointments/components/WeekStrip.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/")({
  component: AppointmentsPage,
});

type MobileView = "today" | "week" | "all";

function SegmentedToggle({
  value,
  onChange,
}: {
  value: MobileView;
  onChange: (v: MobileView) => void;
}) {
  const options: { value: MobileView; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "all", label: "All" },
  ];

  return (
    <div
      aria-label="View mode"
      className="bg-muted flex w-full items-center rounded-xl p-1"
      role="tablist"
    >
      {options.map((opt) => (
        <button
          aria-selected={value === opt.value}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          key={opt.value}
          onClick={() => onChange(opt.value)}
          role="tab"
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AppointmentsPage() {
  const { user } = useAuthSuspense();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [mobileView, setMobileView] = React.useState<MobileView>("today");

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Appointments"
      />
    );
  }

  const clinicId = user.clinicId;

  const openNew = () => {
    setEditId(undefined);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          actions={
            <div className="flex items-center gap-2">
              <Button
                nativeButton={false}
                render={<Link to="/app/appointments/calendar" />}
                size="sm"
                variant="outline"
              >
                <CalendarIcon className="size-3.5" />
                Calendar
              </Button>
              <Button onClick={openNew} size="sm" title="New appointment (N)">
                <PlusIcon className="size-3.5" />
                New
              </Button>
            </div>
          }
          description="Today's schedule and weekly overview."
          title="Appointments"
        />

        <div className="md:hidden">
          <SegmentedToggle onChange={setMobileView} value={mobileView} />
        </div>

        <div className="hidden gap-6 md:grid md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_260px_220px]">
          <div className="bg-card rounded-xl border p-5">
            <TodayQueue clinicId={clinicId} onEdit={openEdit} onNew={openNew} />
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-card rounded-xl border p-5">
              <WeekStrip
                clinicId={clinicId}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          </div>

          <div className="bg-card hidden rounded-xl border p-5 lg:block">
            {/* Store-backed — no props. `doctors` left out until
						    the route has a roster to pass in. */}
            <FiltersRail />
          </div>
        </div>

        <div className="md:hidden">
          {mobileView === "today" && (
            <div className="bg-card rounded-xl border p-4">
              <TodayQueue clinicId={clinicId} onEdit={openEdit} onNew={openNew} />
            </div>
          )}
          {mobileView === "week" && (
            <div className="bg-card rounded-xl border p-4">
              <WeekStrip
                clinicId={clinicId}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          )}
          {mobileView === "all" && (
            <div className="bg-card rounded-xl border p-4">
              <FiltersRail />
            </div>
          )}
        </div>
      </div>

      <AppointmentSheet
        appointmentId={editId}
        clinicId={clinicId}
        onOpenChange={setSheetOpen}
        onSaved={() => {
          setSheetOpen(false);
          setEditId(undefined);
        }}
        open={sheetOpen}
      />
    </>
  );
}
```

`_auth/app/appointments/new.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppointmentSheet } from "#/features/appointments/components/AppointmentSheet.tsx";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/appointments/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: (search.patientId as string | undefined) ?? undefined,
  }),
  component: NewAppointmentPage,
});

function NewAppointmentPage() {
  const { user } = useAuthSuspense();
  const navigate = useNavigate();
  const { patientId } = Route.useSearch();

  if (!user?.clinicId) return null;

  return (
    <AppointmentSheet
      clinicId={user.clinicId}
      defaultPatientId={patientId}
      onOpenChange={(open) => {
        if (!open) {
          void navigate({ to: "/app/appointments" });
        }
      }}
      onSaved={() => void navigate({ to: "/app/appointments" })}
      open
    />
  );
}
```

`_auth/app/clinics/$clinicId.tsx`:

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Section } from "#/components/blocks/section.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { InfoRow } from "#/components/ui/info-row.tsx";

// ── read: query factory from queries.ts ────────────────────────────────
import { clinicWithStatsQuery } from "#/features/clinics/queries";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/$clinicId")({
  component: ClinicLayout,
});

function ClinicLayout() {
  const { clinicId } = Route.useParams();
  const { user } = useAuthSuspense();

  if (typeof user?.role !== "string" || user.role !== "admin") {
    return <PageHeader description="Only administrators can view clinic details." title="Clinic" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        className="w-fit"
        nativeButton={false}
        render={<Link to="/app/clinics" />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to clinics
      </Button>
      <ClinicDetail clinicId={clinicId} />
      <Outlet />
    </div>
  );
}

function ClinicDetail({ clinicId }: { clinicId: string }) {
  // ── read via factory ────────────────────────────────────────────────
  const { data: clinic } = useSuspenseQuery(clinicWithStatsQuery(clinicId));

  if (!clinic) {
    return (
      <PageHeader description={`No clinic exists with ID ${clinicId}.`} title="Clinic not found" />
    );
  }

  const patientCount = clinic.patients?.length ?? 0;
  const staffCount = clinic.users?.length ?? 0;
  const upcomingCount = clinic.appointments?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            nativeButton={false}
            render={<Link params={{ clinicId }} to="/app/clinics/$clinicId/edit" />}
            variant="outline"
          >
            <PencilIcon aria-hidden="true" />
            Edit
          </Button>
        }
        description="Clinic overview and directory."
        title={clinic.name}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Patients" value={patientCount} />
        <StatCard label="Staff" value={staffCount} />
        <StatCard label="Upcoming appointments" value={upcomingCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Phone" value={clinic.phone} />
          <InfoRow label="Email" value={clinic.email} />
          <InfoRow label="Address" value={clinic.address} />
        </CardContent>
      </Card>

      <Section description="Users linked to this clinic." title="Staff">
        {clinic.users.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No staff linked to this clinic yet.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {clinic.users.map((u) => (
              <li className="flex items-center justify-between px-3 py-2 text-sm" key={u.id}>
                <span className="font-medium">{u.name ?? "Unknown staff"}</span>
                <span className="text-muted-foreground text-xs capitalize">{u.role ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
      </CardContent>
    </Card>
  );
}
```

`_auth/app/clinics/$clinicId/edit.tsx`:

```tsx
// routes/_auth/app/clinics/$clinicId/edit.tsx
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { toast } from "#/components/ui/toast.tsx";

// ── reads + mutations ────────────────────────────────────────────────
import { clinicByIdQuery, useUpdateClinicMutation } from "#/features/clinics/queries";

import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/$clinicId/edit")({
  component: EditClinicPage,
});

const updateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.email("Invalid email").or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone must be at least 7 characters")
    .max(20, "Phone is too long")
    .or(z.literal("")),
  address: z.string().trim().max(500).or(z.literal("")),
});

/** TanStack Form hands back `unknown[]`; pull a readable string out. */
function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

function EditClinicPage() {
  const { clinicId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  const cancel = () => void navigate({ to: "/app/clinics/$clinicId", params: { clinicId } });

  if (typeof user?.role !== "string" || user.role !== "admin") {
    return <PageHeader description="Only administrators can edit clinics." title="Edit Clinic" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button nativeButton onClick={cancel} variant="outline">
            Cancel
          </Button>
        }
        description={`Clinic ${clinicId}`}
        title="Edit Clinic"
      />
      <Card>
        <CardContent className="pt-6">
          <EditClinicForm clinicId={clinicId} onDone={cancel} />
        </CardContent>
      </Card>
    </div>
  );
}

function EditClinicForm({ clinicId, onDone }: { clinicId: string; onDone: () => void }) {
  const clinicQuery = useQuery(clinicByIdQuery(clinicId));

  if (clinicQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (clinicQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-destructive text-sm font-medium">
          {clinicQuery.error instanceof Error
            ? clinicQuery.error.message
            : "Could not load clinic."}
        </p>
        <Button onClick={() => void clinicQuery.refetch()} size="sm" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!clinicQuery.data) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        This clinic no longer exists.
      </p>
    );
  }

  // useForm lives below — we can't call it conditionally, so the split is required.
  return <ClinicEditFields clinic={clinicQuery.data} clinicId={clinicId} onDone={onDone} />;
}

function ClinicEditFields({
  clinicId,
  clinic,
  onDone,
}: {
  clinicId: string;
  clinic: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  onDone: () => void;
}) {
  const updateMutation = useUpdateClinicMutation();

  const form = useForm({
    defaultValues: {
      name: clinic.name,
      email: clinic.email ?? "",
      phone: clinic.phone ?? "",
      address: clinic.address ?? "",
    },
    validators: { onSubmit: updateSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync({
          data: {
            clinicId,
            patch: {
              name: value.name.trim(),
              email: value.email.trim() || null,
              phone: value.phone.trim() || null,
              address: value.address.trim() || null,
            },
          },
        });
        toast.add({ type: "success", data: "Clinic updated" });
        onDone();
        return undefined;
      } catch (err) {
        // Bubble into TanStack Form's errorMap so the user sees why
        // the save failed instead of a silent no-op.
        return {
          form: err instanceof Error ? err.message : "Failed to save clinic",
        };
      }
    },
  });

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor="clinic-name">Name</Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              autoComplete="organization"
              id="clinic-name"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="phone">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor="clinic-phone">Phone</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="clinic-phone"
                inputMode="tel"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="tel"
                value={field.state.value}
              />
              {fieldErrorMessage(field.state.meta.errors[0]) && (
                <p className="text-destructive text-sm" role="alert">
                  {fieldErrorMessage(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor="clinic-email">Email</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="clinic-email"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="email"
                value={field.state.value}
              />
              {fieldErrorMessage(field.state.meta.errors[0]) && (
                <p className="text-destructive text-sm" role="alert">
                  {fieldErrorMessage(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="address">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor="clinic-address">Address</Label>
            <Textarea
              id="clinic-address"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => {
          const message = fieldErrorMessage(err);
          return message ? (
            <p className="text-destructive text-sm" role="alert">
              {message}
            </p>
          ) : null;
        }}
      </form.Subscribe>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex justify-end gap-2">
            <Button disabled={isSubmitting} onClick={onDone} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
```

`_auth/app/clinics/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import {
  DEFAULT_PAGE_SIZE,
  isPageSize,
  type PageSize,
} from "#/components/tables/table-pagination-constants.ts";
import { ClinicForm, ClinicsTable } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/")({
  validateSearch: z.object({
    page: z.number().int().min(1).optional(),
    size: z.custom<PageSize>((v) => isPageSize(String(v))).optional(),
  }),
  component: ClinicsPage,
});

function ClinicsPage() {
  const search = Route.useSearch();
  const { user } = useAuthSuspense();

  // Only admins manage the clinic directory. Everything else (doctors, staff,
  // patients) sees a hint instead of the table.
  if (typeof user?.role !== "string" || user.role !== "admin") {
    return (
      <PageHeader
        description="Only administrators can manage the clinic directory."
        title="Clinics"
      />
    );
  }

  const page = search.page ?? 1;
  const size = (search.size ?? DEFAULT_PAGE_SIZE) as PageSize;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={<ClinicForm />}
        description="Register, browse, and edit the clinics that make up the network."
        title="Clinics"
      />
      <ClinicsTable page={page} size={size} />
    </div>
  );
}
```

`_auth/app/clinics/new.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { ClinicForm } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/new")({
  component: NewClinicPage,
});

function NewClinicPage() {
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  if (typeof user?.role !== "string" || user.role !== "admin") {
    return <PageHeader description="Only administrators can create clinics." title="New Clinic" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            nativeButton={false}
            render={<a aria-label="Cancel and return to clinics" href="/app/clinics" />}
            variant="outline"
          >
            Cancel
          </Button>
        }
        description="Register a clinic. You can add staff and patients afterwards."
        title="New Clinic"
      />
      <Card>
        <CardContent className="pt-6">
          <ClinicForm
            inline
            onSuccess={(clinic) => {
              void navigate({
                to: "/app/clinics/$clinicId",
                params: { clinicId: clinic.id },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

`_auth/app/conflicts/$conflictId.tsx`:

```tsx
// src/routes/_auth/app/conflicts/$conflictId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOutboxEntry, useResolveConflict } from "@/features/outbox/use-outbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_auth/app/conflicts/$conflictId")({
  component: ConflictDialog,
});

function ConflictDialog() {
  const { conflictId } = Route.useParams();
  const navigate = useNavigate();
  const q = useOutboxEntry(conflictId);
  const resolve = useResolveConflict();

  const close = () => void navigate({ to: "/app" });
  const pick = (resolution: "keep-local" | "use-server") =>
    resolve.mutate({ id: conflictId, resolution }, { onSettled: close });

  return (
    <Dialog onOpenChange={(open) => !open && close()} open>
      <DialogContent aria-labelledby="conflict-title" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle id="conflict-title">Sync conflict needs review</DialogTitle>
        </DialogHeader>

        {!q.data ? (
          <p className="text-muted-foreground text-sm">This conflict has already been resolved.</p>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Someone else updated this record while you were offline. Pick which version to keep.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <SnapshotPanel data={q.data.optimisticSnapshot} label="Your change (offline)" />
              <SnapshotPanel data={q.data.serverSnapshot} label="Server version" />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                disabled={resolve.isPending}
                nativeButton
                onClick={() => pick("use-server")}
                variant="outline"
              >
                Use server version
              </Button>
              <Button disabled={resolve.isPending} nativeButton onClick={() => pick("keep-local")}>
                Keep my change
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SnapshotPanel({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide uppercase">{label}</p>
      <pre className="max-h-64 overflow-auto text-[11px] leading-snug">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
```

`_auth/app/development/$patientId.tsx`:

```tsx
// routes/_auth/app/development/$patientId.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeftIcon, Check, FileText, Printer, Stethoscope } from "lucide-react";
import * as React from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { SectionState } from "#/components/blocks/state-view.tsx";
import { Icons } from "#/components/icons.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { toast } from "#/components/ui/toast.tsx";
// ── components ─────────────────────────────────────────────────────────
import { DomainRings } from "#/features/development/components/DomainRings.tsx";
import { MilestoneTimeline } from "#/features/development/components/MilestoneTimeline.tsx";
import { PrintChecklist } from "#/features/development/components/PrintChecklist.tsx";
// ── reads + mutations ──────────────────────────────────────────────────
import {
  patientDevelopmentQuery,
  useSetMilestoneAchievedMutation,
} from "#/features/development/queries";

// ── types + helpers ────────────────────────────────────────────────────
import { milestoneStatus } from "#/features/development/status.ts";
import {
  DOMAIN_META,
  DOMAIN_ORDER,
  type MilestoneDomain,
  type PatientMilestone,
} from "#/features/development/types.ts";

import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/development/$patientId")({
  component: PatientDevelopmentPage,
});

function PatientDevelopmentPage() {
  const { patientId } = Route.useParams();
  const { user } = useAuthSuspense();

  // ── read: shared query factory ─────────────────────────────────────
  const query = useQuery(patientDevelopmentQuery(patientId));

  // ── mutation: shared hook ──────────────────────────────────────────
  const mutation = useSetMilestoneAchievedMutation(patientId);

  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string | null>(null);

  const selected = React.useMemo(() => {
    if (!query.data || !selectedMilestoneId) return null;
    return query.data.milestones.find((m) => m.id === selectedMilestoneId) ?? null;
  }, [query.data, selectedMilestoneId]);

  if (query.isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SectionState
        action={
          <Button nativeButton={false} render={<Link to="/app/patients" />} variant="outline">
            Back to patients
          </Button>
        }
        description={
          query.error instanceof Error ? query.error.message : "This patient could not be found."
        }
        icon={Icons.alertCircle}
        title="Patient Not Found"
      />
    );
  }

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Development"
      />
    );
  }

  const data = query.data;
  const milestones = data.milestones;
  const correctedAge = data.correctedAgeMonths;

  // Ring data: percent achieved of *expected* per domain (bracket-appropriate).
  const ringData = DOMAIN_ORDER.map((domain) => {
    const items = milestones.filter((m) => m.domain === domain);
    const expectedItems = items.filter((m) => m.targetAgeMonths <= correctedAge);
    const achieved = expectedItems.filter((m) => m.isAchieved).length;
    const redFlags = expectedItems.filter((m) => !m.isAchieved && m.isRedFlagIfMissing).length;
    return {
      domain,
      achieved,
      expected: expectedItems.length,
      redFlags,
    };
  });

  const redFlagItems = milestones.filter((m) => {
    const s = milestoneStatus(m, correctedAge);
    return s === "red-flag";
  });

  const ageLabel =
    data.ageMonths >= 24
      ? `${(data.ageMonths / 12).toFixed(1)} years`
      : `${data.ageMonths.toFixed(1)} months`;
  const correctedLabel = data.isPreterm
    ? `Corrected: ${correctedAge.toFixed(1)} months (born ${data.weeksPremature}w early)`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Button
        className="w-fit"
        nativeButton={false}
        render={
          <Link
            params={{ patientId }}
            search={{ tab: "development" }}
            to="/app/patients/$patientId"
          />
        }
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to patient
      </Button>

      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button nativeButton onClick={() => window.print()} variant="outline">
              <Printer aria-hidden="true" />
              Print checklist
            </Button>
            <Button
              nativeButton={false}
              render={
                <Link
                  params={{ patientId }}
                  search={{ tab: "development" }}
                  to="/app/patients/$patientId"
                />
              }
              variant="outline"
            >
              <Stethoscope aria-hidden="true" />
              Open chart
            </Button>
          </div>
        }
        description={`${ageLabel} · ${
          data.isPreterm ? "corrected age for preterm" : "chronological age"
        } · Next check-up: ${data.nextCheckupMonths} months`}
        title={`${data.patient.firstName} ${data.patient.lastName}`}
      />

      {redFlagItems.length > 0 && (
        <RedFlagBanner
          items={redFlagItems}
          patientId={patientId}
          patientName={`${data.patient.firstName} ${data.patient.lastName}`}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Milestone timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-3">
            <MilestoneTimeline
              correctedAgeMonths={correctedAge}
              milestones={milestones}
              onSelect={setSelectedMilestoneId}
              selectedId={selectedMilestoneId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress by domain</CardTitle>
          </CardHeader>
          <CardContent>
            <DomainRings data={ringData} />
            {correctedLabel && (
              <p className="text-muted-foreground mt-3 text-xs">{correctedLabel}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Side inspector */}
      <Sheet
        onOpenChange={(open) => {
          if (!open) setSelectedMilestoneId(null);
        }}
        open={Boolean(selected)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md" side="right">
          {selected && (
            <MilestoneInspector
              milestone={selected}
              onClose={() => setSelectedMilestoneId(null)}
              onSave={(values) =>
                mutation.mutate(
                  {
                    data: {
                      patientId,
                      milestoneId: selected.id,
                      ...values,
                    },
                  },
                  {
                    onSuccess: () => {
                      // Sheet stays open — the user may want to
                      // record follow-up notes. Query refresh
                      // re-renders it with the saved state.
                    },
                    onError: (err) => {
                      toast.add({
                        type: "destructive",
                        description:
                          err instanceof Error ? err.message : "Could not update milestone.",
                      });
                    },
                  },
                )
              }
              saving={mutation.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Print-only checklist */}
      <PrintChecklist
        ageLabel={ageLabel}
        milestones={milestones}
        patientName={`${data.patient.firstName} ${data.patient.lastName}`}
      />
    </div>
  );
}

// ── Sub-components (unchanged) ─────────────────────────────────────────

function RedFlagBanner({
  items,
  patientName,
  patientId,
}: {
  items: readonly PatientMilestone[];
  patientName: string;
  patientId: string;
}) {
  const [open, setOpen] = React.useState(false);

  const referralDraft = React.useMemo(
    () =>
      [
        "Referral — Developmental delay screening",
        "",
        `Patient: ${patientName} (${patientId})`,
        "",
        "The following critical milestones are past their expected age and not yet achieved:",
        ...items.map((m) => `• ${m.title} (${m.ageLabel}) — ${m.description}`),
        "",
        "Recommend referral to a developmental pediatrician for formal assessment.",
      ].join("\n"),
    [items, patientId, patientName],
  );

  return (
    <div className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4">
      <AlertTriangle aria-hidden="true" className="text-destructive mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-destructive text-sm font-semibold">
          {items.length} critical milestone{items.length > 1 ? "s" : ""} not achieved
        </p>
        <ul className="text-destructive/90 mt-1 space-y-0.5 text-xs">
          {items.map((m) => (
            <li key={m.id}>
              · {m.title} ({m.ageLabel})
            </li>
          ))}
        </ul>
      </div>
      <Button nativeButton onClick={() => setOpen(true)} size="sm" variant="destructive">
        <FileText aria-hidden="true" />
        Refer to specialist
      </Button>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="w-full sm:max-w-lg" side="right">
          <SheetHeader>
            <SheetTitle>Referral draft</SheetTitle>
            <SheetDescription>
              Pre-filled note you can copy into the patient's chart or email to a specialist.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Label htmlFor="referral-body">Referral text</Label>
            <Textarea
              className="min-h-64 font-mono text-xs"
              id="referral-body"
              readOnly
              value={referralDraft}
            />
            <Button
              nativeButton
              onClick={async () => {
                await navigator.clipboard.writeText(referralDraft);
                toast.add({
                  type: "success",
                  description: "Referral copied to clipboard.",
                });
                setOpen(false);
              }}
            >
              Copy referral
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MilestoneInspector({
  milestone,
  onSave,
  onClose,
  saving,
}: {
  milestone: PatientMilestone;
  onSave: (values: {
    isAchieved: boolean;
    achievedDate?: string | null;
    notes?: string | null;
  }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [isAchieved, setIsAchieved] = React.useState(milestone.isAchieved);
  const [achievedDate, setAchievedDate] = React.useState(
    milestone.achievedDate ?? new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = React.useState(milestone.notes ?? "");

  const meta = DOMAIN_META[milestone.domain as MilestoneDomain];

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] ${meta.bg} ${meta.text}`} variant="secondary">
            {meta.label}
          </Badge>
          {milestone.isRedFlagIfMissing && (
            <Badge className="text-destructive border-destructive/40 text-[10px]" variant="outline">
              Critical
            </Badge>
          )}
        </div>
        <SheetTitle>{milestone.title}</SheetTitle>
        <SheetDescription>Expected by {milestone.ageLabel}</SheetDescription>
      </SheetHeader>

      <p className="text-muted-foreground mt-3 text-sm">{milestone.description}</p>

      <div className="mt-6 flex flex-col gap-4">
        <button
          aria-pressed={isAchieved}
          className={`flex items-center justify-between rounded-md border p-3 text-sm transition-colors ${
            isAchieved
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-border hover:bg-muted/50"
          }`}
          onClick={() => setIsAchieved((prev) => !prev)}
          type="button"
        >
          <span className="font-medium">Achieved</span>
          {isAchieved ? (
            <Check aria-hidden="true" className="size-4 text-emerald-600" strokeWidth={3} />
          ) : (
            <span className="text-muted-foreground text-xs">Not yet</span>
          )}
        </button>

        {isAchieved && (
          <div className="grid gap-2">
            <Label htmlFor="achieved-date">Date achieved</Label>
            <Input
              id="achieved-date"
              onChange={(e) => setAchievedDate(e.target.value)}
              type="date"
              value={achievedDate}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="milestone-notes">Notes</Label>
          <Textarea
            id="milestone-notes"
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context, observation, follow-up plan…"
            rows={3}
            value={notes}
          />
        </div>
      </div>

      <div className="mt-auto flex gap-2 pt-6">
        <Button className="flex-1" onClick={onClose} type="button" variant="outline">
          Close
        </Button>
        <Button
          className="flex-1"
          disabled={saving}
          onClick={() =>
            onSave({
              isAchieved,
              achievedDate: isAchieved ? achievedDate : null,
              notes: notes.trim() || null,
            })
          }
          type="button"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
```

`_auth/app/development/index.tsx`:

```tsx
// routes/_auth/app/development/index.tsx
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { MilestoneChecklist } from "#/features/development";

export const Route = createFileRoute("/_auth/app/development/")({
  component: DevelopmentPage,
});

function DevelopmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="WHO/CDC-aligned developmental screening milestones by age bracket."
        title="Developmental Milestones"
      />
      <Card>
        <CardContent className="pt-6">
          <MilestoneChecklist />
        </CardContent>
      </Card>
    </div>
  );
}
```

`_auth/app/immunizations/$patientId.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, CircleAlertIcon, CircleIcon, PrinterIcon } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/blocks/page-header";
import { Section } from "@/components/blocks/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
// ── reads: query factory ───────────────────────────────────────────────
import {
  patientImmunizationsQuery,
  useRecordImmunizationMutation,
} from "@/features/immunizations/queries";
// ── types ──────────────────────────────────────────────────────────────
import type { PatientVaccinationRecord } from "@/features/immunizations/types";

export const Route = createFileRoute("/_auth/app/immunizations/$patientId")({
  component: PatientImmunizationsPage,
});

const TARGET_AGE_GROUPS = [0, 2, 4, 6, 9, 12, 18, 60] as const;

function PatientImmunizationsPage() {
  const { patientId } = Route.useParams();
  const [active, setActive] = useState<PatientVaccinationRecord | null>(null);

  // ── read: shared query factory ─────────────────────────────────────
  const query = useQuery(patientImmunizationsQuery(patientId));

  // ── mutation: shared hook ──────────────────────────────────────────
  const mutation = useRecordImmunizationMutation();

  if (query.isLoading) return <Skeleton className="h-96 w-full" />;

  if (query.isError) {
    return (
      <PageHeader
        description={query.error instanceof Error ? query.error.message : "Failed to load."}
        title="Immunizations"
      />
    );
  }

  const records = query.data ?? [];
  const grouped = new Map<number, PatientVaccinationRecord[]>();
  for (const r of records) {
    const bucket = TARGET_AGE_GROUPS.find((g) => g >= r.targetAgeMonths) ?? 60;
    const list = grouped.get(bucket) ?? [];
    list.push(r);
    grouped.set(bucket, list);
  }

  // The record form needs a closure over `active`. Building the payload
  // here (rather than inside the form component) keeps the form dumb.
  const submitRecord = (formValues: { date: string; lot: string; site: string; notes: string }) => {
    if (!active) return;
    mutation.mutate(
      {
        data: {
          patientId,
          vaccineKey: active.vaccineKey,
          vaccineName: active.name,
          doseNumber: active.doseNumber,
          targetAgeMonths: active.targetAgeMonths,
          administeredDate: new Date(formValues.date),
          lotNumber: formValues.lot || null,
          site: formValues.site || null,
          notes: formValues.notes || null,
        },
      },
      {
        onSuccess: () => {
          toast.add({ type: "success", description: "Vaccine recorded" });
          setActive(null);
        },
        onError: (err) => {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to record",
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button onClick={() => window.print()} variant="outline">
            <PrinterIcon aria-hidden="true" />
            Print schedule
          </Button>
        }
        description={`Immunization history and upcoming doses for patient ${patientId}.`}
        title="Immunization schedule"
      />

      <div className="relative">
        <div aria-hidden="true" className="bg-border absolute inset-y-0 left-3 w-px" />
        <div className="flex flex-col gap-6">
          {[...grouped.entries()]
            .sort(([a], [b]) => a - b)
            .map(([ageMonths, items]) => (
              <section className="relative pl-9" key={ageMonths}>
                <span
                  aria-hidden="true"
                  className="bg-background ring-border absolute top-1.5 left-1.5 grid size-3 place-items-center rounded-full ring-2"
                />
                <Section title={ageLabel(ageMonths)}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((v) => (
                      <VaccineCard
                        key={`${v.vaccineKey}-${v.doseNumber}`}
                        onRecord={() => setActive(v)}
                        record={v}
                      />
                    ))}
                  </div>
                </Section>
              </section>
            ))}
        </div>
      </div>

      <Dialog onOpenChange={(open) => !open && setActive(null)} open={Boolean(active)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record administration</DialogTitle>
            <DialogDescription>
              {active?.name} — dose {active?.doseNumber}
            </DialogDescription>
          </DialogHeader>
          {active && (
            <RecordForm
              isPending={mutation.isPending}
              onCancel={() => setActive(null)}
              onSubmit={submitRecord}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components (unchanged) ──────────────────────────────────────────

function VaccineCard({
  record,
  onRecord,
}: {
  record: PatientVaccinationRecord;
  onRecord: () => void;
}) {
  const status =
    record.status === "given"
      ? { Icon: CheckIcon, label: "Given", variant: "success" as const }
      : record.status === "overdue"
        ? {
            Icon: CircleAlertIcon,
            label: "Overdue",
            variant: "destructive" as const,
          }
        : { Icon: CircleIcon, label: "Due", variant: "warning" as const };

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium">{record.name}</span>
        <span className="text-muted-foreground truncate text-xs">{record.diseaseTarget}</span>
        <Badge variant={status.variant}>
          <status.Icon aria-hidden="true" className="size-3" />
          {status.label}
        </Badge>
      </div>
      {record.status !== "given" && (
        <Button onClick={onRecord} size="sm" variant="outline">
          Record
        </Button>
      )}
    </div>
  );
}

function RecordForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (v: { date: string; lot: string; site: string; notes: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lot, setLot] = useState("");
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ date, lot, site, notes });
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor="rec-date">Date</Label>
        <Input
          id="rec-date"
          onChange={(e) => setDate(e.target.value)}
          required
          type="date"
          value={date}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="rec-lot">Lot / batch</Label>
        <Input
          id="rec-lot"
          onChange={(e) => setLot(e.target.value)}
          placeholder="e.g. AB1234X"
          value={lot}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="rec-site">Site</Label>
        <Input
          id="rec-site"
          onChange={(e) => setSite(e.target.value)}
          placeholder="Anterolateral thigh, deltoid…"
          value={site}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="rec-notes">Notes</Label>
        <Input
          id="rec-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          value={notes}
        />
      </div>
      <DialogFooter>
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving…" : "Record"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ageLabel(months: number): string {
  if (months === 0) return "Birth";
  if (months < 12) return `${months} months`;
  if (months === 12) return "12 months";
  if (months === 18) return "18 months";
  return "5 years";
}
```

`_auth/app/immunizations/index.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "@/components/blocks/page-header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CoverageStrip } from "@/features/immunizations/components/CoverageStrip";
import { ImmunizationMatrix } from "@/features/immunizations/components/ImmunizationMatrix";
// ── read: query factory from queries.ts ────────────────────────────────
import { immunizationCoverageQuery } from "@/features/immunizations/queries";
import { useAuthSuspense } from "@/lib/auth/hooks";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const IMMUNIZATIONS_PATH = "/app/immunizations" as const;

const AGE_BRACKETS = [
  { value: "0-6", label: "0–6m" },
  { value: "6-12", label: "6–12m" },
  { value: "12-24", label: "12–24m" },
  { value: ">24", label: ">24m" },
] as const;

const searchSchema = z.object({
  age: z.enum(["0-6", "6-12", "12-24", ">24"]).optional(),
  overdue: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/_auth/app/immunizations/")({
  validateSearch: searchSchema,
  component: ImmunizationRegisterPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function ImmunizationRegisterPage() {
  const { user } = useAuthSuspense();
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Clinic id is possibly null while auth resolves. Hooks must still run
  // unconditionally — the query is gated with `enabled`, not by an early
  // return before the hook.
  const clinicId = user?.clinicId ?? null;

  // Shared coverage query — same key as every other caller, so
  // `invalidateImmunizationCaches` from the record-immunization mutation
  // refreshes this automatically.
  const coverageQ = useQuery({
    ...immunizationCoverageQuery(clinicId ?? ""),
    enabled: Boolean(clinicId),
  });

  // Centralized search update — one place to reason about what's in the URL.
  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    void navigate({
      search: (prev) => {
        const next = { ...prev, ...patch };
        // Drop false / undefined so the URL stays clean and the
        // "on" state is encoded as presence, not a value.
        for (const key of Object.keys(next) as (keyof typeof next)[]) {
          if (next[key] === false || next[key] === undefined) {
            delete next[key];
          }
        }
        return next;
      },
      to: IMMUNIZATIONS_PATH,
    });
  };

  // ── Deferred render for the "no clinic" case ───────────────────────────
  //
  // This used to be a `return` before `useQuery`, which broke the rules
  // of hooks. Moving it after all hooks run keeps the hook order stable
  // and lets the page render the same hooks in every render pass.

  if (!user) {
    // Auth is still resolving. A skeleton prevents a flash of "no clinic".
    return <PageHeader description="Loading…" title="Immunizations" />;
  }

  if (!clinicId) {
    return (
      <PageHeader description="No clinic is assigned to your account." title="Immunizations" />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Clinic-wide immunization coverage and per-patient status."
        title="Immunizations"
      />

      <CoverageStrip data={coverageQ.data} isLoading={coverageQ.isLoading} />

      <div className="bg-background/95 sticky top-0 z-20 -mx-6 space-y-3 border-b px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div aria-label="Filter by age bracket" className="flex flex-wrap gap-1" role="group">
            <AgeChip
              active={!search.age}
              label="All ages"
              onClick={() => setSearch({ age: undefined })}
            />
            {AGE_BRACKETS.map((bracket) => (
              <AgeChip
                active={search.age === bracket.value}
                key={bracket.value}
                label={bracket.label}
                onClick={() => setSearch({ age: bracket.value })}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(search.overdue)}
              id="only-overdue"
              onCheckedChange={(v) => setSearch({ overdue: v || undefined })}
            />
            <Label className="text-xs" htmlFor="only-overdue">
              Only overdue
            </Label>
          </div>
        </div>
      </div>

      <ImmunizationMatrix
        ageBracket={search.age}
        clinicId={clinicId}
        onlyOverdue={Boolean(search.overdue)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ─────────────────────────────────────────────────────────────────────────────

function AgeChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium"
          : "bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-3 py-1 text-xs font-medium"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
```

`_auth/app/index.tsx`:

```tsx
import type { LinkProps } from "@tanstack/react-router";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  RulerIcon,
  SyringeIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { Suspense } from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { StatCard, StatCardSkeleton } from "#/components/blocks/stat-card.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardDescription, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { AppointmentsTable } from "#/features/appointments/components/AppointmentsTable.tsx";
import { useClinicPulse } from "#/features/dashboard/use-clinic-pulse.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { RecentGrowthCard } from "@/features/dashboard/components/RecentGrowthCard";
import { RecentGrowthSkeleton } from "@/features/dashboard/components/RecentGrowthSkeleton";
export const Route = createFileRoute("/_auth/app/")({
  component: DashboardPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type NavCard = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: LinkProps["to"];
  actionLabel: string;
};

type QuickAction = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: LinkProps["to"];
};

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const NAV_CARDS: NavCard[] = [
  {
    title: "Patients",
    description: "Manage pediatric patient profiles, medical histories, and growth charts.",
    icon: UsersIcon,
    to: "/app/patients",
    actionLabel: "View Patients",
  },
  {
    title: "Appointments",
    description: "Schedule consultations and manage daily clinic appointments.",
    icon: CalendarClockIcon,
    to: "/app/appointments",
    actionLabel: "View Schedule",
  },
  {
    title: "Visits",
    description: "Review physical exams, diagnoses, and outpatient visit notes.",
    icon: ClipboardListIcon,
    to: "/app/visits",
    actionLabel: "View Visits",
  },
  {
    title: "Prescriptions & Dosing",
    description: "Calculate pediatric drug dosages and manage active medications.",
    icon: SyringeIcon,
    to: "/app/prescriptions/neonatal-dose-calculator",
    actionLabel: "Dosing Calculator",
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "New Patient",
    description: "Register a new pediatric patient",
    icon: UserPlusIcon,
    to: "/app/patients/new",
  },
  {
    label: "Growth Measurement",
    description: "Log height, weight, and head circumference",
    icon: RulerIcon,
    to: "/app/patients/$patientId/measurements/new",
  },
  {
    label: "Dose Calculator",
    description: "Pediatric drug dosing by weight",
    icon: SyringeIcon,
    to: "/app/prescriptions/neonatal-dose-calculator",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user } = useAuthSuspense();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        description="Pediatric clinic overview, quick navigation, and today's schedule."
        title={user?.name ? `Welcome back, ${user.name}` : "Clinic Dashboard"}
      />

      {/* ── Clinic Pulse ───────────────────────────────────────── */}
      <section aria-label="Clinic overview">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <ClinicPulse clinicId={user?.clinicId ?? undefined} />
        </Suspense>
      </section>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <section aria-labelledby="quick-actions-heading">
        <div className="mb-3">
          <h2 className="text-sm font-semibold tracking-tight" id="quick-actions-heading">
            Quick Actions
          </h2>
          <p className="text-muted-foreground text-xs">Common tasks — one click away.</p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.to}>
              <QuickActionButton action={action} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Navigation Cards ───────────────────────────────────── */}
      <section aria-labelledby="navigation-heading">
        <h2 className="sr-only" id="navigation-heading">
          Navigation
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NAV_CARDS.map((card) => (
            <li key={card.to}>
              <NavCardItem card={card} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Today's Appointments ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="todays-appointments-heading" className="lg:col-span-2">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight" id="todays-appointments-heading">
                Today's Appointments
              </h2>
              <p className="text-muted-foreground text-sm">Scheduled consultations for today.</p>
            </div>
            <Button
              nativeButton={false}
              render={<Link to="/app/appointments" />}
              size="sm"
              variant="outline"
            >
              <span>All Appointments</span>
              <ArrowRightIcon className="ml-1.5 size-3.5" />
            </Button>
          </div>
          <AppointmentsTable clinicId={user?.clinicId ?? undefined} />
        </section>
        <Suspense fallback={<RecentGrowthSkeleton />}>
          <RecentGrowthCard clinicId={user?.clinicId ?? undefined} />
        </Suspense>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ClinicPulse({ clinicId }: { clinicId: string | undefined }) {
  const { data: stats } = useClinicPulse(clinicId);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          icon={stat.icon}
          key={stat.label}
          label={stat.label}
          sub={stat.sub}
          tone={stat.tone}
          value={stat.value}
        />
      ))}
    </div>
  );
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link
      aria-label={`${action.label} — ${action.description}`}
      className="group bg-primary/5 hover:bg-primary/10 border-primary/10 hover:border-primary/30 focus-visible:ring-ring flex items-center gap-3 rounded-lg border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      to={action.to}
    >
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{action.label}</span>
        <span className="text-muted-foreground block truncate text-xs">{action.description}</span>
      </span>
      <ArrowRightIcon className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
    </Link>
  );
}

function NavCardItem({ card }: { card: NavCard }) {
  const Icon = card.icon;
  return (
    <Card className="flex h-full flex-col justify-between" size="sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
            <Icon className="size-4" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-normal normal-case">
            {card.title}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">{card.description}</CardDescription>
      </CardHeader>
      <div className="p-4 pt-0">
        <Button
          className="w-full justify-between gap-1 text-xs"
          nativeButton={false}
          render={<Link to={card.to} />}
          size="xs"
          variant="outline"
        >
          <span>{card.actionLabel}</span>
          <ArrowRightIcon className="size-3" />
        </Button>
      </div>
    </Card>
  );
}
```

`_auth/app/patients/$patientId.tsx`:

```tsx
// routes/_auth/app/patients/$patientId.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { RouteError } from "#/components/blocks/route-error.tsx";
import { Section } from "#/components/blocks/section.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { InfoRow } from "#/components/ui/info-row.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import {
  AppointmentForm,
  AppointmentsTable,
  DiagnosisTable,
  ImmunizationCard,
  MilestoneChecklist,
  PatientGrowthPanel,
  PrescriptionTable,
  VisitForm,
  VisitsTable,
} from "#/features/index.ts";
import { patientHistoryQuery } from "#/features/patients/queries.ts";
import { patientVisitsQuery } from "#/features/visits/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { Icons } from "@/components/icons";

// ─── Route ────────────────────────────────────────────────────────────────
//
// `ensureQueryData` is deprecated in this version of TanStack Router.
// `fetchQuery` is the supported replacement: it awaits the query, honors
// `staleTime`, and — critically — does NOT re-fetch when the query is
// already fresh in the cache. Behavior is identical for our purposes:
// the loader resolves with the cache primed, and the component's
// `useQuery` reads from cache on the first render.

export const Route = createFileRoute("/_auth/app/patients/$patientId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.query(patientHistoryQuery(params.patientId)),
      context.queryClient.query(patientVisitsQuery(params.patientId)),
    ]),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string | undefined) ?? "overview",
  }),
  component: PatientLayout,
  errorComponent: ({ error, reset }) => (
    <RouteError
      kind="unknown"
      message={errorMessage(error)}
      onRetry={reset}
      title="Couldn't load this patient"
    />
  ),
  pendingComponent: () => <PatientDetailSkeleton />,
});

// ─── Page ─────────────────────────────────────────────────────────────────

function PatientLayout() {
  const { patientId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  const patientQ = useQuery(patientHistoryQuery(patientId));
  const visitsQ = useQuery(patientVisitsQuery(patientId));

  // Safety-critical: never render a partial chart while the primary
  // record is unresolved.
  if (patientQ.isPending) return <PatientDetailSkeleton />;
  if (patientQ.isError) {
    return (
      <RouteError
        kind="unknown"
        message={errorMessage(patientQ.error)}
        onRetry={() => patientQ.refetch()}
        title="Couldn't load this patient"
      />
    );
  }
  if (!patientQ.data) return <RouteNotFound title="Patient not found" />;

  const patient = patientQ.data;
  const visits = visitsQ.data ?? [];
  const latestVisit = visits[0];

  // Hooks must be called unconditionally.
  const ageMonths = useMemo(() => {
    if (!patient.dateOfBirth) return undefined;
    const days = (Date.now() - new Date(`${patient.dateOfBirth}T00:00:00Z`).getTime()) / 86_400_000;
    return days / 30.4375;
  }, [patient.dateOfBirth]);

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Patient"
      />
    );
  }

  const clinicId = user.clinicId;

  return (
    <div aria-busy={visitsQ.isFetching} className="flex flex-col gap-6">
      {visitsQ.isError && (
        <InlineBanner tone="warning">
          Visits failed to refresh. Showing last loaded data.{" "}
          <button
            className="underline underline-offset-2"
            onClick={() => void visitsQ.refetch()}
            type="button"
          >
            Retry
          </button>
        </InlineBanner>
      )}

      <Button
        className="w-fit"
        nativeButton={false}
        render={<Link to="/app/patients" />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to patients
      </Button>

      <PageHeader
        actions={
          <>
            <VisitForm clinicId={clinicId} patientId={patientId} />
            <AppointmentForm clinicId={clinicId} patientId={patientId} />
            <Button
              nativeButton={false}
              render={
                <Link params={{ patientId }} search={{ tab }} to="/app/patients/$patientId/edit" />
              }
              variant="outline"
            >
              <PencilIcon aria-hidden="true" />
              Edit
            </Button>
          </>
        }
        description={`MRN ${patient.mrn} · ${patient.sex} · ${
          ageMonths != null ? `${ageMonths.toFixed(1)} months` : "—"
        }`}
        title={`${patient.firstName} ${patient.lastName}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <InfoRow label="Date of birth" value={patient.dateOfBirth} />
          <InfoRow label="Parent" value={patient.parentName} />
          <InfoRow label="Phone" value={patient.phone ?? patient.parentPhone} />
          <InfoRow label="Address" value={patient.address} />
          <InfoRow label="Allergies" value={patient.allergies} />
          <InfoRow label="Notes" value={patient.notes} />
        </CardContent>
      </Card>

      <Tabs
        onValueChange={(next) => {
          void navigate({
            to: "/app/patients/$patientId",
            params: { patientId },
            search: { tab: next },
          });
        }}
        value={tab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientGrowthPanel
                  currentX={latestVisit?.ageMonths}
                  latestAgeMonths={latestVisit?.ageMonths}
                  latestVisitId={latestVisit?.id}
                  patientId={patientId}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Latest visit</CardTitle>
              </CardHeader>
              <CardContent>
                {latestVisit ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow
                      label="Date"
                      value={new Date(latestVisit.visitedAt).toLocaleString("en-US")}
                    />
                    <InfoRow label="Age" value={`${latestVisit.ageMonths.toFixed(1)} months`} />
                    <InfoRow label="Doctor" value={latestVisit.doctorId ?? null} />
                    <Button
                      nativeButton={false}
                      render={
                        <Link params={{ visitId: latestVisit.id }} to="/app/visits/$visitId" />
                      }
                      variant="outline"
                    >
                      View encounter
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No visits recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <Section
            action={<VisitForm clinicId={clinicId} patientId={patientId} />}
            title="Visit history"
          >
            <VisitsTable visits={visits} />
          </Section>
        </TabsContent>

        <TabsContent value="growth">
          <Card>
            <CardContent className="pt-6">
              <PatientGrowthPanel patientId={patientId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="pt-6">
                <MilestoneChecklist childAgeMonths={ageMonths ?? 0} />
              </CardContent>
            </Card>
            <Button
              className="w-fit"
              nativeButton={false}
              render={<Link params={{ patientId }} to="/app/development/$patientId" />}
              variant="outline"
            >
              Open full developmental tracker
              <Icons.chevronRight aria-hidden="true" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="immunizations">
          <ImmunizationCard
            patientDob={patient.dateOfBirth}
            patientId={patientId}
            visitId={latestVisit?.id}
          />
        </TabsContent>

        <TabsContent value="diagnoses">
          {latestVisit ? (
            <DiagnosisTable page={1} size={20} visitId={latestVisit.id} />
          ) : (
            <p className="text-muted-foreground text-sm">Record a visit before adding diagnoses.</p>
          )}
        </TabsContent>

        <TabsContent value="prescriptions">
          <PrescriptionTable page={1} patientId={patientId} size={20} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTable clinicId={clinicId} />
        </TabsContent>
      </Tabs>

      <Outlet />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function InlineBanner({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200"
      : "border-sky-500/30 bg-sky-500/5 text-sky-900 dark:text-sky-200";
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs ${toneClass}`}
      role="status"
    >
      <span>{children}</span>
    </div>
  );
}

function RouteNotFound({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icons.alertCircle aria-hidden="true" className="text-muted-foreground size-8" />
      <p className="text-lg font-semibold">{title}</p>
      <Button nativeButton={false} render={<Link to="/app/patients" />} variant="outline">
        Back to patients
      </Button>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading patient record" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="space-y-1" key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="h-9 w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Turn an arbitrary error into a message safe to show a clinician.
 * Prefer the server's message when it's an Error, but never leak a
 * stack trace or an internal identifier.
 */
function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message && err.message.length < 200) {
    return err.message;
  }
  return "No changes were made. Check your connection and retry.";
}
```

`_auth/app/patients/$patientId/edit.tsx`:

```tsx
// routes/_auth/app/patients/$patientId/edit.tsx
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { toast } from "#/components/ui/toast.tsx";

// ── reads + mutations ────────────────────────────────────────────────
import { getPatientQueryOptions, useUpdatePatientMutation } from "#/features/patients/queries";

import { useAuthSuspense } from "#/lib/auth/hooks.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_TABS = new Set([
  "overview",
  "visits",
  "growth",
  "immunizations",
  "development",
  "diagnoses",
  "prescriptions",
  "appointments",
]);

const searchSchema = z.object({
  tab: z
    .string()
    .optional()
    .transform((v) => (v && KNOWN_TABS.has(v) ? v : "overview")),
});

export const Route = createFileRoute("/_auth/app/patients/$patientId/edit")({
  validateSearch: searchSchema,
  component: EditPatientPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  phone: z.string().trim().max(32).or(z.literal("")),
  address: z.string().trim().max(500).or(z.literal("")),
  parentName: z.string().trim().max(120).or(z.literal("")),
  allergies: z.string().trim().max(500).or(z.literal("")),
});

type EditFormValues = z.infer<typeof editSchema>;

function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function EditPatientPage() {
  const { patientId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  const backToPatient = React.useCallback(() => {
    void navigate({
      to: "/app/patients/$patientId",
      params: { patientId },
      search: { tab },
    });
  }, [navigate, patientId, tab]);

  if (!user?.clinicId) {
    return <PageHeader description="No clinic is assigned to your account." title="Edit Patient" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button nativeButton onClick={backToPatient} variant="outline">
            Cancel
          </Button>
        }
        description={`Patient ID ${patientId}`}
        title="Edit Patient"
      />
      <Card>
        <CardContent className="pt-6">
          <PatientEditFields
            clinicId={user.clinicId}
            onDone={backToPatient}
            patientId={patientId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fields loader
// ─────────────────────────────────────────────────────────────────────────────

function PatientEditFields({
  patientId,
  clinicId,
  onDone,
}: {
  patientId: string;
  clinicId: string;
  onDone: () => void;
}) {
  const patientQuery = useQuery(getPatientQueryOptions(patientId));

  if (patientQuery.isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (patientQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-destructive text-sm font-medium">
          {patientQuery.error instanceof Error
            ? patientQuery.error.message
            : "Could not load patient."}
        </p>
        <Button onClick={() => void patientQuery.refetch()} size="sm" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!patientQuery.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground text-sm">This patient no longer exists.</p>
        <Button onClick={onDone} size="sm" variant="outline">
          Back to patients
        </Button>
      </div>
    );
  }

  return <PatientEditForm clinicId={clinicId} onDone={onDone} patient={patientQuery.data} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

interface EditablePatient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  allergies?: string | null;
}

function PatientEditForm({
  patient,
  clinicId,
  onDone,
}: {
  patient: EditablePatient;
  clinicId: string;
  onDone: () => void;
}) {
  const updateMutation = useUpdatePatientMutation({
    patientId: patient.id,
    clinicId,
  });

  const form = useForm({
    defaultValues: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      parentName: patient.parentName ?? "",
      allergies: patient.allergies ?? "",
    },
    validators: { onSubmit: editSchema },
    onSubmit: async ({ value }) => {
      const trimmed: EditFormValues = {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        phone: value.phone.trim(),
        address: value.address.trim(),
        parentName: value.parentName.trim(),
        allergies: value.allergies.trim(),
      };

      try {
        await updateMutation.mutateAsync({
          data: {
            patientId: patient.id,
            patch: {
              firstName: trimmed.firstName,
              lastName: trimmed.lastName,
              phone: trimmed.phone || null,
              address: trimmed.address || null,
              parentName: trimmed.parentName || null,
              allergies: trimmed.allergies || null,
            },
          },
        });

        toast.add({ type: "success", description: "Patient updated" });
        onDone();
        return undefined;
      } catch (err) {
        return {
          form: err instanceof Error ? err.message : "Failed to save patient",
        };
      }
    },
  });

  const submittingRef = React.useRef(false);

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (submittingRef.current) return;
        submittingRef.current = true;
        void form.handleSubmit().finally(() => {
          submittingRef.current = false;
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="firstName">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="First name"
            >
              <Input
                autoComplete="given-name"
                id={field.name}
                maxLength={120}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="Last name"
            >
              <Input
                autoComplete="family-name"
                id={field.name}
                maxLength={120}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="parentName">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="Parent / guardian"
            >
              <Input
                autoComplete="name"
                id={field.name}
                maxLength={120}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <FieldShell
              error={fieldErrorMessage(field.state.meta.errors[0])}
              id={field.name}
              label="Phone"
            >
              <Input
                autoComplete="tel"
                id={field.name}
                inputMode="tel"
                maxLength={32}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="tel"
                value={field.state.value}
              />
            </FieldShell>
          )}
        </form.Field>
      </div>

      <form.Field name="address">
        {(field) => (
          <FieldShell
            error={fieldErrorMessage(field.state.meta.errors[0])}
            id={field.name}
            label="Address"
          >
            <Textarea
              autoComplete="street-address"
              id={field.name}
              maxLength={500}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              value={field.state.value}
            />
          </FieldShell>
        )}
      </form.Field>

      <form.Field name="allergies">
        {(field) => (
          <FieldShell
            error={fieldErrorMessage(field.state.meta.errors[0])}
            hint="Comma-separated, e.g. penicillin, peanuts"
            id={field.name}
            label="Allergies"
          >
            <Textarea
              id={field.name}
              maxLength={500}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
              value={field.state.value}
            />
          </FieldShell>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => {
          const message = fieldErrorMessage(err);
          return message ? (
            <p className="text-destructive text-sm" role="alert">
              {message}
            </p>
          ) : null;
        }}
      </form.Subscribe>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex justify-end gap-2">
            <Button disabled={isSubmitting} onClick={onDone} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small shared field shell (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              "aria-describedby"?: string;
              "aria-invalid"?: boolean;
            }>,
            {
              "aria-describedby": describedBy,
              "aria-invalid": Boolean(error),
            },
          )
        : children}
      {hint && (
        <p className="text-muted-foreground text-[11px]" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-destructive text-sm" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

`_auth/app/patients/$patientId/growth.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PatientGrowthPanel } from "#/features/index.ts";

export const Route = createFileRoute("/_auth/app/patients/$patientId/growth")({
  component: GrowthPage,
});

function GrowthPage() {
  const { patientId } = Route.useParams();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={`Longitudinal growth for patient ${patientId}.`}
        title="Growth Chart"
      />
      <Card>
        <CardContent className="pt-6">
          <PatientGrowthPanel patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

`_auth/app/patients/$patientId/measurements/new.tsx`:

```tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { MeasurementForm } from "#/features/measurements";
// ── read: query factory from patients/queries ──────────────────────────
import { getPatientForComposerQueryOptions } from "#/features/patients/queries";
import { ageInMonths } from "#/features/shared/helpers";

export const Route = createFileRoute("/_auth/app/patients/$patientId/measurements/new")({
  // `ensureQueryData` (not `query`) — otherwise the loader doesn't await
  // and `useLoaderData()` returns `undefined` on first render.
  loader: ({ context, params }) =>
    context.queryClient.query(getPatientForComposerQueryOptions(params.patientId)),
  component: NewMeasurementPage,
});

function NewMeasurementPage() {
  const patient = Route.useLoaderData();
  const navigate = useNavigate();

  if (!patient) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Patient not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This patient may have been deleted or never existed.
        </p>
        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link to="/app/patients" />}
          variant="outline"
        >
          Back to patients
        </Button>
      </div>
    );
  }

  const ageMonths = ageInMonths(new Date(patient.dateOfBirth), new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          nativeButton={false}
          render={
            <Link
              params={{ patientId: patient.id }}
              search={{ tab: "overview" }}
              to="/app/patients/$patientId"
            />
          }
          size="sm"
          variant="ghost"
        >
          <ArrowLeftIcon className="mr-1.5 size-3.5" />
          Back to {patient.firstName} {patient.lastName}
        </Button>
      </div>

      <PageHeader
        description={`Log a new growth measurement for ${patient.firstName} ${patient.lastName}.`}
        title="New Measurement"
      />

      <MeasurementForm
        ageMonths={ageMonths}
        clinicId={patient.clinicId ?? ""}
        onSuccess={() =>
          navigate({
            params: { patientId: patient.id },
            search: { tab: "growth" },
            to: "/app/patients/$patientId/growth",
          })
        }
        patientId={patient.id}
        patientSex={patient.sex}
      />
    </div>
  );
}
```

`_auth/app/patients/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { PatientForm, PatientsTable } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/patients/")({
  component: PatientsPage,
});

const DEFAULT_PAGE_SIZE = 20;

function PatientsPage() {
  const { user } = useAuthSuspense();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Patients"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <PatientForm clinicId={user.clinicId} onSuccess={() => window.location.reload()} />
        }
        description="Browse and manage the children registered at your clinic."
        title="Patients"
      />
      <PatientsTable clinicId={user.clinicId} page={1} size={DEFAULT_PAGE_SIZE} />
    </div>
  );
}
```

`_auth/app/patients/new.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PatientForm } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/patients/new")({
  component: NewPatientPage,
});

function NewPatientPage() {
  const navigate = useNavigate();
  const { user } = useAuthSuspense();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="New Patient"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button
            nativeButton={false}
            render={<a aria-label="Cancel" href="/app/patients" />}
            variant="outline"
          >
            Cancel
          </Button>
        }
        description="Register a child at your clinic."
        title="New Patient"
      />
      <Card>
        <CardContent className="pt-6">
          <PatientForm
            clinicId={user.clinicId}
            inline
            onSuccess={(patient) => {
              void navigate({
                to: "/app/patients/$patientId",
                params: { patientId: patient.id },
                search: { tab: "overview" },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

`_auth/app/prescriptions/$prescriptionId.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v4";

import { PageHeader } from "@/components/blocks/page-header";
import { toast } from "@/components/ui/toast";
// ── composer components ───────────────────────────────────────────────
import { ComposerShell } from "@/features/prescriptions/composer/components/ComposerShell";
import { computeInteractions } from "@/features/prescriptions/composer/components/interactions";
import { findComposerDrug } from "@/features/prescriptions/composer/formulary";
// ── mutations (hooks) ─────────────────────────────────────────────────
import {
  useDiscontinuePrescriptionMutation,
  useSavePrescriptionMutation,
} from "@/features/prescriptions/composer/queries";
import type { PrescriptionComposerValues } from "@/features/prescriptions/composer/types";
// ── reads ─────────────────────────────────────────────────────────────
import {
  activePrescriptionsQuery,
  getPatientForComposerQueryOptions,
  prescriptionByIdQuery,
} from "@/features/prescriptions/queries";

export const Route = createFileRoute("/_auth/app/prescriptions/$prescriptionId")({
  validateSearch: z.object({
    edit: z.coerce.boolean().optional(),
    print: z.coerce.boolean().optional(),
  }),
  component: PrescriptionDetailPage,
});

// ── helpers ─────────────────────────────────────────────────────────────

function toComposerValues(row: {
  patientId: string;
  visitId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
}): PrescriptionComposerValues {
  return {
    patientId: row.patientId,
    visitId: row.visitId,
    drugKey: "",
    medicationName: row.medicationName,
    brandName: null,
    strength: Number.parseFloat(row.dosage) || 0,
    unit: "mg",
    frequency: row.frequency,
    durationDays: row.durationDays,
    instructions: row.instructions,
    mgPerKgPerDay: null,
    dosesPerDay: null,
    weightKg: null,
    concentrationLabel: null,
  };
}

// ── page ────────────────────────────────────────────────────────────────

function PrescriptionDetailPage() {
  const { prescriptionId } = Route.useParams();
  const { edit = false, print = false } = Route.useSearch();
  const navigate = useNavigate();

  // ── reads ──────────────────────────────────────────────────────────
  const detail = useQuery(prescriptionByIdQuery(prescriptionId));
  const patientId = detail.data?.patientId;

  const patientQ = useQuery({
    ...getPatientForComposerQueryOptions(patientId ?? ""),
    enabled: Boolean(patientId),
  });

  const activeQ = useQuery({
    ...activePrescriptionsQuery(patientId ?? ""),
    enabled: Boolean(patientId),
  });

  // ── mutations ──────────────────────────────────────────────────────
  const saveMutation = useSavePrescriptionMutation();
  const discontinueMutation = useDiscontinuePrescriptionMutation();

  // ── local composer state ───────────────────────────────────────────
  const [values, setValues] = useState<PrescriptionComposerValues | null>(null);

  // Track which prescription we've initialized for, so a refetch of
  // `detail` doesn't reset the user's in-progress edits.
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    if (initializedFor.current === detail.data.id) return;
    initializedFor.current = detail.data.id;
    setValues(toComposerValues(detail.data));
  }, [detail.data]);

  // ── print effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (!print) return;
    const id = requestAnimationFrame(() => {
      window.print();
      void navigate({
        to: "/app/prescriptions/$prescriptionId",
        params: { prescriptionId },
        search: { edit: edit || undefined },
      });
    });
    return () => cancelAnimationFrame(id);
  }, [print, edit, prescriptionId, navigate]);

  // ── loading / error states ─────────────────────────────────────────
  if (detail.isPending || !values) {
    return <PageHeader description="Loading…" title="Prescription" />;
  }

  if (detail.isError || !detail.data) {
    return (
      <PageHeader
        description={
          detail.error instanceof Error ? detail.error.message : "Prescription not found."
        }
        title="Prescription"
      />
    );
  }

  if (!patientQ.data) {
    return <PageHeader description="Patient not found." title="Prescription" />;
  }

  // ── derived ────────────────────────────────────────────────────────
  const mode = edit ? "edit" : "view";

  const onChange = (next: Partial<PrescriptionComposerValues>) =>
    setValues((v) => (v ? { ...v, ...next } : v));

  const drug = values.drugKey ? findComposerDrug(values.drugKey) : undefined;
  const warnings = computeInteractions({
    drug,
    allergies: patientQ.data.allergies,
    active: (activeQ.data ?? []).filter((m) => m.id !== prescriptionId),
  });

  // ── handlers ───────────────────────────────────────────────────────
  const runSave = (shouldPrint: boolean) => {
    saveMutation.mutate(
      { ...values, prescriptionId },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            description: "Prescription updated",
          });
          void navigate({
            to: "/app/prescriptions/$prescriptionId",
            params: { prescriptionId },
            search: shouldPrint ? { print: true } : { edit: edit || undefined },
          });
        },
        onError: (err: unknown) => {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to save",
          });
        },
      },
    );
  };

  const runDiscontinue = () => {
    discontinueMutation.mutate(
      { prescriptionId },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            description: "Prescription discontinued",
          });
          void navigate({
            to: "/app/prescriptions",
            search: { status: "all", page: 1, size: 20 },
          });
        },
        onError: (err: unknown) => {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to discontinue",
          });
        },
      },
    );
  };

  // ── render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <ComposerShell
        isSaving={saveMutation.isPending}
        mode={mode}
        onChange={onChange}
        onDiscontinue={mode === "view" ? runDiscontinue : undefined}
        onSave={() => runSave(false)}
        onSaveAndPrint={() => runSave(true)}
        patient={patientQ.data}
        previous={(activeQ.data ?? []).filter((m) => m.id !== prescriptionId)}
        subtitle={`Prescription ${prescriptionId.slice(0, 8)} — ${mode === "edit" ? "editing" : "read-only"}.`}
        title={detail.data.medicationName}
        values={values}
        warnings={warnings}
      />
      <footer className="text-muted-foreground border-t pt-4 text-xs">
        <p>
          Created {new Date(detail.data.prescribedAt).toLocaleString()} · Last updated{" "}
          {new Date(detail.data.prescribedAt).toLocaleString()}
        </p>
      </footer>
    </div>
  );
}
```

`_auth/app/prescriptions/index.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  CalculatorIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  PillIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/blocks/page-header";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { FilterBar } from "@/components/tables/shared/FilterBar";
import { TablePagination } from "@/components/tables/table-pagination";
import { isPageSize, type PageSize } from "@/components/tables/table-pagination-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  type PrescriptionRegisterSearch,
  prescriptionKeys,
  prescriptionRegisterQuery,
  prescriptionRegisterSearchSchema,
} from "@/features/prescriptions";
// ── imports split into functions vs queries ──────────────────────────────
import { renewPrescriptionFn } from "@/features/prescriptions/functions";
// ─────────────────────────────────────────────────────────────────────────
import { useAuthSuspense } from "@/lib/auth/hooks";

// ── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_auth/app/prescriptions/")({
  validateSearch: (search: Record<string, unknown>): PrescriptionRegisterSearch =>
    prescriptionRegisterSearchSchema.parse(search),
  component: PrescriptionsRegisterPage,
});

// ── Row type ───────────────────────────────────────────────────────────────

type Status = "active" | "completed" | "cancelled";

type RegisterRow = {
  id: string;
  medicationName: string;
  brandName: string | null;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  status: Status;
  prescribedAt: Date;
  prescriber: { id: string; name: string } | null;
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
  } | null;
  flagsInteraction: boolean;
};

// ── Constants ───────────────────────────────────────────────────────────────

const PRESCRIBER_OPTIONS = ["All"];

const STATUS_PILLS: Array<{
  value: PrescriptionRegisterSearch["status"];
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const features = tableFeatures({ rowPaginationFeature });
const column = createColumnHelper<typeof features, RegisterRow>();

// ── Columns (unchanged) ────────────────────────────────────────────────────

const columns = column.columns([
  column.accessor("medicationName", {
    header: "Medication",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5 py-1">
        <span className="bg-muted/60 grid size-8 shrink-0 place-items-center rounded-md">
          <PillIcon aria-hidden="true" className="text-muted-foreground size-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.medicationName}</span>
          {row.original.brandName && (
            <span className="text-muted-foreground truncate text-xs">{row.original.brandName}</span>
          )}
        </div>
      </div>
    ),
  }),
  column.accessor((row) => row.patient?.lastName ?? "", {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const p = row.original.patient;
      if (!p) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold uppercase"
          >
            {p.firstName.charAt(0)}
            {p.lastName.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-col">
            <Link
              className="truncate font-medium underline-offset-4 hover:underline"
              params={{ patientId: p.id }}
              search={{ tab: "overview" }}
              to="/app/patients/$patientId"
            >
              {p.firstName} {p.lastName}
            </Link>
            <span className="text-muted-foreground truncate font-mono text-[11px] tabular-nums">
              {p.mrn}
            </span>
          </div>
        </div>
      );
    },
  }),
  column.accessor("dosage", {
    header: "Dosage",
    meta: { width: "w-28" },
    cell: (info) => (
      <span className="block truncate font-mono text-xs tabular-nums">{info.getValue()}</span>
    ),
  }),
  column.accessor("frequency", {
    header: "Frequency",
    meta: { width: "w-24" },
    cell: (info) => (
      <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor("durationDays", {
    header: "Duration",
    meta: { width: "w-24", hideOnMobile: true },
    cell: (info) => {
      const d = info.getValue();
      return (
        <span className="text-muted-foreground block font-mono text-xs tabular-nums">
          {d == null ? "Ongoing" : `${d}d`}
        </span>
      );
    },
  }),
  column.accessor((row) => row.prescriber?.name ?? "", {
    id: "prescriber",
    header: "Prescriber",
    meta: { width: "w-40", hideOnMobile: true },
    cell: (info) => (
      <span className="text-muted-foreground block truncate">{info.getValue() || "—"}</span>
    ),
  }),
  column.accessor("prescribedAt", {
    header: "Prescribed",
    meta: { width: "w-32" },
    cell: (info) => {
      const d = new Date(info.getValue());
      return (
        <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
          {Number.isNaN(d.getTime()) ? "—" : DATE_FMT.format(d)}
        </span>
      );
    },
  }),
]);

const COLUMN_LAYOUT = [
  {},
  {},
  { width: "w-28" },
  { width: "w-24" },
  { width: "w-24", hideOnMobile: true },
  { width: "w-40", hideOnMobile: true },
  { width: "w-32" },
] as const;

// ── Page ────────────────────────────────────────────────────────────────────

function PrescriptionsRegisterPage() {
  const { user } = useAuthSuspense();
  const search = Route.useSearch();
  const navigate = useNavigate();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Prescriptions"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PrescriptionsHeader clinicId={user.clinicId} search={search} />
      <PrescriptionsFilterBar
        onChange={(next) => void navigate({ search: next as never, to: "/app/prescriptions" })}
        search={search}
      />
      <PrescriptionsTable clinicId={user.clinicId} search={search} />
    </div>
  );
}

// ── Header with KPI chips ──────────────────────────────────────────────────

function PrescriptionsHeader({
  clinicId,
  search,
}: {
  clinicId: string;
  search: PrescriptionRegisterSearch;
}) {
  // ── KEY CHANGE: use prescriptionRegisterQuery for each KPI count ────────
  // Each call reuses the same query-options factory with a different
  // `search` shape. The factory normalizes the key so `page`/`size`
  // don't create separate cache entries.
  const activeCount = useQuery({
    ...prescriptionRegisterQuery(clinicId, {
      ...search,
      page: 1,
      size: 1,
      status: "active",
    }),
    // Override: the header only needs the count, so don't keep the full
    // row list alive longer than necessary.
    select: (data) => data.total,
  });

  const completedWeekCount = useQuery({
    ...prescriptionRegisterQuery(clinicId, {
      ...search,
      page: 1,
      size: 1,
      status: "completed",
      from: startOfWeekISO(),
    }),
    select: (data) => data.total,
  });

  // Flagged-interactions is a placeholder — no server function yet.
  const flaggedCount = 0;

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <SplitActionButton />
          </div>
        }
        description="All medications prescribed at this clinic."
        title="Prescriptions"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">
          Active&nbsp;
          <span className="font-mono tabular-nums">{activeCount.data ?? "…"}</span>
        </Badge>
        <Badge variant="secondary">
          Completed this week&nbsp;
          <span className="font-mono tabular-nums">{completedWeekCount.data ?? "…"}</span>
        </Badge>
        <Badge variant={flaggedCount > 0 ? "warning" : "outline"}>
          <CircleAlertIcon aria-hidden="true" className="size-3" />
          Flagged interactions&nbsp;
          <span className="font-mono tabular-nums">{flaggedCount}</span>
        </Badge>
      </div>
    </div>
  );
}

function SplitActionButton() {
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border">
      <Button
        className="rounded-none border-0"
        nativeButton={false}
        render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
      >
        <PlusIcon aria-hidden="true" />
        New prescription
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="More prescription actions"
              className="rounded-none border-0 border-l"
              size="icon"
              variant="default"
            />
          }
        >
          <ChevronDownIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            nativeButton={false}
            render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
          >
            <CalculatorIcon aria-hidden="true" />
            Open NICU calculator
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Filter bar (unchanged) ─────────────────────────────────────────────────

function PrescriptionsFilterBar({
  search,
  onChange,
}: {
  search: PrescriptionRegisterSearch;
  onChange: (next: PrescriptionRegisterSearch) => void;
}) {
  const [q, setQ] = useState(search.q ?? "");
  const [medication, setMedication] = useState(search.medication ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== q) onChange({ ...search, q: q || undefined, page: 1 });
    }, 250);
    return () => clearTimeout(t);
  }, [q, search, onChange]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.medication ?? "") !== medication)
        onChange({ ...search, medication: medication || undefined, page: 1 });
    }, 250);
    return () => clearTimeout(t);
  }, [medication, search, onChange]);

  const hasFilters =
    Boolean(search.q) ||
    Boolean(search.medication) ||
    Boolean(search.prescriberId) ||
    search.status !== "all" ||
    Boolean(search.from) ||
    Boolean(search.to);

  return (
    <div className="bg-background/95 sticky top-0 z-10 -mx-6 space-y-3 border-b px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          aria-label="Search patients"
          className="border-border bg-background focus-visible:border-ring h-9 rounded-md border px-3 text-sm outline-none"
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient name or MRN"
          type="search"
          value={q}
        />
        <input
          aria-label="Search medications"
          className="border-border bg-background focus-visible:border-ring h-9 rounded-md border px-3 text-sm outline-none"
          onChange={(e) => setMedication(e.target.value)}
          placeholder="Search medication or brand"
          type="search"
          value={medication}
        />
        <FilterBar
          filters={[
            {
              allLabel: "All prescribers",
              onChange: (value) =>
                onChange({
                  ...search,
                  prescriberId: value === "All" ? undefined : value,
                  page: 1,
                }),
              options: PRESCRIBER_OPTIONS,
              value: search.prescriberId ?? "All",
            },
          ]}
          hasFilters={hasFilters}
          hideSearch
          onClear={() => onChange({ ...prescriptionRegisterSearchSchema.parse({}), page: 1 })}
          onSearchChange={() => undefined}
          searchPlaceholder=""
          searchValue=""
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div aria-label="Filter by status" className="flex flex-wrap gap-1" role="group">
          {STATUS_PILLS.map((pill) => {
            const active = search.status === pill.value;
            return (
              <button
                aria-pressed={active}
                className={
                  active
                    ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                }
                key={pill.value}
                onClick={() => onChange({ ...search, status: pill.value, page: 1 })}
                type="button"
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            aria-label="Prescribed from"
            className="border-border bg-background h-8 rounded-md border px-2 text-xs"
            onChange={(e) =>
              onChange({
                ...search,
                from: e.target.value || undefined,
                page: 1,
              })
            }
            type="date"
            value={search.from ?? ""}
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            aria-label="Prescribed to"
            className="border-border bg-background h-8 rounded-md border px-2 text-xs"
            onChange={(e) => onChange({ ...search, to: e.target.value || undefined, page: 1 })}
            type="date"
            value={search.to ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────

function PrescriptionsTable({
  clinicId,
  search,
}: {
  clinicId: string;
  search: PrescriptionRegisterSearch;
}) {
  const queryClient = useQueryClient();
  const size: PageSize = isPageSize(String(search.size)) ? (search.size as PageSize) : 20;
  const page = search.page;

  // ── KEY CHANGE: use prescriptionRegisterQuery ───────────────────────────
  // Note: pass `search` as-is; the factory filters out page/size for the
  // key, but the queryFn gets the full search object (including page/size)
  // so the server returns the correct page. No manual destructuring needed.
  const query = useQuery(prescriptionRegisterQuery(clinicId, search));

  const rows = (query.data?.rows ?? []) as RegisterRow[];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / size));

  const table = useTable({
    columns,
    data: rows,
    features,
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: total,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
  });

  if (query.isError) {
    return (
      <SectionState
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            variant="outline"
          >
            {query.isFetching ? "Retrying…" : "Try Again"}
          </Button>
        }
        description={
          query.error instanceof Error ? query.error.message : "An unexpected error occurred."
        }
        icon={CircleAlertIcon}
        title="Failed to Load Prescriptions"
      />
    );
  }

  if (!query.isLoading && total === 0) {
    return <PrescriptionsEmptyState />;
  }

  const leafColumnCount = table.getAllLeafColumns().length;
  const FlexRender = table.FlexRender;

  return (
    <div className="flex flex-col gap-2">
      <Table aria-busy={query.isFetching} aria-label="Prescriptions" layout="fixed">
        <TableColGroup columns={COLUMN_LAYOUT} />
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  className="tracking-wider uppercase"
                  hideOnMobile={header.column.columnDef.meta?.hideOnMobile}
                  key={header.id}
                >
                  <FlexRender header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <RegisterRow FlexRender={FlexRender} key={row.id} queryClient={queryClient} row={row} />
          ))}
          {query.isFetching &&
            Array.from({ length: Math.min(size, 5) }, (_, i) => (
              <TableRow key={`sk-${i}`}>
                <TableCell colSpan={leafColumnCount}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="bg-background/95 sticky bottom-0 py-2 backdrop-blur max-sm:-mx-6 max-sm:px-6 max-sm:pb-[env(safe-area-inset-bottom)]">
        <TablePagination
          ariaLabel="Prescription Pages"
          page={page}
          pageCount={pageCount}
          route={Route}
          size={size}
        />
      </div>
    </div>
  );
}

function RegisterRow({
  row,
  FlexRender,
  queryClient,
}: {
  row: ReturnType<
    ReturnType<typeof useTable<typeof features, RegisterRow>>["getRowModel"]
  >["rows"][number];
  FlexRender: ReturnType<typeof useTable<typeof features, RegisterRow>>["FlexRender"];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const flags = row.original.flagsInteraction;
  return (
    <TableRow
      className={
        flags
          ? "relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-amber-500"
          : undefined
      }
    >
      {row.getAllCells().map((cell) => (
        <TableCell
          className={
            cell.column.id === "patient" || cell.column.id === "medicationName" ? "relative" : ""
          }
          hideOnMobile={cell.column.columnDef.meta?.hideOnMobile}
          key={cell.id}
        >
          {cell.column.id === "medicationName" ? (
            <div className="group/cell relative flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <FlexRender cell={cell} />
              </div>
              <RenewButton prescriptionId={row.original.id} queryClient={queryClient} />
            </div>
          ) : (
            <FlexRender cell={cell} />
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Renew mutation ─────────────────────────────────────────────────────────

function RenewButton({
  prescriptionId,
  queryClient,
}: {
  prescriptionId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  // ── KEY CHANGE: use useMutation + useServerFn instead of calling
  // the server function directly from onClick. This gives us:
  //   - isPending state for a proper loading indicator
  //   - onSuccess hook for invalidation
  //   - error handling through the standard mutation API
  const renew = useServerFn(renewPrescriptionFn);

  const mutation = useMutation({
    mutationFn: () => renew({ data: { prescriptionId } }),
    onSuccess: (newRow) => {
      toast.add({
        type: "success",
        description: `Prescription renewed${newRow?.id ? ` (${newRow.id.slice(0, 8)})` : ""}`,
      });
      // Invalidate the whole register subtree — the new row must appear.
      // The `clinic` segment isn't in this query's key, so invalidate
      // by the register prefix instead.
      void queryClient.invalidateQueries({
        queryKey: ["prescriptions", "register"],
      });
      // Also invalidate the specific prescription if anyone has it open.
      void queryClient.invalidateQueries({
        queryKey: prescriptionKeys.detail(prescriptionId),
      });
    },
    onError: (err: unknown) => {
      toast.add({
        type: "destructive",
        description: err instanceof Error ? err.message : "Failed to renew",
      });
    },
  });

  return (
    <Button
      className="opacity-0 transition-opacity group-hover/cell:opacity-100 focus-visible:opacity-100"
      disabled={mutation.isPending}
      nativeButton
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutation.mutate();
      }}
      size="xs"
      variant="ghost"
    >
      <RefreshCwIcon aria-hidden="true" className={mutation.isPending ? "animate-spin" : ""} />
      {mutation.isPending ? "Renewing…" : "Renew"}
    </Button>
  );
}

// ── Empty state (unchanged) ────────────────────────────────────────────────

function PrescriptionsEmptyState() {
  return (
    <div className="grid gap-6 rounded-xl border border-dashed p-8 md:grid-cols-[1fr_360px] md:p-10">
      <div className="flex flex-col justify-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">No prescriptions yet</h2>
          <p className="text-muted-foreground text-sm">
            Prescriptions written at this clinic will appear here, filterable by status, prescriber,
            and date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
          >
            <PlusIcon aria-hidden="true" />
            Write a prescription
          </Button>
          <Button
            nativeButton={false}
            render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
            variant="outline"
          >
            <CalculatorIcon aria-hidden="true" />
            Browse formulary
          </Button>
        </div>
      </div>

      <aside className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-4 text-sm">
        <p className="text-foreground font-semibold">Pediatric dosing, in one line</p>
        <p className="text-muted-foreground">
          Doses are weight-based (mg/kg/dose or mg/kg/day). Use the NICU calculator for neonates —
          it accounts for gestational age and renal dosing. Always round to the smallest measurable
          volume for the prepared concentration.
        </p>
        <Link
          className="text-primary text-xs font-medium underline-offset-4 hover:underline"
          to="/app/prescriptions/neonatal-dose-calculator"
        >
          Open the dosing reference →
        </Link>
      </aside>
    </div>
  );
}

// ── Helpers (unchanged) ────────────────────────────────────────────────────

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7; // Monday = 1
  d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
```

`_auth/app/prescriptions/neonatal-dose-calculator.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PediatricDosingCalculator } from "#/features/prescriptions/components/PediatricDosingCalculator.tsx";

export const Route = createFileRoute("/_auth/app/prescriptions/neonatal-dose-calculator")({
  component: NeonatalDoseCalculatorPage,
});

function NeonatalDoseCalculatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Calculate a reference dose and preparation volume without creating or saving a prescription."
        title="Neonatal dose calculator"
      />
      <Card>
        <CardContent className="pt-6">
          <PediatricDosingCalculator standalone />
        </CardContent>
      </Card>
    </div>
  );
}
```

`_auth/app/prescriptions/new.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod/v4";

import { PageHeader } from "@/components/blocks/page-header";
import { toast } from "@/components/ui/toast";
// ── composer components ───────────────────────────────────────────────
import { ComposerShell } from "@/features/prescriptions/composer/components/ComposerShell";
import { computeInteractions } from "@/features/prescriptions/composer/components/interactions";
import { findComposerDrug } from "@/features/prescriptions/composer/formulary";
// ── mutation ──────────────────────────────────────────────────────────
import { useSavePrescriptionMutation } from "@/features/prescriptions/composer/queries";
import type { PrescriptionComposerValues } from "@/features/prescriptions/composer/types";
// ── reads ─────────────────────────────────────────────────────────────
import {
  activePrescriptionsQuery,
  getPatientForComposerQueryOptions,
} from "@/features/prescriptions/queries";

export const Route = createFileRoute("/_auth/app/prescriptions/new")({
  validateSearch: z.object({
    patientId: z.uuid(),
    visitId: z.uuid(),
  }),
  component: NewPrescriptionPage,
});

const EMPTY: Omit<PrescriptionComposerValues, "patientId" | "visitId"> = {
  drugKey: "",
  medicationName: "",
  brandName: null,
  strength: 0,
  unit: "mg",
  frequency: "BID",
  durationDays: 5,
  instructions: null,
  mgPerKgPerDay: null,
  dosesPerDay: 2,
  weightKg: null,
  concentrationLabel: null,
};

function NewPrescriptionPage() {
  const { patientId, visitId } = Route.useSearch();
  const navigate = useNavigate();

  // ── reads ──────────────────────────────────────────────────────────
  const patientQ = useQuery(getPatientForComposerQueryOptions(patientId));
  const activeQ = useQuery(activePrescriptionsQuery(patientId));

  // ── mutation ───────────────────────────────────────────────────────
  const saveMutation = useSavePrescriptionMutation();

  // ── composer state ─────────────────────────────────────────────────
  const [values, setValues] = React.useState<PrescriptionComposerValues>({
    ...EMPTY,
    patientId,
    visitId,
  });

  React.useEffect(() => {
    setValues({ ...EMPTY, patientId, visitId });
  }, [patientId, visitId]);

  // Pre-fill weight from the patient record, but never clobber a value the
  // user typed. Runs once per loaded patient.
  const lastPrefilledPatientRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const weight = patientQ.data?.weightKg;
    if (!weight) return;
    if (lastPrefilledPatientRef.current === patientId) return;
    lastPrefilledPatientRef.current = patientId;
    setValues((v) => (v.weightKg == null ? { ...v, weightKg: weight } : v));
  }, [patientQ.data, patientId]);

  // ── loading / error states ─────────────────────────────────────────
  if (patientQ.isPending) {
    return <PageHeader description="Loading patient…" title="New prescription" />;
  }

  if (patientQ.isError || !patientQ.data) {
    return (
      <PageHeader
        description={
          patientQ.error instanceof Error ? patientQ.error.message : "Patient not found."
        }
        title="New prescription"
      />
    );
  }

  // ── derived ────────────────────────────────────────────────────────
  const onChange = (next: Partial<PrescriptionComposerValues>) =>
    setValues((v) => ({ ...v, ...next }));

  const interactionsUnavailable = activeQ.isError;
  const warnings = interactionsUnavailable
    ? [
        {
          severity: "amber" as const,
          title: "Interaction check unavailable",
          detail:
            "The patient's active prescriptions could not be loaded. Verify interactions manually before saving.",
        },
      ]
    : computeInteractions({
        drug: values.drugKey ? findComposerDrug(values.drugKey) : undefined,
        allergies: patientQ.data.allergies,
        active: activeQ.data ?? [],
      });

  // ── handlers ───────────────────────────────────────────────────────
  const runSave = (shouldPrint: boolean) => {
    saveMutation.mutate(values, {
      onSuccess: (row) => {
        toast.add({
          type: "success",
          description: "Prescription saved",
        });
        // Navigate first, then print from the detail page so the
        // print dialog shows the saved prescription, not the
        // composer.
        void navigate({
          to: "/app/prescriptions/$prescriptionId",
          params: { prescriptionId: row.id },
          search: shouldPrint ? { print: true } : undefined,
        });
      },
      onError: (err: unknown) => {
        toast.add({
          type: "destructive",
          description: err instanceof Error ? err.message : "Failed to save prescription",
        });
      },
    });
  };

  // ── render ─────────────────────────────────────────────────────────
  return (
    <ComposerShell
      isSaving={saveMutation.isPending}
      mode="create"
      onChange={onChange}
      onSave={() => runSave(false)}
      onSaveAndPrint={() => runSave(true)}
      patient={patientQ.data}
      previous={[]}
      subtitle="Write a new prescription. Weight, dosing, and interactions update live."
      title="New prescription"
      values={values}
      warnings={warnings}
    />
  );
}
```

`_auth/app/route.tsx`:

```tsx
// src/routes/_auth/app/route.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/blocks/app-shell-1";
import { installOutboxFlusher } from "#/features/outbox/flusher.ts";
import { ConnectionBanner } from "#/features/outbox/ui/connection-banner.tsx";
import React from "react";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  React.useEffect(() => installOutboxFlusher(), []);

  return (
    <AppShell>
      <ConnectionBanner />
      <Outlet />
    </AppShell>
  );
}
// import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
// import {
// 	CalendarClockIcon,
// 	ClipboardListIcon,
// 	LayoutDashboardIcon,
// 	MenuIcon,
// 	StethoscopeIcon,
// 	SyringeIcon,
// 	UsersIcon
// } from "lucide-react";
// import * as React from "react";

// import { SignOutButton } from "#/components/sign-out-button.tsx";
// import { ThemeToggle } from "#/components/theme-toggle.tsx";
// import { Button } from "#/components/ui/button.tsx";
// import {
// 	Sheet,
// 	SheetContent,
// 	SheetHeader,
// 	SheetTitle,
// 	SheetTrigger
// } from "#/components/ui/sheet.tsx";

// export const Route = createFileRoute("/_auth/app")({
// 	component: AppLayout
// });

// const NAV_ITEMS = [
// 	{ label: "Dashboard", icon: LayoutDashboardIcon, to: "/app" },
// 	{ label: "Patients", icon: UsersIcon, to: "/app/patients" },
// 	{ label: "Appointments", icon: CalendarClockIcon, to: "/app/appointments" },
// 	{ label: "Visits", icon: ClipboardListIcon, to: "/app/visits" },
// 	{ label: "Prescriptions", icon: SyringeIcon, to: "/app/prescriptions" },
// 	{ label: "Clinics", icon: StethoscopeIcon, to: "/app/clinics" }
// ] as const;

// function AppLayout() {
// 	const [openMobile, setOpenMobile] = React.useState(false);

// 	return (
// 		<div className='flex min-h-svh w-full bg-zinc-50/50 dark:bg-zinc-950/50'>
// 			{/* ── Sidebar (Desktop) ──────────────────────────────────────── */}
// 			<aside className='bg-background sticky top-0 hidden h-svh w-64 flex-col border-r md:flex'>
// 				<div className='flex h-14 items-center border-b px-6'>
// 					<Link
// 						className='flex items-center gap-2 font-bold tracking-tight'
// 						to='/app'
// 					>
// 						<StethoscopeIcon className='text-primary size-5' />
// 						<span>Pediatric Clinic</span>
// 					</Link>
// 				</div>
// 				<nav className='flex flex-1 flex-col gap-1 overflow-y-auto p-4'>
// 					{NAV_ITEMS.map(item => (
// 						<Link
// 							activeProps={{
// 								className: "bg-primary/10 text-primary hover:bg-primary/15"
// 							}}
// 							className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
// 							inactiveProps={{
// 								className:
// 									"text-muted-foreground hover:bg-muted/50 hover:text-foreground"
// 							}}
// 							key={item.to}
// 							to={item.to}
// 						>
// 							<item.icon className='size-4' />
// 							{item.label}
// 						</Link>
// 					))}
// 				</nav>
// 				<div className='border-t p-4'>
// 					<SignOutButton className='text-muted-foreground hover:text-foreground w-full justify-start gap-3' />
// 				</div>
// 			</aside>

// 			{/* ── Main Content Area ──────────────────────────────────────── */}
// 			<div className='flex min-w-0 flex-1 flex-col'>
// 				{/* Topbar */}
// 				<header className='bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6'>
// 					<div className='flex items-center gap-2 md:hidden'>
// 						<Sheet
// 							onOpenChange={setOpenMobile}
// 							open={openMobile}
// 						>
// 							<SheetTrigger
// 								render={
// 									<Button
// 										className='md:hidden'
// 										size='icon-sm'
// 										variant='ghost'
// 									/>
// 								}
// 							>
// 								<MenuIcon className='size-5' />
// 								<span className='sr-only'>Open navigation menu</span>
// 							</SheetTrigger>
// 							<SheetContent
// 								className='flex w-72 flex-col justify-between p-0'
// 								side='left'
// 							>
// 								<div>
// 									<SheetHeader className='border-b px-6 py-4'>
// 										<SheetTitle className='flex items-center gap-2 text-base font-bold'>
// 											<StethoscopeIcon className='text-primary size-5' />
// 											<span>Pediatric Clinic</span>
// 										</SheetTitle>
// 									</SheetHeader>
// 									<nav className='flex flex-col gap-1 p-4'>
// 										{NAV_ITEMS.map(item => (
// 											<Link
// 												activeProps={{
// 													className:
// 														"bg-primary/10 text-primary hover:bg-primary/15"
// 												}}
// 												className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
// 												inactiveProps={{
// 													className:
// 														"text-muted-foreground hover:bg-muted/50 hover:text-foreground"
// 												}}
// 												key={item.to}
// 												onClick={() => setOpenMobile(false)}
// 												to={item.to}
// 											>
// 												<item.icon className='size-4' />
// 												{item.label}
// 											</Link>
// 										))}
// 									</nav>
// 								</div>
// 								<div className='border-t p-4'>
// 									<SignOutButton className='text-muted-foreground hover:text-foreground w-full justify-start gap-3' />
// 								</div>
// 							</SheetContent>
// 						</Sheet>

// 						<Link
// 							className='flex items-center gap-2 font-bold tracking-tight'
// 							to='/app'
// 						>
// 							<StethoscopeIcon className='text-primary size-5' />
// 							<span>Pediatric Clinic</span>
// 						</Link>
// 					</div>

// 					<div className='hidden md:block'>{/* Desktop context */}</div>

// 					<div className='flex items-center gap-2'>
// 						<ThemeToggle />
// 					</div>
// 				</header>

// 				{/* Page Content */}
// 				<main className='flex-1 p-4 sm:p-6 lg:p-8'>
// 					<div className='mx-auto w-full max-w-7xl'>
// 						<Outlet />
// 					</div>
// 				</main>
// 			</div>
// 		</div>
// 	);
// }
```

`_auth/app/visits/$visitId.edit.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/blocks/page-header";
import { toast } from "@/components/ui/toast";
import { visitSnapshotQuery } from "@/features/visits/composer/queries";
import type { VisitComposerValues } from "@/features/visits/composer/schema";
import { VisitComposer } from "@/features/visits/composer/VisitComposer";
import { useDeleteVisitMutation, visitWithDetailsQuery } from "@/features/visits/queries";

export const Route = createFileRoute("/_auth/app/visits/$visitId/edit")({
  component: EditVisitPage,
});

function EditVisitPage() {
  const { visitId } = Route.useParams();
  const navigate = useNavigate();
  const deleteVisit = useDeleteVisitMutation();

  const detail = useQuery(visitWithDetailsQuery(visitId));
  const snapshotQ = useQuery({
    ...visitSnapshotQuery(detail.data?.patientId ?? ""),
    enabled: Boolean(detail.data?.patientId),
  });

  if (detail.isLoading || snapshotQ.isLoading) {
    return <PageHeader description="Loading…" title="Edit visit" />;
  }
  if (!detail.data || !snapshotQ.data) {
    return <PageHeader description="Not found." title="Edit visit" />;
  }

  const d = detail.data;
  const initial: VisitComposerValues = {
    patientId: d.patientId,
    clinicId: d.clinicId,
    doctorId: d.doctorId,
    visitedAt: new Date(d.visitedAt),
    chiefComplaint: d.chiefComplaint ?? "",
    symptoms: (d.symptoms ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as never,
    examFindings: d.physicalExam ?? "",
    template: null,
    measurements: (d.measurements ?? []).map((m) => ({
      draftId: `m-${m.id}`,
      indicator: m.indicator as never,
      value: m.value,
    })),
    diagnoses: (d.diagnoses ?? []).map((dx) => ({
      draftId: `dx-${dx.id}`,
      icdCode: dx.icdCode,
      description: dx.description,
      type: dx.type as never,
    })),
    prescriptions: (d.prescriptions ?? []).map((rx) => ({
      draftId: `rx-${rx.id}`,
      medicationName: rx.medicationName,
      dosage: rx.dosage,
      frequency: rx.frequency,
      durationDays: rx.durationDays,
      instructions: rx.instructions ?? "",
    })),
    plan: d.plan ?? "",
    followUpWeeks: 4,
  };

  return (
    <VisitComposer
      initial={initial}
      mode="edit"
      onDelete={async () => {
        try {
          await deleteVisit.mutateAsync({
            visitId,
            clinicId: d.clinicId,
            patientId: d.patientId,
          });
          toast.add({ type: "success", description: "Visit deleted" });
          void navigate({ to: "/app/visits" });
        } catch (err) {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to delete",
          });
        }
      }}
      onSuccess={() => void navigate({ to: "/app/visits/$visitId", params: { visitId } })}
      snapshot={snapshotQ.data}
      visitId={visitId}
    />
  );
}
```

`_auth/app/visits/$visitId.tsx`:

```tsx
// routes/_auth/app/visits/$visitId.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { RouteError } from "#/components/blocks/route-error.tsx";
import { Section } from "#/components/blocks/section.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { InfoRow } from "#/components/ui/info-row.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import {
  DiagnosisForm,
  DiagnosisTable,
  MeasurementForm,
  MeasurementsTable,
  PrescriptionForm,
  PrescriptionTable,
} from "#/features/index.ts";
import { visitWithDetailsQuery } from "#/features/visits/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { Icons } from "@/components/icons";

// ─── Route ────────────────────────────────────────────────────────────────
//
// `queryClient.query` isn't a thing on TanStack Router's QueryClient
// context — the deprecated-but-working method is `ensureQueryData`, and
// the supported replacement is `fetchQuery`. Use `fetchQuery` so the
// loader awaits, populates the cache, and surfaces errors to
// `errorComponent` instead of rejecting silently.

export const Route = createFileRoute("/_auth/app/visits/$visitId")({
  loader: ({ context, params }) =>
    context.queryClient.fetchQuery(visitWithDetailsQuery(params.visitId)),
  component: VisitDetailPage,
  errorComponent: ({ error, reset }) => (
    <RouteError
      kind="unknown"
      message={errorMessage(error)}
      onRetry={reset}
      title="Couldn't load this visit"
    />
  ),
  pendingComponent: () => <VisitDetailSkeleton />,
});

// ─── Page ─────────────────────────────────────────────────────────────────

function VisitDetailPage() {
  const { visitId } = Route.useParams();
  const { user } = useAuthSuspense();

  const query = useQuery(visitWithDetailsQuery(visitId));

  // Auth gate first — this is a *redirect* concern, not a data concern.
  // Note: `useAuthSuspense` already throws a redirect if not signed in,
  // so this branch only fires for signed-in users with no clinic.
  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Visit"
      />
    );
  }

  if (query.isPending) return <VisitDetailSkeleton />;

  if (query.isError || !query.data) {
    // `query.data === undefined` without `isError` means the query
    // resolved but the record doesn't exist — a genuine 404.
    if (!query.isError) {
      return <RouteNotFound title="Visit not found" />;
    }
    return (
      <RouteError
        kind="unknown"
        message={errorMessage(query.error)}
        onRetry={() => void query.refetch()}
        title="Couldn't load this visit"
      />
    );
  }

  const visit = query.data;
  const patient = visit.patient;

  return (
    <div className="flex flex-col gap-6">
      <Button
        className="w-fit"
        nativeButton={false}
        render={
          <Link
            params={{ patientId: visit.patientId }}
            search={{ tab: "visits" }}
            to="/app/patients/$patientId"
          />
        }
        size="sm"
        variant="ghost"
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to patient
      </Button>

      <PageHeader
        description={`Visit on ${new Date(visit.visitedAt).toLocaleString("en-US")}`}
        title={patient ? `${patient.firstName} ${patient.lastName}` : "Visit"}
      />

      <Card>
        <CardHeader>
          <CardTitle>Encounter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <InfoRow label="Age at visit" value={`${visit.ageMonths.toFixed(1)} months`} />
          <InfoRow label="Doctor" value={visit.doctor?.name ?? null} />
          <InfoRow label="MRN" value={patient?.mrn ?? null} />
        </CardContent>
      </Card>

      <Section
        action={
          <MeasurementForm
            patientId={visit.patientId}
            visitId={visitId}
            {...visitMeasurementCtx(visit, patient)}
          />
        }
        title="Measurements"
      >
        <MeasurementsTable
          indicator="weight-for-age"
          page={1}
          patientId={visit.patientId}
          size={10}
        />
      </Section>

      <Section action={<DiagnosisForm visitId={visitId} />} title="Diagnoses">
        <DiagnosisTable page={1} size={10} visitId={visitId} />
      </Section>

      <Section
        action={
          <PrescriptionForm
            clinicId={visit.clinicId}
            patientId={visit.patientId}
            visitId={visitId}
          />
        }
        title="Prescriptions"
      >
        <PrescriptionTable page={1} size={10} visitId={visitId} />
      </Section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function RouteNotFound({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icons.alertCircle aria-hidden="true" className="text-muted-foreground size-8" />
      <p className="text-lg font-semibold">{title}</p>
      <Button nativeButton={false} render={<Link to="/app/visits" />} variant="outline">
        Back to visits
      </Button>
    </div>
  );
}

function VisitDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading visit" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="space-y-1" key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message && err.message.length < 200) {
    return err.message;
  }
  return "No changes were made. Check your connection and retry.";
}

function visitMeasurementCtx(
  visit: { ageMonths: number },
  patient: { sex: "male" | "female" } | null,
) {
  return {
    ageMonths: visit.ageMonths,
    patientSex: patient?.sex ?? ("male" as const),
  };
}
```

`_auth/app/visits/index.tsx`:

```tsx
// routes/_auth/app/visits/index.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import { SectionState } from "#/components/blocks/state-view.tsx";
import { Icons } from "#/components/icons.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { VisitsTable } from "#/features/visits/components/VisitsTable.tsx";
import { recentVisitsQuery } from "#/features/visits/queries.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/visits/")({
  validateSearch: z.object({
    page: z.number().int().min(1).optional(),
  }),
  component: VisitsPage,
});

function VisitsPage() {
  const { user } = useAuthSuspense();

  const query = useQuery({
    ...recentVisitsQuery(user?.clinicId ?? ""),
    enabled: Boolean(user?.clinicId),
  });

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Visits"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader description="Recent encounters, diagnoses, and clinical notes." title="Visits" />

      <Card>
        <CardHeader>
          <CardTitle>Encounter log</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : query.isError ? (
            <SectionState
              action={
                <Button onClick={() => void query.refetch()} variant="outline">
                  Try Again
                </Button>
              }
              description={
                query.error instanceof Error ? query.error.message : "Failed to load visits."
              }
              icon={Icons.alertCircle}
              title="Could Not Load Visits"
            />
          ) : (
            <VisitsTable showPatientColumn visits={query.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

`_auth/app/visits/new.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "@/components/blocks/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { visitSnapshotQuery } from "@/features/visits/composer/queries";
import {
  VISIT_COMPOSER_DEFAULTS,
  type VisitComposerValues,
} from "@/features/visits/composer/schema";
import { VisitComposer } from "@/features/visits/composer/VisitComposer";
import { useAuthSuspense } from "@/lib/auth/hooks";
import React from "react";

export const Route = createFileRoute("/_auth/app/visits/new")({
  validateSearch: z.object({ patientId: z.string() }),
  component: NewVisitPage,
});

function NewVisitPage() {
  const { user } = useAuthSuspense();
  const { patientId } = Route.useSearch();
  const navigate = useNavigate();

  const snapshotQ = useQuery(visitSnapshotQuery(patientId));

  if (!user?.clinicId) {
    return <PageHeader description="No clinic assigned." title="New visit" />;
  }
  if (snapshotQ.isLoading) return <Skeleton className="h-96 w-full" />;
  if (!snapshotQ.data) return <PageHeader description="Patient not found." title="New visit" />;

  const initial: VisitComposerValues = React.useMemo(
    () => ({
      ...VISIT_COMPOSER_DEFAULTS,
      patientId,
      clinicId: user.clinicId ?? "",
      doctorId: null,
    }),
    [patientId, user.clinicId],
  );

  return (
    <VisitComposer
      initial={initial}
      mode="create"
      onSuccess={(visitId: string) =>
        void navigate({
          to: "/app/visits/$visitId",
          params: { visitId },
        })
      }
      snapshot={snapshotQ.data}
    />
  );
}
```

`_auth/route.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authQueryOptions } from "#/lib/auth/queries.ts";

/**
 * This is the _auth layout, which enables 'protected routes'
 * for all child routes under _auth (e.g. _auth/app/*)
 */
export const Route = createFileRoute("/_auth")({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    /**
     * beforeLoad runs on every navigation and prefetch, so we use TanStack Query
     * for client-side caching to speed up navigation, reducing client-to-server calls.
     *
     * Better Auth's cookieCache is also enabled in `/lib/auth/auth.ts`,
     * which can further reduce server-to-database calls.
     *
     * Both cache layers help for faster UX and page load/navigation.
     *
     * But this is NOT a server-side security guarantee.
     * Consider authMiddleware for data fetching operations & mutations
     * where auth is required, e.g. for API routes and server functions.
     * see `/lib/auth/middleware.ts`
     */
    const user = await context.queryClient.query({
      ...authQueryOptions(),
      staleTime: "static",
    });
    void context.queryClient.query(authQueryOptions());

    if (!user) {
      throw redirect({ to: "/login" });
    }

    /**
     * If we need auth data in other loaders/beforeLoad,
     * use `authQueryOptions` with `context.queryClient`,
     * similar to what we already do here.
     *
     * Prefer this approach instead of passing user to router/loader context,
     * for simpler centralized revalidation via TanStack Query.
     */
  },
});
```

`_guest/about.tsx`:

```tsx
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
      <p className="island-kicker mb-3">{MISSION.eyebrow}</p>
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
        <p className="island-kicker mb-2">Who it's for</p>
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
            <Card className="island-shell h-full">
              <CardContent className="space-y-3 pt-6">
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
        <p className="island-kicker mb-2">What's different</p>
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
            <Card className="island-shell h-full">
              <CardHeader className="pb-2">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <CardTitle className="mt-3 text-base">{title}</CardTitle>
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
        <p className="island-kicker mb-2">Clinical standards</p>
        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          Every formula has a citation.
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--sea-ink-soft)]">
          If a number appears on a patient's chart, you can trace it back to a published source.
        </p>
      </header>

      <Card className="island-shell overflow-hidden">
        <CardContent className="p-0">
          <dl className="divide-y divide-[var(--line)]">
            {STANDARDS.map(({ label, value, detail }) => (
              <div className="grid gap-2 p-5 sm:grid-cols-[140px_1fr] sm:gap-6 sm:p-6" key={label}>
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
        <p className="island-kicker mb-2">Security & data</p>
        <h2 className="display-title text-3xl font-bold tracking-tight sm:text-4xl">
          The questions every clinic admin asks.
        </h2>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECURITY.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Card className="island-shell h-full">
              <CardContent className="flex gap-4 pt-6">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">{body}</p>
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
    <section className="island-shell rounded-3xl px-8 py-14 sm:px-12 sm:py-16">
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
    <section className="island-shell rounded-3xl px-8 py-16 text-center sm:px-16">
      <div className="mx-auto max-w-2xl">
        <Badge className="mb-5 gap-1.5 rounded-full px-3 py-1" variant="outline">
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
          <Button
            render={<Link className="inline-flex items-center gap-2" to="/login" />}
            size="lg"
          >
            Sign in to your clinic
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            render={
              <a
                aria-label="Email hello@smartclinic.example"
                className="inline-flex items-center gap-2"
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
```

`_guest/forgot-password.tsx`:

```tsx
// src/routes/_guest/forgot-password.tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, LoaderCircleIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth-client.ts";

export const Route = createFileRoute("/_guest/forgot-password")({
  component: ForgotPasswordForm,
});

const forgotSchema = z.object({
  email: z.email("Invalid email address"),
});

/**
 * Better Auth sends the reset link to `redirectTo`, appending `?token=…`.
 * The link in the email must point at a route inside this app, e.g.
 * `/reset-password?token=abc`.
 */
const RESET_PAGE_PATH = "/reset-password";

function ForgotPasswordForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: forgotSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      setPending(true);
      try {
        const { error: authError } = await authClient.requestPasswordReset({
          email: value.email.trim(),
          redirectTo: `${window.location.origin}${RESET_PAGE_PATH}`,
        });
        if (authError) {
          throw new Error(authError.message || "Could not send the reset email.");
        }
        setSubmitted(true);
        toast.add({
          type: "success",
          description: "Check your inbox for a reset link.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not send the reset email.";
        setError(message);
        toast.add({ type: "error", description: message });
      } finally {
        setPending(false);
      }
    },
  });

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Check your email
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            If an account exists for that address, a reset link is on its way. The link expires in
            15 minutes.
          </p>
        </div>
        <Button
          className="h-11 w-full text-base font-semibold"
          nativeButton={false}
          render={<Link to="/login" />}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Forgot password?
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter the email you signed up with and we&apos;ll send a reset link.
        </p>
      </div>

      <form
        aria-busy={pending}
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (pending) return;
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => {
            const err = field.state.meta.errors[0];
            const message =
              typeof err === "string"
                ? err
                : err && typeof err === "object" && "message" in err
                  ? String((err as { message: unknown }).message)
                  : undefined;
            return (
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Email address</Label>
                <Input
                  aria-describedby={message ? "forgot-email-error" : undefined}
                  aria-invalid={Boolean(message) || Boolean(error)}
                  autoComplete="email"
                  className="h-11"
                  id="forgot-email"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="doctor@clinic.com"
                  readOnly={pending}
                  required
                  type="email"
                  value={field.state.value}
                />
                {message && (
                  <p className="text-destructive text-sm" id="forgot-email-error" role="alert">
                    {message}
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>

        {error && (
          <p className="text-destructive text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        <Button className="h-11 w-full text-base font-semibold" disabled={pending} type="submit">
          {pending ? (
            <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <MailIcon aria-hidden="true" className="size-5" />
          )}
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Remembered it?{" "}
        <Link className="text-primary font-semibold hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

`_guest/login.tsx`:

```tsx
// src/routes/_guest/login.tsx
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { SocialSignInButtons } from "#/components/sign-in-social-buttons.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authQueryOptions } from "#/lib/auth/queries.ts";
import { authClient } from "#/lib/auth-client.ts";

export const Route = createFileRoute("/_guest/login")({
  component: LoginForm,
});

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** TanStack Form's `field.state.meta.errors` is `unknown[]`. Normalize it. */
function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

function LoginForm() {
  const { redirectUrl } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [capsLock, setCapsLock] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const errorId = React.useId();

  const login = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { error: authError } = await authClient.signIn.email({
        ...data,
        callbackURL: redirectUrl,
      });
      if (authError) {
        throw new Error(authError.message || "Invalid email or password.");
      }
    },
    onSuccess: async () => {
      // Invalidate AND refetch so the session is live before we navigate.
      // If this fails, we stay on /login with an error rather than
      // bouncing between /login -> /app -> /login.
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions().queryKey,
      });
      const user = await queryClient.query(authQueryOptions());
      if (!user) {
        throw new Error("Signed in, but the session could not be loaded. Try refreshing the page.");
      }
      void navigate({ to: redirectUrl || "/app", replace: true });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Invalid email or password.";
      setError(message);
      toast.add({ type: "error", description: message });
    },
  });

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      await login.mutateAsync(value);
    },
  });

  const isPending = login.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to manage your clinic.</p>
      </div>

      <form
        aria-busy={isPending}
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isPending) return;
          void form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          <form.Field name="email">
            {(field) => {
              const message = fieldErrorMessage(field.state.meta.errors[0]);
              return (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={Boolean(message) || Boolean(error)}
                    autoComplete="email"
                    className="h-11"
                    id="email"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="doctor@clinic.com"
                    readOnly={isPending}
                    required
                    type="email"
                    value={field.state.value}
                  />
                  {message && (
                    <p className="text-destructive text-xs" role="alert">
                      {message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const message = fieldErrorMessage(field.state.meta.errors[0]);
              const describedBy =
                [
                  error ? errorId : null,
                  capsLock ? "login-caps-lock" : null,
                  message ? "login-password-error" : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined;

              return (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      className="text-primary text-xs font-medium hover:underline"
                      to="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Relative wrapper so the eye button can sit on the right edge. */}
                  <div className="relative">
                    <Input
                      aria-describedby={describedBy}
                      aria-invalid={Boolean(message) || Boolean(error)}
                      autoComplete="current-password"
                      className="h-11 pr-11"
                      id="password"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                      placeholder="••••••••"
                      readOnly={isPending}
                      required
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />

                    <button
                      aria-controls="password"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOffIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>

                  {capsLock && (
                    <p className="text-muted-foreground text-xs" id="login-caps-lock">
                      Caps Lock is on.
                    </p>
                  )}

                  {message && (
                    <p className="text-destructive text-xs" id="login-password-error" role="alert">
                      {message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          {error && (
            <p
              className="animate-in text-destructive fade-in slide-in-from-top-1 text-sm font-medium"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            className="mt-2 h-11 w-full text-base font-semibold"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-5" />
            )}
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </div>

        <SocialSignInButtons callbackURL={redirectUrl} disabled={isPending} />
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link className="text-primary font-semibold hover:underline" to="/signup">
          Create one
        </Link>
      </p>
    </div>
  );
}
```

`_guest/privacy.tsx`:

```tsx
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
```

`_guest/reset-password.tsx`:

```tsx
// src/routes/_guest/reset-password.tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, LoaderCircleIcon, ShieldCheckIcon } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth-client.ts";

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    // Better Auth may append `?error=INVALID_TOKEN` when the link is bad.
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordForm,
});

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPasswordForm() {
  const { token, error: urlError } = Route.useSearch();
  const navigate = useNavigate();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    urlError === "INVALID_TOKEN"
      ? "This reset link is invalid or has expired. Request a new one."
      : null,
  );

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: resetSchema },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError("Missing reset token. Request a new link from the login page.");
        return;
      }
      setError(null);
      setPending(true);
      try {
        const { error: authError } = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });
        if (authError) {
          throw new Error(authError.message || "Could not reset the password.");
        }
        toast.add({
          type: "success",
          description: "Password updated. Please sign in.",
        });
        void navigate({ to: "/login", replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not reset the password.";
        setError(message);
        toast.add({ type: "error", description: message });
      } finally {
        setPending(false);
      }
    },
  });

  // Missing / bad token — no point showing the form.
  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reset link is invalid
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {error ??
              "This link is missing a reset token. Request a new one from the sign-in page."}
          </p>
        </div>
        <Button
          className="h-11 w-full text-base font-semibold"
          nativeButton={false}
          render={<Link to="/forgot-password" />}
        >
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Set a new password
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Choose a password of at least 8 characters.
        </p>
      </div>

      <form
        aria-busy={pending}
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (pending) return;
          void form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          <form.Field name="password">
            {(field) => {
              const err = field.state.meta.errors[0];
              const message =
                typeof err === "string"
                  ? err
                  : err && typeof err === "object" && "message" in err
                    ? String((err as { message: unknown }).message)
                    : undefined;
              return (
                <div className="grid gap-2">
                  <Label htmlFor="reset-password">New password</Label>
                  <Input
                    aria-describedby={message ? "reset-password-error" : undefined}
                    aria-invalid={Boolean(message) || Boolean(error)}
                    autoComplete="new-password"
                    className="h-11"
                    id="reset-password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="At least 8 characters"
                    readOnly={pending}
                    required
                    type="password"
                    value={field.state.value}
                  />
                  {message && (
                    <p className="text-destructive text-sm" id="reset-password-error" role="alert">
                      {message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => {
              const err = field.state.meta.errors[0];
              const message =
                typeof err === "string"
                  ? err
                  : err && typeof err === "object" && "message" in err
                    ? String((err as { message: unknown }).message)
                    : undefined;
              return (
                <div className="grid gap-2">
                  <Label htmlFor="reset-confirm">Confirm new password</Label>
                  <Input
                    aria-describedby={message ? "reset-confirm-error" : undefined}
                    aria-invalid={Boolean(message) || Boolean(error)}
                    autoComplete="new-password"
                    className="h-11"
                    id="reset-confirm"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Repeat your password"
                    readOnly={pending}
                    required
                    type="password"
                    value={field.state.value}
                  />
                  {message && (
                    <p className="text-destructive text-sm" id="reset-confirm-error" role="alert">
                      {message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          {error && (
            <p className="text-destructive text-sm font-medium" role="alert">
              {error}
            </p>
          )}

          <Button className="h-11 w-full text-base font-semibold" disabled={pending} type="submit">
            {pending ? (
              <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ShieldCheckIcon aria-hidden="true" className="size-5" />
            )}
            {pending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
          to="/login"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
          Back to sign in
        </Link>
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline"
          to="/forgot-password"
        >
          Request new link
        </Link>
      </div>
    </div>
  );
}
```

`_guest/route.tsx`:

```tsx
// src/routes/_guest/route.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { useEffect } from "react";

import { authQueryOptions } from "#/lib/auth/queries.ts";

const CURRENT_YEAR = new Date().getFullYear();

export const Route = createFileRoute("/_guest")({
  component: GuestLayout,
  beforeLoad: () => {
    return { redirectUrl: "/app" };
  },
});

function GuestLayout() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    ...authQueryOptions(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (user) {
      void navigate({ to: "/app", replace: true });
    }
  }, [navigate, user]);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-zinc-950">
      {/* Decorative Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] [background-size:24px_24px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />

      <div className="flex w-full max-w-[420px] flex-col gap-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <img
              alt="Dr. Hazem Ali Clinic"
              className="size-full object-contain p-2"
              src="/brand/logo-192.png"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Dr. Hazem Ali
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Pediatrician &bull; Neonatologist &bull; IBCLC
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <HeartPulse className="size-3.5" />
          <span>Secure Medical Portal &copy; {CURRENT_YEAR}</span>
        </div>
      </div>
    </div>
  );
}
```

`_guest/services/chronic-care.tsx`:

```tsx
import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/chronic-care")({
  head: () => ({
    meta: [
      { title: "Chronic Care — Pediatric Clinic" },
      { name: "description", content: getService("chronic-care").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("chronic-care")} />,
});
```

`_guest/services/developmental-screening.tsx`:

```tsx
import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/developmental-screening")({
  head: () => ({
    meta: [
      { title: "Developmental Screening — Pediatric Clinic" },
      {
        name: "description",
        content: getService("developmental-screening").tagline,
      },
    ],
  }),
  component: () => <ServiceLayout service={getService("developmental-screening")} />,
});
```

`_guest/services/immunizations.tsx`:

```tsx
import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/immunizations")({
  head: () => ({
    meta: [
      { title: "Immunizations — Pediatric Clinic" },
      { name: "description", content: getService("immunizations").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("immunizations")} />,
});
```

`_guest/services/index.tsx`:

```tsx
import { SERVICES } from "@data/services";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HeartPulseIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  SyringeIcon,
} from "lucide-react";

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
```

`_guest/services/newborn-care.tsx`:

```tsx
import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/newborn-care")({
  head: () => ({
    meta: [
      { title: "Newborn Care — Pediatric Clinic" },
      { name: "description", content: getService("newborn-care").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("newborn-care")} />,
});
```

`_guest/services/sick-visits.tsx`:

```tsx
import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/sick-visits")({
  head: () => ({
    meta: [
      { title: "Sick Visits — Pediatric Clinic" },
      { name: "description", content: getService("sick-visits").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("sick-visits")} />,
});
```

`_guest/services/well-child.tsx`:

```tsx
import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/well-child")({
  head: () => ({
    meta: [
      { title: "Well-Child Visits — Pediatric Clinic" },
      { name: "description", content: getService("well-child").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("well-child")} />,
});
```

`_guest/signup.tsx`:

```tsx
// src/routes/_guest/signup.tsx
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, UserPlus } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { SocialSignInButtons } from "#/components/sign-in-social-buttons.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authQueryOptions } from "#/lib/auth/queries.ts";
import { authClient } from "#/lib/auth-client.ts";

export const Route = createFileRoute("/_guest/signup")({
  component: SignupForm,
});

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** TanStack Form hands back `unknown[]`; pull a readable string out. */
function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Invalid value";
}

function SignupForm() {
  const { redirectUrl } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [capsLock, setCapsLock] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const errorId = React.useId();

  // Declare the mutation BEFORE the form so `onSubmit` can reference it.
  const signup = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const { error: authError } = await authClient.signUp.email({
        ...data,
        callbackURL: redirectUrl,
      });
      if (authError) {
        throw new Error(authError.message || "An error occurred while creating your account.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions().queryKey,
      });
      try {
        const user = await queryClient.query(authQueryOptions());
        if (user) {
          toast.add({
            type: "success",
            description: "Account created successfully!",
          });
          void navigate({ to: redirectUrl || "/app", replace: true });
          return;
        }
      } catch {
        // Query resolution failed, fallback to login page smoothly
      }

      // If the session cookie is not active yet, route smoothly to login
      toast.add({
        type: "success",
        description: "Account created successfully! Please sign in with your credentials.",
      });
      void navigate({ to: "/login", replace: true });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast.add({ type: "error", description: message });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: { onSubmit: signupSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await signup.mutateAsync({
          name: value.name.trim(),
          email: value.email,
          password: value.password,
        });
      } catch {
        // Handled in mutation onError
      }
    },
  });

  const isPending = signup.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create an account
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Join the clinic portal to get started.
        </p>
      </div>

      <form
        aria-busy={isPending}
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isPending) return;
          void form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          <form.Field name="name">
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <div className="grid gap-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    aria-describedby={err ? "signup-name-error" : undefined}
                    aria-invalid={Boolean(err) || Boolean(error)}
                    autoComplete="name"
                    className="h-11"
                    disabled={isPending}
                    id="signup-name"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Dr. Hazem Ali"
                    required
                    type="text"
                    value={field.state.value}
                  />
                  {err && (
                    <p className="text-destructive text-sm" id="signup-name-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input
                    aria-describedby={err ? "signup-email-error" : undefined}
                    aria-invalid={Boolean(err) || Boolean(error)}
                    autoComplete="email"
                    className="h-11"
                    disabled={isPending}
                    id="signup-email"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="doctor@clinic.com"
                    required
                    type="email"
                    value={field.state.value}
                  />
                  {err && (
                    <p className="text-destructive text-sm" id="signup-email-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const err = field.state.meta.errors[0];
              const describedBy =
                [err ? "signup-password-error" : null, capsLock ? "signup-caps-lock" : null]
                  .filter(Boolean)
                  .join(" ") || undefined;

              return (
                <div className="grid gap-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      aria-describedby={describedBy}
                      aria-invalid={Boolean(err) || Boolean(error)}
                      autoComplete="new-password"
                      className="h-11 pr-11"
                      disabled={isPending}
                      id="signup-password"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                      placeholder="At least 8 characters"
                      required
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-controls="signup-password"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOffIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>

                  {capsLock && (
                    <p className="text-muted-foreground text-xs" id="signup-caps-lock">
                      Caps Lock is on.
                    </p>
                  )}

                  {err && (
                    <p className="text-destructive text-sm" id="signup-password-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <div className="grid gap-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      aria-describedby={err ? "signup-confirm-error" : undefined}
                      aria-invalid={Boolean(err) || Boolean(error)}
                      autoComplete="new-password"
                      className="h-11 pr-11"
                      disabled={isPending}
                      id="signup-confirm"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-controls="signup-confirm"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password confirmation"
                          : "Show password confirmation"
                      }
                      aria-pressed={showConfirmPassword}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                  {err && (
                    <p className="text-destructive text-sm" id="signup-confirm-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          {error && (
            <p
              className="animate-in text-destructive fade-in slide-in-from-top-1 text-sm font-medium"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            className="mt-2 h-11 w-full text-base font-semibold"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <UserPlus aria-hidden="true" className="size-5" />
            )}
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </div>

        <SocialSignInButtons callbackURL={redirectUrl} disabled={isPending} />
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link className="text-primary font-semibold hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

`_guest/terms.tsx`:

```tsx
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
        <Badge className="mb-6 gap-1.5 rounded-full px-3 py-1" variant="outline">
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
              <p className="island-kicker text-[var(--sea-ink-soft)]">
                {String(index + 1).padStart(2, "0")}
              </p>
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
            <p className="island-kicker text-[var(--sea-ink-soft)]">
              {String(SECTIONS.length + 1).padStart(2, "0")}
            </p>
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
              className="inline-flex items-center gap-2"
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
          <Button
            render={<Link className="inline-flex items-center gap-2" to="/privacy" />}
            variant="outline"
          >
            Privacy Policy
          </Button>
          <Button
            render={<Link className="inline-flex items-center gap-2" to="/about" />}
            variant="ghost"
          >
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
```

`api/auth/$.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
```

`index.tsx`:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ServicesGrid } from "#/components/landing/services-grid.tsx";
import { authQueryOptions } from "#/lib/auth/queries.ts";
import { CtaSection } from "@/components/landing/cta-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Footer } from "@/components/landing/footer";
import { GrowthPreview } from "@/components/landing/growth-preview";
import { Hero } from "@/components/landing/hero";
import { TrustBar } from "@/components/landing/trust-bar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "G-Tracker — Pediatric clinic platform with WHO & Egyptian growth charts",
      },
      {
        name: "description",
        content:
          "Patient records, growth charts, immunizations, pediatric dosing, and visit notes for pediatric clinics.",
      },
      {
        property: "og:title",
        content: "G-Tracker — Pediatric clinic platform",
      },
      {
        property: "og:description",
        content:
          "WHO & Egyptian growth charts, immunization tracking, and pediatric dosing calculators.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://yourdomain.com/" }],
  }),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query({
      ...authQueryOptions(),
      staleTime: "static",
    });
    if (user) {
      throw redirect({ to: "/app" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="bg-background min-h-dvh">
      <Hero />
      <TrustBar />

      {/* The new 6-image grid */}
      <ServicesGrid />

      <FeatureGrid />
      <GrowthPreview />
      <CtaSection />
      <Footer />
    </main>
  );
}
```
