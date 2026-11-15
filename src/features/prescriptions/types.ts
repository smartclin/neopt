import type { Prescription } from "@/db/schema";

/** One row of the prescription list, with the joined visit summary. */
export type PrescriptionRow = Prescription & {
  visit: {
    visitedAt: Date;
    ageMonths?: number | null;
  } | null;
  prescribedBy: {
    id: string;
    name: string;
  } | null;
};
