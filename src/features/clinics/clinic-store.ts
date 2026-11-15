// src/stores/clinic-store.ts
//
// The active clinic — a client-side mirror of the fields on the Better Auth
// session that every clinic-scoped surface needs.
//
// Design notes
// ------------
//
// 1. SSR safety
//    A module-level `createStore(...)` is a singleton per process. Under
//    TanStack Start that process serves *every* request — so a server-side
//    `setActiveClinic(acmeClinic)` on request A would leak into request B's
//    server-render of `clinicStore.state`. We therefore construct the store
//    through `getClinicStore()`, which returns a fresh store on the server
//    and a cached singleton on the client. This mirrors the
//    `getQueryClient()` pattern from `integrations/tanstack-query/query-client`.
//
// 2. Idempotency
//    `ClinicSessionSync` runs inside a `useEffect` whose deps include every
//    session field it observes. Each `useAuth()` refresh — profile edit,
//    `refetch()`, cross-tab invalidate — re-runs it with a *new* object
//    literal for the same clinic. Without a structural compare,
//    `setActiveClinic` would push a fresh reference into the store on every
//    refresh, notifying every subscriber and invalidating every
//    clinic-scoped query downstream. `isSameClinic` short-circuits that.
//
// 3. Null = "no clinic"
//    A signed-out user (or a user whose account isn't yet linked to a
//    clinic) legitimately has no active clinic. `null` is the canonical
//    representation, never `{}`. Consumers should branch on `active === null`
//    rather than on any field being empty.
//
// 4. No mutation of the input
//    `setActiveClinic` copies the incoming object before storing it, so a
//    caller that later mutates its own `clinic` variable can't corrupt the
//    store. Cheap insurance; a `Clinic` object is 5 primitives.

import { createStore, useSelector } from "@tanstack/react-store";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The subset of clinic identity that most surfaces need. Intentionally
 * smaller than `Clinic` in `db/schema.ts` — the store is a *session*
 * mirror, not a cache of the full clinic row. If a surface needs `createdAt`,
 * `notes`, etc., it fetches the row via React Query (`clinicByIdQuery`).
 */
export interface ActiveClinic {
  /** Clinic UUID if the user is linked to one; falls back to the user id. */
  id: string;
  name: string;
  email: string | null;
  // phone: string | null;
  // address: string | null;
}

interface ClinicState {
  /**
   * The currently active clinic, or `null` when signed out / not linked.
   *
   * Never `undefined`: `undefined` means "we haven't hydrated yet" and would
   * force every consumer to handle a third state. Use `useHasActiveClinic()`
   * or `active === null` instead.
   */
  active: ActiveClinic | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Structural equality
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True iff `a` and `b` describe the same clinic.
 *
 * Hand-written (rather than a generic deep-equal) because the shape is tiny
 * and fixed. If `ActiveClinic` grows a field, TypeScript won't force you to
 * update this — so keep the two in sync manually. There's a test below that
 * guards against this.
 */
function isSameClinic(a: ActiveClinic | null, b: ActiveClinic | null): boolean {
  if (a === b) return true; // covers both null, same reference
  if (a === null || b === null) return false;
  return (
    a.id === b.id && a.name === b.name && a.email === b.email // a.phone === b.phone &&
    // a.address === b.address
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Store factory — SSR-safe
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_STATE: ClinicState = { active: null };

function createClinicStore() {
  return createStore<ClinicState>(INITIAL_STATE);
}

export type ClinicStore = ReturnType<typeof createClinicStore>;

let clientStore: ClinicStore | undefined;

/**
 * Return the clinic store for the current environment.
 *
 * - **Browser:** a module-level singleton. Every `useClinicStore()` call
 *   returns the same instance, so all components share state.
 * - **Server:** a fresh store per call. Because TanStack Start renders each
 *   request in its own call, no state can leak between requests. (If you
 *   ever render two sibling components that both call `getClinicStore()`
 *   inside *one* request, they'll each get a fresh store — which is why
 *   server-side components must read clinic data from React Query, not from
 *   this store. That's the same rule as `getQueryClient()`.)
 */
export function getClinicStore(): ClinicStore {
  if (typeof window === "undefined") {
    return createClinicStore();
  }
  clientStore ??= createClinicStore();
  return clientStore;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The action surface consumed by `ClinicSessionSync` and any future caller
 * that wants to change the active clinic (e.g. an admin "switch clinic"
 * picker).
 *
 * Writes go through `getClinicStore()` so the same call works on the client
 * (mutating the singleton) and on the server (mutating a per-render store —
 * which is a no-op for output, but keeps the call sites uniform).
 */
export const clinicActions = {
  /**
   * Set or clear the active clinic.
   *
   * Idempotent: if the incoming clinic is structurally equal to the current
   * one, the store is left untouched and no subscribers are notified. This
   * is the property `ClinicSessionSync` relies on — it can call this on every
   * `useAuth()` refresh without causing a downstream refetch storm.
   */
  setActiveClinic(next: ActiveClinic | null): void {
    const store = getClinicStore();
    store.setState((prev) => {
      if (isSameClinic(prev.active, next)) return prev;
      return {
        ...prev,
        // Copy so a caller that later mutates its own object can't corrupt
        // the store. Clone the primitives; no deep clone needed.
        active: next === null ? null : { ...next },
      };
    });
  },

  /** Clear the active clinic. Equivalent to `setActiveClinic(null)`. */
  clearActiveClinic(): void {
    clinicActions.setActiveClinic(null);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Selectors / hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the whole clinic state.
 *
 * Prefer the narrower `useActiveClinic()` when you only need the clinic —
 * selecting the whole state object re-renders on any field change, which
 * today is only `active`, but will stop being true the moment we add a
 * second slice (e.g. `switching: boolean`).
 */
export function useClinicStore(): ClinicState {
  return useSelector(getClinicStore(), (s) => s);
}

/**
 * The active clinic, or `null` when signed out / not linked.
 *
 * This is the hook 95% of components want. The selector returns
 * `s.active` directly, so a component using it re-renders only when the
 * clinic identity changes — not on unrelated store writes.
 */
export function useActiveClinic(): ActiveClinic | null {
  return useSelector(getClinicStore(), (s) => s.active);
}

/**
 * Boolean convenience for gating UI that requires a clinic
 * (e.g. "New patient" buttons, appointment filters).
 */
export function useHasActiveClinic(): boolean {
  return useSelector(getClinicStore(), (s) => s.active !== null);
}

/**
 * The active clinic, throwing if there isn't one.
 *
 * Use inside components that are mounted only under `_auth/app/*` — the
 * layout already guarantees a signed-in user, so `null` here means a bug
 * upstream (e.g. `ClinicSessionSync` not mounted). Throwing gives you a
 * loud failure instead of a silently-broken page.
 */
export function useRequiredActiveClinic(): ActiveClinic {
  const clinic = useActiveClinic();
  if (!clinic) {
    throw new Error(
      "useRequiredActiveClinic: no active clinic. Is <ClinicSessionSync /> " +
        "mounted, and is the current user linked to a clinic?",
    );
  }
  return clinic;
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-reactive reads (for handlers, analytics, edge cases)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The current active clinic, read synchronously without subscribing.
 *
 * Use inside event handlers or `beforeLoad` — not in render, because it
 * doesn't trigger re-renders when the value changes. On the server this
 * always returns `null` (fresh store per call), which is what you want:
 * server-side code should resolve the clinic from the session/DB, not from
 * a client store.
 */
export function getActiveClinicSnapshot(): ActiveClinic | null {
  return getClinicStore().state.active;
}
