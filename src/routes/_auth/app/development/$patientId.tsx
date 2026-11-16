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
