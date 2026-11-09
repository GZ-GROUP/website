/**
 * Validates a post-login destination: only paths inside this site. Rejects
 * protocol-relative URLs ("//evil.test"), backslash variants browsers normalise
 * to them, and control characters, so `?next=` cannot be an open redirect.
 */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string" || next.length > 500) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (/[\\\u0000-\u001f]/.test(next)) return null;
  return next;
}

/** Builds the login link that returns to `path` afterwards. */
export function loginHref(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}
