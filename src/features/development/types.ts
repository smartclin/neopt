// features/development/types.ts (append)
import { BabyIcon, BrainIcon, HandIcon, type LucideIcon, MessageCircleIcon } from "lucide-react";

export type MilestoneDomain = "gross-motor" | "fine-motor" | "language" | "social-emotional";

export interface DevelopmentalMilestone {
  id: string;
  domain: MilestoneDomain;
  targetAgeMonths: number;
  ageLabel: string;
  title: string;
  description: string;
  isRedFlagIfMissing?: boolean;
}

export const DEVELOPMENTAL_MILESTONES: DevelopmentalMilestone[] = [
  // 2 Months
  {
    id: "m-2m-social",
    domain: "social-emotional",
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    title: "Social Smile",
    description: "Smiles at people, calms when spoken to or picked up.",
    isRedFlagIfMissing: true,
  },
  {
    id: "m-2m-lang",
    domain: "language",
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    title: "Cooing & Vocalizing",
    description: "Makes sounds other than crying (e.g. 'ooh', 'aah'), turns head toward sounds.",
  },
  {
    id: "m-2m-fine",
    domain: "fine-motor",
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    title: "Visual Tracking",
    description: "Follows objects past midline with eyes, opens and closes hands.",
  },
  {
    id: "m-2m-gross",
    domain: "gross-motor",
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    title: "Head Lift on Tummy",
    description: "Lifts head up when lying on tummy, moves both arms and legs equally.",
  },

  // 4 Months
  {
    id: "m-4m-social",
    domain: "social-emotional",
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    title: "Chuckling & Laughing",
    description: "Chuckles or laughs when you try to make them laugh.",
  },
  {
    id: "m-4m-fine",
    domain: "fine-motor",
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    title: "Reaching for Toys",
    description: "Reaches for and grasps toys, brings hands to mouth.",
  },
  {
    id: "m-4m-gross",
    domain: "gross-motor",
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    title: "No Head Lag / Steady Head",
    description:
      "Holds head steady without support when held upright; pushes up on elbows in tummy time.",
    isRedFlagIfMissing: true,
  },

  // 6 Months
  {
    id: "m-6m-social",
    domain: "social-emotional",
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    title: "Recognizes Familiar Faces",
    description: "Knows familiar people, likes to look at self in a mirror.",
  },
  {
    id: "m-6m-lang",
    domain: "language",
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    title: "Babbling Consonants",
    description: "Babbles with consonants ('ba-ba', 'da-da', 'ma-ma' non-specific).",
    isRedFlagIfMissing: true,
  },
  {
    id: "m-6m-fine",
    domain: "fine-motor",
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    title: "Transferring Objects",
    description: "Passes objects from one hand to the other.",
  },
  {
    id: "m-6m-gross",
    domain: "gross-motor",
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    title: "Rolling Over & Supported Sitting",
    description: "Rolls from tummy to back and back to tummy; sits with support.",
  },

  // 9 Months
  {
    id: "m-9m-gross",
    domain: "gross-motor",
    targetAgeMonths: 9,
    ageLabel: "9 Months",
    title: "Independent Sitting",
    description: "Sits without support, gets into a sitting position independently.",
    isRedFlagIfMissing: true,
  },
  {
    id: "m-9m-fine",
    domain: "fine-motor",
    targetAgeMonths: 9,
    ageLabel: "9 Months",
    title: "Immature Pincer Grasp",
    description: "Picks up small foods using fingers and thumb against side of index finger.",
  },
  {
    id: "m-9m-social",
    domain: "social-emotional",
    targetAgeMonths: 9,
    ageLabel: "9 Months",
    title: "Stranger Anxiety & Object Permanence",
    description: "Clingy with familiar adults around strangers, looks for dropped objects.",
  },

  // 12 Months
  {
    id: "m-12m-lang",
    domain: "language",
    targetAgeMonths: 12,
    ageLabel: "12 Months (1 Year)",
    title: "First Words & Responds to Name",
    description:
      "Says 1-2 words ('mama', 'dada' specifically), understands simple phrases like 'no'.",
    isRedFlagIfMissing: true,
  },
  {
    id: "m-12m-fine",
    domain: "fine-motor",
    targetAgeMonths: 12,
    ageLabel: "12 Months",
    title: "Neat Pincer Grasp",
    description: "Uses tips of thumb and index finger to pick up small objects.",
  },
  {
    id: "m-12m-gross",
    domain: "gross-motor",
    targetAgeMonths: 12,
    ageLabel: "12 Months",
    title: "Cruising / Pulls to Stand",
    description:
      "Pulls up to stand, walks while holding onto furniture ('cruising'), may take first independent steps.",
  },

  // 18 Months
  {
    id: "m-18m-gross",
    domain: "gross-motor",
    targetAgeMonths: 18,
    ageLabel: "18 Months",
    title: "Independent Walking",
    description: "Walks independently without holding on, walks up steps with help.",
    isRedFlagIfMissing: true,
  },
  {
    id: "m-18m-lang",
    domain: "language",
    targetAgeMonths: 18,
    ageLabel: "18 Months",
    title: "Vocabulary of 6-20 Words",
    description: "Uses at least 6-10 single words, points to show what they want.",
  },
  {
    id: "m-18m-fine",
    domain: "fine-motor",
    targetAgeMonths: 18,
    ageLabel: "18 Months",
    title: "Scribbling & Tower of 3 Blocks",
    description: "Scribbles on paper, stacks at least 2-3 blocks, drinks from a cup.",
  },

  // 24 Months (2 Years)
  {
    id: "m-24m-lang",
    domain: "language",
    targetAgeMonths: 24,
    ageLabel: "24 Months (2 Years)",
    title: "2-Word Phrases",
    description: "Puts 2 words together (e.g. 'more milk', 'big dog'), knows common body parts.",
    isRedFlagIfMissing: true,
  },
  {
    id: "m-24m-gross",
    domain: "gross-motor",
    targetAgeMonths: 24,
    ageLabel: "24 Months",
    title: "Runs & Kicks Ball",
    description: "Runs easily, kicks a ball forward, climbs onto furniture without help.",
  },
  {
    id: "m-24m-social",
    domain: "social-emotional",
    targetAgeMonths: 24,
    ageLabel: "24 Months",
    title: "Imitates Adults & Parallel Play",
    description: "Plays alongside other children, notices when others are hurt, copies chores.",
  },
];

export const DOMAIN_META: Record<
  MilestoneDomain,
  {
    label: string;
    shortLabel: string;
    /** Tailwind class fragment for backgrounds (pastel). */
    bg: string;
    /** Tailwind class fragment for text. */
    text: string;
    /** Tailwind class fragment for the ring stroke (via inline SVG or chart). */
    stroke: string;
    /** Solid hex, used by the timeline dots and connecting line. */
    hex: string;
    icon: LucideIcon;
  }
> = {
  "gross-motor": {
    label: "Gross Motor",
    shortLabel: "Gross",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    stroke: "stroke-blue-500",
    hex: "#3b82f6",
    icon: BabyIcon,
  },
  "fine-motor": {
    label: "Fine Motor",
    shortLabel: "Fine",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    stroke: "stroke-purple-500",
    hex: "#a855f7",
    icon: HandIcon,
  },
  language: {
    label: "Language & Communication",
    shortLabel: "Language",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    stroke: "stroke-amber-500",
    hex: "#f59e0b",
    icon: MessageCircleIcon,
  },
  "social-emotional": {
    label: "Social & Emotional",
    shortLabel: "Social",
    bg: "bg-pink-500/10",
    text: "text-pink-700 dark:text-pink-400",
    stroke: "stroke-pink-500",
    hex: "#ec4899",
    icon: BrainIcon,
  },
};

/** Ordered lane list for the timeline. */
export const DOMAIN_ORDER: readonly MilestoneDomain[] = [
  "gross-motor",
  "fine-motor",
  "language",
  "social-emotional",
] as const;

/**
 * A milestone augmented with the patient's own achievement record.
 * `achievedDate` is an ISO date string (YYYY-MM-DD), matching the schema.
 */
export interface PatientMilestone extends DevelopmentalMilestone {
  recordId: string | null;
  isAchieved: boolean;
  achievedDate: string | null;
  notes: string | null;
}

export interface PatientDevelopmentSnapshot {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    sex: "male" | "female";
    dateOfBirth: string; // YYYY-MM-DD
    gestationalAgeWeeks: number | null;
  };
  ageMonths: number;
  correctedAgeMonths: number;
  isPreterm: boolean;
  weeksPremature: number;
  nextCheckupMonths: number;
  milestones: PatientMilestone[];
}
