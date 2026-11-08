import { z } from "zod";
import { isValidUsername } from "@/lib/auth/usernames";

export const OCCUPATIONS = ["STUDENT", "PROFESSOR", "COMPANY", "RESEARCHER", "DEVELOPER", "OTHER"] as const;
export type OccupationValue = (typeof OCCUPATIONS)[number];

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "FIELD_TOO_LONG")
    .transform((v) => (v === "" ? null : v));

/** Profile edit form. Error messages are message keys, translated in the UI. */
export const profileSchema = z.object({
  name: z.string().trim().min(1, "FIELD_REQUIRED").max(80, "FIELD_TOO_LONG"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidUsername, "INVALID_USERNAME"),
  bio: trimmedOptional(280),
  description: trimmedOptional(2000),
  occupation: z
    .enum(OCCUPATIONS)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "FIELD_REQUIRED"),
    newPassword: z.string().min(PASSWORD_MIN, "PASSWORD_TOO_SHORT").max(PASSWORD_MAX, "PASSWORD_TOO_LONG"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirmPassword"],
  });
