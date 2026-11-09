import { cache } from "react";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/editor/links";
import type { ArticleSummary, AuthorSummary } from "@/lib/content/types";
import { buildArticleOrder, buildArticleWhere, PAGE_SIZE, type ListFilters } from "@/lib/articles/filters";

// Read models for public pages and the studio. Only published articles leave
// this module for public callers.

export const authorSelect = {
  name: true,
  username: true,
  displayUsername: true,
  image: true,
  identityVerifications: { select: { provider: true }, orderBy: { provider: "asc" } },
} satisfies Prisma.UserSelect;

type AuthorRow = Prisma.UserGetPayload<{ select: typeof authorSelect }>;

export function toAuthorSummary(user: AuthorRow): AuthorSummary {
  return {
    username: user.username ?? "",
    displayName: user.name,
    avatarUrl: user.image,
    verifications: user.identityVerifications.map((v) => v.provider),
  };
}

const summarySelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverImageKey: true,
  coverAlt: true,
  publishedAt: true,
  language: true,
  readingMinutes: true,
  category: { select: { slug: true, kind: true } },
  author: { select: authorSelect },
  coAuthors: { select: { user: { select: authorSelect } }, orderBy: { position: "asc" } },
} satisfies Prisma.ArticleSelect;

type SummaryRow = Prisma.ArticleGetPayload<{ select: typeof summarySelect }>;

function toSummary(row: SummaryRow): ArticleSummary {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageKey ? mediaUrl(row.coverImageKey) : null,
    coverAlt: row.coverAlt,
    publishedAt: row.publishedAt ?? new Date(0),
    language: row.language,
    readingMinutes: row.readingMinutes,
    category: row.category,
    author: toAuthorSummary(row.author),
    coAuthors: row.coAuthors.map((c) => toAuthorSummary(c.user)),
  };
}

export type ArticlePage = { items: ArticleSummary[]; total: number; page: number; pageCount: number };

export async function listPublishedArticles(filters: ListFilters): Promise<ArticlePage> {
  const where = buildArticleWhere(filters);
  const [total, rows] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: buildArticleOrder(filters),
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: summarySelect,
    }),
  ]);
  return { items: rows.map(toSummary), total, page: filters.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function latestPublished(kind: "SHOWCASE" | "EDITORIAL", take: number): Promise<ArticleSummary[]> {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", category: { kind } },
    orderBy: { publishedAt: "desc" },
    take,
    select: summarySelect,
  });
  return rows.map(toSummary);
}

/** Published articles of a user, as author and as co-author (public profile). */
export async function publishedByUser(userId: string): Promise<{ authored: ArticleSummary[]; coAuthored: ArticleSummary[] }> {
  const list = (relation: Prisma.ArticleWhereInput) =>
    prisma.article.findMany({
      where: { status: "PUBLISHED", ...relation },
      orderBy: { publishedAt: "desc" },
      select: summarySelect,
    });
  const [authored, coAuthored] = await Promise.all([
    list({ authorId: userId }),
    list({ coAuthors: { some: { userId } } }),
  ]);
  return { authored: authored.map(toSummary), coAuthored: coAuthored.map(toSummary) };
}

/** Writers with at least one published article, most recent first. */
export async function activeWriters(take: number): Promise<AuthorSummary[]> {
  const users = await prisma.user.findMany({
    where: { banned: false, articles: { some: { status: "PUBLISHED" } } },
    orderBy: { createdAt: "asc" },
    take,
    select: authorSelect,
  });
  return users.map(toAuthorSummary);
}

/** Tags used by published articles, for the blog filter. */
export async function publishedTags(take = 30) {
  return prisma.tag.findMany({
    where: { articles: { some: { article: { status: "PUBLISHED" } } } },
    orderBy: { name: "asc" },
    take,
    select: { slug: true, name: true },
  });
}

const articleDetailSelect = {
  ...summarySelect,
  id: true,
  status: true,
  content: true,
  repositoryUrl: true,
  externalUrl: true,
  updatedAt: true,
  tags: { select: { tag: { select: { slug: true, name: true } } } },
} satisfies Prisma.ArticleSelect;

export type ArticleDetail = ArticleSummary & {
  id: string;
  content: Prisma.JsonValue;
  repositoryUrl: string | null;
  externalUrl: string | null;
  updatedAt: Date;
  tags: { slug: string; name: string }[];
};

function toDetail(row: Prisma.ArticleGetPayload<{ select: typeof articleDetailSelect }>): ArticleDetail {
  return {
    ...toSummary(row),
    // Drafts (studio preview) have no publication date yet: show the last edit.
    publishedAt: row.publishedAt ?? row.updatedAt,
    id: row.id,
    content: row.content,
    repositoryUrl: row.repositoryUrl,
    externalUrl: row.externalUrl,
    updatedAt: row.updatedAt,
    tags: row.tags.map((t) => t.tag),
  };
}

/** Public article page: published only. Drafts and archived articles are 404. */
export const getPublishedArticle = cache(async (slug: string): Promise<ArticleDetail | null> => {
  const row = await prisma.article.findFirst({ where: { slug, status: "PUBLISHED" }, select: articleDetailSelect });
  return row ? toDetail(row) : null;
});

/** Studio preview of any article the caller may view (checked by the caller). */
export async function getArticleForPreview(id: string): Promise<ArticleDetail | null> {
  const row = await prisma.article.findUnique({ where: { id }, select: articleDetailSelect });
  return row ? toDetail(row) : null;
}
