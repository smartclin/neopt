// src/db/columns.ts
import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

/** Text primary key, generated in the app for stable ids. */
export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/**
 * Timestamps for domain tables: DB defaults on both, $onUpdate bumps updated_at.
 * Returns a fresh object per call so Drizzle never shares mutable column state.
 */
export const timestamps = () => ({
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date()),
});

/**
 * Timestamps for auth tables: no DB default on updated_at (Better Auth sets it),
 * $onUpdate still bumps on app-side updates.
 */
export const authTimestamps = () => ({
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── auditFields helper (after user) ────────────────────────────────────────
