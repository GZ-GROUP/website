// Runs once when a Next.js server instance starts (dev, `next start`, standalone).
// Each task is idempotent and must never block startup: a failure is logged and
// retried on the next start.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureMasterAdmin } = await import("@/lib/auth/bootstrap");
  try {
    await ensureMasterAdmin();
  } catch (error) {
    console.error("[bootstrap] Could not ensure the master admin:", error);
  }

  const { ensureBucket, isStorageConfigured } = await import("@/lib/storage/s3");
  try {
    if (!isStorageConfigured()) {
      console.warn("[storage] S3_* is not configured: image uploads are disabled.");
    } else if ((await ensureBucket()) === "created") {
      console.info("[storage] Media bucket created.");
    }
  } catch (error) {
    console.error("[storage] Could not ensure the media bucket:", error);
  }
}
