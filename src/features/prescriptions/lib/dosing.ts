/**
 * Pediatric Dosing & Liquid Suspension Calculator
 *
 * Implements clinical pediatric dosing rules:
 * - Weight-based calculation (mg/kg/day or mg/kg/dose)
 * - Frequency division (e.g. BID = 2 doses, TID = 3 doses)
 * - Liquid suspension volume conversion (mL per dose)
 * - Maximum adult dose ceiling guardrails
 */

export interface PediatricDrugProfile {
  id: string;
  genericName: string;
  brandNames: string[];
  category:
    | "antibiotic"
    | "antipyretic"
    | "analgesic"
    | "bronchodilator"
    | "antihistamine"
    | "steroid"
    | "other";
  recommendedDoseMgPerKgPerDay?: {
    standard: number;
    high?: number;
    maxDailyMg: number;
  };
  recommendedDoseMgPerKgPerDose?: {
    standard: number;
    maxSingleDoseMg: number;
  };
  defaultFrequency: "Q4-6H PRN" | "Q6H" | "Q8H (TID)" | "Q12H (BID)" | "Once Daily (OD)";
  dosesPerDay: number;
  commonConcentrations: Array<{
    label: string;
    mg: number;
    ml: number; // e.g. 250mg / 5ml -> mg: 250, ml: 5
  }>;
  indicationNotes: string;
}

export const COMMON_PEDIATRIC_FORMULARY: PediatricDrugProfile[] = [
  {
    id: "paracetamol",
    genericName: "Paracetamol (Acetaminophen)",
    brandNames: ["Cetal", "Paramol", "Tempra", "Panadol Baby"],
    category: "antipyretic",
    recommendedDoseMgPerKgPerDose: {
      standard: 15, // 10-15 mg/kg/dose
      maxSingleDoseMg: 1000,
    },
    defaultFrequency: "Q4-6H PRN",
    dosesPerDay: 4,
    commonConcentrations: [
      { label: "120 mg / 5 mL (Syrup)", mg: 120, ml: 5 },
      { label: "250 mg / 5 mL (Suspension)", mg: 250, ml: 5 },
      { label: "100 mg / 1 mL (Oral Drops)", mg: 100, ml: 1 },
    ],
    indicationNotes:
      "First-line antipyretic/analgesic. Max 4 doses in 24 hours. Minimum interval 4 hours.",
  },
  {
    id: "ibuprofen",
    genericName: "Ibuprofen",
    brandNames: ["Brufen", "Catafly", "Advil Children"],
    category: "antipyretic",
    recommendedDoseMgPerKgPerDose: {
      standard: 10, // 5-10 mg/kg/dose
      maxSingleDoseMg: 400,
    },
    defaultFrequency: "Q8H (TID)",
    dosesPerDay: 3,
    commonConcentrations: [
      { label: "100 mg / 5 mL (Syrup)", mg: 100, ml: 5 },
      { label: "200 mg / 5 mL (Suspension)", mg: 200, ml: 5 },
    ],
    indicationNotes:
      "Only for infants > 3 months (and > 5 kg). Give with food. Avoid in severe dehydration.",
  },
  {
    id: "amoxicillin",
    genericName: "Amoxicillin",
    brandNames: ["Amoxil", "Ibiamox", "E-Mox"],
    category: "antibiotic",
    recommendedDoseMgPerKgPerDay: {
      standard: 50,
      high: 90, // e.g. for acute otitis media or severe pneumonia
      maxDailyMg: 3000,
    },
    defaultFrequency: "Q8H (TID)",
    dosesPerDay: 3,
    commonConcentrations: [
      { label: "125 mg / 5 mL", mg: 125, ml: 5 },
      { label: "250 mg / 5 mL", mg: 250, ml: 5 },
      { label: "500 mg / 5 mL", mg: 500, ml: 5 },
    ],
    indicationNotes:
      "Standard: 40-50 mg/kg/day; High-dose for AOM/pneumonia: 80-90 mg/kg/day divided Q8H or Q12H.",
  },
  {
    id: "amox-clav",
    genericName: "Amoxicillin / Clavulanic Acid",
    brandNames: ["Augmentin", "Curam", "Megamox", "Hibiotic"],
    category: "antibiotic",
    recommendedDoseMgPerKgPerDay: {
      standard: 45,
      high: 90,
      maxDailyMg: 2000,
    },
    defaultFrequency: "Q12H (BID)",
    dosesPerDay: 2,
    commonConcentrations: [
      { label: "156 mg / 5 mL (4:1)", mg: 125, ml: 5 },
      { label: "228 mg / 5 mL (7:1)", mg: 200, ml: 5 },
      { label: "312 mg / 5 mL (4:1)", mg: 250, ml: 5 },
      { label: "457 mg / 5 mL (7:1)", mg: 400, ml: 5 },
    ],
    indicationNotes:
      "457mg (7:1) suspension is dosed BID (Q12H) to reduce clavulanate-associated diarrhea.",
  },
  {
    id: "azithromycin",
    genericName: "Azithromycin",
    brandNames: ["Zithrokan", "Zithromax", "Xithrone"],
    category: "antibiotic",
    recommendedDoseMgPerKgPerDay: {
      standard: 10,
      maxDailyMg: 500,
    },
    defaultFrequency: "Once Daily (OD)",
    dosesPerDay: 1,
    commonConcentrations: [
      { label: "200 mg / 5 mL", mg: 200, ml: 5 },
      { label: "100 mg / 5 mL", mg: 100, ml: 5 },
    ],
    indicationNotes:
      "Single daily dose for 3 to 5 days. Day 1 may be 10 mg/kg, then 5 mg/kg days 2-5 depending on indication.",
  },
  {
    id: "cetirizine",
    genericName: "Cetirizine",
    brandNames: ["Zyrtec", "Histazine"],
    category: "antihistamine",
    recommendedDoseMgPerKgPerDay: {
      standard: 0.25,
      maxDailyMg: 10,
    },
    defaultFrequency: "Once Daily (OD)",
    dosesPerDay: 1,
    commonConcentrations: [
      { label: "5 mg / 5 mL (Syrup)", mg: 5, ml: 5 },
      { label: "10 mg / 1 mL (Oral Drops)", mg: 10, ml: 1 },
    ],
    indicationNotes:
      "For allergic rhinitis, urticaria. Age 6-12m: 2.5mg OD; 1-2y: 2.5mg BID; 2-5y: 5mg OD; >6y: 10mg OD.",
  },
];

export interface DosingCalculationResult {
  weightKg: number;
  mgPerSingleDose: number;
  mgPerDay: number;
  volumeMlPerDose: number;
  volumeMlPerDay: number;
  frequency: string;
  dosesPerDay: number;
  concentrationLabel: string;
  isMaxCapped: boolean;
  notes: string;
}

export function calculatePediatricDose(params: {
  drug: PediatricDrugProfile;
  weightKg: number;
  concentrationIndex?: number;
  useHighDose?: boolean;
}): DosingCalculationResult {
  const { drug, weightKg, concentrationIndex = 0, useHighDose = false } = params;
  const concentration =
    drug.commonConcentrations[concentrationIndex] ?? drug.commonConcentrations[0];

  let singleDoseMg = 0;
  let totalDailyMg = 0;
  let isCapped = false;

  if (drug.recommendedDoseMgPerKgPerDose) {
    const rawDose = weightKg * drug.recommendedDoseMgPerKgPerDose.standard;
    const maxSingle = drug.recommendedDoseMgPerKgPerDose.maxSingleDoseMg;
    if (rawDose > maxSingle) {
      singleDoseMg = maxSingle;
      isCapped = true;
    } else {
      singleDoseMg = rawDose;
    }
    totalDailyMg = singleDoseMg * drug.dosesPerDay;
  } else if (drug.recommendedDoseMgPerKgPerDay) {
    const targetMgPerKg =
      useHighDose && drug.recommendedDoseMgPerKgPerDay.high
        ? drug.recommendedDoseMgPerKgPerDay.high
        : drug.recommendedDoseMgPerKgPerDay.standard;

    const rawDaily = weightKg * targetMgPerKg;
    const maxDaily = drug.recommendedDoseMgPerKgPerDay.maxDailyMg;

    if (rawDaily > maxDaily) {
      totalDailyMg = maxDaily;
      isCapped = true;
    } else {
      totalDailyMg = rawDaily;
    }

    singleDoseMg = totalDailyMg / drug.dosesPerDay;
  }

  // Calculate volume in mL: (mgNeeded / concentrationMg) * concentrationMl
  const volumeMlPerDose = (singleDoseMg / concentration.mg) * concentration.ml;
  const volumeMlPerDay = volumeMlPerDose * drug.dosesPerDay;

  return {
    weightKg,
    mgPerSingleDose: Math.round(singleDoseMg * 10) / 10,
    mgPerDay: Math.round(totalDailyMg * 10) / 10,
    volumeMlPerDose: Math.round(volumeMlPerDose * 10) / 10,
    volumeMlPerDay: Math.round(volumeMlPerDay * 10) / 10,
    frequency: drug.defaultFrequency,
    dosesPerDay: drug.dosesPerDay,
    concentrationLabel: concentration.label,
    isMaxCapped: isCapped,
    notes: drug.indicationNotes,
  };
}
