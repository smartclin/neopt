// src/features/outbox/use-outbox.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { flushOutbox } from "./flusher";
import { type OutboxEntry, outboxStore } from "./store";

const key = ["outbox"] as const;

export function useOutbox() {
  return useQuery({
    queryKey: key,
    queryFn: () => outboxStore.list(),
    staleTime: Number.POSITIVE_INFINITY,
    // Poll while anything is still in-flight so the banner updates.
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((e) => e.status === "queued" || e.status === "syncing") ? 2_000 : false;
    },
  });
}

export function useOutboxEntry(id: string) {
  return useQuery({
    queryKey: [...key, id],
    queryFn: () => outboxStore.byId(id),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * Enqueue a write. Applies it optimistically to the outbox cache so the
 * banner and the per-item status badge update instantly.
 */
export function useQueueWrite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: OutboxEntry) => {
      await outboxStore.put(entry);
      void flushOutbox(); // kick the flusher
      return entry;
    },
    onMutate: async (entry) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<OutboxEntry[]>(key) ?? [];
      qc.setQueryData(key, [entry, ...prev]);
      return { prev };
    },
    onError: (_err, _entry, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Resolve a conflict. Caller picks which side wins.
 * - "keep-local": re-queue with a fresh idempotency key and the server's
 *   current `baseVersion`, so the server accepts the new write.
 * - "use-server": discard the local entry and refresh the relevant query.
 */
export function useResolveConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      resolution,
    }: {
      id: string;
      resolution: "keep-local" | "use-server";
    }) => {
      const entry = await outboxStore.byId(id);
      if (!entry) return;
      if (resolution === "use-server") {
        await outboxStore.delete(id);
      } else {
        await outboxStore.put({
          ...entry,
          status: "queued",
          idempotencyKey: crypto.randomUUID(),
          baseVersion: undefined,
          error: undefined,
          attempts: 0,
          updatedAt: new Date().toISOString(),
        });
      }
      void flushOutbox();
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}
