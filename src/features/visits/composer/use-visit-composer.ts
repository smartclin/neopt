// features/visits/composer/use-visit-composer.ts
//
// The composer's React-facing hook. Deliberately knows nothing about
// server functions or Drizzle — only about the mutation hook exported
// from `./queries`.

import * as React from "react";

import type { VisitComposerValues } from "./schema";

import { useSaveVisitComposerMutation } from "./queries";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComposerSaveState {
  saving: boolean;
  dirty: boolean;
  lastSavedAt: Date | null;
  error: string | null;
}

export type SaveOutcome = { ok: true; visitId: string } | { ok: false; error: string };

export interface VisitComposerHandle {
  state: ComposerSaveState & { values: VisitComposerValues };
  patch: (partial: Partial<VisitComposerValues>) => void;
  reset: () => void;
  save: () => Promise<SaveOutcome>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The composer's value object is all JSON-safe. `JSON.stringify` is a
 * cheap structural signature. Two invariants make it correct:
 *
 *   1. Key insertion order is stable — `patch` always spreads into the
 *      existing object, and `initial`/`submittedValues` share one shape.
 *      Never construct `values` by spreading a differently-ordered object.
 *   2. Dates serialise as ISO strings, so same-instant Dates compare equal.
 *
 * If a field ever becomes non-JSON-safe (File, Map, …) this is the one
 * place to change.
 */
function signatureOf(values: VisitComposerValues): string {
  return JSON.stringify(values);
}

/** Structural key for an arbitrary JSON-safe value (used to detect prop changes). */
function stableKey(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Identity that, when it changes, means "load fresh data into the editor".
 * Includes `visitId` so navigating create → edit (or between visits on the
 * same route) resets the draft.
 */
function loadKey(initial: VisitComposerValues, visitId: string | undefined): string {
  return stableKey({ initial, visitId: visitId ?? null });
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

type Snapshot = {
  /** Current draft the user is editing. */
  values: VisitComposerValues;
  /** Signature of the last successfully-saved (or loaded) values. */
  savedSignature: string;
  /** The last values known to be persisted — what `reset()` restores to. */
  lastPersisted: VisitComposerValues;
  lastSavedAt: Date | null;
  error: string | null;
  /** Identity of the incoming `(initial, visitId)` pair. */
  key: string;
};

function createSnapshot(
  initial: VisitComposerValues,
  visitId: string | undefined,
  key: string,
): Snapshot {
  const signature = signatureOf(initial);
  return {
    values: initial,
    savedSignature: signature,
    lastPersisted: initial,
    // Only claim "last saved" on edit — a fresh create hasn't been saved yet.
    lastSavedAt: visitId ? new Date() : null,
    error: null,
    key,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useVisitComposer(
  initial: VisitComposerValues,
  visitId?: string,
): VisitComposerHandle {
  const key = loadKey(initial, visitId);

  const [snap, setSnap] = React.useState<Snapshot>(() => createSnapshot(initial, visitId, key));

  // Derive-from-props reset: if the incoming identity changed, swap the
  // whole snapshot atomically. React discards this render's output and
  // re-renders immediately, so the old patient's values are never visible.
  if (snap.key !== key) {
    setSnap(createSnapshot(initial, visitId, key));
  }

  // Latest draft, mirrored OUTSIDE render so `save()` can read it from an
  // event handler without tripping the "no ref writes during render" rule.
  // Initialised from state, updated by `patch`/`reset`/`onSuccess` only.
  const latestValuesRef = React.useRef<VisitComposerValues>(snap.values);

  const currentSignature = React.useMemo(() => signatureOf(snap.values), [snap.values]);
  const dirty = currentSignature !== snap.savedSignature;

  const mutation = useSaveVisitComposerMutation({
    onSuccess: (_result, submittedValues) => {
      latestValuesRef.current = submittedValues;
      const signature = signatureOf(submittedValues);
      setSnap((prev) => ({
        ...prev,
        // Keep the user's live draft, only mark it saved.
        savedSignature: signature,
        lastPersisted: submittedValues,
        lastSavedAt: new Date(),
        error: null,
      }));
    },
    onError: (err) => {
      setSnap((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Could not save visit.",
      }));
    },
  });

  const { mutateAsync } = mutation;

  const patch = React.useCallback((partial: Partial<VisitComposerValues>) => {
    setSnap((prev) => {
      const nextValues = { ...prev.values, ...partial };
      latestValuesRef.current = nextValues;
      return { ...prev, values: nextValues };
    });
  }, []);

  const reset = React.useCallback(() => {
    setSnap((prev) => {
      const lastPersisted = prev.lastPersisted;
      latestValuesRef.current = lastPersisted;
      return {
        ...prev,
        values: lastPersisted,
        savedSignature: signatureOf(lastPersisted),
        error: null,
      };
    });
  }, []);

  const save = React.useCallback(async (): Promise<SaveOutcome> => {
    setSnap((prev) => ({ ...prev, error: null }));
    try {
      const submitted = latestValuesRef.current;
      const result = await mutateAsync({ ...submitted, visitId });
      return { ok: true, visitId: result.visitId };
    } catch (err) {
      // `onError` already wrote the message into state; mirror it here so
      // callers get a self-contained result without reading state.
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not save visit.",
      };
    }
  }, [mutateAsync, visitId]);

  return {
    state: {
      values: snap.values,
      dirty,
      error: snap.error,
      lastSavedAt: snap.lastSavedAt,
      saving: mutation.isPending,
    },
    patch,
    reset,
    save,
  };
}
