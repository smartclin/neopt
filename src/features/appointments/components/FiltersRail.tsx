import {cn} from "cn";
import {CalendarIcon, FilterIcon, RotateCcwIcon, SearchIcon, UserIcon} from "lucide-react";
import {useMemo} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";

import {
    type AppointmentFilters,
    DEFAULT_FILTERS,
    patchFilters,
    resetFilters,
    useAppointmentFilters,
} from "../filters-store";
import {type AppointmentStatus, STATUS_CONFIG} from "../status";

const STATUSES: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No Show" },
];

export function FiltersRail({
  doctors,
}: {
  doctors?: ReadonlyArray<{ id: string; name: string }>;
}) {
  const filters = useAppointmentFilters();
  const active = useMemo(
    () =>
      filters.search || filters.doctorId || filters.status || filters.dateFrom || filters.dateTo,
    [filters],
  );
  const set = <K extends keyof AppointmentFilters>(key: K, value: AppointmentFilters[K]) =>
    patchFilters({ [key]: value } as Partial<AppointmentFilters>);

  const reset = () => resetFilters();
  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className=" size-3.5" />
          <h2 className="text-sm font-semibold">Filters</h2>
          {active && <Badge variant="info">Active</Badge>}
        </div>
        {active && (
          <Button className="" onClick={reset} size="xs" variant="ghost">
            <RotateCcwIcon className="size-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Patient search */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center ">
          <UserIcon className="size-3" />
          Patient
        </Label>
        <div className="relative">
          <SearchIcon className=" absolute top-1/2 left-0 size-3 -translate-y-1/2" />
          <Input

            onChange={(e) => set("search", e.target.value)}
            placeholder="Search name or MRN…"
            value={filters.search}
          />
        </div>
      </div>

      {/* Doctor filter — only render when we have options */}
      {doctors && doctors.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-doctor">
              Doctor
            </Label>
            <select
              className="border-b-input focus-visible:border-b-ring h-9 w-full border border-transparent bg-transparent px-0 py-1 text-sm outline-none"
              id="filter-doctor"
              onChange={(e) => set("doctorId", e.target.value)}
              value={filters.doctorId}
            >
              <option value="">All doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <Separator />

      {/* Status filter */}
      <div className="flex flex-col gap-2">
        <Label >Status</Label>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s.value];
            const isActive = filters.status === s.value;
            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium transition-all",
                  isActive ? cfg.pillClass : "border-border  hover:border-current",
                )}
                key={s.value}
                onClick={() => set("status", isActive ? "" : s.value)}
                type="button"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isActive ? cfg.dotClass : "bg-muted-foreground",
                  )}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Date range */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center ">
          <CalendarIcon className="size-3" />
          Date range
        </Label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className=" text-[0.65rem]">From</span>
            <input
              className="border-b-input focus-visible:border-b-ring h-9 w-full border border-transparent bg-transparent px-0 py-1 text-sm [color-scheme:light_dark] transition-[color,border-color] outline-none"
              onChange={(e) => set("dateFrom", e.target.value)}
              type="date"
              value={filters.dateFrom}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className=" text-[0.65rem]">To</span>
            <input
              className="border-b-input focus-visible:border-b-ring h-9 w-full border border-transparent bg-transparent px-0 py-1 text-sm [color-scheme:light_dark] transition-[color,border-color] outline-none"
              onChange={(e) => set("dateTo", e.target.value)}
              type="date"
              value={filters.dateTo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_FILTERS };
