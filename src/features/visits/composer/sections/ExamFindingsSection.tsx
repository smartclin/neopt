import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { VisitComposerValues } from "../schema";

const TEMPLATES: Record<string, string> = {
  "well-child":
    "General: alert, well-appearing. HEENT: normocephalic, atraumatic. Chest: clear to auscultation bilaterally. Heart: RRR, no murmurs. Abdomen: soft, non-tender, no hepatosplenomegaly. Skin: warm, dry, no rashes.",
  URI: "General: alert, mild distress. HEENT: oropharyngeal erythema, no exudate. TMs: pearly grey, mobile. Chest: coarse breath sounds, no wheeze. Heart: RRR. Abdomen: soft.",
  gastro:
    "General: alert, mild dehydration. Abdomen: soft, mild diffuse tenderness, hyperactive bowel sounds. Skin: decreased turgor. Mucous membranes: tacky.",
};

interface Props {
  values: VisitComposerValues;
  patch: (p: Partial<VisitComposerValues>) => void;
  readOnly?: boolean;
}

export function ExamFindingsSection({ values, patch, readOnly }: Props) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1">
        {Object.keys(TEMPLATES).map((name) => (
          <button
            className="bg-muted  hover:bg-muted/80 rounded-full px-2.5 py-0.5 text-xs font-medium"
            disabled={readOnly}
            key={name}
            onClick={() => patch({ examFindings: TEMPLATES[name], template: name as never })}
            type="button"
          >
            {name}
          </button>
        ))}
        {values.template && <Badge variant="secondary">template: {values.template}</Badge>}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="examFindings">Exam findings</Label>
        <Textarea
          disabled={readOnly}
          id="examFindings"
          onChange={(e) => patch({ examFindings: e.target.value })}
          placeholder="Free text, or pick a template above."
          rows={6}
          value={values.examFindings}
        />
      </div>
    </div>
  );
}
