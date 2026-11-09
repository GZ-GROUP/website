import { prisma } from "@/lib/db";
import { logger, serializeError } from "@/lib/logging/logger";

const NO_STORE = { "Cache-Control": "no-store" };

/** Container health check. Says only whether the app can serve, never why not. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: NO_STORE });
  } catch (error) {
    logger.error("health_check_failed", { error: serializeError(error) });
    return Response.json({ status: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
