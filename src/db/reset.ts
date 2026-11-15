import { reset } from "drizzle-seed";

import { closeDb, db } from ".";
import * as schema from "./schema";

export async function clearDatabase(): Promise<void> {
  console.log("🗑️ Clearing database...");
  await reset(db, schema);
}

/**
 * CLI entrypoint.
 *
 * Only runs when this file is executed directly:
 *   bun src/db/reset.ts
 *   bun run db:reset
 *
 * Importing this module (e.g. from tests) is side-effect free.
 */
if (import.meta.main) {
  try {
    await clearDatabase();
  } catch (error) {
    console.error("🗑️ Database reset failed:", error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
