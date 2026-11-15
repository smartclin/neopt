import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import "@tanstack/react-start/server-only";
import { APIError } from "better-auth";
import { betterAuth } from "better-auth/minimal";
import {
  admin as adminPlugin,
  customSession,
  multiSession as multiSessionPlugin,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { db, eq } from "#/db/index.ts";
import * as schema from "#/db/schema.ts";
import { env } from "#/env.ts";

import { ac, roles } from "./auth/permissions";
import { USER_ROLES } from "./auth/role";
import { EMAIL_REGEX, getCachedRole, setCachedRole } from "./auth/utils";

// Explicit allow-list. Never reflect the caller's `Origin` header back into
// the trusted set — that would let any site drive state-changing auth
// requests against this app.
const allowedOrigins = [
  env.BETTER_AUTH_URL,
  ...(env.ALLOWED_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? []),
];

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: allowedOrigins,

  telemetry: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),

  user: {
    additionalFields: {
      address: { input: true, required: false, type: "string" },
      apiKey: { input: false, required: false, type: "string" },
      clinicId: {
        input: false,
        required: false,
        type: "string",
      },
      phone: { input: true, required: false, type: "string" },
      role: {
        type: [...USER_ROLES],
        defaultValue: "patient",
        input: false,
        required: true,
        // `required: true` + `defaultValue` makes `session.user.role`
        // A required `Role` in the inferred type — no casts needed
        // Downstream. The DB column stays nullable for safety.
      },
    },
    deleteUser: {
      beforeDelete: async (user) => {
        const [fullUser] = await db
          .select({ role: schema.user.role })
          .from(schema.user)
          .where(eq(schema.user.id, user.id))
          .limit(1);

        if (fullUser?.role?.toLowerCase() === "doctor") {
          const hasPatients = await db
            .select({ id: schema.patients.id })
            .from(schema.patients)
            .where(eq(schema.patients.providerId, user.id))
            .limit(1)
            .then((rows) => rows.length > 0);

          if (hasPatients) {
            throw new APIError("BAD_REQUEST", {
              message: "Doctor has active patients and cannot be deleted",
            });
          }
        }
      },
      enabled: true,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
    encryptOAuthTokens: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: "auth",
    crossSubDomainCookies: {
      domain: process.env.NODE_ENV === "production" ? env.COOKIE_DOMAIN : undefined,
      enabled: process.env.NODE_ENV === "production" && Boolean(env.COOKIE_DOMAIN),
    },
    database: {
      defaultFindManyLimit: 50,
      generateId: () => crypto.randomUUID(),
      joins: true,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      // "none" + secure only works on HTTPS or localhost. In dev,
      // "lax" avoids the secure-cookie edge cases entirely.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.trim().toLowerCase();
          if (!EMAIL_REGEX.test(email)) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid email format",
            });
          }
          return {
            data: {
              ...user,
              email,
              name: user.name.trim() || "Unnamed User",
              // Preserve an explicit role (admin-created users).
              // Only default when the caller didn't set one —
              // The previous version hard-coded "patient",
              // Which silently broke admin.createUser.
              role: user["role"] ?? "patient",
            },
          };
        },
      },
    },
  },
  logger: {
    disabled: false,
    level: process.env.NODE_ENV === "production" ? "error" : "info",
  },
  rateLimit: {
    modelName: "rateLimit",
    storage: "database",
  },

  // https://better-auth.com/docs/integrations/tanstack#usage-tips
  plugins: [
    adminPlugin({
      ac,
      adminRoles: ["admin"],
      defaultRole: "patient",
      roles,
    }),
    multiSessionPlugin(),
    customSession(async ({ user, session }) => {
      // Read the role from cache first. The cache is swept by a
      // Timer (see top of file); expired entries are also evicted
      // Lazily inside `getCachedRole`. Do NOT clear the whole
      // Cache here — that would defeat the point.
      let dbUser = getCachedRole(user.id);

      if (!dbUser) {
        const [row] = await db
          .select({
            banExpires: schema.user.banExpires,
            banReason: schema.user.banReason, // ← add
            banned: schema.user.banned, // ← add
            clinicId: schema.user.clinicId,
            role: schema.user.role,
          })
          .from(schema.user)
          .where(eq(schema.user.id, user.id))
          .limit(1);

        if (row?.role) {
          dbUser = {
            banExpires: null,
            banReason: null,
            banned: false,
            clinicId: row.clinicId ?? null,
            role: row.role,
          };
          setCachedRole(
            user.id,
            row.role,
            row.clinicId ?? null,
            dbUser.banned,
            dbUser.banReason,
            dbUser.banExpires,
          );
        }
      }

      // Narrow to the role union. `?? "patient"` matches the DB
      // Default; `as Role` is safe because the cache only stores
      // Values validated against `USER_ROLES`.
      const role = dbUser?.role;
      return {
        session,
        user: {
          ...user,
          banExpires: dbUser?.banExpires ?? null,
          banReason: dbUser?.banReason ?? null,
          banned: dbUser?.banned ?? false,
          clinicId: dbUser?.clinicId ?? null,
          role,
        },
      };
    }),
    tanstackStartCookies(),
  ],

  // https://better-auth.com/docs/concepts/session-management#session-caching
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // https://better-auth.com/docs/concepts/oauth
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});
