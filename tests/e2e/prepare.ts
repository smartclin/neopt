import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { e2e } from "./environment.ts";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

if (process.env.E2E_BASE_URL) {
  console.info("Using the external e2e server; local database setup skipped.");
  process.exit(0);
}

if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
  throw new Error("Local e2e requires BETTER_AUTH_SECRET and BETTER_AUTH_URL in the environment.");
}

mkdirSync(path.dirname(e2e.databaseFile), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`${e2e.databaseFile}${suffix}`, { force: true });
}

const env = { ...process.env, DB_FILE_NAME: e2e.databaseFile };

for (const script of ["db:migrate", "db:seed", "db:seed:admin"]) {
  const result = spawnSync("bun", ["run", script], { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`E2E database setup failed while running "${script}".`);
  }
}
