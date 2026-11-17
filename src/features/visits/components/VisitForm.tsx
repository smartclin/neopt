import {useForm} from "@tanstack/react-form";
import {Plus} from "lucide-react";
import {useState} from "react";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {toast} from "@/components/ui/toast";
import {useCreateVisitMutation} from "@/features/visits/queries";

const pad = (n: number) => String(n).padStart(2, "0");

function splitAgeMonths(total: number): {
  ageYears: number;
  ageMonthsRemainder: number;
} {
  const years = Math.floor(total / 12);
  const months = Math.round(total - years * 12);
  return months >= 12
    ? { ageYears: years + 1, ageMonthsRemainder: 0 }
    : { ageYears: years, ageMonthsRemainder: months };
}

function toDateTimeLocalString(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function fromDateTimeLocalString(value: string): Date {
  return new Date(value);
}

const visitFormSchema = z.object({
  patientId: z.uuid(),
  clinicId: z.uuid(),
  visitedAt: z.date(),
  ageMonths: z.number().min(0, "Age must be ≥ 0").max(1200),
});

export interface VisitFormProps {
  patientId: string;
  clinicId?: string;
  defaultAgeMonths?: number;
  inline?: boolean;
  onSuccess?: (visit: { id: string }) => void;
}

export function VisitForm({
  patientId,
  clinicId,
  defaultAgeMonths = 0,
  inline = false,
  onSuccess,
}: VisitFormProps) {
  const [open, setOpen] = useState(false);
  const createVisit = useCreateVisitMutation();

  const form = useForm({
    defaultValues: {
      patientId,
      clinicId: clinicId ?? "",
      visitedAt: new Date(),
      ageMonths: defaultAgeMonths,
    },
    validators: {
      onSubmit: visitFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { ageYears, ageMonthsRemainder } = splitAgeMonths(value.ageMonths);
        const visit = await createVisit.mutateAsync({
          patientId: value.patientId,
          clinicId: value.clinicId,
          visitedAt: value.visitedAt,
          ageMonths: value.ageMonths,
          ageYears,
          ageMonthsRemainder,
        });
        toast.add({ type: "success", description: "Visit encounter recorded" });
        form.reset();
        setOpen(false);
        onSuccess?.(visit);
      } catch (error) {
        toast.add({
          type: "destructive",
          description: error instanceof Error ? error.message : "Failed to record visit",
        });
      }
    },
  });

  const formBody = (
    <form
    noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="visitedAt">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="visitedAt">Visit Date & Time</Label>
            <Input
              id="visitedAt"
              onChange={(e) => field.handleChange(fromDateTimeLocalString(e.target.value))}
              type="datetime-local"
              value={toDateTimeLocalString(new Date(field.state.value))}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="ageMonths">
        {(field) => (
          <div className="grid gap-1.5">
            <Label htmlFor="ageMonths">Child Age at Visit (Months)</Label>
            <Input
              id="ageMonths"
              max="240"
              min="0"
              onChange={(e) => field.handleChange(Number.parseFloat(e.target.value) || 0)}
              step="0.1"
              type="number"
              value={field.state.value}
            />
            {field.state.value > 0 && (
              <p className=" text-xs">
                Equates to approx. {Math.floor(field.state.value / 12)} years,{" "}
                {Math.round(field.state.value % 12)} months
              </p>
            )}
          </div>
        )}
      </form.Field>

      {!clinicId && (
        <form.Field name="clinicId">
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor="clinicId">Clinic ID</Label>
              <Input
                id="clinicId"
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter clinic UUID"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
      )}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button className="w-full" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : "Start Encounter / Save Visit"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );

  if (inline) {
    return (
      <div className="bg-card rounded-lg border p-6 shadow-xs">
        <h3 className="mb-4 text-lg font-semibold">Record New Visit</h3>
        {formBody}
      </div>
    );
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-1.5 size-4" />
        New Visit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Clinical Visit</DialogTitle>
          <DialogDescription>
            Record a new pediatric encounter to document growth measurements, diagnoses, and
            prescriptions.
          </DialogDescription>
        </DialogHeader>
        {formBody}
      </DialogContent>
    </Dialog>
  );
}
