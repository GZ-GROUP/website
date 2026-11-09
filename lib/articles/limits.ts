// Article categories and limits. Kept apart from the zod schemas so that importing them in the
// browser doesn't ship zod, whose eval probe would trip the Content-Security-Policy.

export const CATEGORY_SLUGS = ["software", "research", "experiments", "tutorial", "opinion", "community"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export const SHOWCASE_SLUGS = ["software", "research", "experiments"] as const;
export const MAX_TAGS = 5;
export const MAX_CO_AUTHORS = 5;
