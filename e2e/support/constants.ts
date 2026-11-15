/**
 * Single source of truth for the e2e suite: credentials, storage state and
 * the application routes under test.
 *
 * Route strings must match `src/routeTree.gen.ts`. Every authenticated route
 * lives under the `/app` prefix (the `_auth` layout); every public route is a
 * child of the `_guest` layout.
 */

/** The administrator created by `bun run db:seed:admin`. */
export const ADMIN = {
  name: "DrHazem",
  email: process.env.E2E_ADMIN_EMAIL ?? "clinysmar@gmail.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? "HealthF27",
} as const;

/** Where the `setup` project persists the authenticated session. */
export const ADMIN_STORAGE_STATE = "e2e/.auth/admin.json";

/** Brand name rendered by the guest layout header. */
export const APP_NAME = "Dr. Hazem Ali";

/** Marketing copy used to assert the landing hero rendered. */
export const LANDING_HERO = /clinic platform your/i;

/** Routes exercised by the suite. */
export const ROUTES = {
  // public
  landing: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  about: "/about",
  services: "/services",
  privacy: "/privacy",
  terms: "/terms",

  // authenticated (`/app`)
  dashboard: "/app",
  patients: "/app/patients",
  newPatient: "/app/patients/new",
  appointments: "/app/appointments",
  appointmentsCalendar: "/app/appointments/calendar",
  newAppointment: "/app/appointments/new",
  visits: "/app/visits",
  prescriptions: "/app/prescriptions",
  doseCalculator: "/app/prescriptions/neonatal-dose-calculator",
  immunizations: "/app/immunizations",
  development: "/app/development",
  clinics: "/app/clinics",
} as const;

/**
 * Authenticated route groups the guard suite tries to reach without a session.
 * Each one must bounce back to `/login`.
 */
export const PROTECTED_ROUTES: readonly string[] = [
  ROUTES.dashboard,
  ROUTES.patients,
  ROUTES.newPatient,
  ROUTES.appointments,
  ROUTES.appointmentsCalendar,
  ROUTES.newAppointment,
  ROUTES.visits,
  ROUTES.prescriptions,
  ROUTES.doseCalculator,
  ROUTES.immunizations,
  ROUTES.development,
  ROUTES.clinics,
];
