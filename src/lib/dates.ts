/**
 * src/lib/dates.ts
 *
 * Canonical date/time formatting utilities. Every screen that shows a date or
 * time to a user should use one of these functions so the output is consistent
 * across the application and respects the zone passed in.
 *
 * Rules:
 *  - Never call `toLocaleDateString`, `toLocaleString`, or construct a raw
 *    `Intl.DateTimeFormat` in component code. Use these helpers instead.
 *  - For stored patterns such as `yyyy-MM-dd`, using them directly in code is
 *    fine — the rule only applies to human-readable output.
 */

// ─── Short-date: "Jan 5, 2024" ────────────────────────────────────────────
const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** "Jan 5, 2024" */
export function formatDate(date: Date): string {
  return SHORT_DATE_FMT.format(date);
}

export function formatWeekRange(start: Date, end: Date): string {
  const startFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFmt.format(start)} – ${endFmt.format(end)}`;
}
// ─── Short-time: "14:35" ──────────────────────────────────────────────────
const SHORT_TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "14:35" */
export function formatTime(date: Date): string {
  return SHORT_TIME_FMT.format(date);
}

// ─── Date + time: "Jan 5, 2024, 14:35" ────────────────────────────────────
const DATE_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "Jan 5, 2024, 14:35" */
export function formatDateTime(date: Date): string {
  return DATE_TIME_FMT.format(date);
}

// ─── Weekday-only: "Monday" ────────────────────────────────────────────────
const DAY_FMT = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

/** "Monday" */
export function formatDay(date: Date): string {
  return DAY_FMT.format(date);
}

// ─── Short weekday: "Mon" ─────────────────────────────────────────────────
const SHORT_DAY_FMT = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

/** "Mon" */
export function formatShortDay(date: Date): string {
  return SHORT_DAY_FMT.format(date);
}

// ─── Day heading: "Monday, 5 January" ─────────────────────────────────────
const DAY_HEADING_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Monday, 5 January" */
export function formatDayHeading(date: Date): string {
  return DAY_HEADING_FMT.format(date);
}

// ─── Day heading with year: "Monday, 5 January 2024" ──────────────────────
const DAY_HEADING_YEAR_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Monday, 5 January 2024" */
export function formatDayHeadingWithYear(date: Date): string {
  return DAY_HEADING_YEAR_FMT.format(date);
}

// ─── Local date: "2024-01-05" ─────────────────────────────────────────────
/**
 * "2024-01-05" — a local-time yyyy-MM-dd string, suitable for `<input type="date">`.
 * Not the same as `.toISOString().slice(0,10)` which is always UTC.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Month heading: "January 2024" ────────────────────────────────────────
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

/** "January 2024" */
export function formatMonth(date: Date): string {
  return MONTH_FMT.format(date);
}

// ─── Prompt-style "now": "Monday, 5 Jan 2024 at 14:35" ────────────────────
/**
 * A verbose, unambiguous representation for use in AI prompts or audit logs.
 * Includes weekday, date, and time.
 */
export function formatPromptNow(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
// Date helpers shared by the calendar, the week strip, and the queue.

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function toDateKey(d: Date | string): string {
  const date = startOfDay(new Date(d));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function nowLocalInput(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000 - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function roundToNextSlot(offsetMin = 30): string {
  const d = new Date(Date.now() + offsetMin * 60_000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalDateTimeString(d);
}

/** True for any of the "the appointment no longer needs action" states. */
export function isFinishedStatus(status: string): boolean {
  return status === "completed" || status === "cancelled" || status === "no-show";
}

/** True when a key event landed on a form field. */
export function isEditableTarget(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLInputElement) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  if (el.isContentEditable) return true;
  return false;
}
export function groupByDay<T extends { scheduledAt: Date | string }>(
  appointments: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const appt of appointments) {
    const key = toDateKey(appt.scheduledAt);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(appt);
  }
  return groups;
}
