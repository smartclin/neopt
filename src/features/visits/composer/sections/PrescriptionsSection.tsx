import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { VisitComposerValues } from "../schema";

interface Props {
  values: VisitComposerValues;
  patch: (p: Partial<VisitComposerValues>) => void;
  readOnly?: boolean;
}

function randomId() {
  return `rx-${Math.random().toString(36).slice(2)}`;
}

export function PrescriptionsSection({ values, patch, readOnly }: Props) {
  const [open, setOpen] = useState(false);

  const updateRow = (index: number, next: Partial<(typeof values.prescriptions)[number]>) => {
    const rows = values.prescriptions.slice();
    rows[index] = { ...rows[index], ...next };
    patch({ prescriptions: rows });
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <span className=" text-xs">
          {values.prescriptions.length} medication
          {values.prescriptions.length === 1 ? "" : "s"}
        </span>
        <Button onClick={() => setOpen((o) => !o)} size="sm" type="button" variant="ghost">
          <ChevronDownIcon className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "Collapse" : "Expand"}
        </Button>
      </div>

      {open &&
        values.prescriptions.map((row, i) => (
          <div className="grid gap-2 rounded-md border p-3" key={row.draftId}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Medication {i + 1}
              </span>
              <Button
                aria-label={`Remove medication ${i + 1}`}
                disabled={readOnly}
                onClick={() =>
                  patch({
                    prescriptions: values.prescriptions.filter((x) => x.draftId !== row.draftId),
                  })
                }
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2Icon />
              </Button>
            </div>
            <Input
              disabled={readOnly}
              onChange={(e) => updateRow(i, { medicationName: e.target.value })}
              placeholder="Medication name"
              value={row.medicationName}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                disabled={readOnly}
                onChange={(e) => updateRow(i, { dosage: e.target.value })}
                placeholder="e.g. 250 mg"
                value={row.dosage}
              />
              <Input
                disabled={readOnly}
                onChange={(e) => updateRow(i, { frequency: e.target.value })}
                placeholder="BID"
                value={row.frequency}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                disabled={readOnly}
                onChange={(e) => updateRow(i, { durationDays: e.target.valueAsNumber || null })}
                placeholder="Duration (days)"
                type="number"
                value={row.durationDays ?? ""}
              />
              <Textarea
                disabled={readOnly}
                onChange={(e) => updateRow(i, { instructions: e.target.value })}
                placeholder="Instructions (optional)"
                rows={1}
                value={row.instructions}
              />
            </div>
          </div>
        ))}

      <Button
        disabled={readOnly}
        onClick={() => {
          setOpen(true);
          patch({
            prescriptions: [
              ...values.prescriptions,
              {
                draftId: randomId(),
                medicationName: "",
                dosage: "",
                frequency: "BID",
                durationDays: 5,
                instructions: "",
              },
            ],
          });
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <PlusIcon /> Add medication
      </Button>
    </div>
  );
}
