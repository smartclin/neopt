import {useForm} from "@tanstack/react-form";
import {useQuery} from "@tanstack/react-query";
import {
    AlertCircleIcon,
    CalendarIcon,
    ClockIcon,
    PlusIcon,
    SaveIcon,
    SearchIcon,
    SparklesIcon,
    UserIcon,
    XIcon,
} from "lucide-react";
import * as React from "react";

import {roundToNextSlot, toLocalDateTimeString} from "#/lib/dates.ts";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";
import {Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Spinner} from "@/components/ui/spinner";
import {Textarea} from "@/components/ui/textarea";
import {toast} from "@/components/ui/toast";

import {getPatientQueryOptions, searchPatientsQuery} from "@/features/patients/queries";

import {
    appointmentByIdQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
} from "../queries";
import {PatientSearchResult} from "../types";
import {AppointmentStatusBadge} from "./AppointmentStatusBadge";

// ── Types ──────────────────────────────────────────────────────────────

interface AppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId?: string;
  defaultPatientId?: string;
  clinicId: string;
  onSaved?: () => void;
  onClosed?: () => void;
}

function formErrorMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "form" in err) {
    const f = (err as { form: unknown }).form;
    if (typeof f === "string") return f;
  }
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return null;
}

function ageLabel(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return "Unknown";
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "Unknown";

  const today = new Date();
  let ageYears = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) ageYears -= 1;
  if (ageYears > 0) return `${ageYears}y`;

  const diffMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth()) -
    (today.getDate() < birth.getDate() ? 1 : 0);
  if (diffMonths > 0) return `${diffMonths}mo`;

  const diffDays = Math.max(0, Math.floor((today.getTime() - birth.getTime()) / 86400000));
  return `${diffDays}d`;
}

// ── Patient preview ───────────────────────────────────────────────────

function PatientPreview({ patientId }: { patientId: string }) {
  const q = useQuery(getPatientQueryOptions(patientId));

  if (q.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="text-destructive rounded-lg border border-dashed p-3 text-sm">
        {q.error instanceof Error ? q.error.message : "Could not load patient."}
      </div>
    );
  }
  if (!q.data) {
    return <p className="text-sm">Patient not found (may have been deleted).</p>;
  }

  const p = q.data;
  const initials = `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed p-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">
            {p.firstName} {p.lastName}
          </span>
          <span className="font-mono text-xs">MRN {p.mrn}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="block">Age</span>
          <span>{ageLabel(p.dateOfBirth)}</span>
        </div>
        <div>
          <span className="block">Sex</span>
          <span className="capitalize">{p.sex}</span>
        </div>
        {p.allergies ? (
          <div className="col-span-2">
            <span className="block">Allergies</span>
            <Badge className="mt-0.5" variant="destructive">
              <AlertCircleIcon aria-hidden="true" className="size-3" />
              {p.allergies}
            </Badge>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Patient search ────────────────────────────────────────────────────

interface PatientSearchProps {
  clinicId: string;
  onSelect: (patient: PatientSearchResult) => void;
  onClear?: () => void;
}

function PatientSearch({ clinicId, onSelect, onClear }: PatientSearchProps) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const searchQuery = useQuery(searchPatientsQuery(clinicId, q));
  const results = (searchQuery.data ?? []) as PatientSearchResult[];
  const showDropdown = open && q.trim().length >= 2;

  const pick = (patient: PatientSearchResult) => {
    onSelect(patient);
    setQ(`${patient.firstName} ${patient.lastName}`);
    setOpen(false);
  };

  const clear = () => {
    setQ("");
    onClear?.();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-0 size-3.5 -translate-y-1/2" />
        <Input
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-label="Search patient"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search patient by name or MRN…"
          value={q}
        />
        {q && (
          <button
            aria-label="Clear patient"
            className="hover:text-foreground absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1"
            onClick={clear}
            type="button"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="bg-popover ring-foreground/10 absolute z-50 mt-1 w-full overflow-hidden rounded-xl shadow-lg ring-1"
          role="listbox"
        >
          {searchQuery.isPending ? (
            <div className="px-3 py-2 text-sm">Searching…</div>
          ) : searchQuery.isError ? (
            <div className="text-destructive px-3 py-2 text-sm">
              {searchQuery.error instanceof Error ? searchQuery.error.message : "Search failed."}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm">No patients match.</div>
          ) : (
            results.map((p) => (
              <button
                className="hover:bg-muted flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors"
                key={p.id}
                onClick={() => pick(p)}
                role="option"
                type="button"
              >
                <Avatar size="sm">
                  <AvatarFallback>
                    {p.firstName[0]}
                    {p.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="font-mono text-xs">
                    MRN {p.mrn} · {ageLabel(p.dateOfBirth)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Duration stepper ──────────────────────────────────────────────────

const DURATION_STEPS = [10, 15, 20, 30, 45, 60, 90] as const;

function DurationStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const currentIdx = DURATION_STEPS.indexOf(value as (typeof DURATION_STEPS)[number]);
  const dec = () => {
    if (currentIdx > 0) onChange(DURATION_STEPS[currentIdx - 1]);
  };
  const inc = () => {
    if (currentIdx >= 0 && currentIdx < DURATION_STEPS.length - 1) {
      onChange(DURATION_STEPS[currentIdx + 1]);
    } else if (currentIdx === -1) {
      onChange(DURATION_STEPS[0]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Decrease duration"
        className="border-border hover:bg-muted flex size-8 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-30"
        disabled={currentIdx <= 0}
        onClick={dec}
        type="button"
      >
        −
      </button>
      <span className="min-w-[4.5rem] text-center font-mono text-sm tabular-nums">{value} min</span>
      <button
        aria-label="Increase duration"
        className="border-border hover:bg-muted flex size-8 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-30"
        disabled={currentIdx >= DURATION_STEPS.length - 1}
        onClick={inc}
        type="button"
      >
        +
      </button>
    </div>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────

export function AppointmentSheet({
  open,
  onOpenChange,
  appointmentId,
  defaultPatientId,
  clinicId,
  onSaved,
  onClosed,
}: AppointmentSheetProps) {
  const isEdit = Boolean(appointmentId);

  const existingQuery = useQuery({
    ...appointmentByIdQuery(appointmentId ?? ""),
    enabled: isEdit && open,
  });
  const existing = existingQuery.data;

  const createMutation = useCreateAppointmentMutation();
  const updateMutation = useUpdateAppointmentMutation();

  const [localSelectedPatientId, setLocalSelectedPatientId] = React.useState(
    defaultPatientId ?? "",
  );
  const selectedPatientId = existing?.patientId ?? localSelectedPatientId;

  const defaultScheduledAt = React.useMemo(() => roundToNextSlot(30), []);

  const form = useForm({
    defaultValues: {
      patientId: defaultPatientId ?? "",
      scheduledAt: defaultScheduledAt,
      durationMinutes: 15,
      reason: "",
      notes: "",
    },
    validators: {
      onSubmitAsync: async ({ value }) => {
        try {
          if (isEdit && appointmentId) {
            await updateMutation.mutateAsync({
              data: {
                appointmentId,
                patch: {
                  scheduledAt: new Date(value.scheduledAt),
                  durationMinutes: value.durationMinutes,
                  reason: value.reason || null,
                  notes: value.notes || null,
                },
              },
            });
            toast.add({ type: "success", description: "Appointment updated" });
          } else {
            if (!value.patientId) return { form: "Select a patient first" };
            if (!value.scheduledAt) return { form: "Choose a date and time" };
            await createMutation.mutateAsync({
              data: {
                patientId: value.patientId,
                clinicId,
                scheduledAt: new Date(value.scheduledAt),
                durationMinutes: value.durationMinutes,
                status: "scheduled",
                reason: value.reason || null,
                notes: value.notes || null,
              },
            });
            toast.add({ type: "success", description: "Appointment scheduled" });
          }
          onSaved?.();
          onOpenChange(false);
          return undefined;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Something went wrong";
          toast.add({ type: "error", description: message });
          return { form: message };
        }
      },
    },
  });

  // Sync loaded appointment into form (once per id).
  const lastSyncedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!existing) return;
    if (lastSyncedIdRef.current === existing.id) return;
    lastSyncedIdRef.current = existing.id;
    form.setFieldValue("patientId", existing.patientId);
    form.setFieldValue("scheduledAt", toLocalDateTimeString(new Date(existing.scheduledAt)));
    form.setFieldValue("durationMinutes", existing.durationMinutes);
    form.setFieldValue("reason", existing.reason ?? "");
    form.setFieldValue("notes", existing.notes ?? "");
  }, [existing, form]);

  const findNextSlot = () => {
    form.setFieldValue("scheduledAt", roundToNextSlot(60));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Reset to a clean slate so a reopened sheet doesn't show stale data.
      form.reset();
      lastSyncedIdRef.current = null;
      setLocalSelectedPatientId(defaultPatientId ?? "");
    }
    onOpenChange(next);
    if (!next) onClosed?.();
  };

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg" side="right">
        <SheetHeader className="mx-6 my-4 flex-row items-center justify-between">
          <SheetTitle>{isEdit ? "Edit Appointment" : "New Appointment"}</SheetTitle>
          <div className="flex items-center gap-2">
            {isEdit && existing && <AppointmentStatusBadge status={existing.status} />}
            <SheetClose render={<Button size="icon-sm" variant="ghost" />}>
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        {isEdit && existingQuery.isPending ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="size-3.5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Patient</span>
                </div>

                {!isEdit && !defaultPatientId ? (
                  <PatientSearch
                    clinicId={clinicId}
                    onClear={() => {
                      setLocalSelectedPatientId("");
                      form.setFieldValue("patientId", "");
                    }}
                    onSelect={(p) => {
                      setLocalSelectedPatientId(p.id);
                      form.setFieldValue("patientId", p.id);
                    }}
                  />
                ) : null}

                {selectedPatientId ? <PatientPreview patientId={selectedPatientId} /> : null}
              </div>

              <Separator />

              <form
                className="flex flex-col gap-5"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void form.handleSubmit();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-3.5" />
                    <span className="text-xs font-semibold tracking-wider uppercase">Schedule</span>
                  </div>
                  <button
                    className="text-primary flex items-center gap-1 text-xs hover:underline"
                    onClick={findNextSlot}
                    type="button"
                  >
                    <SparklesIcon className="size-3" />
                    Find next open slot
                  </button>
                </div>

                <form.Field name="scheduledAt">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={field.name}>
                        <ClockIcon aria-hidden="true" className="mr-1.5 inline size-3" />
                        Date &amp; Time
                      </Label>
                      <input
                        aria-invalid={field.state.meta.errors.length > 0}
                        className="border-b-input focus-visible:border-b-ring h-10 w-full border border-transparent bg-transparent px-0 py-1 font-mono text-sm [color-scheme:light_dark] transition-[color,border-color] outline-none"
                        id={field.name}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                        type="datetime-local"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="durationMinutes">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label>Duration</Label>
                      <DurationStepper
                        onChange={(v) => field.handleChange(v)}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <Separator />

                <form.Field name="reason">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={field.name}>
                        Reason <span className="font-normal normal-case">(optional)</span>
                      </Label>
                      <Input
                        id={field.name}
                        maxLength={1000}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Well-child check, fever…"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="notes">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={field.name}>
                        Notes <span className="font-normal normal-case">(optional)</span>
                      </Label>
                      <Textarea
                        id={field.name}
                        maxLength={5000}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Any special instructions or context…"
                        rows={3}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
                  {(err) => {
                    const message = formErrorMessage(err);
                    return message ? (
                      <p className="text-destructive text-sm" role="alert">
                        {message}
                      </p>
                    ) : null;
                  }}
                </form.Subscribe>

                <div className="flex gap-2 pt-2">
                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <Button className="flex-1" disabled={isSubmitting} type="submit">
                        {isSubmitting ? (
                          <Spinner className="size-3.5" />
                        ) : isEdit ? (
                          <SaveIcon className="size-3.5" />
                        ) : (
                          <PlusIcon className="size-3.5" />
                        )}
                        {isEdit ? "Save changes" : "Schedule"}
                      </Button>
                    )}
                  </form.Subscribe>
                  <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
