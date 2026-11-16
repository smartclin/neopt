// features/development/components/PrintChecklist.tsx

import { Check, Square } from "lucide-react";

import type { PatientMilestone } from "../types";

import { DOMAIN_META, DOMAIN_ORDER } from "../types";

export interface PrintChecklistProps {
  milestones: readonly PatientMilestone[];
  patientName: string;
  ageLabel: string;
  clinicName?: string;
}

/**
 * Parent-facing printable checklist. Hidden on-screen, revealed in
 * `@media print`. All shadcn chrome stripped to keep the output
 * paper-friendly.
 */
export function PrintChecklist({
  milestones,
  patientName,
  ageLabel,
  clinicName,
}: PrintChecklistProps) {
  const byDomain = DOMAIN_ORDER.map((domain) => ({
    domain,
    items: milestones
      .filter((m) => m.domain === domain)
      .sort((a, b) => a.targetAgeMonths - b.targetAgeMonths),
  }));

  return (
    <div className="hidden print:block">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">Developmental Milestones Checklist</h1>
        <p className="mt-1 text-sm">
          <strong>Patient:</strong> {patientName} &nbsp;·&nbsp; <strong>Age:</strong> {ageLabel}
        </p>
        {clinicName && <p className="text-muted-foreground text-xs">{clinicName}</p>}
      </div>

      {byDomain.map(({ domain, items }) => {
        if (items.length === 0) return null;
        const meta = DOMAIN_META[domain];
        const Icon = meta.icon;
        return (
          <section className="mb-6 break-inside-avoid" key={domain}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
              <Icon aria-hidden="true" className="size-4" />
              {meta.label}
            </h2>
            <ul className="space-y-2">
              {items.map((m) => (
                <li className="flex items-start gap-3 text-sm" key={m.id}>
                  <span className="mt-0.5">
                    {m.isAchieved ? (
                      <Check
                        aria-hidden="true"
                        className="size-4 text-emerald-600"
                        strokeWidth={3}
                      />
                    ) : (
                      <Square aria-hidden="true" className="text-muted-foreground size-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-muted-foreground text-xs">{m.description}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Expected by: {m.ageLabel}
                      {m.isRedFlagIfMissing && (
                        <span className="text-destructive ml-2 font-semibold">
                          · Critical milestone
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="text-muted-foreground mt-8 border-t pt-4 text-[10px]">
        <p>
          <strong>Instructions for parents:</strong> Check off the milestones your child has
          achieved. Bring this checklist to your next visit. Contact the clinic if you have concerns
          about any milestone.
        </p>
      </div>
    </div>
  );
}
