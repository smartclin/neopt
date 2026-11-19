import {useQuery} from "@tanstack/react-query";
import {cn} from "cn";
import * as React from "react";

import {addDays, formatDayHeading, formatShortDay, startOfDay, toDateKey} from "@/lib/dates";

// ── read: query factory ────────────────────────────────────────────────
import {appointmentsInRangeQuery} from "../queries";

// ── Helpers ────────────────────────────────────────────────────────────
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
      aria-label={`${formatDayHeading(date)}, ${count} appointment${count !== 1 ? "s" : ""}`}
      aria-pressed={selected}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-xl  py-2.5 transition-colors",
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
          isToday ? "text-primary" : "",
        )}
      >
        {formatShortDay(date)}
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
        {date.getDate()}
      </span>

      <div aria-hidden="true" className="flex flex-wrap justify-center gap-[2px]">
        {Array.from({ length: dots }, (_, i) => (
          <span className="bg-primary/60 size-[4px] rounded-full" key={i} />
        ))}
        {overflow > 0 && <span className=" text-[0.5rem]">+{overflow}</span>}
      </div>

      <div aria-hidden="true" className="bg-muted h-[3px] w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct > 0.8 ? "bg-destructive" : pct > 0.5 ? "bg-warning" : "bg-primary/50",
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
const key = toDateKey(d);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [rangeQuery.data]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

const selKey = selectedDate ? toDateKey(selectedDate) : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">This Week</h2>
        <span className=" text-xs">
          {new Intl.DateTimeFormat("en-GB", {
            month: "short",
            day: "numeric",
          }).format(weekStart)}
          {" – "}
          {new Intl.DateTimeFormat("en-GB", {
            month: "short",
            day: "numeric",
          }).format(addDays(weekStart, 6))}
        </span>
      </div>
      <div className="flex gap-0.5">
        {days.map((day) => (
          <DayCell
            count={countByDay[toDateKey(day)] ?? 0}
date={day}
isToday={toDateKey(day) === toDateKey(today)}
key={toDateKey(day)}
onSelect={(d) => onSelectDate?.(d)}
selected={selKey === toDateKey(day)}
          />
        ))}
      </div>
    </div>
  );
}
