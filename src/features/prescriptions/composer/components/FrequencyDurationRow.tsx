import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QUICK = [
  { value: "OD", label: "OD" },
  { value: "BID", label: "BID" },
  { value: "TID", label: "TID" },
  { value: "PRN", label: "PRN" },
] as const;

const DURATION_CHIPS = [
  { label: "x5d", days: 5 },
  { label: "x7d", days: 7 },
  { label: "x10d", days: 10 },
  { label: "x14d", days: 14 },
] as const;

interface FrequencyDurationRowProps {
  frequency: string;
  durationDays: number | null;
  onChange: (next: { frequency?: string; durationDays?: number | null }) => void;
}

export function FrequencyDurationRow({
  frequency,
  durationDays,
  onChange,
}: FrequencyDurationRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="grid gap-1">
        <Label htmlFor="composer-frequency">Frequency</Label>
        <Input
          id="composer-frequency"
          onChange={(e) => onChange({ frequency: e.target.value })}
          placeholder="e.g. BID, q8h PRN"
          value={frequency}
        />
        <div className="flex flex-wrap gap-1">
          {QUICK.map((q) => (
            <button
              className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-2 py-0.5 text-[11px] font-medium"
              key={q.value}
              onClick={() => onChange({ frequency: q.value })}
              type="button"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="composer-duration">Duration (days)</Label>
        <Input
          id="composer-duration"
          inputMode="numeric"
          min="1"
          onChange={(e) =>
            onChange({
              durationDays: e.target.valueAsNumber || null,
            })
          }
          placeholder="Ongoing"
          step="1"
          type="number"
          value={durationDays ?? ""}
        />
        <div className="flex flex-wrap gap-1">
          {DURATION_CHIPS.map((d) => (
            <button
              className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-2 py-0.5 text-[11px] font-medium"
              key={d.days}
              onClick={() => onChange({ durationDays: d.days })}
              type="button"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
