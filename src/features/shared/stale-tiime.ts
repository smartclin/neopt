// Lib/query-stale-times.ts
export const STALE = {
  /** Dashboard summary counts: aggregates, tolerate staleness. */
  DASHBOARD: 60 * 1000,
  /** Single-record reads. */
  DETAIL: 60 * 1000,
  /** Encounter lists: active clinical work. */
  ENCOUNTERS: 30 * 1000,
  GROWTH: 60 * 1000,
  /** Lists that paginate: patient roster, appointment book. */
  LIST: 2 * 60 * 1000,
  /** Patient demographics: name, DOB, blood group. */
  PATIENT_DEMOGRAPHICS: 5 * 60 * 1000,
  PRESCRIPTION: 30 * 1000,
  /** Static reference data — never stale. */
  STATIC: Number.POSITIVE_INFINITY,
} as const;
