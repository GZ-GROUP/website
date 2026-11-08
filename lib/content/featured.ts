import type { ArticleSummary, AuthorSummary } from "./types";

// Landing page data source. Nothing has been published yet, so these return
// empty lists and the UI renders its empty states. In the Editorial phase each
// function becomes a Prisma query with the same return type.

export async function getFeaturedProjects(): Promise<ArticleSummary[]> {
  return [];
}

export async function getFeaturedArticles(): Promise<ArticleSummary[]> {
  return [];
}

export async function getFeaturedMembers(): Promise<AuthorSummary[]> {
  return [];
}
