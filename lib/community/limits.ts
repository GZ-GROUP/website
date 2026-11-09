// Comment limits. Kept apart from the zod schemas so that importing them in the
// browser doesn't ship zod, whose eval probe would trip the Content-Security-Policy.

export const MAX_COMMENT_LENGTH = 2000;
