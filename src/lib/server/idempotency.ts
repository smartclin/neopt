// src/lib/server/idempotency.ts
import { db } from "@/db";
import { idempotency } from "@/db/schema";

/**
 * Wraps a server function so a repeated call with the same
 * Idempotency-Key returns the cached response instead of re-executing.
 *
 * - Cache TTL is 24h. Long enough to cover a full offline session.
 * - Cache is keyed by (idempotencyKey) globally. Add a `userId` or
 *   `clinicId` to the key if you want per-tenant isolation.
 * - Stores the *result* of a successful call AND the shape of a 409
 *   conflict, so retries of a conflict don't re-hit the DB.
 */
export type IdempotentResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "conflict"; serverSnapshot: unknown };

export async function withIdempotency<T>(
  idempotencyKey: string | null,
  handler: () => Promise<IdempotentResult<T>>,
): Promise<IdempotentResult<T>> {
  if (!idempotencyKey) {
    // No key → cannot dedupe. We still run, but warn so you notice
    // a caller that forgot to pass the header.
    console.warn("[idempotency] missing Idempotency-Key — retries will duplicate");
    return handler();
  }

  const existing = await db.query.idempotency.findFirst({
    where: { key: idempotencyKey },
  });
  if (existing) {
    return existing.result as IdempotentResult<T>;
  }

  const result = await handler();

  // Only cache successful writes AND 409s. A retryable network error
  // must NOT be cached — the next attempt should re-run.
  if (result.kind === "ok" || result.kind === "conflict") {
    await db.insert(idempotency).values({
      id: crypto.randomUUID(),
      key: idempotencyKey,
      requestHash: idempotencyKey,
      result: result as object,
      createdAt: new Date(),
    });
  }

  return result;
}
