import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { PageHeader } from "@/components/blocks/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { VisitSnapshot } from "./queries";
import { RightRail } from "./RightRail";
import type { VisitComposerValues } from "./schema";
import { DiagnosesSection } from "./sections/DiagnosesSection";
import { EncounterContextSection } from "./sections/EncounterContextSection";
import { ExamFindingsSection } from "./sections/ExamFindingsSection";
import { PlanSection } from "./sections/PlanSection";
import { PrescriptionsSection } from "./sections/PrescriptionsSection";
import { VitalsSection } from "./sections/VitalsSection";
import { useVisitComposer } from "./use-visit-composer";

interface VisitComposerProps {
  initial: VisitComposerValues;
  snapshot: NonNullable<VisitSnapshot>;
  visitId?: string;
  mode: "create" | "edit";
  onDelete?: () => void;
  onSuccess?: (visitId: string) => void;
}

const SECTION_IDS = ["encounter", "vitals", "exam", "diagnoses", "prescriptions", "plan"] as const;

type SectionId = (typeof SECTION_IDS)[number];

export function VisitComposer({
  initial,
  snapshot,
  visitId,
  mode,
  onDelete,
  onSuccess,
}: VisitComposerProps) {
  const { state, patch, save } = useVisitComposer(initial, visitId);

  const [openSections, setOpenSections] = useState<SectionId[]>([...SECTION_IDS]);

  const handleSave = useCallback(async () => {
    const result = await save();
    if (result?.visitId) {
      onSuccess?.(result.visitId);
    }
  }, [save, onSuccess]);

  const sections = useMemo(
    () => [
      {
        id: "encounter" as const,
        label: "Encounter context",
        render: () => <EncounterContextSection patch={patch} values={state.values} />,
      },
      {
        id: "vitals" as const,
        label: "Vitals & measurements",
        render: () => (
          <VitalsSection patch={patch} patientId={state.values.patientId} values={state.values} />
        ),
      },
      {
        id: "exam" as const,
        label: "Exam findings",
        render: () => <ExamFindingsSection patch={patch} values={state.values} />,
      },
      {
        id: "diagnoses" as const,
        label: "Diagnoses",
        render: () => <DiagnosesSection patch={patch} values={state.values} />,
      },
      {
        id: "prescriptions" as const,
        label: "Prescriptions",
        render: () => <PrescriptionsSection patch={patch} values={state.values} />,
      },
      {
        id: "plan" as const,
        label: "Plan & follow-up",
        render: () => <PlanSection patch={patch} values={state.values} />,
      },
    ],
    [patch, state.values],
  );
  const saveLabel = state.saving ? "Saving…" : mode === "create" ? "Save visit" : "Save changes";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button disabled={state.saving} nativeButton onClick={() => void handleSave()}>
              {saveLabel}
            </Button>
            <Button nativeButton={false} render={<Link to="/app/visits" />} variant="outline">
              Cancel
            </Button>
            {onDelete && (
              <Button nativeButton onClick={onDelete} variant="ghost">
                Delete visit
              </Button>
            )}
          </div>
        }
        description={mode === "create" ? "Compose a clinical note." : "Update the encounter."}
        title={mode === "create" ? "New visit" : "Edit visit"}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <Accordion
            multiple
            onValueChange={(value) => setOpenSections(value as SectionId[])}
            value={openSections}
          >
            {sections.map(({ id, label, render }) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger>{label}</AccordionTrigger>
                <AccordionContent>{render()}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <RightRail saveState={state} snapshot={snapshot} values={state.values} />
        </aside>
      </div>
    </div>
  );
}
