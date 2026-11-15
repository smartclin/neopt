import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InstructionsFieldProps {
  value: string;
  onChange: (v: string) => void;
}

export function InstructionsField({ value, onChange }: InstructionsFieldProps) {
  return (
    <div className="grid gap-1">
      <Label htmlFor="composer-instructions">Instructions (optional)</Label>
      <Textarea
        id="composer-instructions"
        maxLength={2000}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Take with food. Complete the full course even if symptoms improve."
        rows={3}
        value={value}
      />
    </div>
  );
}
