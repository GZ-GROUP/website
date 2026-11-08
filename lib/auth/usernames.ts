// Usernames that could impersonate the organization or a system role.
const RESERVED = new Set([
  "admin",
  "administrator",
  "root",
  "superadmin",
  "system",
  "support",
  "help",
  "security",
  "staff",
  "team",
  "moderator",
  "gz",
  "gzgroup",
  "gz-group",
  "gz_group",
  "official",
  "api",
  "auth",
  "account",
  "settings",
  "login",
  "register",
  "null",
  "undefined",
]);

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.]*[a-z0-9])?$/;

/** Lowercase letters, digits, "_" and "." (not at the ends), not reserved. */
export function isValidUsername(value: string): boolean {
  const username = value.toLowerCase();
  return (
    username.length >= USERNAME_MIN &&
    username.length <= USERNAME_MAX &&
    USERNAME_PATTERN.test(username) &&
    !RESERVED.has(username)
  );
}

/** Turns an external handle (e.g. a GitHub login) into a valid username candidate. */
export function toUsernameCandidate(handle: string): string {
  const cleaned = handle
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, USERNAME_MAX);
  return isValidUsername(cleaned) ? cleaned : `user_${cleaned}`.slice(0, USERNAME_MAX);
}
