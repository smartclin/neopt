import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { VisitComposerValues } from "../schema";

interface Props {
  values: VisitComposerValues;
  patch: (p: Partial<VisitComposerValues>) => void;
  readOnly?: boolean;
}

export function PlanSection({ values, patch, readOnly }: Props) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="plan">Plan</Label>
        <Textarea
          disabled={readOnly}
          id="plan"
          onChange={(e) => patch({ plan: e.target.value })}
          placeholder="Plan, advice, red flags to return."
          rows={5}
          value={values.plan}
        />
      </div>
      <div className="grid gap-1 sm:w-44">
        <Label htmlFor="followUp">Next visit (weeks)</Label>
        <Input
          disabled={readOnly}
          id="followUp"
          max="52"
          min="0"
          onChange={(e) => patch({ followUpWeeks: e.target.valueAsNumber || 0 })}
          type="number"
          value={values.followUpWeeks ?? ""}
        />
      </div>
    </div>
  );
}
