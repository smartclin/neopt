import { AlertTriangleIcon, SaveIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ageInMonths } from "@/features/shared/helpers";
import { formatDate, formatTime } from "@/lib/dates";

import type { VisitComposerValues } from "./schema";

interface RightRailProps {
  snapshot: {
    patient: {
      firstName: string;
      lastName: string;
      mrn: string;
      sex: "male" | "female";
      dateOfBirth: string;
      allergies: string | null;
    };
    lastVisitAt: Date | null;
    weightSeries: Array<{ value: number; at: Date }>;
  };
  values: VisitComposerValues;
  saveState: {
    lastSavedAt: Date | null;
    dirty: boolean;
    saving: boolean;
    error: string | null;
  };
}

export function RightRail({ snapshot, values, saveState }: RightRailProps) {
  const ageMonths = ageInMonths(new Date(snapshot.patient.dateOfBirth), new Date());
  const ageLabel =
    ageMonths < 24
      ? `${ageMonths.toFixed(1)} mo`
      : `${Math.floor(ageMonths / 12)}y ${Math.round(ageMonths % 12)}m`;

  const allergies = (snapshot.patient.allergies ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Interaction warnings: naive check against existing allergies.
  const warnings: Array<{ severity: "amber" | "red"; text: string }> = [];
  for (const p of values.prescriptions) {
    for (const a of allergies) {
      if (p.medicationName.toLowerCase().includes(a.toLowerCase())) {
        warnings.push({
          severity: "red",
          text: `${p.medicationName} matches recorded allergy "${a}"`,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">
        Save manually with the button below. Unsaved changes are lost if you leave.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Patient snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <span className="font-semibold">
              {snapshot.patient.firstName} {snapshot.patient.lastName}
            </span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {snapshot.patient.mrn} · {ageLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {allergies.length === 0 ? (
              <span className="text-muted-foreground text-xs">No allergies recorded</span>
            ) : (
              allergies.map((a) => (
                <Badge key={a} variant="destructive">
                  {a}
                </Badge>
              ))
            )}
          </div>

          <div className="text-muted-foreground text-xs">
            Last visit: {snapshot.lastVisitAt ? formatDate(new Date(snapshot.lastVisitAt)) : "—"}
          </div>

          <WeightSparkline data={snapshot.weightSeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <AlertTriangleIcon className="size-4" />
            Safety alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {warnings.length === 0 ? (
            <p className="text-muted-foreground text-xs">No interactions detected.</p>
          ) : (
            warnings.map((w, i) => (
              <div
                className={
                  w.severity === "red"
                    ? "border-destructive/40 bg-destructive/5 rounded-md border p-2 text-xs"
                    : "rounded-md border border-warning/40 bg-warning/5 p-2 text-xs"
                }
                key={i}
              >
                {w.text}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <SaveIcon className="size-4" />
            Save status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saveState.saving && <span className="text-warning">Saving…</span>}
          {!saveState.saving && saveState.error && (
            <span className="text-destructive">{saveState.error}</span>
          )}
          {!saveState.saving && !saveState.error && saveState.dirty && (
            <span className="text-muted-foreground">Unsaved changes</span>
          )}
          {!saveState.saving && !saveState.dirty && saveState.lastSavedAt && (
            <span className="text-module-encounters">
              Last saved {formatTime(saveState.lastSavedAt)}
            </span>
          )}
          <span className="text-muted-foreground">
            <SparklesIcon className="inline size-3" /> Auto-saves every 30s
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

function WeightSparkline({ data }: { data: Array<{ value: number; at: Date }> }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <svg
      aria-label="Weight trend"
      className="text-module-encounters"
      fill="none"
      height="40"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox={"0 0 100 40"}
      width="100%"
    >
      <polyline
        points={data
          .map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 40 - ((d.value - min) / range) * 36 - 2;
            return `${x},${y}`;
          })
          .join(" ")}
      />
    </svg>
  );
}
