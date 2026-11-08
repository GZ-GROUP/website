import type { AuthProvider } from "@/lib/generated/prisma/enums";

// Read models for public content, produced by lib/articles/queries.ts.

export type CategoryKind = "SHOWCASE" | "EDITORIAL";

/** Showcase categories are "projects"; there is no separate Project entity. */
export type ShowcaseCategorySlug = "software" | "research" | "experiments";

export type AuthorSummary = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verifications: AuthProvider[];
};

export type ArticleSummary = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverAlt: string | null;
  publishedAt: Date;
  language: "ES" | "EN";
  readingMinutes: number;
  /** Display name comes from messages (Categories.<slug>.title). */
  category: { slug: string; kind: CategoryKind };
  author: AuthorSummary;
  coAuthors: AuthorSummary[];
};
