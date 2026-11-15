import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

const dbFileName = process.env.DB_FILE_NAME;
if (!dbFileName) {
  throw new Error("DB_FILE_NAME is required to run Drizzle Kit");
}

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: dbFileName,
  },
});
