import { z } from "zod";
import { isHttpsUrl, MEDIA_PATH_PATTERN } from "@/lib/editor/links";

export const CATEGORY_SLUGS = ["software", "research", "experiments", "tutorial", "opinion", "community"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export const SHOWCASE_SLUGS = ["software", "research", "experiments"] as const;

export const MAX_TAGS = 5;
export const MAX_CO_AUTHORS = 5;

const optionalHttps = z
  .string()
  .trim()
  .max(500, "FIELD_TOO_LONG")
  .refine((v) => v === "" || isHttpsUrl(v), "INVALID_URL")
  .transform((v) => (v === "" ? null : v));

/**
 * Metadata saved with every draft. Error messages are message keys (Editor.errors).
 * Content is validated separately by lib/editor/content.ts.
 */
export const articleMetaSchema = z.object({
  title: z.string().trim().max(160, "FIELD_TOO_LONG"),
  excerpt: z.string().trim().max(300, "FIELD_TOO_LONG"),
  category: z.enum(CATEGORY_SLUGS),
  language: z.enum(["ES", "EN"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(MAX_TAGS, "TOO_MANY_TAGS"),
  coverImageKey: z
    .string()
    .nullable()
    .refine((v) => v === null || MEDIA_PATH_PATTERN.test(`/media/${v}`), "INVALID_IMAGE"),
  coverAlt: z.string().trim().max(200, "FIELD_TOO_LONG"),
  repositoryUrl: optionalHttps,
  externalUrl: optionalHttps,
  coAuthors: z.array(z.string().trim().toLowerCase()).max(MAX_CO_AUTHORS, "TOO_MANY_CO_AUTHORS"),
});

export type ArticleMetaInput = z.input<typeof articleMetaSchema>;
export type ArticleMeta = z.output<typeof articleMetaSchema>;

/** What an article needs before it can be published (drafts may be incomplete). */
export function publishProblems(article: {
  title: string;
  excerpt: string;
  contentText: string;
  coverImageKey: string | null;
  coverAlt: string | null;
}): string[] {
  const problems: string[] = [];
  if (!article.title.trim()) problems.push("TITLE_REQUIRED");
  if (!article.excerpt.trim()) problems.push("EXCERPT_REQUIRED");
  if (article.contentText.trim().length < 50) problems.push("CONTENT_TOO_SHORT");
  if (article.coverImageKey && !article.coverAlt?.trim()) problems.push("COVER_ALT_REQUIRED");
  return problems;
}
