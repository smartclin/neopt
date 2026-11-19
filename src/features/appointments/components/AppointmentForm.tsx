import {useForm} from "@tanstack/react-form";
import {Plus} from "lucide-react";
import {useMemo, useState, type ComponentProps} from "react";
import {z} from "zod";

import {fieldErrorMessage} from "@/components/forms/field-error";
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
import {Textarea} from "@/components/ui/textarea";
import {toast} from "@/components/ui/toast";

import {useCreateAppointmentMutation} from "../queries";

const appointmentSchema = z.object({
  patientId: z.uuid("Invalid patient ID"),
  clinicId: z.string().min(1, "Clinic is required"),
  doctorId: z.uuid("Invalid doctor ID").nullable(),
  scheduledAt: z
    .string()
    .min(1, "Scheduled time is required")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
  durationMinutes: z
    .number({ error: "Duration is required" })
    .int()
    .min(5, "At least 5 minutes")
    .max(240, "At most 240 minutes"),
  reason: z.string().max(1000, "Reason is too long"),
  notes: z.string().max(5000, "Notes are too long"),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

function nowLocalInput(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  // Format the local wall-clock components without UTC conversion.
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

interface AppointmentFormProps {
  patientId?: string;
  clinicId: string;
  defaultDoctorId?: string | null;
  defaultDurationMinutes?: number;
  inline?: boolean;
  onSuccess?: (appointment: { id: string }) => void;
}

export function AppointmentForm({
  patientId = "",
  clinicId,
  defaultDoctorId = null,
  defaultDurationMinutes = 15,
  inline = false,
  onSuccess,
}: AppointmentFormProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateAppointmentMutation();

  const defaultValues = useMemo<AppointmentFormValues>(
    () => ({
      patientId,
      clinicId,
      doctorId: defaultDoctorId ?? null,
      scheduledAt: nowLocalInput(30),
      durationMinutes: defaultDurationMinutes,
      reason: "",
      notes: "",
    }),
    [patientId, clinicId, defaultDoctorId, defaultDurationMinutes],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: appointmentSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const appointment = await createMutation.mutateAsync({
            data: {
              patientId: value.patientId,
              clinicId: value.clinicId,
              doctorId: value.doctorId,
              scheduledAt: new Date(value.scheduledAt),
              durationMinutes: value.durationMinutes,
              reason: value.reason.trim(),
              notes: value.notes.trim(),
            },
          });

          toast.add({ type: "success", description: "Appointment scheduled" });
          form.reset(defaultValues);
          setOpen(false);
          onSuccess?.(appointment as { id: string });
          return undefined;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to schedule appointment";
          return { form: message };
        }
      },
    },
  });


  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset(defaultValues);
  };

  const body = (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {!patientId && (
        <form.Field name="patientId">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Patient ID</Label>
              <Input
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter patient ID"
                required
                value={field.state.value}
              />
              {fieldErrorMessage(field.state.meta.errors[0]) && (
                <p className="text-destructive text-sm" role="alert">
                  {fieldErrorMessage(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="scheduledAt">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Scheduled At</Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              required
              type="datetime-local"
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="durationMinutes">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Duration (minutes)</Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              max={240}
              min={5}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Math.round(e.target.valueAsNumber || 0))}
              required
              step={5}
              type="number"
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="reason">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Reason <span className="font-normal">(optional)</span>
            </Label>
            <Input
              id={field.name}
              maxLength={1000}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Follow-up, vaccination, growth check…"
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>
              Notes <span className="font-normal">(optional)</span>
            </Label>
            <Textarea
              id={field.name}
              maxLength={5000}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
              value={field.state.value}
            />
            {fieldErrorMessage(field.state.meta.errors[0]) && (
              <p className="text-destructive text-sm" role="alert">
                {fieldErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
        {(err) => {
          const message = fieldErrorMessage(err);
          return message ? (
            <p className="text-destructive text-sm" role="alert">
              {message}
            </p>
          ) : null;
        }}
      </form.Subscribe>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex justify-end gap-2">
            {!inline && (
              <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
                Cancel
              </Button>
            )}
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Scheduling…" : "Schedule Appointment"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );

  if (inline) return body;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={(props: ComponentProps<"button">) => (
          <Button {...props} type="button">
            <Plus />
            New Appointment
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Book a visit for this patient. The doctor is optional — the front desk can leave it
            unassigned.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
