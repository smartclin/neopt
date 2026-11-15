// src/features/outbox/flusher.ts
import { type OutboxEntry, outboxStore } from "./store";

type SendResult =
  | { ok: true; serverSnapshot?: unknown }
  | { ok: false; kind: "conflict"; serverSnapshot: unknown }
  | { ok: false; kind: "retry"; error: string }
  | { ok: false; kind: "fatal"; error: string };

/**
 * Map each outbox kind to the server function that performs it.
 * Each function MUST accept an `idempotencyKey` and the server must
 * dedupe on it — otherwise a retried write creates duplicates.
 */
const senders: Record<OutboxEntry["kind"], (entry: OutboxEntry) => Promise<SendResult>> = {
  "record-immunization": async (entry) => {
    const { recordImmunizationFn } = await import("@/features/immunizations/functions");
    try {
      const r = await recordImmunizationFn({
        data: entry.payload as never,
        headers: { "Idempotency-Key": entry.idempotencyKey },
      });
      return { ok: true, serverSnapshot: r };
    } catch (err) {
      return classifyServerError(err);
    }
  },
  "save-visit": async (entry) => {
    const { saveVisitFn } = await import("@/features/visits/functions");
    try {
      const r = await saveVisitFn({
        data: entry.payload as never,
        headers: { "Idempotency-Key": entry.idempotencyKey },
      });
      return { ok: true, serverSnapshot: r };
    } catch (err) {
      return classifyServerError(err);
    }
  },
  "save-prescription": async (entry) => {
    const { savePrescriptionFn } = await import("@/features/prescriptions/functions");
    try {
      const r = await savePrescriptionFn({
        data: entry.payload as never,
        headers: { "Idempotency-Key": entry.idempotencyKey },
      });
      return { ok: true, serverSnapshot: r };
    } catch (err) {
      return classifyServerError(err);
    }
  },
  "set-milestone": async (entry) => {
    const { setMilestoneFn } = await import("@/features/development/functions");
    try {
      const r = await setMilestoneFn({
        data: entry.payload as never,
        headers: { "Idempotency-Key": entry.idempotencyKey },
      });
      return { ok: true, serverSnapshot: r };
    } catch (err) {
      return classifyServerError(err);
    }
  },
  "create-measurement": async (entry) => {
    const { createMeasurementFn } = await import("@/features/measurements/functions");
    try {
      const r = await createMeasurementFn({
        data: entry.payload as never,
        headers: { "Idempotency-Key": entry.idempotencyKey },
      });
      return { ok: true, serverSnapshot: r };
    } catch (err) {
      return classifyServerError(err);
    }
  },
};

function classifyServerError(err: unknown): SendResult {
  const msg = err instanceof Error ? err.message : String(err);
  if (/409|conflict/i.test(msg)) {
    // Server should return the winning record in the error body.
    const serverSnapshot = (err as { serverSnapshot?: unknown })?.serverSnapshot ?? null;
    return { ok: false, kind: "conflict", serverSnapshot };
  }
  if (/4\d\d/.test(msg)) return { ok: false, kind: "fatal", error: msg };
  return { ok: false, kind: "retry", error: msg };
}

let running = false;

export async function flushOutbox(): Promise<void> {
  if (running) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  running = true;
  try {
    // Drain in a loop so a burst of writes clears in one pass.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const entry = await outboxStore.claimNext();
      if (!entry) break;

      // Exponential backoff for previously-failed entries.
      const delay = Math.min(30_000, 500 * 2 ** (entry.attempts - 1));
      if (entry.attempts > 1) await new Promise((r) => setTimeout(r, delay));

      const sender = senders[entry.kind];
      const result = await sender(entry);

      if (result.ok) {
        await outboxStore.put({
          ...entry,
          status: "synced",
          serverSnapshot: result.serverSnapshot,
          error: undefined,
          updatedAt: new Date().toISOString(),
        });
      } else if (result.kind === "conflict") {
        await outboxStore.put({
          ...entry,
          status: "conflict",
          serverSnapshot: result.serverSnapshot,
          updatedAt: new Date().toISOString(),
        });
      } else if (result.kind === "fatal") {
        await outboxStore.put({
          ...entry,
          status: "failed",
          error: result.error,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // retry — put back to queued so the next flush picks it up.
        await outboxStore.put({
          ...entry,
          status: "queued",
          error: result.error,
          updatedAt: new Date().toISOString(),
        });
        // Stop draining — likely a network blip.
        break;
      }
    }
  } finally {
    running = false;
    // Housekeeping — remove synced entries older than 24h.
    await outboxStore.clearSyncedOlderThan(24 * 60 * 60 * 1000);
  }
}

/** Wire this once from `_auth/app/route.tsx`. */
export function installOutboxFlusher(): () => void {
  const onOnline = () => void flushOutbox();
  const onFocus = () => void flushOutbox();
  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onFocus);
  // Drain once on install (in case the tab was closed mid-flight).
  void flushOutbox();
  const interval = setInterval(() => void flushOutbox(), 30_000);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onFocus);
    clearInterval(interval);
  };
}
