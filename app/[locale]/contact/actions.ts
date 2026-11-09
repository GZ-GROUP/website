"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { contactSchema, type ContactFieldError } from "@/lib/contact/validation";
import { sendEmail } from "@/lib/email";
import { contactMessageEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";
import { logger, serializeError } from "@/lib/logging/logger";
import { clientIp } from "@/lib/security/client-ip";
import { withinRateLimit } from "@/lib/security/rate-limit";

export type ContactState = {
  status: "idle" | "success" | "error";
  error?: "RATE_LIMITED" | "SEND_FAILED";
  fieldErrors?: Partial<Record<string, ContactFieldError>>;
  /** What was typed: React resets the form after an action, so failures hand it back. */
  values?: Partial<Record<string, string>>;
};

/** The master admin's current address; ADMIN_EMAIL only if the account doesn't exist yet. */
async function contactRecipient(): Promise<string> {
  const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { email: true } });
  return admin?.email ?? serverEnv().ADMIN_EMAIL;
}

export async function sendContactMessage(_previous: ContactState, formData: FormData): Promise<ContactState> {
  // Only bots fill the hidden field: pretend it worked so they don't adapt.
  if (String(formData.get("website") ?? "") !== "") return { status: "success" };

  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).filter(([, value]) => typeof value === "string")) as Record<string, string>;

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, ContactFieldError>> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message as ContactFieldError;
    return { status: "error", fieldErrors, values };
  }

  if (!(await withinRateLimit("contact", clientIp(await headers())))) {
    return { status: "error", error: "RATE_LIMITED", values };
  }

  try {
    await sendEmail(contactMessageEmail({ to: await contactRecipient(), ...parsed.data }));
  } catch (error) {
    logger.error("contact_email_failed", { error: serializeError(error) });
    return { status: "error", error: "SEND_FAILED", values };
  }
  return { status: "success" };
}
