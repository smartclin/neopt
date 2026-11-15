import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { VisitComposerValues } from "../schema";

// Tiny local dataset; replace with a fetch to the ICD-10 index.
const ICD_INDEX = [
  { code: "J06.9", description: "Acute upper respiratory infection" },
  { code: "J20.9", description: "Acute bronchitis" },
  { code: "A09", description: "Infectious gastroenteritis" },
  { code: "R50.9", description: "Fever, unspecified" },
  { code: "H66.9", description: "Otitis media, unspecified" },
  { code: "E44.0", description: "Moderate protein-calorie malnutrition" },
];

interface Props {
  values: VisitComposerValues;
  patch: (p: Partial<VisitComposerValues>) => void;
  readOnly?: boolean;
}

function randomId() {
  return `dx-${Math.random().toString(36).slice(2)}`;
}

export function DiagnosesSection({ values, patch, readOnly }: Props) {
  const updateRow = (index: number, next: Partial<(typeof values.diagnoses)[number]>) => {
    const rows = values.diagnoses.slice();
    rows[index] = { ...rows[index], ...next };
    patch({ diagnoses: rows });
  };

  return (
    <div className="grid gap-3">
      {values.diagnoses.map((row, i) => {
        const match = ICD_INDEX.find((ic) => ic.code === row.icdCode.toUpperCase());
        return (
          <div className="grid gap-2 rounded-md border p-3" key={row.draftId}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Diagnosis {i + 1}
              </span>
              <Button
                aria-label={`Remove diagnosis ${i + 1}`}
                disabled={readOnly}
                onClick={() =>
                  patch({
                    diagnoses: values.diagnoses.filter((x) => x.draftId !== row.draftId),
                  })
                }
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2Icon />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[140px_1fr_120px]">
              <div className="grid gap-1">
                <Label htmlFor={`icd-${row.draftId}`}>ICD-10</Label>
                <Input
                  disabled={readOnly}
                  id={`icd-${row.draftId}`}
                  onChange={(e) =>
                    updateRow(i, {
                      icdCode: e.target.value.toUpperCase(),
                      description: match?.description ?? row.description,
                    })
                  }
                  placeholder="E44.0"
                  value={row.icdCode}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`desc-${row.draftId}`}>Description</Label>
                <Input
                  disabled={readOnly}
                  id={`desc-${row.draftId}`}
                  onChange={(e) => updateRow(i, { description: e.target.value })}
                  value={row.description}
                />
              </div>
              <div className="grid gap-1">
                <Label>Type</Label>
                <select
                  className="border-border bg-background h-9 rounded-md border px-2 text-sm"
                  disabled={readOnly}
                  onChange={(e) =>
                    updateRow(i, {
                      type: e.target.value as (typeof row)["type"],
                    })
                  }
                  value={row.type}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </div>
            </div>
            {match && match.description !== row.description && (
              <p className="text-muted-foreground text-xs">
                Match: <span className="font-mono">{match.code}</span> — {match.description}
              </p>
            )}
          </div>
        );
      })}
      <Button
        disabled={readOnly}
        onClick={() =>
          patch({
            diagnoses: [
              ...values.diagnoses,
              {
                draftId: randomId(),
                icdCode: "",
                description: "",
                type: "primary",
              },
            ],
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        <PlusIcon /> Add diagnosis
      </Button>
    </div>
  );
}
