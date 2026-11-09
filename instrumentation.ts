import type { Instrumentation } from "next";
import { logger, serializeError } from "@/lib/logging/logger";

// Runs once when a Next.js server instance starts (dev, `next start`, standalone).
// Each task is idempotent and must never block startup: a failure is logged and
// retried on the next start.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureMasterAdmin } = await import("@/lib/auth/bootstrap");
  try {
    await ensureMasterAdmin();
  } catch (error) {
    logger.error("bootstrap_admin_failed", { error: serializeError(error) });
  }

  const { ensureBucket, isStorageConfigured } = await import("@/lib/storage/s3");
  try {
    if (!isStorageConfigured()) {
      logger.warn("storage_not_configured", { detail: "S3_* is not set: image uploads are disabled." });
    } else if ((await ensureBucket()) === "created") {
      logger.info("storage_bucket_created");
    }
  } catch (error) {
    logger.error("storage_bucket_failed", { error: serializeError(error) });
  }

  if (process.env.NODE_ENV === "production" && !process.env.LEGAL_CONTACT_EMAIL) {
    logger.warn("legal_contact_missing", { detail: "Set LEGAL_CONTACT_EMAIL: the privacy policy needs a contact." });
  }
}

/** Every server error, with the digest shown to the user as a reference. */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  logger.error("request_failed", {
    error: serializeError(error),
    method: request.method,
    // The query string can carry reset tokens.
    path: request.path.split("?")[0],
    route: context.routePath,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
  });
};
