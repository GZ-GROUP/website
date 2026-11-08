import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import type { RoleName } from "@/lib/auth/permissions";

// Server-side authorization helpers. UI checks are cosmetic; these are the gate.

/** The current session, read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/** The admin plugin stores roles as a comma-separated string. */
export function hasRole(user: { role?: string | null }, role: RoleName): boolean {
  return (user.role ?? "").split(",").map((r) => r.trim()).includes(role);
}

/**
 * Requires a signed-in user. Users who must change their password (the master
 * admin on first sign-in) are confined to the password page until they do.
 */
export async function requireUser(options: { allowPendingPasswordChange?: boolean } = {}): Promise<AppSession> {
  const session = await getSession();
  const locale = await getLocale();
  if (!session) return redirect({ href: "/login", locale });
  if (session.user.mustChangePassword && !options.allowPendingPasswordChange) {
    return redirect({ href: "/account/password", locale });
  }
  return session;
}

/** Admin area: anyone else gets a 404, so the area's existence is not revealed. */
export async function requireAdmin(): Promise<AppSession> {
  const session = await getSession();
  if (!session || !hasRole(session.user, "admin")) notFound();
  if (session.user.mustChangePassword) {
    return redirect({ href: "/account/password", locale: await getLocale() });
  }
  return session;
}

/**
 * Studio area (writers and admins): anyone else gets a 404, like /admin, so the
 * author workflow is never revealed publicly.
 */
export async function requireStudio(): Promise<AppSession> {
  const session = await getSession();
  if (!session || !(hasRole(session.user, "writer") || hasRole(session.user, "admin"))) notFound();
  if (session.user.mustChangePassword) {
    return redirect({ href: "/account/password", locale: await getLocale() });
  }
  return session;
}
