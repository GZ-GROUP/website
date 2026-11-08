"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";
import { hasRole, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { changePasswordSchema, profileSchema } from "@/lib/validation/profile";

export type FormState = {
  status: "idle" | "success" | "error";
  error?: AuthErrorKey;
  fieldErrors?: Partial<Record<string, AuthErrorKey>>;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): FormState["fieldErrors"] {
  const out: Record<string, AuthErrorKey> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    out[key] ??= issue.message as AuthErrorKey;
  }
  return out;
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error.issues) };

  const { name, username, bio, description, occupation } = parsed.data;
  try {
    // Through Better Auth so the username plugin validates, normalizes and checks uniqueness.
    await auth.api.updateUser({ body: { name, username }, headers: await headers() });
  } catch (error) {
    const key = authErrorKey(error);
    return key === "USERNAME_IS_ALREADY_TAKEN" || key === "INVALID_USERNAME"
      ? { status: "error", fieldErrors: { username: key } }
      : { status: "error", error: key };
  }

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, bio, description, occupation },
    update: { bio, description, occupation },
  });

  revalidatePath("/[locale]/account", "page");
  revalidatePath("/[locale]/u/[username]", "page");
  return { status: "success" };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireUser({ allowPendingPasswordChange: true });
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error.issues) };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    const key = authErrorKey(error);
    return key === "INVALID_PASSWORD"
      ? { status: "error", fieldErrors: { currentPassword: key } }
      : { status: "error", error: key };
  }

  if (session.user.mustChangePassword) {
    await prisma.user.update({ where: { id: session.user.id }, data: { mustChangePassword: false } });
  }

  return redirect({ href: hasRole(session.user, "admin") ? "/admin" : "/account", locale: await getLocale() });
}
