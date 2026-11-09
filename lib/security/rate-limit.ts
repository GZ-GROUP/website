import { prisma } from "@/lib/db";

// Fixed-window limits for actions, on the table Better Auth already uses for
// sign-in limits. The upsert is atomic, so concurrent requests cannot slip past
// the count. The `app:` prefix keeps these keys apart from Better Auth's.

export const LIMITS = {
  like: { max: 30, windowMs: 60_000 },
  read: { max: 60, windowMs: 60_000 },
  upload: { max: 20, windowMs: 60_000 },
} as const;

/** Counts this attempt and says whether it is still within the limit. */
export async function withinRateLimit(action: keyof typeof LIMITS, userId: string): Promise<boolean> {
  const { max, windowMs } = LIMITS[action];
  const key = `app:${action}:${userId}`;
  const now = BigInt(Date.now());
  const windowStart = now - BigInt(windowMs);

  // `lastRequest` holds when the current window started.
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (id, key, count, "lastRequest")
    VALUES (${key}, ${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits."lastRequest" <= ${windowStart} THEN 1 ELSE rate_limits.count + 1 END,
      "lastRequest" = CASE WHEN rate_limits."lastRequest" <= ${windowStart} THEN ${now} ELSE rate_limits."lastRequest" END
    RETURNING count
  `;
  return Number(rows[0].count) <= max;
}
