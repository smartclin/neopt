export type VaccineStatus = "given" | "due" | "overdue" | "deferred";

export interface VaccineScheduleItem {
  id: string;
  vaccineKey: string;
  name: string;
  diseaseTarget: string;
  doseNumber: number;
  targetAgeMonths: number;
  ageLabel: string;
  route: "Oral" | "Intramuscular (IM)" | "Subcutaneous (SC)" | "Intradermal (ID)";
  site: "Anterolateral Thigh" | "Deltoid" | "Mouth" | "Left Forearm";
  notes?: string;
}

export interface PatientVaccinationRecord extends VaccineScheduleItem {
  recordId?: string;
  patientId: string;
  status: VaccineStatus;
  administeredDate?: Date | null;
  scheduledDate?: Date | null;
  lotNumber?: string | null;
  administeredBy?: string | null;
  adverseEvents?: string | null;
}

export const ROUTINE_CHILDHOOD_SCHEDULE: VaccineScheduleItem[] = [
  // Birth
  {
    id: "bcg-birth",
    vaccineKey: "bcg",
    name: "BCG",
    diseaseTarget: "Tuberculosis",
    doseNumber: 1,
    targetAgeMonths: 0,
    ageLabel: "Birth",
    route: "Intradermal (ID)",
    site: "Deltoid",
    notes: "Given at birth; creates small papule/scar within 6-8 weeks",
  },
  {
    id: "hepb-birth",
    vaccineKey: "hepb",
    name: "Hepatitis B (Birth dose)",
    diseaseTarget: "Hepatitis B",
    doseNumber: 1,
    targetAgeMonths: 0,
    ageLabel: "Birth (within 24h)",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "opv-birth",
    vaccineKey: "opv",
    name: "Oral Polio (OPV Zero)",
    diseaseTarget: "Poliomyelitis",
    doseNumber: 0,
    targetAgeMonths: 0,
    ageLabel: "Birth",
    route: "Oral",
    site: "Mouth",
  },

  // 2 Months
  {
    id: "penta-1",
    vaccineKey: "penta",
    name: "Pentavalent 1 (DTP-HepB-Hib)",
    diseaseTarget: "Diphtheria, Tetanus, Pertussis, Hep B, Hib",
    doseNumber: 1,
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "ipv-1",
    vaccineKey: "ipv",
    name: "Inactivated Polio (IPV 1)",
    diseaseTarget: "Poliomyelitis",
    doseNumber: 1,
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "rota-1",
    vaccineKey: "rota",
    name: "Rotavirus 1",
    diseaseTarget: "Rotavirus Diarrhea",
    doseNumber: 1,
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    route: "Oral",
    site: "Mouth",
  },
  {
    id: "pcv-1",
    vaccineKey: "pcv",
    name: "Pneumococcal Conjugate (PCV 1)",
    diseaseTarget: "Pneumonia, Meningitis (S. pneumoniae)",
    doseNumber: 1,
    targetAgeMonths: 2,
    ageLabel: "2 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },

  // 4 Months
  {
    id: "penta-2",
    vaccineKey: "penta",
    name: "Pentavalent 2 (DTP-HepB-Hib)",
    diseaseTarget: "Diphtheria, Tetanus, Pertussis, Hep B, Hib",
    doseNumber: 2,
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "ipv-2",
    vaccineKey: "ipv",
    name: "Inactivated Polio (IPV 2)",
    diseaseTarget: "Poliomyelitis",
    doseNumber: 2,
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "rota-2",
    vaccineKey: "rota",
    name: "Rotavirus 2",
    diseaseTarget: "Rotavirus Diarrhea",
    doseNumber: 2,
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    route: "Oral",
    site: "Mouth",
  },
  {
    id: "pcv-2",
    vaccineKey: "pcv",
    name: "Pneumococcal Conjugate (PCV 2)",
    diseaseTarget: "Pneumonia, Meningitis",
    doseNumber: 2,
    targetAgeMonths: 4,
    ageLabel: "4 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },

  // 6 Months
  {
    id: "penta-3",
    vaccineKey: "penta",
    name: "Pentavalent 3 (DTP-HepB-Hib)",
    diseaseTarget: "Diphtheria, Tetanus, Pertussis, Hep B, Hib",
    doseNumber: 3,
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "ipv-3",
    vaccineKey: "ipv",
    name: "Inactivated Polio (IPV 3)",
    diseaseTarget: "Poliomyelitis",
    doseNumber: 3,
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },
  {
    id: "pcv-3",
    vaccineKey: "pcv",
    name: "Pneumococcal Conjugate (PCV 3)",
    diseaseTarget: "Pneumonia, Meningitis",
    doseNumber: 3,
    targetAgeMonths: 6,
    ageLabel: "6 Months",
    route: "Intramuscular (IM)",
    site: "Anterolateral Thigh",
  },

  // 9 Months
  {
    id: "measles-9m",
    vaccineKey: "measles",
    name: "Measles / Vitamin A (100,000 IU)",
    diseaseTarget: "Measles, Vitamin A deficiency",
    doseNumber: 1,
    targetAgeMonths: 9,
    ageLabel: "9 Months",
    route: "Subcutaneous (SC)",
    site: "Deltoid",
  },

  // 12 Months
  {
    id: "mmr-1",
    vaccineKey: "mmr",
    name: "MMR 1 (Measles, Mumps, Rubella)",
    diseaseTarget: "Measles, Mumps, Rubella",
    doseNumber: 1,
    targetAgeMonths: 12,
    ageLabel: "12 Months (1 Year)",
    route: "Subcutaneous (SC)",
    site: "Deltoid",
  },
  {
    id: "varicella-1",
    vaccineKey: "varicella",
    name: "Chickenpox (Varicella 1)",
    diseaseTarget: "Varicella Zoster",
    doseNumber: 1,
    targetAgeMonths: 12,
    ageLabel: "12 Months",
    route: "Subcutaneous (SC)",
    site: "Deltoid",
  },

  // 18 Months
  {
    id: "mmr-2",
    vaccineKey: "mmr",
    name: "MMR 2 (Booster)",
    diseaseTarget: "Measles, Mumps, Rubella",
    doseNumber: 2,
    targetAgeMonths: 18,
    ageLabel: "18 Months",
    route: "Subcutaneous (SC)",
    site: "Deltoid",
  },
  {
    id: "dtp-booster-1",
    vaccineKey: "dtp",
    name: "DTP Booster 1 + OPV",
    diseaseTarget: "Diphtheria, Tetanus, Pertussis, Polio",
    doseNumber: 4,
    targetAgeMonths: 18,
    ageLabel: "18 Months",
    route: "Intramuscular (IM)",
    site: "Deltoid",
  },
  {
    id: "hepa-1",
    vaccineKey: "hepa",
    name: "Hepatitis A 1",
    diseaseTarget: "Hepatitis A",
    doseNumber: 1,
    targetAgeMonths: 18,
    ageLabel: "18 Months",
    route: "Intramuscular (IM)",
    site: "Deltoid",
  },
];

export interface ImmunizationCoverage {
  dueThisWeek: number;
  overdue: number;
  coveragePct: number;
  refusedOrDeferred: number;
  byVaccine: Array<{
    vaccineKey: string;
    vaccineName: string;
    given: number;
    due: number;
    overdue: number;
    pct: number;
  }>;
}

export interface MatrixVaccine {
  doses: number | undefined;
  vaccineKey: string;
  vaccineName: string;
  /** Actual dose numbers in render order, e.g. [0, 1, 2, 3] for OPV. */
  doseNumbers: number[];
}

export interface MatrixRow {
  patientId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  sex: "male" | "female";
  dateOfBirth: string;
  /** key = `${vaccineKey}-${doseNumber}`, value = resolved status */
  cells: Record<string, "given" | "due" | "overdue" | "refused">;
}

export interface MatrixResult {
  vaccines: MatrixVaccine[];
  rows: MatrixRow[];
}
