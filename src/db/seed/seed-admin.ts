import { auth } from "#/lib/auth.ts";
import { closeDb, type DB, db, eq } from "@/db";

import * as schema from "../schema";
import { CLINIC_HURGHADA_ID } from "./seed-config";

export const SEED_ADMIN_ID = "00000000-0000-4000-8000-0000000000a1";
export { CLINIC_HURGHADA_ID };
export const SEED_ADMIN_PASSWORD = "HealthF27";
const ADMIN_CONFIG = {
  id: SEED_ADMIN_ID,
  name: "DrHazem",
  email: "clinysmar@gmail.com",
  role: "admin" as const,
  clinicId: CLINIC_HURGHADA_ID,
  username: "drhazem",
  displayUsername: "DrHazem",
  clinicName: "Hurghada General Hospital — Pediatric Clinic",
  clinicPhone: "+20 65 344 0000",
  clinicAddress: "El Nasr St., Hurghada, Red Sea Governorate",
} as const;

type UserRow = typeof schema.user.$inferSelect;

// ── Clinic ───────────────────────────────────────────────────────────────

async function ensureClinic(db: DB) {
  // Drizzle v1 RC: use explicit select + eq for deterministic single-row lookup
  const [existing] = await db
    .select()
    .from(schema.clinics)
    .where(eq(schema.clinics.id, ADMIN_CONFIG.clinicId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(schema.clinics)
    .values({
      id: ADMIN_CONFIG.clinicId,
      name: ADMIN_CONFIG.clinicName,
      address: ADMIN_CONFIG.clinicAddress,
      phone: ADMIN_CONFIG.clinicPhone,
      email: ADMIN_CONFIG.email,
    })
    .returning();

  if (!created) {
    throw new Error("[seed] Failed to create clinic");
  }

  console.info(`[seed] created clinic ${created.id}`);
  return created;
}

// ── Admin ────────────────────────────────────────────────────────────────

export async function ensureAdminUser(db: DB): Promise<UserRow> {
  const ctx = await auth.$context;
  const email = ADMIN_CONFIG.email.toLowerCase();
  const password = SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("[seed] Set SEED_ADMIN_PASSWORD before seeding the admin user");
  }

  const clinic = await ensureClinic(db);

  // Drizzle v1 RC: avoid relational query filters for conditional lookups
  // Use explicit select with eq; chain OR logic in code
  let userRow: UserRow | null = null;

  const [byEmail] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (byEmail) {
    userRow = byEmail;
  } else {
    const [byId] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, ADMIN_CONFIG.id))
      .limit(1);
    if (byId) userRow = byId;
  }

  const hashedPassword = await ctx.password.hash(password);

  // ── Create or heal ────────────────────────────────────────────────
  if (!userRow) {
    await auth.api.createUser({
      body: {
        email,
        name: ADMIN_CONFIG.name,
        password,
        role: ADMIN_CONFIG.role,
      },
    });

    const [created] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    if (!created) {
      throw new Error("[seed] auth.api.createUser did not persist a row");
    }

    const [updated] = await db
      .update(schema.user)
      .set({
        clinicId: clinic.id,
        emailVerified: true,
      })
      .where(eq(schema.user.id, created.id))
      .returning();

    if (!updated) {
      throw new Error("[seed] Failed to update user after creation");
    }
    userRow = updated;
    console.info(`[seed] created admin ${email}`);
  } else {
    const needsUpdate =
      userRow.email !== email ||
      userRow.role !== ADMIN_CONFIG.role ||
      userRow.clinicId !== clinic.id ||
      userRow.emailVerified !== true;

    if (needsUpdate) {
      const [updated] = await db
        .update(schema.user)
        .set({
          email,
          role: ADMIN_CONFIG.role,
          clinicId: clinic.id,
          emailVerified: true,
        })
        .where(eq(schema.user.id, userRow.id))
        .returning();

      if (!updated) {
        throw new Error("[seed] Failed to update existing admin fields");
      }
      userRow = updated;
      console.info(`[seed] healed admin fields for ${email}`);
    }
  }

  // ── Credential account ────────────────────────────────────────────
  const [existingAccount] = await db
    .select()
    .from(schema.account)
    .where(eq(schema.account.userId, userRow.id))
    .limit(1);

  // Better Auth stores providerId as "credential" for email/password
  const credentialAccount = existingAccount?.providerId === "credential" ? existingAccount : null;

  if (!credentialAccount) {
    await ctx.internalAdapter.linkAccount({
      userId: userRow.id,
      providerId: "credential",
      accountId: userRow.id,
      password: hashedPassword,
    });
    console.info(`[seed] linked credential account for ${email}`);
  } else {
    const matches =
      credentialAccount.password != null &&
      (await ctx.password.verify({
        hash: credentialAccount.password,
        password,
      }));

    if (!matches) {
      await db
        .update(schema.account)
        .set({ password: hashedPassword })
        .where(eq(schema.account.id, credentialAccount.id));
      console.warn(`[seed] rotated admin password for ${email} (drift detected)`);
    }
  }

  // ── Fail-loud verification ────────────────────────────────────────
  const [stored] = await db
    .select({ password: schema.account.password })
    .from(schema.account)
    .where(eq(schema.account.userId, userRow.id))
    .limit(1);

  const verified =
    stored?.password != null &&
    (await ctx.password.verify({
      hash: stored.password,
      password,
    }));

  if (!verified) {
    throw new Error(
      `[seed] credential verification failed for ${email}. ` +
        "The auth instance's password hasher likely changed — " +
        "check lib/auth/index.ts emailAndPassword.password.",
    );
  }

  return userRow;
}

/**
 * CLI entrypoint.
 *
 * Only runs when this file is executed directly:
 *   bun src/db/seed/seed-admin.ts
 *
 * Importing this module is side-effect free.
 */
if (import.meta.main) {
  try {
    console.info("🌱 Ensuring admin user...");
    const admin = await ensureAdminUser(db);
    console.info(`✅ Admin ready: ${admin.email} (${admin.id})`);
  } catch (error) {
    console.error("❌ Admin seed failed:", error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
