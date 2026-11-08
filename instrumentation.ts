// Runs once when a Next.js server instance starts (dev, `next start`, standalone).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureMasterAdmin } = await import("@/lib/auth/bootstrap");
  try {
    await ensureMasterAdmin();
  } catch (error) {
    // Never block startup (e.g. the database is still booting); retry on next start.
    console.error("[bootstrap] Could not ensure the master admin:", error);
  }
}
