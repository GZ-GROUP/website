import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const MASTER_ADMIN_USERNAME = "admin";
export const MASTER_ADMIN_MIN_PASSWORD = 16;

export type BootstrapResult = "exists" | "created" | "skipped";

/**
 * Creates the master admin once (ADR 0005). Idempotent: does nothing when a
 * master admin already exists. Never logs the password. Runs at server start
 * from instrumentation.ts, never from an HTTP request.
 */
export async function ensureMasterAdmin(env: NodeJS.ProcessEnv = process.env): Promise<BootstrapResult> {
  const existing = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true } });
  if (existing) return "exists";

  const email = (env.ADMIN_EMAIL || "admin@gzgroup.dev").toLowerCase();
  const password = env.ADMIN_INITIAL_PASSWORD;

  if (!password || password.length < MASTER_ADMIN_MIN_PASSWORD) {
    console.warn(
      `[bootstrap] No master admin yet. Set ADMIN_INITIAL_PASSWORD (${MASTER_ADMIN_MIN_PASSWORD}+ characters) and restart.`,
    );
    return "skipped";
  }

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    console.error(`[bootstrap] ${email} already belongs to a regular account; refusing to promote it automatically.`);
    return "skipped";
  }

  // Server-side createUser (no headers) hashes the password with Better Auth's scrypt
  // and creates the credential account. Its source method is "admin", which the
  // validateUserInfo gate allows for the reserved address.
  const { user } = await auth.api.createUser({
    body: { email, password, name: "GZ Group", role: "admin" },
  });

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuperAdmin: true,
        mustChangePassword: true,
        emailVerified: true,
        username: MASTER_ADMIN_USERNAME,
        displayUsername: MASTER_ADMIN_USERNAME,
      },
    });
  } catch (error) {
    // Another instance won the race (partial unique index): undo our copy.
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    if (await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true } })) return "exists";
    throw error;
  }

  console.info(`[bootstrap] Master admin created for ${email}. A password change is required on first sign-in.`);
  return "created";
}
