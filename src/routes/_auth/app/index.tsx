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
import { AssistantPanel } from "#/features/assistant/components/AssistantPanel";
import { useClinicPulse } from "#/features/dashboard/use-clinic-pulse.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { canUseAssistantRole } from "@/features/assistant/scope";
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
          <p className=" text-xs">Common tasks — one click away.</p>
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
              <p className=" text-sm">Scheduled consultations for today.</p>
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

      {user?.clinicId && canUseAssistantRole(user.role) && <AssistantPanel />}
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
        <span className=" block truncate text-xs">{action.description}</span>
      </span>
      <ArrowRightIcon className=" group-hover:text-foreground size-4 shrink-0 transition-colors" />
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
          <CardTitle>{card.title}</CardTitle>
        </div>
        <CardDescription>{card.description}</CardDescription>
      </CardHeader>
      <div className="p-4 pt-0">
        <Button
          className="w-full justify-between"
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
