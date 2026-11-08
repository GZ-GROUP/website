import type { AuthProvider } from "@/lib/generated/prisma/enums";

// Read models for public content. They mirror the shape the Prisma queries will
// return in the Editorial phase, so the UI only changes its data source then.

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
  publishedAt: Date;
  category: { slug: string; name: string; kind: CategoryKind };
  author: AuthorSummary;
  coAuthors: AuthorSummary[];
};
