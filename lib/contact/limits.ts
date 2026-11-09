// Contact form limits. Kept apart from the zod schema so the browser form can
// use them without shipping zod (see lib/validation/limits.ts).

export const CONTACT_REASONS = ["general", "account", "proposal", "privacy", "other"] as const;
export type ContactReason = (typeof CONTACT_REASONS)[number];

export const CONTACT_LIMITS = {
  name: 80,
  email: 254,
  phone: 30,
  organization: 120,
  subject: 120,
  messageMin: 10,
  message: 5000,
} as const;
