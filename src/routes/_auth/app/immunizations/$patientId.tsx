import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, CircleAlertIcon, CircleIcon, PrinterIcon } from "lucide-react";
import { useState } from "react";

// ── types ──────────────────────────────────────────────────────────────
import type { PatientVaccinationRecord } from "@/features/immunizations/types";

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
