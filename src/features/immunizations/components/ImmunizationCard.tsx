import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, Plus, Syringe } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/dates";

import type { PatientVaccinationRecord } from "../types";

// ── reads + mutations ──────────────────────────────────────────────────
import { patientImmunizationsQuery, useRecordImmunizationMutation } from "../queries";

interface ImmunizationCardProps {
  patientId: string;
  patientDob?: string;
  visitId?: string;
}

export function ImmunizationCard({ patientId, patientDob, visitId }: ImmunizationCardProps) {
  // ── read via factory ──────────────────────────────────────────────
  const { data: records = [], isPending } = useQuery(
    patientImmunizationsQuery(patientId, patientDob),
  );

  // ── mutation via hook ─────────────────────────────────────────────
  const recordMutation = useRecordImmunizationMutation();

  const [activeVaccine, setActiveVaccine] = useState<PatientVaccinationRecord | null>(null);
  const [lotNumber, setLotNumber] = useState("");
  const [administeredDate, setAdministeredDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const givenCount = records.filter((r) => r.status === "given").length;
  const overdueCount = records.filter((r) => r.status === "overdue").length;
  const dueCount = records.filter((r) => r.status === "due").length;

  const handleAdminister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVaccine) return;

    recordMutation.mutate(
      {
        data: {
          patientId,
          visitId: visitId ?? null,
          vaccineKey: activeVaccine.vaccineKey,
          vaccineName: activeVaccine.name,
          doseNumber: activeVaccine.doseNumber,
          targetAgeMonths: activeVaccine.targetAgeMonths,
          status: "given",
          administeredDate: new Date(administeredDate),
          lotNumber: lotNumber.trim() || null,
          site: activeVaccine.site,
        },
      },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            description: `${activeVaccine.name} marked as administered`,
          });
          setActiveVaccine(null);
          setLotNumber("");
        },
        onError: (err) => {
          toast.add({
            type: "destructive",
            description: err instanceof Error ? err.message : "Failed to record vaccine",
          });
        },
      },
    );
  };

  return (
    <Card className="w-full">
      {/* FIX: CardHeader no longer restyled — spacing moved to a wrapper div */}
      <CardHeader>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
              <Syringe className="size-5" />
            </div>
            <div>
              {/* FIX: className removed — CardTitle owns typography */}
              <CardTitle>Childhood Immunization &amp; Vaccine Schedule</CardTitle>
              <CardDescription>
                Routine national schedule from birth through 18 months and preschool
              </CardDescription>
            </div>
          </div>

          {/* FIX: gap-1 is now on the parent, Badges carry only variant */}
          <div className="flex items-center gap-2">
            {/* FIX: variant="success" replaces the color classes */}
            <Badge variant="success">
              <CheckCircle2 className="size-3" />
              {givenCount} Given
            </Badge>
            {overdueCount > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="size-3" />
                {overdueCount} Overdue
              </Badge>
            )}
            <Badge variant="outline">
              <Clock className="size-3" />
              {dueCount} Upcoming
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isPending ? (
          <div className="py-8 text-center text-sm">Loading vaccination schedule...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Age</TableHead>
                  <TableHead>Vaccine Name</TableHead>
                  <TableHead>Target Disease</TableHead>
                  <TableHead>Route &amp; Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Administered Date / Lot</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => {
                  return (
                    <TableRow key={rec.id}>
                      {/* FIX: all four TableCell classNames removed */}
                      <TableCell>{rec.ageLabel}</TableCell>
                      <TableCell>{rec.name}</TableCell>
                      <TableCell>{rec.diseaseTarget}</TableCell>
                      <TableCell>
                        {rec.route} — {rec.site}
                      </TableCell>
                      <TableCell>
                        {rec.status === "given" && <Badge variant="success">Given</Badge>}
                        {rec.status === "overdue" && <Badge variant="destructive">Overdue</Badge>}
                        {rec.status === "due" && <Badge variant="outline">Due</Badge>}
                        {rec.status === "deferred" && <Badge variant="secondary">Deferred</Badge>}
                      </TableCell>
                      <TableCell>
                        {rec.administeredDate ? (
                          <div>
                            <span>{formatDate(new Date(rec.administeredDate))}</span>
                            {rec.lotNumber && <span className="block">Lot: {rec.lotNumber}</span>}
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.status !== "given" && (
                          <Button onClick={() => setActiveVaccine(rec)} size="sm" variant="outline">
                            <Plus className="mr-1 size-3" />
                            Record
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog onOpenChange={(open) => !open && setActiveVaccine(null)} open={!!activeVaccine}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Vaccination Administration</DialogTitle>
              <DialogDescription>
                Document the administration of {activeVaccine?.name} ({activeVaccine?.ageLabel}).
              </DialogDescription>
            </DialogHeader>

            {activeVaccine && (
              <form noValidate className="space-y-4 pt-2" onSubmit={handleAdminister}>
                <div className="grid gap-1.5">
                  <Label htmlFor="adminDate">Administration Date</Label>
                  <Input
                    id="adminDate"
                    onChange={(e) => setAdministeredDate(e.target.value)}
                    required
                    type="date"
                    value={administeredDate}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="lotNum">Batch / Lot Number (Optional)</Label>
                  <Input
                    id="lotNum"
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="e.g. AB1234X"
                    value={lotNumber}
                  />
                </div>

                <div className="bg-muted/50 space-y-1 rounded-md p-3 text-xs">
                  <p>
                    <strong>Recommended Route:</strong> {activeVaccine.route}
                  </p>
                  <p>
                    <strong>Recommended Site:</strong> {activeVaccine.site}
                  </p>
                  {activeVaccine.notes && (
                    <p>
                      <strong>Clinical Note:</strong> {activeVaccine.notes}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    disabled={recordMutation.isPending}
                    onClick={() => setActiveVaccine(null)}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button disabled={recordMutation.isPending} type="submit">
                    {recordMutation.isPending ? "Recording..." : "Confirm & Save"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
