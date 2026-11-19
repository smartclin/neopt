import path from "node:path";

const port = Number(process.env.E2E_PORT ?? 4173);

export const e2e = {
  port,
  origin: process.env.E2E_BASE_URL ?? `http://localhost:${port}`,
  databaseFile: path.resolve(process.env.E2E_DB_FILE_NAME ?? ".wrangler/e2e/clinic.sqlite"),
  storageStatePath: path.resolve(".wrangler/e2e/user.json"),
};
