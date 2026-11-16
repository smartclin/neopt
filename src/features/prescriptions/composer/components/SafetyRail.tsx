import { AlertTriangleIcon, ShieldAlertIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";

import type { ComposerDrug } from "../formulary";

export interface InteractionWarning {
  severity: "amber" | "red";
  title: string;
  detail: string;
}

interface SafetyRailProps {
  warnings: InteractionWarning[];
  drug: ComposerDrug | undefined;
  previous: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    prescribedAt: Date;
    status: string;
  }>;
  mode: "create" | "edit" | "view";
}

export function SafetyRail({ warnings, drug, previous, mode }: SafetyRailProps) {
  const critical = warnings.filter((w) => w.severity === "red");
  const caution = warnings.filter((w) => w.severity === "amber");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center text-sm">
              <ShieldAlertIcon className="mr-2 size-4" />
              Interaction check
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {warnings.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No interactions detected against the patient&rsquo;s allergies or active
                prescriptions.
              </p>
            )}
            {critical.map((w) => (
              <div
                className="border-destructive/40 bg-destructive/5 rounded-md border p-2"
                key={w.title}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="text-destructive size-4" />
                  <span className="text-destructive text-sm font-semibold">{w.title}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{w.detail}</p>
              </div>
            ))}
            {caution.map((w) => (
              <div className="rounded-md border border-warning/40 bg-warning/5 p-2" key={w.title}>
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="text-warning size-4" />
                  <span className="text-warning text-sm font-semibold">{w.title}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{w.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {drug && (
        <Card>
          <CardHeader>
            <CardTitle>Formulary reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="-mx-6" />
            <Accordion>
              <AccordionItem value="indication">
                <AccordionTrigger>Indication</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground text-sm">{drug.indication}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="contraindications">
                <AccordionTrigger>Contraindications</AccordionTrigger>
                <AccordionContent>
                  {drug.contraindications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None listed in the formulary.</p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-4 text-sm">
                      {drug.contraindications.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="monitoring">
                <AccordionTrigger>Monitoring</AccordionTrigger>
                <AccordionContent>
                  {drug.monitoring.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No specific monitoring parameters listed.
                    </p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-4 text-sm">
                      {drug.monitoring.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {mode !== "create" && previous.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {previous
                .slice(-3)
                .reverse()
                .map((p) => (
                  <div className="flex items-center justify-between gap-2 text-xs" key={p.id}>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{p.medicationName}</span>
                      <span className="text-muted-foreground font-mono text-xss tabular-nums">
                        {p.dosage} · {formatDate(new Date(p.prescribedAt))}
                      </span>
                    </div>
                    <Badge
                      className="shrink-0"
                      variant={p.status === "active" ? "default" : "secondary"}
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
