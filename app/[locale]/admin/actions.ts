"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasRole, requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export type RoleActionState = { status: "idle" | "success" | "error"; userId?: string; error?: "forbidden" | "unknown" };

const schema = z.object({
  userId: z.string().min(1),
  // This screen only moves people between Reader and Writer. Granting "admin"
  // is reserved to the master admin and not offered in the UI yet.
  role: z.enum(["reader", "writer"]),
});

/** Promote a Reader to Writer or back. Authorized on the server for every call. */
export async function setUserRole(_prev: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const session = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: "unknown" };
  const { userId, role } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isSuperAdmin: true },
  });
  // Nobody changes the master admin; only the master admin changes another admin.
  if (!target || target.isSuperAdmin || target.id === session.user.id) {
    return { status: "error", userId, error: "forbidden" };
  }
  if (hasRole(target, "admin") && !session.user.isSuperAdmin) {
    return { status: "error", userId, error: "forbidden" };
  }

  try {
    await auth.api.setRole({ body: { userId, role }, headers: await headers() });
  } catch {
    return { status: "error", userId, error: "unknown" };
  }

  revalidatePath("/[locale]/admin", "page");
  return { status: "success", userId };
}
