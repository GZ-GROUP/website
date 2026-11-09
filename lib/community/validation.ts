import { z } from "zod";

export const MAX_COMMENT_LENGTH = 2000;
/** Anti-spam: at most this many comments per user in the window. */
export const COMMENT_RATE_MAX = 5;
export const COMMENT_RATE_WINDOW_MS = 60_000;

/** Comments are plain text: stored as typed and always rendered as text, never as HTML. */
export const commentBodySchema = z.string().trim().min(1).max(MAX_COMMENT_LENGTH);
