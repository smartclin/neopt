// features/visits/composer/use-visit-composer.ts
//
// The composer's React-facing hook. Deliberately knows nothing about
// server functions, queryOptions, or Drizzle — only about the mutation
// hook exported from `./query-options`.

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

export interface VisitComposerHandle {
  state: ComposerSaveState & { values: VisitComposerValues };
  patch: (partial: Partial<VisitComposerValues>) => void;
  reset: () => void;
  save: () => Promise<{ visitId: string } | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialisation — cheap structural dirty check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The composer's value object is all JSON-safe (numbers, strings, Dates,
 * plain objects, arrays of the same). `JSON.stringify` is a cheap way to
 * get a stable structural signature — the alternative (deep-equal) either
 * pulls in a dependency or duplicates the whole shape per comparison.
 *
 * If any field ever becomes non-JSON-safe (e.g. a `File` or `Map`), this
 * is the one place to change — swap to a purpose-built serialiser.
 */
function serialize(values: VisitComposerValues): string {
  return JSON.stringify(values);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useVisitComposer(
  initial: VisitComposerValues,
  visitId?: string,
): VisitComposerHandle {
  const initialSignature = serialize(initial);
  const [previousInitialSignature, setPreviousInitialSignature] = React.useState(initialSignature);
  const [values, setValues] = React.useState<VisitComposerValues>(initial);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(visitId ? new Date() : null);
  const [error, setError] = React.useState<string | null>(null);
  const [savedSignature, setSavedSignature] = React.useState(() => serialize(initial));
  const [lastPersisted, setLastPersisted] = React.useState(initial);

  if (previousInitialSignature !== initialSignature) {
    setPreviousInitialSignature(initialSignature);
    setValues(initial);
    setSavedSignature(initialSignature);
    setLastPersisted(initial);
    setError(null);
  }

  const dirty = serialize(values) !== savedSignature;

  const mutation = useSaveVisitComposerMutation({
    onSuccess: (_result, submittedValues) => {
      setLastPersisted(submittedValues);
      setSavedSignature(serialize(submittedValues));
      setLastSavedAt(new Date());
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not save visit.");
    },
  });

  const patch = React.useCallback((partial: Partial<VisitComposerValues>) => {
    setValues((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = React.useCallback(() => {
    setValues(lastPersisted);
    setError(null);
  }, [lastPersisted]);

  const save = React.useCallback(async () => {
    setError(null);
    try {
      const result = await mutation.mutateAsync({ ...values, visitId });
      return { visitId: result.visitId };
    } catch {
      // `onError` already recorded the message; swallow so callers get a
      // `null` (used by `VisitComposer`'s `onSuccess` branch).
      return null;
    }
  }, [mutation, values, visitId]);

  return {
    state: {
      dirty,
      error,
      lastSavedAt,
      saving: mutation.isPending,
      values,
    },
    patch,
    reset,
    save,
  };
}
