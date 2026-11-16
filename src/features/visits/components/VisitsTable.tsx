import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";

import type { Visit } from "../schema";

interface VisitsTableProps {
  visits: Array<
    Visit & {
      measurements?: Array<{ id: string; indicator: string; value: number }>;
      diagnoses?: Array<{ id: string; description: string; icdCode: string }>;
      prescriptions?: Array<{ id: string; medicationName: string }>;
      patient?: {
        id: string;
        firstName: string;
        lastName: string;
        mrn: string;
      } | null;
    }
  >;
  showPatientColumn?: boolean;
}

export function VisitsTable({ visits, showPatientColumn = false }: VisitsTableProps) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <Stethoscope className="text-muted-foreground/60 size-8" />
        <p className="mt-2 text-sm font-medium">No visits recorded yet</p>
        <p className="text-muted-foreground text-xs">
          Record a new clinical encounter to begin tracking patient progress.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Visit Date</TableHead>
            {showPatientColumn && <TableHead>Patient</TableHead>}
            <TableHead>Age at Visit</TableHead>
            <TableHead>Vitals / Anthropometrics</TableHead>
            <TableHead>Diagnoses</TableHead>
            <TableHead>Prescriptions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((v) => {
            const dateStr = v.visitedAt ? formatDateTime(new Date(v.visitedAt)) : "—";
            const ageDisplay =
              v.ageYears != null && v.ageYears > 0
                ? `${v.ageYears}y ${v.ageMonthsRemainder ?? 0}m`
                : `${v.ageMonths.toFixed(1)}m`;

            return (
              <TableRow key={v.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="text-muted-foreground size-3.5" />
                    <span>{dateStr}</span>
                  </div>
                </TableCell>
                {showPatientColumn && (
                  <TableCell>
                    {v.patient ? (
                      <Link
                        className="font-medium hover:underline"
                        params={{ patientId: v.patient.id }}
                        search={{ tab: "overview" }} // match whatever the route requires
                        to="/app/patients/$patientId"
                      >
                        {v.patient.firstName} {v.patient.lastName}{" "}
                        <span className="text-muted-foreground text-xs">({v.patient.mrn})</span>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline">{ageDisplay}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {v.measurements?.length ?? 0} recorded
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {v.diagnoses && v.diagnoses.length > 0 ? (
                      v.diagnoses.slice(0, 2).map((d) => (
                        <Badge className="text-xs" key={d.id} variant="secondary">
                          {d.icdCode}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    {v.prescriptions?.length ?? 0} medications
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    params={{ patientId: v.patientId }}
                    search={{ tab: "visits" }}
                    to="/app/patients/$patientId"
                  >
                    <Button size="sm" variant="ghost">
                      Open <ArrowRight className="ml-1 size-3" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
