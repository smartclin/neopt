import { skipToken, useQuery } from "@tanstack/react-query";
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
    ...(clinicId
      ? immunizationCoverageQuery(clinicId)
      : {
          queryKey: ["immunizations", "coverage", "skip"],
          queryFn: skipToken,
        }),
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
