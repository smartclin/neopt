import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import * as React from "react";

// ── read: query factory ────────────────────────────────────────────────
import { appointmentsInRangeQuery } from "../queries";

// ── Helpers ────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DAY_FMT = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric" });

const MAX_DOTS = 8;

// ── Day cell ───────────────────────────────────────────────────────────

function DayCell({
  date,
  count,
  isToday,
  selected,
  onSelect,
}: {
  date: Date;
  count: number;
  isToday: boolean;
  selected: boolean;
  onSelect: (d: Date) => void;
}) {
  const dots = Math.min(count, MAX_DOTS);
  const overflow = count > MAX_DOTS ? count - MAX_DOTS : 0;
  const pct = Math.min(count / 12, 1);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <button
      aria-label={`${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${count} appointment${count !== 1 ? "s" : ""}`}
      aria-pressed={selected}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 transition-colors",
        isWeekend && "bg-muted/40",
        selected && "bg-primary/10 ring-primary/20 ring-1",
        !selected && !isWeekend && "hover:bg-muted/40",
        isToday && !selected && "ring-primary/30 ring-1",
      )}
      onClick={() => onSelect(date)}
      type="button"
    >
      <span
        className={cn(
          "text-[0.6rem] font-medium tracking-wide uppercase",
          isToday ? "text-primary" : "text-muted-foreground",
        )}
      >
        {DAY_FMT.format(date)}
      </span>

      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
          isToday
            ? "bg-primary text-primary-foreground"
            : selected
              ? "text-primary"
              : "text-foreground",
        )}
      >
        {DATE_FMT.format(date)}
      </span>

      <div aria-hidden="true" className="flex flex-wrap justify-center gap-[2px]">
        {Array.from({ length: dots }, (_, i) => (
          <span className="bg-primary/60 size-[4px] rounded-full" key={i} />
        ))}
        {overflow > 0 && <span className="text-muted-foreground text-[0.5rem]">+{overflow}</span>}
      </div>

      <div aria-hidden="true" className="bg-muted h-[3px] w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct > 0.8 ? "bg-rose-500" : pct > 0.5 ? "bg-amber-400" : "bg-primary/50",
          )}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────

interface WeekStripProps {
  clinicId: string;
  selectedDate?: Date;
  onSelectDate?: (d: Date) => void;
}

export function WeekStrip({ clinicId, selectedDate, onSelectDate }: WeekStripProps) {
  const today = startOfDay(new Date());

  // Week starting Monday
  const weekStart = React.useMemo(() => {
    const d = startOfDay(new Date());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday
    d.setDate(d.getDate() + diff);
    return d;
  }, []);

  const weekEnd = addDays(weekStart, 7);

  // ── read via factory ──────────────────────────────────────────────
  const rangeQuery = useQuery(
    appointmentsInRangeQuery(clinicId, weekStart.toISOString(), weekEnd.toISOString()),
  );

  const countByDay = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const appt of rangeQuery.data ?? []) {
      const d = new Date(appt.scheduledAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [rangeQuery.data]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const selKey = selectedDate ? dateKey(selectedDate) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">This Week</h2>
        <span className="text-muted-foreground text-xs">
          {weekStart.toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric",
          })}{" "}
          –{" "}
          {addDays(weekStart, 6).toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="flex gap-0.5">
        {days.map((day) => (
          <DayCell
            count={countByDay[dateKey(day)] ?? 0}
            date={day}
            isToday={dateKey(day) === dateKey(today)}
            key={dateKey(day)}
            onSelect={(d) => onSelectDate?.(d)}
            selected={selKey === dateKey(day)}
          />
        ))}
      </div>
    </div>
  );
}
