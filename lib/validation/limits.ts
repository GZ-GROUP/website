// Profile and password limits. Kept apart from the zod schemas so that importing them in the
// browser doesn't ship zod, whose eval probe would trip the Content-Security-Policy.

export const OCCUPATIONS = ["STUDENT", "PROFESSOR", "COMPANY", "RESEARCHER", "DEVELOPER", "OTHER"] as const;
export type OccupationValue = (typeof OCCUPATIONS)[number];

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
