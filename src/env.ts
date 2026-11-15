import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
    BETTER_AUTH_URL: z.url(),
    // Auth signing secret — 32+ chars (256 bits) per Better Auth guidance.
    BETTER_AUTH_SECRET: z.string().min(32),
    DB_FILE_NAME: z.string().min(1),
    // Optional cookie domain for cross-subdomain sessions in production.
    COOKIE_DOMAIN: z.string().optional(),
    // Comma-separated allow-list of extra trusted origins for Better Auth.
    ALLOWED_ORIGINS: z.string().optional(), // parsed in lib/auth.ts
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "VITE_",

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_BASE_URL: z.url().optional(),
  },
  runtimeEnv: import.meta.env.SSR ? process.env : import.meta.env,
  emptyStringAsUndefined: true,
});

export type ServerEnv = typeof env;
