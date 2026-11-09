/**
 * The visitor's address, for limiting anonymous actions. Uses the last entry of
 * x-forwarded-for, the one added by our own proxy: anything before it was sent
 * by the client and can be forged.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || headers.get("x-real-ip")?.trim() || "unknown";
}
