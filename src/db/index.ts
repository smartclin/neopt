// src/db/index.ts
import "@tanstack/react-start/server-only";
import { Database } from "bun:sqlite";

import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  getTableName,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  or,
  type SQL,
  type SQLWrapper,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { relations } from "./relations";
import { authRelations } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

const sqlite = new Database(process.env.DB_FILE_NAME ?? "clinic.sqlite");

// Pragmas are applied once, before the client serves any query.
//   • WAL          — readers never block the writer (long-lived server +
//                    background seeding).
//   • busy_timeout — wait up to 5s on a locked writer instead of failing
//                    immediately with SQLITE_BUSY.
//   • foreign_keys — SQLite defaults this OFF; our FKs and `onDelete: cascade`
//                    only work when it is ON.
//   • synchronous  — NORMAL is durable under WAL and much faster than FULL.
//   • temp_store   — keep transient sorts/indices in memory.
//   • cache_size   — 64 MiB page cache (negative value is in KiB).
sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA busy_timeout = 5000");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA synchronous = NORMAL");
sqlite.run("PRAGMA temp_store = MEMORY");
sqlite.run("PRAGMA cache_size = -64000");

// Merge relations in the required order:
//   1. `defineRelations` — the base relations object
//   2. `defineRelationsPart` results — auth, clinic
const mergedRelations = {
  ...relations,
  ...authRelations,
};

export const db = drizzle({
  client: sqlite,
  relations: mergedRelations,
});

export type DB = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─────────────────────────────────────────────────────────────────────────────
// Readiness & shutdown
// ─────────────────────────────────────────────────────────────────────────────

let isClosed = false;

export async function checkIsDbReady(): Promise<boolean> {
  if (isClosed) return false;
  try {
    sqlite.query("SELECT 1").get();
    return true;
  } catch (error) {
    console.error("Database readiness check failed", error);
    return false;
  }
}

/** Idempotent: closing an already-closed client is a no-op. */
export async function closeDb(): Promise<void> {
  if (isClosed) return;
  isClosed = true;

  try {
    db.$client.close();
  } catch (error) {
    console.error("Error closing database connection", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────

export type TransactionOptions = {
  /**
   * Locking mode. `immediate` (the default) takes SQLite's write lock at
   * `BEGIN`, avoiding the lock-upgrade deadlock `deferred` can hit when two
   * writers overlap.
   */
  behavior?: "deferred" | "immediate" | "exclusive";
};

export type RunWithDbOptions = TransactionOptions & {
  /** Extra attempts after a transient failure. Total tries = maxRetries + 1. */
  maxRetries?: number;
};

// SQLite reports contention via `SQLITE_BUSY` / `SQLITE_LOCKED`. bun:sqlite
// surfaces these on `error.code` (and in the message as "database is locked").
// The database runs in WAL mode with a 5s busy_timeout, so a short retry is
// enough to ride out a transient writer collision.
const RETRYABLE_SQLITE_CODES = new Set<string>(["SQLITE_BUSY", "SQLITE_LOCKED"]);

function isRetryableTxError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") {
    if (RETRYABLE_SQLITE_CODES.has(code)) return true;
    if (/SQLITE_(BUSY|LOCKED)/i.test(code)) return true;
  }

  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    /(SQLITE_BUSY|SQLITE_LOCKED|database is locked|database table is locked)/i.test(message)
  );
}

const MAX_BACKOFF_MS = 2_000;

/**
 * Run `fn` inside a SQLite transaction, retrying on transient contention.
 *
 * bun:sqlite is a **synchronous** driver: Drizzle wraps the callback in a
 * native `BEGIN`/`COMMIT`, so `fn` must be synchronous. An `async` callback
 * would resolve *after* the commit and silently run outside the transaction —
 * keep every statement on `tx`.
 */
export async function withTransaction<T>(
  fn: (tx: Transaction) => T,
  options: RunWithDbOptions = {},
): Promise<T> {
  const { maxRetries = 2, behavior = "immediate" } = options;

  let attempt = 0;
  for (;;) {
    try {
      // Drizzle types the callback return as a conditional that rejects
      // "could-be-Promise" generics; the cast satisfies it without giving
      // up the sync callback contract enforced above.
      return db.transaction(fn as never, { behavior }) as T;
    } catch (error: unknown) {
      if (attempt >= maxRetries || !isRetryableTxError(error)) throw error;
      attempt += 1;
      const backoff = Math.min(50 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
      await new Promise((resolve) => setTimeout(resolve, backoff + Math.random() * 50));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────────────

export type { SQL, SQLWrapper };
export {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  getTableName,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
};
