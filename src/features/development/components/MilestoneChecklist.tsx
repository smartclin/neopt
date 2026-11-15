import { AlertTriangle, Award } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEVELOPMENTAL_MILESTONES, type MilestoneDomain } from "../types";

interface MilestoneChecklistProps {
  childAgeMonths?: number;
  correctedAgeMonths?: number;
}

const AGE_BRACKETS = [2, 4, 6, 9, 12, 18, 24];

const DOMAIN_LABELS: Record<MilestoneDomain, { label: string; badge: string }> = {
  "gross-motor": {
    label: "Gross Motor",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  "fine-motor": {
    label: "Fine Motor",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  language: {
    label: "Language & Communication",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  "social-emotional": {
    label: "Social & Emotional",
    badge: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  },
};

export function MilestoneChecklist({
  childAgeMonths = 6,
  correctedAgeMonths,
}: MilestoneChecklistProps) {
  const effectiveAge = correctedAgeMonths ?? childAgeMonths;

  // Closest bracket
  const initialBracket = useMemo(() => {
    let closest = AGE_BRACKETS[0];
    let minDiff = Math.abs(effectiveAge - closest);
    for (const b of AGE_BRACKETS) {
      const diff = Math.abs(effectiveAge - b);
      if (diff < minDiff) {
        minDiff = diff;
        closest = b;
      }
    }
    return closest;
  }, [effectiveAge]);

  const [selectedAge, setSelectedAge] = useState<number>(initialBracket);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const currentMilestones = useMemo(
    () => DEVELOPMENTAL_MILESTONES.filter((m) => m.targetAgeMonths === selectedAge),
    [selectedAge],
  );

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const achievedCount = currentMilestones.filter((m) => checkedIds.has(m.id)).length;
  const missingRedFlags = currentMilestones.filter(
    (m) => m.isRedFlagIfMissing && !checkedIds.has(m.id),
  );

  return (
    <Card className="w-full shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
              <Award className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Developmental Milestones & Neurodevelopmental Screening
              </CardTitle>
              <CardDescription>
                Screening gross motor, fine motor, communication, and social skills at well-child
                visits
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-44">
              <Select
                onValueChange={(val) => val && setSelectedAge(Number.parseInt(val, 10))}
                value={String(selectedAge)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select check-up age" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_BRACKETS.map((age) => (
                    <SelectItem key={age} value={String(age)}>
                      {age < 12 ? `${age} Months Check-up` : `${age / 12} Year(s) Check-up`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge className="text-xs" variant="outline">
              {achievedCount} / {currentMilestones.length} Met
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {effectiveAge > selectedAge + 1 && missingRedFlags.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <span className="font-semibold">Developmental Alert:</span> One or more key milestone
              red flags are unverified for child's age ({effectiveAge.toFixed(1)} months):
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {missingRedFlags.map((rf) => (
                  <li key={rf.id}>
                    {rf.title} ({rf.ageLabel})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {currentMilestones.map((m) => {
            const isChecked = checkedIds.has(m.id);
            const domainMeta = DOMAIN_LABELS[m.domain];

            return (
              <div
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  isChecked
                    ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20"
                    : "hover:bg-muted/50"
                }`}
                key={m.id}
                onClick={() => toggleCheck(m.id)}
              >
                <Checkbox
                  checked={isChecked}
                  className="mt-0.5"
                  onCheckedChange={() => toggleCheck(m.id)}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-foreground text-sm font-semibold">{m.title}</span>
                    <Badge className={`text-[10px] ${domainMeta.badge}`} variant="secondary">
                      {domainMeta.label}
                    </Badge>
                    {m.isRedFlagIfMissing && (
                      <Badge
                        className="text-destructive border-destructive/30 text-[10px]"
                        variant="outline"
                      >
                        Critical
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
