import messages from "@/messages/es.json";

export type AuthErrorKey = keyof typeof messages.AuthErrors;

const KNOWN = new Set(Object.keys(messages.AuthErrors));

/**
 * Maps a Better Auth error (client `{ code, status }` or a server APIError body)
 * to a key of the AuthErrors message namespace.
 */
export function authErrorKey(error: unknown): AuthErrorKey {
  if (!error || typeof error !== "object") return "UNKNOWN";
  const e = error as { code?: unknown; status?: unknown; body?: { code?: unknown }; error?: unknown };
  if (e.status === 429) return "TOO_MANY_REQUESTS";
  for (const candidate of [e.code, e.body?.code, e.error]) {
    if (typeof candidate === "string" && KNOWN.has(candidate)) return candidate as AuthErrorKey;
  }
  return "UNKNOWN";
}
