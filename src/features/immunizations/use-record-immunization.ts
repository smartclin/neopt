// src/features/immunizations/use-record-immunization.ts

import type { OutboxEntry } from "@/features/outbox/store";
import { useQueueWrite } from "@/features/outbox/use-outbox";
import { type RecordImmunizationInput, recordImmunizationFn } from "./functions";

/**
 * Records an immunization. If online, calls the server directly. If
 * offline (or the call fails with a network error), queues to the outbox
 * so the flusher picks it up when connectivity returns.
 */
export function useRecordImmunization() {
  const queue = useQueueWrite();
  return {
    mutate: async (data: RecordImmunizationInput) => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          return await recordImmunizationFn({ data });
        } catch (err) {
          // Network error → fall through to queue.
          if (!(err instanceof Error) || !/network|fetch/i.test(err.message)) throw err;
        }
      }
      const entry: OutboxEntry<RecordImmunizationInput> = {
        id: crypto.randomUUID(),
        kind: "record-immunization",
        entityId: data.patientId,
        payload: data,
        status: "queued",
        idempotencyKey: crypto.randomUUID(),
        optimisticSnapshot: data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attempts: 0,
      };
      await queue.mutateAsync(entry);
      return { queued: true as const, entry };
    },
  };
}
