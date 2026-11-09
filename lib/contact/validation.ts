import { z } from "zod";
import { CONTACT_LIMITS as L, CONTACT_REASONS } from "@/lib/contact/limits";

// Error messages are keys under Contact.form.errors.

// A line break here could reach the email's headers.
const SINGLE_LINE = /^[^\r\n\t\0]*$/;

const requiredLine = (max: number) =>
  z.string().trim().min(1, "REQUIRED").max(max, "TOO_LONG").regex(SINGLE_LINE, "INVALID_TEXT");

const optionalLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "TOO_LONG")
    .regex(SINGLE_LINE, "INVALID_TEXT")
    .transform((value) => value || null);

export const contactSchema = z.object({
  name: requiredLine(L.name),
  email: z.string().trim().min(1, "REQUIRED").max(L.email, "TOO_LONG").pipe(z.email("INVALID_EMAIL")),
  phone: optionalLine(L.phone).refine((value) => value === null || /^\+?[\d\s().-]{6,}$/.test(value), "INVALID_PHONE"),
  organization: optionalLine(L.organization),
  reason: z.enum(CONTACT_REASONS, "REQUIRED"),
  subject: requiredLine(L.subject),
  message: z.string().trim().min(1, "REQUIRED").min(L.messageMin, "MESSAGE_TOO_SHORT").max(L.message, "TOO_LONG"),
  consent: z.literal("on", "CONSENT_REQUIRED"),
});

export type ContactFieldError =
  | "REQUIRED"
  | "TOO_LONG"
  | "INVALID_EMAIL"
  | "INVALID_PHONE"
  | "INVALID_TEXT"
  | "MESSAGE_TOO_SHORT"
  | "CONSENT_REQUIRED";
